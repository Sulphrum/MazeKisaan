"""Fetch Open-Meteo history/forecasts with deterministic offline fallback."""

from __future__ import annotations

import math
from datetime import date
from pathlib import Path
from typing import Any, Dict, List

import httpx
import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "data" / "weather_maharashtra.csv"
START_DATE = "2024-08-01"
END_DATE = "2026-09-03"
LOCATIONS = {
    "Nashik": {"lat": 20.0059, "lon": 73.7898},
    "Pune": {"lat": 18.5204, "lon": 73.8567},
    "Solapur": {"lat": 17.6868, "lon": 75.9064},
    "Aurangabad": {"lat": 19.8762, "lon": 75.3433},
}
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


def _daily_rows(payload: Dict[str, Any], district: str) -> List[Dict[str, Any]]:
    daily = payload.get("daily", {})
    dates = daily.get("time", [])
    keys = [
        "precipitation_sum", "temperature_2m_max", "temperature_2m_min",
        "wind_speed_10m_max",
    ]
    if not dates or any(len(daily.get(key, [])) != len(dates) for key in keys):
        raise ValueError("Open-Meteo returned incomplete daily data")
    return [
        {
            "date": observed,
            "district": district,
            "precipitation_mm": round(float(daily["precipitation_sum"][index] or 0), 2),
            "temp_max_c": round(float(daily["temperature_2m_max"][index]), 2),
            "temp_min_c": round(float(daily["temperature_2m_min"][index]), 2),
            "wind_speed_kmh": round(float(daily["wind_speed_10m_max"][index]), 2),
        }
        for index, observed in enumerate(dates)
    ]


def fetch_historical_weather() -> pd.DataFrame:
    rows: List[Dict[str, Any]] = []
    with httpx.Client(timeout=15.0, follow_redirects=True) as client:
        for district, coordinates in LOCATIONS.items():
            response = client.get(
                ARCHIVE_URL,
                params={
                    "latitude": coordinates["lat"],
                    "longitude": coordinates["lon"],
                    "start_date": START_DATE,
                    "end_date": END_DATE,
                    "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min,wind_speed_10m_max",
                    "timezone": "Asia/Kolkata",
                },
            )
            response.raise_for_status()
            rows.extend(_daily_rows(response.json(), district))
    frame = pd.DataFrame(rows)
    expected_days = len(pd.date_range(START_DATE, END_DATE, freq="D"))
    if len(frame) != expected_days * len(LOCATIONS):
        raise ValueError("Open-Meteo history does not cover the complete requested period")
    return frame


def generate_synthetic_weather() -> pd.DataFrame:
    rng = np.random.default_rng(84)
    dates = pd.date_range(START_DATE, END_DATE, freq="D")
    rows: List[Dict[str, Any]] = []
    district_temp_bias = {"Nashik": -1.0, "Pune": -0.4, "Solapur": 1.8, "Aurangabad": 0.7}
    district_rain_bias = {"Nashik": 1.10, "Pune": 1.18, "Solapur": 0.70, "Aurangabad": 0.82}
    for district in LOCATIONS:
        for timestamp in dates:
            day_of_year = timestamp.dayofyear
            month = timestamp.month
            # Warmest in Apr-May and coolest in Dec-Jan.
            seasonal_heat = 7.5 * math.sin(2 * math.pi * (day_of_year - 48) / 365)
            temp_max = 31 + seasonal_heat + district_temp_bias[district] + rng.normal(0, 1.8)
            temp_max = float(np.clip(temp_max, 21, 42))
            temp_min = float(np.clip(temp_max - rng.uniform(7, 14), 15, 30))
            if 6 <= month <= 9:
                wet_day = rng.random() < 0.67
                rain = rng.uniform(5, 25) * district_rain_bias[district] if wet_day else rng.uniform(0, 2)
            else:
                rain = rng.uniform(0, 2) if rng.random() < 0.24 else 0
            wind = float(np.clip(rng.normal(13 if 6 <= month <= 9 else 9, 3), 2, 30))
            rows.append(
                {
                    "date": timestamp.date().isoformat(),
                    "district": district,
                    "precipitation_mm": round(rain, 2),
                    "temp_max_c": round(temp_max, 2),
                    "temp_min_c": round(temp_min, 2),
                    "wind_speed_kmh": round(wind, 2),
                }
            )
    return pd.DataFrame(rows)


def fetch_weather_forecast(district: str, forecast_days: int = 14) -> List[Dict[str, Any]]:
    """Fetch a district forecast, falling back to plausible near-term weather."""
    district_name = district if district in LOCATIONS else "Nashik"
    coordinates = LOCATIONS[district_name]
    try:
        response = httpx.get(
            FORECAST_URL,
            params={
                "latitude": coordinates["lat"],
                "longitude": coordinates["lon"],
                "daily": "precipitation_sum,temperature_2m_max",
                "forecast_days": min(14, max(1, forecast_days)),
                "timezone": "Asia/Kolkata",
            },
            timeout=2.0,
            follow_redirects=True,
        )
        response.raise_for_status()
        daily = response.json()["daily"]
        return [
            {
                "date": observed,
                "district": district_name,
                "precipitation_mm": float(daily["precipitation_sum"][index] or 0),
                "temp_max_c": float(daily["temperature_2m_max"][index]),
            }
            for index, observed in enumerate(daily["time"])
        ]
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        synthetic = generate_synthetic_weather()
        district_rows = synthetic[synthetic["district"] == district_name].tail(forecast_days)
        return district_rows[["date", "district", "precipitation_mm", "temp_max_c"]].to_dict("records")


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    try:
        weather = fetch_historical_weather()
        source = "Open-Meteo"
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        print(f"Open-Meteo unavailable or incomplete ({exc}); using synthetic weather fallback.")
        weather = generate_synthetic_weather()
        source = "realistic synthetic fallback"
    columns = [
        "date", "district", "precipitation_mm", "temp_max_c", "temp_min_c",
        "wind_speed_kmh",
    ]
    weather[columns].to_csv(OUTPUT, index=False)
    print(f"Saved {len(weather):,} {source} observations to {OUTPUT}")
    print(f"Coverage: {weather['date'].min()} through {weather['date'].max()}")


if __name__ == "__main__":
    main()
