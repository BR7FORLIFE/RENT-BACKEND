"""API del modelo RENT. Servicio interno: solo lo consume rent-financial-module."""
from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .forecast import Forecaster

MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).resolve().parent.parent / "artifacts" / "rent_model.joblib"))
API_KEY = os.getenv("MODEL_API_KEY") 

app = FastAPI(title="RENT model API", version="1.0.0")
forecaster = Forecaster(MODEL_PATH)


class Transaction(BaseModel):
    property_id: str
    type: Literal["INCOME", "EXPENSE"]
    category: Literal["RENT", "SERVICE", "UTILITY", "MAINTENANCE", "DEPOSIT", "OTHER"]
    status: Literal["PLANNED", "PENDING", "PAID", "OVERDUE", "CANCELLED"]
    amount: float = Field(ge=0)
    currency: Literal["COP", "USD"]
    occurred_at: datetime


class ForecastRequest(BaseModel):
    transactions: list[Transaction]
    horizon: int = Field(default=6, ge=1, le=12)


def check_key(x_api_key: str | None = Header(default=None)) -> None:
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="API key invalida")


@app.get("/health")
def health():
    return {"status": "ok", "features": len(forecaster.feature_cols)}


@app.post("/forecast", dependencies=[Depends(check_key)])
def forecast(body: ForecastRequest):
    return forecaster.run([t.model_dump() for t in body.transactions], horizon=body.horizon)
