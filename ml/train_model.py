"""Train माझे Kisan's weather and festival-aware seven-day price model."""

from __future__ import annotations

import calendar
import json
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

from festival_calendar import get_festival_features
from commodity_config import HARVEST_MONTHS, PEAK_HARVEST_MONTH


ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "maharashtra_prices.csv"
WEATHER_PATH = ROOT / "data" / "weather_maharashtra.csv"
MODEL_DIR = ROOT / "models"

BASE_FEATURE_COLUMNS = [
    "price_lag_1d", "price_lag_7d", "price_lag_14d", "price_lag_30d",
    "price_lag_365d", "price_trend_7d", "price_trend_30d",
    "arrivals_lag_7d", "arrivals_trend", "month", "week_of_year",
    "day_of_week", "days_to_diwali", "days_to_navratri",
    "is_harvest_season", "commodity_encoded", "mandi_encoded",
]
WEATHER_FESTIVAL_FEATURES = [
    "precipitation_mm", "temp_max_c", "rainfall_7d_sum", "is_monsoon",
    "days_to_next_festival", "festival_demand_score", "is_festival_period",
    "next_festival_multiplier", "post_harvest_pressure",
]
FEATURE_COLUMNS = BASE_FEATURE_COLUMNS + WEATHER_FESTIVAL_FEATURES

DIWALI_DATES = [date(2024, 11, 1), date(2025, 10, 20), date(2026, 10, 19)]
NAVRATRI_DATES = [date(2024, 10, 3), date(2025, 9, 22), date(2026, 10, 2)]


def days_until_next(day: pd.Timestamp, events: List[date]) -> int:
    current = day.date()
    future = [(event - current).days for event in events if event >= current]
    if future:
        return min(future)
    return (date(current.year + 1, events[-1].month, events[-1].day) - current).days


def post_harvest_pressure(commodity: str, observed: pd.Timestamp) -> int:
    """Flag the peak harvest month and its two-week arrival-pressure tail."""
    month = PEAK_HARVEST_MONTH[commodity]
    year = observed.year
    peak_start = date(year, month, 1)
    peak_end = date(year, month, calendar.monthrange(year, month)[1])
    day = observed.date()
    return int(peak_start <= day <= peak_end + timedelta(days=14))


def merge_weather(price_data: pd.DataFrame, weather_data: pd.DataFrame) -> pd.DataFrame:
    prices = price_data.copy()
    weather = weather_data.copy()
    prices["date"] = pd.to_datetime(prices["date"])
    weather["date"] = pd.to_datetime(weather["date"])
    # Current price data is Nashik/Pune. This also gives a safe approximation for
    # future mandi names that contain a known district.
    prices["weather_district"] = [
        district if district in {"Nashik", "Pune", "Solapur", "Aurangabad"}
        else "Pune" if "pune" in mandi.lower() else "Nashik"
        for district, mandi in zip(prices["district"], prices["mandi"])
    ]
    weather = weather.rename(columns={"district": "weather_district"})
    merged = prices.merge(
        weather[["date", "weather_district", "precipitation_mm", "temp_max_c"]],
        on=["date", "weather_district"],
        how="left",
        validate="many_to_one",
    )
    if merged[["precipitation_mm", "temp_max_c"]].isna().any().any():
        raise ValueError("Weather data does not fully cover the price dataset")
    return merged


def engineer_features(
    data: pd.DataFrame,
    weather: pd.DataFrame,
) -> Tuple[pd.DataFrame, Dict[str, LabelEncoder]]:
    frame = merge_weather(data, weather)
    frame = frame.sort_values(["commodity", "mandi", "date"]).reset_index(drop=True)
    groups = frame.groupby(["commodity", "mandi"], sort=False)

    for days in (1, 7, 14, 30, 365):
        frame[f"price_lag_{days}d"] = groups["modal_price"].shift(days)
    frame["price_trend_7d"] = (frame["modal_price"] - frame["price_lag_7d"]) / frame["price_lag_7d"]
    frame["price_trend_30d"] = (frame["modal_price"] - frame["price_lag_30d"]) / frame["price_lag_30d"]
    frame["arrivals_lag_7d"] = groups["arrivals_tonnes"].shift(7)
    arrivals_average = groups["arrivals_tonnes"].transform(
        lambda values: values.shift(1).rolling(7).mean()
    )
    frame["arrivals_trend"] = (frame["arrivals_tonnes"] - arrivals_average) / arrivals_average
    frame["month"] = frame["date"].dt.month
    frame["week_of_year"] = frame["date"].dt.isocalendar().week.astype(int).clip(upper=52)
    frame["day_of_week"] = frame["date"].dt.dayofweek
    frame["days_to_diwali"] = frame["date"].map(lambda value: days_until_next(value, DIWALI_DATES))
    frame["days_to_navratri"] = frame["date"].map(lambda value: days_until_next(value, NAVRATRI_DATES))
    frame["is_harvest_season"] = [
        int(month in HARVEST_MONTHS[commodity])
        for commodity, month in zip(frame["commodity"], frame["month"])
    ]
    frame["rainfall_7d_sum"] = groups["precipitation_mm"].transform(
        lambda values: values.rolling(7, min_periods=1).sum()
    )
    frame["is_monsoon"] = frame["month"].between(6, 9).astype(int)
    festival_features = frame["date"].map(get_festival_features)
    for column in (
        "days_to_next_festival", "festival_demand_score", "is_festival_period",
        "next_festival_multiplier",
    ):
        frame[column] = festival_features.map(lambda values: values[column])
    frame["post_harvest_pressure"] = [
        post_harvest_pressure(commodity, observed)
        for commodity, observed in zip(frame["commodity"], frame["date"])
    ]

    commodity_encoder = LabelEncoder().fit(frame["commodity"])
    mandi_encoder = LabelEncoder().fit(frame["mandi"])
    frame["commodity_encoded"] = commodity_encoder.transform(frame["commodity"])
    frame["mandi_encoded"] = mandi_encoder.transform(frame["mandi"])
    frame["target_price_7d"] = groups["modal_price"].shift(-7)
    frame = frame.replace([np.inf, -np.inf], np.nan).dropna(
        subset=FEATURE_COLUMNS + ["target_price_7d"]
    )
    return frame, {"commodity": commodity_encoder, "mandi": mandi_encoder}


def evaluate(
    name: str,
    trained_model: object,
    test: pd.DataFrame,
    columns: List[str],
) -> Tuple[float, List[Dict[str, object]]]:
    predictions = trained_model.predict(test[columns])
    overall_mae = float(mean_absolute_error(test["target_price_7d"], predictions))
    rows: List[Dict[str, object]] = []
    for commodity in sorted(test["commodity"].unique()):
        mask = test["commodity"] == commodity
        actual = test.loc[mask, "target_price_7d"]
        predicted = predictions[mask.to_numpy()]
        commodity_mae = mean_absolute_error(actual, predicted)
        rows.append(
            {
                "Model": name,
                "Commodity": commodity,
                "MAE (₹/qtl)": round(commodity_mae, 2),
                "RMSE (₹/qtl)": round(mean_squared_error(actual, predicted) ** 0.5, 2),
                "Accuracy (%)": round(max(0.0, 100 * (1 - commodity_mae / actual.mean())), 2),
            }
        )
    return overall_mae, rows


def main() -> None:
    for required_path, instruction in (
        (DATA_PATH, "Run fetch_agmarknet.py first"),
        (WEATHER_PATH, "Run fetch_weather.py first"),
    ):
        if not required_path.exists():
            raise FileNotFoundError(f"{instruction}: {required_path} does not exist")
    featured, encoders = engineer_features(pd.read_csv(DATA_PATH), pd.read_csv(WEATHER_PATH))
    cutoff = featured["date"].max() - pd.Timedelta(days=89)
    train = featured[featured["date"] < cutoff]
    test = featured[featured["date"] >= cutoff]
    if train.empty or test.empty:
        raise ValueError("The dataset does not contain enough history for a 90-day holdout")

    # Recreate the Week 1 Random Forest on the same training split. The saved Week
    # 1 production artifact was refit on all observations, so evaluating that file
    # against this holdout would leak the answer and understate its error.
    week_1_model = RandomForestRegressor(
        n_estimators=200, max_depth=15, min_samples_leaf=5,
        random_state=42, n_jobs=-1,
    )
    week_1_model.fit(train[BASE_FEATURE_COLUMNS], train["target_price_7d"])
    week_1_mae, week_1_rows = evaluate("Baseline Random Forest", week_1_model, test, BASE_FEATURE_COLUMNS)
    print(f"Baseline Random Forest holdout MAE on the shared test window: ₹{week_1_mae:,.2f}/qtl")

    models = {
        "Random Forest v2": RandomForestRegressor(
            n_estimators=200, max_depth=15, min_samples_leaf=5,
            random_state=42, n_jobs=-1,
        ),
        "XGBoost v2": XGBRegressor(
            n_estimators=200, learning_rate=0.05, max_depth=6,
            random_state=42, n_jobs=-1, objective="reg:squarederror",
        ),
    }
    results: List[Dict[str, object]] = week_1_rows
    scores: Dict[str, float] = {"Baseline Random Forest": week_1_mae}
    for name, candidate in models.items():
        print(f"Training {name} on {len(train):,} observations...")
        candidate.fit(train[FEATURE_COLUMNS], train["target_price_7d"])
        scores[name], rows = evaluate(name, candidate, test, FEATURE_COLUMNS)
        results.extend(rows)
        print(f"{name} overall holdout MAE: ₹{scores[name]:,.2f}/qtl")

    winner_name = min(scores, key=scores.get)
    if winner_name == "Baseline Random Forest":
        winner = week_1_model
        winner_columns = BASE_FEATURE_COLUMNS
    else:
        winner = models[winner_name]
        winner_columns = FEATURE_COLUMNS
    winner.fit(featured[winner_columns], featured["target_price_7d"])
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(winner, MODEL_DIR / "price_model_v2.pkl")
    joblib.dump(encoders, MODEL_DIR / "label_encoders.pkl")
    (MODEL_DIR / "feature_columns.json").write_text(
        json.dumps(winner_columns, indent=2), encoding="utf-8"
    )

    print("\nCandidate holdout accuracy by commodity (last 90 days)")
    print(pd.DataFrame(results).to_string(index=False))
    print(f"\nSelected model: {winner_name} (overall MAE ₹{scores[winner_name]:,.2f}/qtl)")
    improvement = week_1_mae - scores[winner_name]
    improvement_pct = improvement / week_1_mae * 100
    direction = "improvement" if improvement >= 0 else "regression"
    print(f"Selected candidate vs baseline: ₹{abs(improvement):,.2f}/qtl ({abs(improvement_pct):.2f}%) {direction}")
    print(f"Saved validated model to {MODEL_DIR / 'price_model_v2.pkl'}")


if __name__ == "__main__":
    main()
