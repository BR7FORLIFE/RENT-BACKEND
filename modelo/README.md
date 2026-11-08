# modelo — API de predicción financiera (FastAPI)

Sirve el modelo `artifacts/rent_model.joblib` (regresión lineal entrenada en `notebooks/rent_model_colab.ipynb`)
que predice el **saldo mensual del propietario** (`ingresos PAID − gastos PAID`, en COP).

## Flujo

```
Frontend ──GET /rent-financial/finance/property/:id/forecast──▶ rent-financial (NestJS)
                                                                 │ autoriza (VER_FINANZAS) y lee los movimientos
                                                                 ▼
                                                      POST model:8000/forecast (esta API)
```

La API es **interna**: no pasa por nginx ni se publica al host. Opcionalmente se protege con `MODEL_API_KEY`.

## Endpoints

- `GET /health`
- `POST /forecast` — `{ "transactions": [...], "horizon": 1..12 }`. Cada movimiento:
  `property_id, type, category, status, amount, currency, occurred_at`.

La respuesta trae `history`, `backtest` (ajuste del modelo mes a mes), `forecast` (con banda del 80 %),
`metrics`, `drivers` (contribución de cada variable al próximo mes), `categories`, `summary`, etc.
Si hay menos de 4 meses cerrados devuelve `{ "ready": false, "reason": "..." }`.

## Reglas heredadas del entrenamiento (`app/features.py`)

- Solo cuenta `PAID`; `DEPOSIT` se excluye; `PLANNED` y `CANCELLED` se ignoran; USD → COP a 4000.
- Solo meses **cerrados**; el pronóstico empieza en el mes en curso.
- Pronóstico a varios meses: recursivo (cada predicción alimenta los rezagos del siguiente; los gastos
  futuros se estiman con el promedio de los últimos 3 meses). La banda crece un 10 % por mes de horizonte.

## Desarrollo

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
pytest
uvicorn app.main:app --reload --port 8000
```

`scikit-learn` está fijado a **1.6.1** porque es la versión con la que se guardó el `.joblib`.
Si se reentrena el modelo, reemplaza `artifacts/rent_model.joblib` y revisa la versión en `requirements.txt`.
