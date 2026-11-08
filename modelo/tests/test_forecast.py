from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
AS_OF = datetime(2026, 11, 8, tzinfo=timezone.utc)


def tx(month: str, type_="INCOME", category="RENT", status="PAID", amount=2_000_000, currency="COP", day=3):
    return {
        "property_id": "p1",
        "type": type_,
        "category": category,
        "status": status,
        "amount": amount,
        "currency": currency,
        "occurred_at": f"{month}-{day:02d}T10:00:00Z",
    }


def months(n):
    return [f"2026-{m:02d}" for m in range(10 - n + 1, 11)] 


def history(n=8):
    rows = []
    for m in months(n):
        rows += [tx(m), tx(m, "EXPENSE", "SERVICE", amount=300_000)]
    return rows


def post(rows, horizon=3):
    return client.post("/forecast", json={"transactions": rows, "horizon": horizon})


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_forecast_shape_and_horizon():
    res = post(history(), horizon=4).json()
    assert res["ready"] is True
    assert [f["month"] for f in res["forecast"]][0] == "2026-11"
    assert len(res["forecast"]) == 4
    assert all(f["low"] <= f["predicted"] <= f["high"] for f in res["forecast"])
    assert len(res["history"]) == 8
    assert res["currency"] == "COP"


def test_empty_and_short_history_not_ready():
    assert post([]).json()["ready"] is False
    short = post(history(2)).json()
    assert short["ready"] is False and "reason" in short


def test_deposit_planned_cancelled_are_ignored():
    rows = history() + [
        tx("2026-10", category="DEPOSIT", amount=9_000_000),
        tx("2026-10", status="PLANNED", amount=9_000_000),
        tx("2026-10", status="CANCELLED", amount=9_000_000),
    ]
    last = post(rows).json()["history"][-1]
    assert last["income"] == 2_000_000


def test_usd_is_converted_to_cop():
    rows = [r for r in history() if r["occurred_at"][:7] != "2026-10"] + [
        tx("2026-10", amount=500, currency="USD"),
    ]
    assert post(rows).json()["history"][-1]["income"] == 500 * 4000


def test_current_month_is_not_part_of_history():
    res = post(history() + [tx("2026-11", amount=1_000_000)]).json()
    assert res["history"][-1]["month"] == "2026-10"
    assert res["currentMonthToDate"]["income"] == 1_000_000


def test_invalid_payload_rejected():
    bad = history()[0] | {"amount": -5}
    assert post([bad]).status_code == 422
    assert client.post("/forecast", json={"transactions": [], "horizon": 99}).status_code == 422


def test_api_key_enforced(monkeypatch):
    monkeypatch.setattr("app.main.API_KEY", "secret")
    assert post(history()).status_code == 401
    ok = client.post(
        "/forecast",
        json={"transactions": [tx("2026-10")], "horizon": 1},
        headers={"X-Api-Key": "secret"},
    )
    assert ok.status_code == 200
