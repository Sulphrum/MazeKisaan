"""Indian agricultural-demand festival features used by training and serving."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, Union


FESTIVALS = [
    # 2024
    {"name": "Ganesh Chaturthi", "start": "2024-09-07", "end": "2024-09-17", "demand_multiplier": 1.15},
    {"name": "Navratri", "start": "2024-10-03", "end": "2024-10-12", "demand_multiplier": 1.18},
    {"name": "Diwali", "start": "2024-11-01", "end": "2024-11-05", "demand_multiplier": 1.25},
    {"name": "Holi", "start": "2025-03-14", "end": "2025-03-14", "demand_multiplier": 1.12},
    {"name": "Eid", "start": "2025-03-31", "end": "2025-03-31", "demand_multiplier": 1.10},
    # 2025
    {"name": "Ganesh Chaturthi", "start": "2025-08-27", "end": "2025-09-06", "demand_multiplier": 1.15},
    {"name": "Navratri", "start": "2025-09-22", "end": "2025-10-01", "demand_multiplier": 1.18},
    {"name": "Diwali", "start": "2025-10-20", "end": "2025-10-24", "demand_multiplier": 1.25},
    {"name": "Holi", "start": "2026-03-02", "end": "2026-03-02", "demand_multiplier": 1.12},
    # 2026
    {"name": "Ganesh Chaturthi", "start": "2026-08-19", "end": "2026-08-29", "demand_multiplier": 1.15},
    {"name": "Navratri", "start": "2026-10-02", "end": "2026-10-11", "demand_multiplier": 1.18},
    {"name": "Diwali", "start": "2026-10-19", "end": "2026-10-23", "demand_multiplier": 1.25},
    # The Week 1 planning horizon includes this 2027 event.
    {"name": "Holi", "start": "2027-03-14", "end": "2027-03-14", "demand_multiplier": 1.12},
]


def _as_date(value: Union[str, date, datetime]) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()


def _normalised() -> list[Dict[str, Any]]:
    return [
        {
            **festival,
            "start_date": _as_date(festival["start"]),
            "end_date": _as_date(festival["end"]),
        }
        for festival in FESTIVALS
    ]


def get_festival_features(value: Union[str, date, datetime]) -> Dict[str, Any]:
    """Return smooth, leakage-free demand signals for one calendar date."""
    day = _as_date(value)
    festivals = _normalised()
    active = next(
        (festival for festival in festivals if festival["start_date"] <= day <= festival["end_date"]),
        None,
    )
    upcoming = [festival for festival in festivals if festival["start_date"] > day]
    previous = [festival for festival in festivals if festival["end_date"] < day]
    next_festival = min(upcoming, key=lambda item: item["start_date"], default=None)
    last_festival = max(previous, key=lambda item: item["end_date"], default=None)

    if active:
        days_to_next = 0
        multiplier = float(active["demand_multiplier"])
        # Demand stays elevated through the event and drops to zero the day after.
        duration = max(1, (active["end_date"] - active["start_date"]).days)
        progress = (day - active["start_date"]).days / duration
        demand_score = max(0.45, 0.90 - 0.45 * progress)
    elif next_festival:
        days_to_next = (next_festival["start_date"] - day).days
        multiplier = float(next_festival["demand_multiplier"])
        if 2 <= days_to_next <= 14:
            demand_score = (14 - days_to_next) / 12
        elif days_to_next in (0, 1):
            demand_score = 0.90
        else:
            demand_score = 0.0
    else:
        days_to_next = 365
        multiplier = 1.0
        demand_score = 0.0

    days_since_last = (day - last_festival["end_date"]).days if last_festival else 365
    if days_since_last == 1:
        # Explicit cooldown boundary: the score resets immediately after an event,
        # even when another festival is already within its demand ramp window.
        demand_score = 0.0
    return {
        "days_to_next_festival": int(max(0, days_to_next)),
        "days_since_last_festival": int(max(0, days_since_last)),
        "next_festival_multiplier": multiplier,
        "is_festival_period": int(active is not None),
        "festival_demand_score": round(float(min(1.0, max(0.0, demand_score))), 4),
    }


def get_next_festival(value: Union[str, date, datetime]) -> Dict[str, Any]:
    """Return the active or next festival for human-readable API context."""
    day = _as_date(value)
    festivals = _normalised()
    candidate = next(
        (festival for festival in festivals if festival["start_date"] <= day <= festival["end_date"]),
        None,
    )
    if candidate is None:
        future = [festival for festival in festivals if festival["start_date"] > day]
        candidate = min(future, key=lambda item: item["start_date"], default=None)
    if candidate is None:
        return {"name": "Seasonal demand", "days_away": 365, "demand_multiplier": 1.0}
    return {
        "name": candidate["name"],
        "days_away": max(0, (candidate["start_date"] - day).days),
        "demand_multiplier": float(candidate["demand_multiplier"]),
        "start": candidate["start"],
        "end": candidate["end"],
    }
