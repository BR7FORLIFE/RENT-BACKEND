"""Prediccion del saldo mensual del propietario con el modelo entrenado (rent_model.joblib)."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from .features import N_LAGS, add_features, to_monthly

Z_80 = 1.2816  

FEATURE_LABELS = {
    "net_balance_lag1": "Saldo del mes anterior",
    "income_lag1": "Ingresos del mes anterior",
    "expense_lag1": "Gastos del mes anterior",
    "net_balance_lag2": "Saldo de hace 2 meses",
    "income_lag2": "Ingresos de hace 2 meses",
    "expense_lag2": "Gastos de hace 2 meses",
    "net_balance_lag3": "Saldo de hace 3 meses",
    "income_lag3": "Ingresos de hace 3 meses",
    "expense_lag3": "Gastos de hace 3 meses",
    "overdue_income_lag1": "Ingresos en mora del mes anterior",
    "net_roll3": "Promedio de los últimos 3 meses",
    "net_hist_mean": "Promedio histórico",
    "month_sin": "Estacionalidad (seno)",
    "month_cos": "Estacionalidad (coseno)",
}

TX_COLUMNS = ["property_id", "type", "category", "status", "amount", "currency", "occurred_at"]


def _f(value: float) -> float:
    return round(float(value), 2)


def _month(p: pd.Period) -> str:
    return str(p)


class Forecaster:
    def __init__(self, model_path: str | Path):
        artifact = joblib.load(model_path)
        self.model = artifact["model"]
        self.feature_cols: list[str] = artifact["feature_cols"]
        self.n_lags: int = artifact["n_lags"]
        self.usd_to_cop: float = artifact["usd_to_cop"]
        if self.n_lags != N_LAGS:
            raise RuntimeError("El modelo fue entrenado con otro N_LAGS; revisa app/features.py")
        
    def _predict(self, rows: pd.DataFrame) -> np.ndarray:
        return self.model.predict(rows[self.feature_cols])

    def _contributions(self, row: pd.DataFrame) -> dict[str, Any]:
        scaler = self.model.named_steps["scaler"]
        reg = self.model.named_steps["reg"]
        x = row[self.feature_cols].to_numpy(dtype=float)[0]
        contrib = reg.coef_ * (x - scaler.mean_) / scaler.scale_
        items = sorted(zip(self.feature_cols, contrib), key=lambda kv: abs(kv[1]), reverse=True)
        return {
            "base": _f(reg.intercept_),
            "items": [
                {"feature": f, "label": FEATURE_LABELS.get(f, f), "value": _f(v)} for f, v in items[:8]
            ],
        }

    @staticmethod
    def _frame(transactions: list[dict]) -> pd.DataFrame:
        df = pd.DataFrame(transactions, columns=TX_COLUMNS)
        if df.empty:
            return df
        df["amount"] = pd.to_numeric(df["amount"])
        df["occurred_at"] = pd.to_datetime(df["occurred_at"], utc=True).dt.tz_localize(None)
        return df

    def _category_breakdown(self, df: pd.DataFrame, months: list[pd.Period]) -> dict[str, list[dict]]:
        out: dict[str, list[dict]] = {"income": [], "expense": []}
        paid = df[(df["status"] == "PAID") & (df["category"] != "DEPOSIT") & df["month"].isin(months)]
        for key, tx_type in (("income", "INCOME"), ("expense", "EXPENSE")):
            grouped = paid[paid["type"] == tx_type].groupby("category")["amount_cop"].sum()
            out[key] = [
                {"category": c, "total": _f(v)} for c, v in grouped.sort_values(ascending=False).items()
            ]
        return out

    # ------------------------------------------------------------------ principal
    def run(self, transactions: list[dict], horizon: int = 6, as_of: datetime | None = None) -> dict[str, Any]:
        as_of = as_of or datetime.now(timezone.utc)
        current = pd.Period(as_of.strftime("%Y-%m"), freq="M")
        last_closed = current - 1

        base: dict[str, Any] = {
            "currency": "COP",
            "usdToCop": self.usd_to_cop,
            "generatedAt": as_of.isoformat(),
            "currentMonth": _month(current),
            "horizon": horizon,
        }

        df = self._frame(transactions)
        if df.empty:
            return {**base, "ready": False, "reason": "La propiedad aún no tiene movimientos financieros."}

        df["amount_cop"] = np.where(df["currency"] == "USD", df["amount"] * self.usd_to_cop, df["amount"])
        df["month"] = df["occurred_at"].dt.to_period("M")

        monthly = to_monthly(df, self.usd_to_cop, last_closed)
        if len(monthly) < N_LAGS + 1:
            return {
                **base,
                "ready": False,
                "reason": f"Se necesitan al menos {N_LAGS + 1} meses cerrados de historial "
                f"(hay {len(monthly)}).",
            }

        # Renta facturada vs cobrada por mes (cobranza)
        rent = df[(df["category"] == "RENT") & (df["type"] == "INCOME") & ~df["status"].isin(["PLANNED", "CANCELLED"])]
        billed = rent.groupby("month")["amount_cop"].sum()
        collected = rent[rent["status"] == "PAID"].groupby("month")["amount_cop"].sum()

        history = [
            {
                "month": _month(r.month),
                "income": _f(r.income),
                "expense": _f(r.expense),
                "overdueIncome": _f(r.overdue_income),
                "net": _f(r.net_balance),
                "rentBilled": _f(billed.get(r.month, 0.0)),
                "rentCollected": _f(collected.get(r.month, 0.0)),
            }
            for r in monthly.itertuples()
        ]

        feats = add_features(monthly)
        fit = feats.dropna(subset=self.feature_cols).copy()
        fit["pred"] = self._predict(fit)
        err = fit["net_balance"] - fit["pred"]
        rmse = float(np.sqrt(np.mean(err**2))) if len(fit) else 0.0
        mae = float(np.mean(np.abs(err))) if len(fit) else 0.0
        base_mae = float(np.mean(np.abs(fit["net_balance"] - fit["net_balance_lag1"]))) if len(fit) else 0.0
        ss_tot = float(((fit["net_balance"] - fit["net_balance"].mean()) ** 2).sum()) if len(fit) else 0.0
        r2 = 1 - float((err**2).sum()) / ss_tot if ss_tot > 0 else None

        backtest = [
            {"month": _month(r.month), "actual": _f(r.net_balance), "predicted": _f(r.pred)}
            for r in fit.itertuples()
        ]

        work = monthly[["property_id", "month", "income", "expense", "overdue_income", "net_balance"]].copy()
        pid = work["property_id"].iloc[0]
        forecast = []
        first_contrib = None
        for step in range(1, horizon + 1):
            month = current + (step - 1)
            work = pd.concat(
                [
                    work,
                    pd.DataFrame(
                        {
                            "property_id": [pid],
                            "month": [month],
                            "income": [0.0],
                            "expense": [0.0],
                            "overdue_income": [0.0],
                            "net_balance": [0.0],
                        }
                    ),
                ],
                ignore_index=True,
            )
            row = add_features(work).iloc[[-1]]
            pred = float(self._predict(row)[0])
            if step == 1:
                first_contrib = self._contributions(row)

            prev = work.iloc[:-1].tail(3)
            exp_hat = float(prev["expense"].mean())
            work.loc[work.index[-1], ["income", "expense", "overdue_income", "net_balance"]] = [
                pred + exp_hat,
                exp_hat,
                float(prev["overdue_income"].mean()),
                pred,
            ]

            spread = Z_80 * rmse * (1 + 0.1 * (step - 1))
            forecast.append(
                {
                    "month": _month(month),
                    "predicted": _f(pred),
                    "low": _f(pred - spread),
                    "high": _f(pred + spread),
                    "expectedIncome": _f(pred + exp_hat),
                    "expectedExpense": _f(exp_hat),
                }
            )

        cur = df[(df["month"] == current) & (df["status"] == "PAID") & (df["category"] != "DEPOSIT")]
        overdue_total = df[(df["status"] == "OVERDUE") & (df["type"] == "INCOME")]["amount_cop"].sum()
        last_months = list(monthly["month"].tail(12))

        totals = [h["net"] for h in history]
        recent = np.mean(totals[-3:])
        previous = np.mean(totals[-6:-3]) if len(totals) >= 6 else np.mean(totals[:-3] or totals)
        trend = "up" if recent > previous * 1.05 else "down" if recent < previous * 0.95 else "stable"

        return {
            **base,
            "ready": True,
            "history": history,
            "backtest": backtest,
            "forecast": forecast,
            "metrics": {
                "months": len(fit),
                "mae": _f(mae),
                "rmse": _f(rmse),
                "r2": None if r2 is None else round(r2, 3),
                "baselineMae": _f(base_mae),
                "improvementVsBaseline": round(1 - mae / base_mae, 3) if base_mae > 0 else None,
            },
            "drivers": first_contrib,
            "currentMonthToDate": {
                "month": _month(current),
                "income": _f(cur[cur["type"] == "INCOME"]["amount_cop"].sum()),
                "expense": _f(cur[cur["type"] == "EXPENSE"]["amount_cop"].sum()),
            },
            "overdueIncomeTotal": _f(overdue_total),
            "categories": self._category_breakdown(df, last_months),
            "summary": {
                "nextMonth": forecast[0]["predicted"] if forecast else None,
                "forecastTotal": _f(sum(f["predicted"] for f in forecast)),
                "historyAverage": _f(np.mean(totals)),
                "trend": trend,
            },
        }
