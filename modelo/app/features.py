from __future__ import annotations

import numpy as np
import pandas as pd

N_LAGS = 3


def to_monthly(df: pd.DataFrame, usd_to_cop: float, last_month: pd.Period) -> pd.DataFrame:
    df = df.copy()
    df["amount_cop"] = np.where(df["currency"] == "USD", df["amount"] * usd_to_cop, df["amount"])
    df["month"] = df["occurred_at"].dt.to_period("M")

    real = df[~df["status"].isin(["PLANNED", "CANCELLED"])]
    real = real[real["month"] <= last_month]
    if real.empty:
        return pd.DataFrame(
            columns=["property_id", "month", "income", "expense", "overdue_income", "net_balance"]
        )

    paid = real[(real["status"] == "PAID") & (real["category"] != "DEPOSIT")]
    income = paid[paid["type"] == "INCOME"].groupby(["property_id", "month"])["amount_cop"].sum().rename("income")
    expense = paid[paid["type"] == "EXPENSE"].groupby(["property_id", "month"])["amount_cop"].sum().rename("expense")
    overdue = (
        real[(real["status"] == "OVERDUE") & (real["type"] == "INCOME")]
        .groupby(["property_id", "month"])["amount_cop"].sum().rename("overdue_income")
    )

    monthly = pd.concat([income, expense, overdue], axis=1).fillna(0.0)
    months = pd.period_range(real["month"].min(), last_month, freq="M")
    idx = pd.MultiIndex.from_product([real["property_id"].unique(), months], names=["property_id", "month"])
    monthly = monthly.reindex(idx, fill_value=0.0).reset_index()
    monthly["net_balance"] = monthly["income"] - monthly["expense"]
    return monthly.sort_values(["property_id", "month"]).reset_index(drop=True)


def add_features(monthly: pd.DataFrame) -> pd.DataFrame:
    monthly = monthly.sort_values(["property_id", "month"]).reset_index(drop=True)
    g = monthly.groupby("property_id")

    for lag in range(1, N_LAGS + 1):
        for col in ["net_balance", "income", "expense"]:
            monthly[f"{col}_lag{lag}"] = g[col].shift(lag)

    monthly["overdue_income_lag1"] = g["overdue_income"].shift(1)
    monthly["net_roll3"] = g["net_balance"].transform(lambda s: s.shift(1).rolling(3, min_periods=1).mean())
    monthly["net_hist_mean"] = g["net_balance"].transform(lambda s: s.shift(1).expanding().mean())

    month_num = monthly["month"].dt.month
    monthly["month_sin"] = np.sin(2 * np.pi * month_num / 12)
    monthly["month_cos"] = np.cos(2 * np.pi * month_num / 12)
    return monthly
