"""FastAPI service for माझे Kisan mandi price intelligence."""

from __future__ import annotations

import json
import calendar
from contextlib import asynccontextmanager
from datetime import date, timedelta
from pathlib import Path
from typing import Literal, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from festival_calendar import get_festival_features, get_next_festival
from fetch_weather import fetch_weather_forecast
from commodity_config import COMMODITIES, HARVEST_MONTHS, PEAK_HARVEST_MONTH


ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"
DATA_PATH = ROOT / "data" / "maharashtra_prices.csv"
WEATHER_PATH = ROOT / "data" / "weather_maharashtra.csv"
LIVE_DATA_PATH = ROOT / "data" / "live_market_prices.csv"
DATA_STATUS_PATH = ROOT / "data" / "market_data_status.json"
DIWALI_DATES = [date(2024, 11, 1), date(2025, 10, 20), date(2026, 10, 19)]
NAVRATRI_DATES = [date(2024, 10, 3), date(2025, 9, 22), date(2026, 10, 2)]
MANDI_DISTRICTS = {
    "Niphad": "Nashik", "Nashik": "Nashik", "Pune (Market Yard)": "Pune",
}

model = None
encoders = None
feature_columns: list[str] = []
prices = pd.DataFrame()
weather_history = pd.DataFrame()
live_prices = pd.DataFrame()
live_prices_mtime: float | None = None


class PredictionRequest(BaseModel):
    commodity: str
    mandi: str = "Niphad"
    current_price: float = Field(gt=0)
    price_7d_ago: float = Field(gt=0)
    price_30d_ago: float = Field(gt=0)
    arrivals_tonnes: float = Field(gt=0)
    forecast_days: int = Field(default=7, ge=1, le=30)
    precipitation_mm: Optional[float] = Field(default=None, ge=0)
    temp_max_c: Optional[float] = None
    rainfall_7d_sum: Optional[float] = Field(default=None, ge=0)


class StrategyRequest(BaseModel):
    commodity: str
    mandi: str = "Niphad"
    quantity_qtl: float = Field(gt=0)
    current_price: float = Field(gt=0)
    price_7d_ago: float = Field(gt=0)
    arrivals_tonnes: float = Field(gt=0)
    shelf_life_days: int = Field(default=7, ge=0)
    storage_cost_per_day: float = Field(default=18, ge=0)
    transport_cost: float = Field(default=728, ge=0)
    cultivation_expense: float = Field(default=0, ge=0)
    quality_grade: str = "A"
    precipitation_mm: Optional[float] = Field(default=None, ge=0)
    temp_max_c: Optional[float] = None
    rainfall_7d_sum: Optional[float] = Field(default=None, ge=0)


def load_artifacts() -> None:
    global model, encoders, feature_columns, prices, weather_history, live_prices, live_prices_mtime
    required = [
        MODEL_DIR / "price_model_v2.pkl",
        MODEL_DIR / "label_encoders.pkl",
        MODEL_DIR / "feature_columns.json",
        DATA_PATH,
        WEATHER_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise RuntimeError(
            "ML artifacts are missing. Run fetch_agmarknet.py and train_model.py first: "
            + ", ".join(missing)
        )
    model = joblib.load(required[0])
    encoders = joblib.load(required[1])
    feature_columns = json.loads(required[2].read_text(encoding="utf-8"))
    prices = pd.read_csv(DATA_PATH, parse_dates=["date"]).sort_values("date")
    weather_history = pd.read_csv(WEATHER_PATH, parse_dates=["date"]).sort_values("date")
    if LIVE_DATA_PATH.exists():
        live_prices = pd.read_csv(LIVE_DATA_PATH, parse_dates=["date"]).sort_values("date")
        live_prices_mtime = LIVE_DATA_PATH.stat().st_mtime
    else:
        live_prices = pd.DataFrame()
        live_prices_mtime = None


def refresh_live_prices() -> None:
    global live_prices, live_prices_mtime
    if not LIVE_DATA_PATH.exists():
        return
    mtime = LIVE_DATA_PATH.stat().st_mtime
    if live_prices_mtime != mtime:
        live_prices = pd.read_csv(LIVE_DATA_PATH, parse_dates=["date"]).sort_values("date")
        live_prices_mtime = mtime


def read_data_status() -> dict[str, object]:
    if not DATA_STATUS_PATH.exists():
        return {"official_live": {"ok": False, "error": "No official update has run yet"}}
    try:
        return json.loads(DATA_STATUS_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"official_live": {"ok": False, "error": "Data status file is unreadable"}}


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_artifacts()
    yield


app = FastAPI(
    title="माझे Kisan ML Price Intelligence",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8443", "http://127.0.0.1:8443"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def canonical_value(value: str, classes: np.ndarray, label: str) -> str:
    lookup = {str(item).lower(): str(item) for item in classes}
    match = lookup.get(value.strip().lower())
    if match is None:
        raise HTTPException(status_code=422, detail=f"Unsupported {label}: {value}")
    return match


def days_until(day: date, events: list[date]) -> int:
    future = [(event - day).days for event in events if event >= day]
    if future:
        return min(future)
    next_event = date(day.year + 1, events[-1].month, events[-1].day)
    return (next_event - day).days


def history_for(commodity: str, mandi: str) -> pd.DataFrame:
    history = prices[(prices["commodity"] == commodity) & (prices["mandi"] == mandi)]
    if history.empty:
        raise HTTPException(status_code=404, detail="No history for this commodity and mandi")
    return history.sort_values("date")


def weather_values(request: PredictionRequest, district: str) -> Tuple[float, float, float]:
    """Resolve optional caller weather, using Open-Meteo only for missing fields."""
    precipitation = request.precipitation_mm
    temperature = request.temp_max_c
    rainfall_sum = request.rainfall_7d_sum
    if precipitation is None or temperature is None or rainfall_sum is None:
        forecast = fetch_weather_forecast(district, 7)
        if precipitation is None:
            precipitation = float(forecast[0]["precipitation_mm"])
        if temperature is None:
            temperature = float(forecast[0]["temp_max_c"])
        if rainfall_sum is None:
            rainfall_sum = sum(float(row["precipitation_mm"]) for row in forecast[:7])
    return float(precipitation), float(temperature), float(rainfall_sum)


def is_post_harvest_pressure(commodity: str, observed: date) -> int:
    month = PEAK_HARVEST_MONTH[commodity]
    peak_start = date(observed.year, month, 1)
    peak_end = date(observed.year, month, calendar.monthrange(observed.year, month)[1])
    return int(peak_start <= observed <= peak_end + timedelta(days=14))


def festival_context(observed: date) -> dict[str, object]:
    festival = get_next_festival(observed)
    boost = round((float(festival["demand_multiplier"]) - 1) * 100)
    days_away = int(festival["days_away"])
    name = str(festival["name"])
    timing = "underway" if days_away == 0 else f"in {days_away} days"
    return {
        "next_festival": name,
        "days_away": days_away,
        "expected_demand_boost": f"+{boost}%",
        "advice": (
            f"{name} is {timing}. Vegetable demand typically rises {boost}% "
            "in the week before."
        ),
    }


def input_features(request: PredictionRequest) -> pd.DataFrame:
    commodity = canonical_value(request.commodity, encoders["commodity"].classes_, "commodity")
    mandi = canonical_value(request.mandi, encoders["mandi"].classes_, "mandi")
    history = history_for(commodity, mandi)
    latest = history.iloc[-1]
    latest_date = latest["date"].date()
    prediction_date = date.today()

    def price_days_ago(days: int) -> float:
        target = pd.Timestamp(latest_date - timedelta(days=days))
        candidates = history[history["date"] <= target]
        return float(candidates.iloc[-1]["modal_price"] if not candidates.empty else request.current_price)

    arrivals_7d = float(history.iloc[-8]["arrivals_tonnes"]) if len(history) >= 8 else request.arrivals_tonnes
    arrivals_average = float(history.tail(7)["arrivals_tonnes"].mean())
    district = MANDI_DISTRICTS.get(mandi, "Pune" if "pune" in mandi.lower() else "Nashik")
    precipitation, temperature, rainfall_sum = weather_values(request, district)
    festival = get_festival_features(prediction_date)
    row = {
        "price_lag_1d": price_days_ago(1),
        "price_lag_7d": request.price_7d_ago,
        "price_lag_14d": price_days_ago(14),
        "price_lag_30d": request.price_30d_ago,
        "price_lag_365d": price_days_ago(365),
        "price_trend_7d": (request.current_price - request.price_7d_ago) / request.price_7d_ago,
        "price_trend_30d": (request.current_price - request.price_30d_ago) / request.price_30d_ago,
        "arrivals_lag_7d": arrivals_7d,
        "arrivals_trend": (request.arrivals_tonnes - arrivals_average) / max(arrivals_average, 0.01),
        "month": prediction_date.month,
        "week_of_year": min(prediction_date.isocalendar().week, 52),
        "day_of_week": prediction_date.weekday(),
        "days_to_diwali": days_until(prediction_date, DIWALI_DATES),
        "days_to_navratri": days_until(prediction_date, NAVRATRI_DATES),
        "is_harvest_season": int(prediction_date.month in HARVEST_MONTHS[commodity]),
        "commodity_encoded": int(encoders["commodity"].transform([commodity])[0]),
        "mandi_encoded": int(encoders["mandi"].transform([mandi])[0]),
        "precipitation_mm": precipitation,
        "temp_max_c": temperature,
        "rainfall_7d_sum": rainfall_sum,
        "is_monsoon": int(6 <= prediction_date.month <= 9),
        "days_to_next_festival": festival["days_to_next_festival"],
        "festival_demand_score": festival["festival_demand_score"],
        "is_festival_period": festival["is_festival_period"],
        "next_festival_multiplier": festival["next_festival_multiplier"],
        "post_harvest_pressure": is_post_harvest_pressure(commodity, prediction_date),
    }
    return pd.DataFrame([row], columns=feature_columns)


def model_forecast(request: PredictionRequest) -> dict[str, object]:
    features = input_features(request)
    raw_prediction = float(model.predict(features)[0])
    commodity = canonical_value(request.commodity, encoders["commodity"].classes_, "commodity")
    mandi = canonical_value(request.mandi, encoders["mandi"].classes_, "mandi")
    training_anchor = float(history_for(commodity, mandi).iloc[-1]["modal_price"])
    # The model learns movement from the historical series. Re-anchor that movement
    # to the caller's live market price so a newer observation is not pulled back to
    # the synthetic dataset's absolute level.
    predicted_7d = max(1.0, request.current_price + raw_prediction - training_anchor)
    seven_day_change = (predicted_7d - request.current_price) / request.current_price
    # A bounded continuation gives a useful 14-day estimate without pretending the
    # seven-day model was directly trained for a different horizon.
    predicted_14d = predicted_7d * (1 + float(np.clip(seven_day_change, -0.12, 0.12)) * 0.65)

    if hasattr(model, "estimators_"):
        tree_predictions = np.array([tree.predict(features.to_numpy())[0] for tree in model.estimators_])
        uncertainty = max(float(tree_predictions.std()), predicted_7d * 0.035)
    else:
        uncertainty = predicted_7d * (0.055 + min(abs(seven_day_change), 0.12))
    range_low = max(1.0, predicted_7d - 1.28 * uncertainty)
    range_high = predicted_7d + 1.28 * uncertainty
    confidence = int(np.clip(92 - uncertainty / predicted_7d * 180, 55, 90))
    trend_pct = seven_day_change * 100
    trend: Literal["rising", "falling", "stable"] = (
        "rising" if trend_pct > 1 else "falling" if trend_pct < -1 else "stable"
    )
    gain = predicted_7d - request.current_price
    if trend == "rising" and gain > 25:
        recommendation = "wait"
        reason = (
            f"Price trending up {trend_pct:.1f}% over next 7 days. Holding for 7 days "
            f"could yield ₹{gain:,.0f}/qtl more."
        )
    elif trend == "falling":
        recommendation = "sell_now"
        reason = f"Price is forecast to fall {abs(trend_pct):.1f}% over the next 7 days."
    else:
        recommendation = "partial"
        reason = "The forecast is broadly stable, so splitting the sale reduces timing risk."

    importances = getattr(model, "feature_importances_", np.zeros(len(feature_columns)))
    ranked = sorted(zip(feature_columns, importances), key=lambda pair: pair[1], reverse=True)[:4]
    return {
        "commodity": request.commodity,
        "mandi": request.mandi,
        "current_price": round(request.current_price),
        "predicted_price_7d": round(predicted_7d),
        "predicted_price_14d": round(predicted_14d),
        "range_low": round(range_low),
        "range_high": round(range_high),
        "confidence_pct": confidence,
        "trend": trend,
        "trend_pct": round(trend_pct, 1),
        "recommendation": recommendation,
        "recommendation_reason": reason,
        "feature_importance": {name: round(float(value), 3) for name, value in ranked},
        "festival_context": festival_context(date.today()),
    }


@app.post("/predict")
def predict(request: PredictionRequest) -> dict[str, object]:
    return model_forecast(request)


def deductions(
    gross: float,
    quantity: float,
    transport: float,
    storage: float,
    spoilage: float,
) -> dict[str, int]:
    return {
        "transport": round(transport),
        "market_commission": round(gross * 0.015),
        "packaging": round(quantity * 20),
        "spoilage_loss": round(spoilage),
        "storage_cost": round(storage),
    }


def make_strategy(
    strategy_id: str,
    label: str,
    description: str,
    gross: float,
    quantity: float,
    transport: float,
    storage: float,
    spoilage: float,
    cultivation: float,
    risk: str,
    risk_color: str,
    shelf_safe: bool,
    **prices_payload: int,
) -> dict[str, object]:
    costs = deductions(gross, quantity, transport, storage, spoilage)
    total = sum(costs.values())
    net = gross - total - cultivation
    return {
        "id": strategy_id,
        "label": label,
        "description": description,
        **prices_payload,
        "gross_revenue": round(gross),
        "deductions": costs,
        "total_deductions": round(total),
        "cultivation_expense": round(cultivation),
        "net_realization": round(net),
        "net_per_qtl": round(net / quantity),
        "risk": risk,
        "risk_color": risk_color,
        "shelf_life_safe": shelf_safe,
    }


@app.post("/strategy")
def strategy(request: StrategyRequest) -> dict[str, object]:
    history = history_for(
        canonical_value(request.commodity, encoders["commodity"].classes_, "commodity"),
        canonical_value(request.mandi, encoders["mandi"].classes_, "mandi"),
    )
    price_30d_ago = float(history.iloc[-31]["modal_price"]) if len(history) >= 31 else request.price_7d_ago
    forecast = model_forecast(
        PredictionRequest(
            commodity=request.commodity,
            mandi=request.mandi,
            current_price=request.current_price,
            price_7d_ago=request.price_7d_ago,
            price_30d_ago=price_30d_ago,
            arrivals_tonnes=request.arrivals_tonnes,
            precipitation_mm=request.precipitation_mm,
            temp_max_c=request.temp_max_c,
            rainfall_7d_sum=request.rainfall_7d_sum,
        )
    )
    current = request.current_price
    future = float(forecast["predicted_price_7d"])
    quantity = request.quantity_qtl
    full_wait_safe = request.shelf_life_days >= 7
    # Highly perishable lots lose roughly 3-8% of value during an unsafe wait.
    unsafe_days = max(0, 7 - request.shelf_life_days)
    spoilage_rate = min(0.10, 0.03 + unsafe_days * 0.015) if not full_wait_safe else 0.01
    full_spoilage = future * quantity * spoilage_rate
    # Storage is quoted per tonne-day while strategy quantities are in quintals.
    full_storage = request.storage_cost_per_day * 7 * (quantity / 10)

    strategy_a = make_strategy(
        "A", "Sell Everything Now", f"Sell all {quantity:g} quintals immediately",
        current * quantity, quantity, request.transport_cost, 0, 0,
        request.cultivation_expense, "Low", "green", True,
        predicted_price=round(current),
    )
    strategy_b = make_strategy(
        "B", "Store for 7 Days", "Wait for price to rise before selling",
        future * quantity, quantity, request.transport_cost, full_storage, full_spoilage,
        request.cultivation_expense, "Medium" if full_wait_safe else "High", "yellow" if full_wait_safe else "red",
        full_wait_safe, predicted_price=round(future),
    )
    now_quantity = quantity * 0.60
    later_quantity = quantity * 0.40
    future_5d = current + ((future - current) * (5 / 7))
    split_gross = now_quantity * current + later_quantity * future_5d
    split_wait_days = 5
    split_wait_safe = request.shelf_life_days >= split_wait_days
    strategy_c = make_strategy(
        "C", "Sell 60% Now + 40% in 5 Days", "Sell most now and hold the balance for five days",
        split_gross, quantity, request.transport_cost,
        request.storage_cost_per_day * split_wait_days * (later_quantity / 10), full_spoilage * 0.40,
        request.cultivation_expense, "Low-Medium", "lime", split_wait_safe,
        predicted_price=round(split_gross / quantity),
        predicted_price_now=round(current), predicted_price_later=round(future_5d),
    )
    strategies = [strategy_a, strategy_b, strategy_c]

    # Select on risk-adjusted realization, penalising unsafe storage uncertainty.
    risk_penalties = {"A": 0, "B": (0 if full_wait_safe else quantity * current * 0.06), "C": quantity * current * 0.008}
    if not full_wait_safe and forecast["trend"] == "rising":
        # A rising market creates upside, but waiting beyond shelf life is unsafe;
        # the split strategy deliberately captures both considerations.
        recommended = strategy_c
    else:
        recommended = max(
            strategies,
            key=lambda item: float(item["net_realization"]) - risk_penalties[str(item["id"])],
        )
    if recommended["id"] == "A":
        summary = "Selling now gives the strongest risk-adjusted return after storage and spoilage costs."
    elif recommended["id"] == "B":
        summary = (
            "Storing the full lot gives the strongest return and remains within the stated shelf life."
            if full_wait_safe
            else "Storing offers the strongest estimated return, but the shelf-life risk requires close monitoring."
        )
    else:
        summary = "The split strategy gives the best risk-adjusted return while limiting shelf-life exposure."

    context = festival_context(date.today())
    festival_factor = (
        f"{context['next_festival']} demand approaching in {context['days_away']} days"
    )
    grade_premium = {"A": 180, "B": 80, "C": 0}.get(request.quality_grade.upper().replace("GRADE ", ""), 0)
    return {
        "strategies": strategies,
        "recommended_strategy": recommended["id"],
        "recommendation_summary": summary,
        "why_factors": [
            f"Price trending {forecast['trend']} {float(forecast['trend_pct']):+.1f}% over 7 days",
            f"Shelf life of {request.shelf_life_days} days makes full wait {'safe' if full_wait_safe else 'risky'}",
            f"Current Grade {request.quality_grade.replace('Grade ', '')} premium is ₹{grade_premium}/qtl vs Grade C",
            festival_factor,
        ],
        "forecast": forecast,
        "festival_context": context,
    }


@app.get("/prices/{commodity}")
def price_chart(
    commodity: str,
    mandi: str = Query(default="Niphad"),
) -> dict[str, object]:
    refresh_live_prices()
    canonical_commodity = canonical_value(commodity, encoders["commodity"].classes_, "commodity")
    canonical_mandi = canonical_value(mandi, encoders["mandi"].classes_, "mandi")
    history = history_for(canonical_commodity, canonical_mandi)
    recent = history.tail(30)
    training_last = recent.iloc[-1]
    prior_7 = history.iloc[-8] if len(history) >= 8 else training_last
    prior_30 = history.iloc[-31] if len(history) >= 31 else prior_7
    current_price = float(training_last["modal_price"])
    price_7d_ago = float(prior_7["modal_price"])
    price_30d_ago = float(prior_30["modal_price"])
    arrivals = float(training_last["arrivals_tonnes"])
    anchor_date = training_last["date"].date()
    current_source = "demo_training_history"

    if not live_prices.empty:
        live_series = live_prices[
            (live_prices["commodity"].str.casefold() == canonical_commodity.casefold())
            & (live_prices["mandi"].str.casefold() == canonical_mandi.casefold())
        ].sort_values("date")
        if not live_series.empty:
            latest_live = live_series.iloc[-1]
            current_price = float(latest_live["modal_price"])
            anchor_date = latest_live["date"].date()
            current_source = "agmarknet_data_gov_in"
            seven_day_candidates = live_series[live_series["date"] <= latest_live["date"] - pd.Timedelta(days=7)]
            thirty_day_candidates = live_series[live_series["date"] <= latest_live["date"] - pd.Timedelta(days=30)]
            if not seven_day_candidates.empty:
                price_7d_ago = float(seven_day_candidates.iloc[-1]["modal_price"])
            if not thirty_day_candidates.empty:
                price_30d_ago = float(thirty_day_candidates.iloc[-1]["modal_price"])
            live_arrivals = latest_live.get("arrivals_tonnes")
            if pd.notna(live_arrivals) and float(live_arrivals) > 0:
                arrivals = float(live_arrivals)

    result = model_forecast(
        PredictionRequest(
            commodity=canonical_commodity,
            mandi=canonical_mandi,
            current_price=current_price,
            price_7d_ago=price_7d_ago,
            price_30d_ago=price_30d_ago,
            arrivals_tonnes=arrivals,
        )
    )
    day_7 = float(result["predicted_price_7d"])
    day_14 = float(result["predicted_price_14d"])
    low_ratio = float(result["range_low"]) / max(day_7, 1)
    high_ratio = float(result["range_high"]) / max(day_7, 1)
    forecast_rows = []
    for offset in range(1, 15):
        if offset <= 7:
            value = current_price + (day_7 - current_price) * offset / 7
        else:
            value = day_7 + (day_14 - day_7) * (offset - 7) / 7
        forecast_rows.append(
            {
                "date": (anchor_date + timedelta(days=offset)).isoformat(),
                "modal_price": round(value),
                "low": round(value * low_ratio),
                "high": round(value * high_ratio),
                "is_forecast": True,
            }
        )
    historical_rows = [
        {"date": row.date.date().isoformat(), "modal_price": round(row.modal_price), "is_forecast": False}
        for row in recent.itertuples()
    ]
    if current_source == "agmarknet_data_gov_in" and anchor_date > training_last["date"].date():
        historical_rows.append({"date": anchor_date.isoformat(), "modal_price": round(current_price), "is_forecast": False})
    return {
        "commodity": canonical_commodity,
        "mandi": canonical_mandi,
        "historical": historical_rows,
        "forecast": forecast_rows,
        "current_price_source": current_source,
        "as_of": anchor_date.isoformat(),
        "training_history_source": "demo_generated",
    }


@app.get("/commodities")
def supported_commodities() -> dict[str, object]:
    return {"commodities": COMMODITIES, "count": len(COMMODITIES)}


@app.get("/data-status")
def data_status() -> dict[str, object]:
    refresh_live_prices()
    status = read_data_status()
    status["live_cache_rows"] = int(len(live_prices))
    return status


@app.get("/latest-prices")
def latest_prices(
    commodity: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
) -> dict[str, object]:
    refresh_live_prices()
    status = read_data_status()
    if live_prices.empty:
        return {"prices": [], "as_of": None, "source": "unavailable", "data_status": status}
    frame = live_prices.copy()
    if commodity:
        frame = frame[frame["commodity"].str.casefold() == commodity.strip().casefold()]
    if district:
        frame = frame[frame["district"].str.casefold() == district.strip().casefold()]
    if frame.empty:
        return {"prices": [], "as_of": None, "source": "agmarknet_data_gov_in", "data_status": status}
    latest_rows = frame.sort_values("date").groupby(["commodity", "mandi"], as_index=False).tail(1)
    result = []
    for row in latest_rows.sort_values(["commodity", "district", "mandi"]).itertuples():
        series = frame[(frame["commodity"] == row.commodity) & (frame["mandi"] == row.mandi)].sort_values("date")
        previous = float(series.iloc[-2]["modal_price"]) if len(series) > 1 else float(row.modal_price)
        change = (float(row.modal_price) - previous) / max(previous, 1) * 100
        result.append({
            "commodity": row.commodity,
            "mandi": row.mandi,
            "district": row.district,
            "date": row.date.date().isoformat(),
            "min_price": round(float(row.min_price)),
            "max_price": round(float(row.max_price)),
            "modal_price": round(float(row.modal_price)),
            "trend": "up" if change > 0.5 else "down" if change < -0.5 else "stable",
            "trend_pct": round(change, 1),
            "variety": getattr(row, "variety", "Not reported"),
            "grade": getattr(row, "grade", "Not reported"),
            "source": "AGMARKNET via data.gov.in",
        })
    return {
        "prices": result,
        "as_of": max(item["date"] for item in result),
        "source": "AGMARKNET via data.gov.in",
        "data_status": status,
    }


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "commodities": COMMODITIES,
        "data_status": read_data_status(),
        "live_cache_rows": int(len(live_prices)),
    }
