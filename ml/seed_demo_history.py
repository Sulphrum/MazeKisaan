"""Create explicitly labelled offline history for development and model demos."""

from __future__ import annotations

import json
import math
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from commodity_config import COMMODITIES, COMMODITY_SPECS, HARVEST_MONTHS


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "data" / "maharashtra_prices.csv"
STATUS_OUTPUT = ROOT / "data" / "market_data_status.json"
START_DATE = date(2024, 8, 1)
END_DATE = date(2026, 9, 3)
MANDIS = {"Niphad": "Nashik", "Nashik": "Nashik", "Pune (Market Yard)": "Pune"}
FESTIVALS = [
    date(2024, 9, 7), date(2024, 10, 3), date(2024, 11, 1),
    date(2025, 8, 27), date(2025, 9, 22), date(2025, 10, 20),
    date(2026, 8, 27), date(2026, 10, 2), date(2026, 10, 20),
]


def festival_multiplier(day: date) -> float:
    boosts = []
    for festival in FESTIVALS:
        days_before = (festival - day).days
        if 0 <= days_before <= 14:
            boosts.append(1.15 + 0.10 * (1 - days_before / 14))
    return max(boosts, default=1.0)


def generate() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    dates = pd.date_range(START_DATE, END_DATE, freq="D")
    rows: list[dict[str, Any]] = []
    mandi_price_bias = {"Niphad": 0.98, "Nashik": 1.00, "Pune (Market Yard)": 1.06}
    mandi_arrival_bias = {"Niphad": 1.12, "Nashik": 1.00, "Pune (Market Yard)": 0.88}
    for commodity in COMMODITIES:
        spec = COMMODITY_SPECS[commodity]
        low, high = spec.price_range
        midpoint = (low + high) / 2
        for mandi, district in MANDIS.items():
            for timestamp in dates:
                day = timestamp.date()
                inflation = 1 + 0.07 * ((day - START_DATE).days / 365.25)
                harvest = day.month in HARVEST_MONTHS[commodity]
                seasonal = 1 + spec.seasonal_amplitude * math.sin(
                    2 * math.pi * (day.month - 1) / 12 + spec.seasonal_phase
                )
                wave = 1 + 0.035 * math.sin((day - START_DATE).days / 11)
                modal = midpoint * inflation * seasonal * (0.75 if harvest else 1.0)
                modal *= festival_multiplier(day) * (0.935 if day.weekday() == 0 else 1.0)
                modal *= wave * rng.uniform(0.95, 1.05)
                modal = float(np.clip(modal, low * inflation * 0.90, high * inflation * 1.08))
                modal *= mandi_price_bias[mandi]
                arrivals = spec.base_arrivals * (1.34 if harvest else 0.90)
                arrivals *= 1.25 if day.weekday() == 0 else 1.0
                arrivals *= mandi_arrival_bias[mandi] * rng.uniform(0.90, 1.10)
                spread = rng.uniform(0.08, 0.15)
                rows.append(
                    {
                        "date": day.isoformat(),
                        "commodity": commodity,
                        "mandi": mandi,
                        "district": district,
                        "min_price": round(modal * (1 - spread)),
                        "max_price": round(modal * (1 + spread)),
                        "modal_price": round(modal),
                        "arrivals_tonnes": round(arrivals, 2),
                        "variety": "Demo composite",
                        "grade": "Demo",
                        "source": "demo_generated",
                        "fetched_at": "",
                    }
                )
    return pd.DataFrame(rows)


def main() -> None:
    frame = generate()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(OUTPUT, index=False)
    try:
        status = json.loads(STATUS_OUTPUT.read_text(encoding="utf-8")) if STATUS_OUTPUT.exists() else {}
    except (json.JSONDecodeError, OSError):
        status = {}
    status["training_history"] = {
        "source": "demo_generated",
        "warning": "Generated values are for development only and are not current mandi observations.",
        "rows": len(frame),
        "commodities": COMMODITIES,
        "start_date": str(frame["date"].min()),
        "end_date": str(frame["date"].max()),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    STATUS_OUTPUT.write_text(json.dumps(status, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved {len(frame):,} labelled demo rows for {len(COMMODITIES)} crops.")


if __name__ == "__main__":
    main()
