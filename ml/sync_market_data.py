"""Maintain a safe local cache of official AGMARKNET prices.

The command downloads current Maharashtra mandi observations from the official
data.gov.in resource and upserts them into ``data/live_market_prices.csv``.
It never generates substitute values and never overwrites the last good cache
when the source is unavailable.
"""

from __future__ import annotations

import json
import os
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import pandas as pd

from commodity_config import canonical_commodity


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
LIVE_OUTPUT = DATA_DIR / "live_market_prices.csv"
STATUS_OUTPUT = DATA_DIR / "market_data_status.json"
RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
SOURCE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"
PAGE_SIZE = 1000
MAX_PAGES = 100


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_status() -> dict[str, Any]:
    if not STATUS_OUTPUT.exists():
        return {}
    try:
        return json.loads(STATUS_OUTPUT.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_status(status: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    STATUS_OUTPUT.write_text(json.dumps(status, indent=2, ensure_ascii=False), encoding="utf-8")


def first_value(row: dict[str, Any], *names: str) -> Any:
    lookup = {str(key).casefold(): value for key, value in row.items()}
    for name in names:
        value = lookup.get(name.casefold())
        if value not in (None, ""):
            return value
    return None


def parse_date(value: Any) -> date | None:
    if value in (None, ""):
        return None
    parsed = pd.to_datetime(str(value), dayfirst=True, errors="coerce")
    return None if pd.isna(parsed) else parsed.date()


def parse_positive_number(value: Any) -> float | None:
    try:
        number = float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def normalise_record(row: dict[str, Any], fetched_at: str) -> dict[str, Any] | None:
    crop = canonical_commodity(str(first_value(row, "commodity", "Commodity") or ""))
    observed = parse_date(first_value(row, "arrival_date", "Arrival_Date", "date"))
    minimum = parse_positive_number(first_value(row, "min_price", "Min_x0020_Price"))
    maximum = parse_positive_number(first_value(row, "max_price", "Max_x0020_Price"))
    modal = parse_positive_number(first_value(row, "modal_price", "Modal_x0020_Price"))
    market = first_value(row, "market", "Market")
    district = first_value(row, "district", "District")
    if not crop or not observed or not market or not district or not minimum or not maximum or not modal:
        return None
    if minimum > maximum or not minimum <= modal <= maximum:
        return None
    arrivals = parse_positive_number(first_value(row, "arrivals", "Arrivals", "commodity_arrivals"))
    return {
        "date": observed.isoformat(),
        "commodity": crop,
        "mandi": str(market).strip(),
        "district": str(district).strip(),
        "min_price": round(minimum, 2),
        "max_price": round(maximum, 2),
        "modal_price": round(modal, 2),
        "arrivals_tonnes": round(arrivals, 2) if arrivals is not None else None,
        "variety": str(first_value(row, "variety", "Variety") or "Not reported").strip(),
        "grade": str(first_value(row, "grade", "Grade") or "Not reported").strip(),
        "source": "agmarknet_data_gov_in",
        "fetched_at": fetched_at,
    }


def download(api_key: str) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    fetched_at = utc_now()
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for page in range(MAX_PAGES):
            response = client.get(
                SOURCE_URL,
                params={
                    "api-key": api_key,
                    "format": "json",
                    "offset": page * PAGE_SIZE,
                    "limit": PAGE_SIZE,
                    "filters[state.keyword]": "Maharashtra",
                },
            )
            response.raise_for_status()
            records = response.json().get("records", [])
            if not isinstance(records, list):
                raise ValueError("data.gov.in returned an unexpected records value")
            for raw in records:
                if isinstance(raw, dict):
                    normalised = normalise_record(raw, fetched_at)
                    if normalised:
                        rows.append(normalised)
            if len(records) < PAGE_SIZE:
                break
        else:
            raise RuntimeError("Safety page limit reached while downloading Maharashtra prices")
    frame = pd.DataFrame(rows)
    if frame.empty:
        raise ValueError("No supported Maharashtra crop records were returned")
    return frame


def merge_cache(incoming: pd.DataFrame) -> pd.DataFrame:
    existing = pd.read_csv(LIVE_OUTPUT) if LIVE_OUTPUT.exists() else pd.DataFrame()
    combined = pd.concat([existing, incoming], ignore_index=True)
    keys = ["date", "commodity", "mandi", "variety", "grade"]
    combined = combined.sort_values("fetched_at").drop_duplicates(keys, keep="last")
    return combined.sort_values(["date", "commodity", "mandi"]).reset_index(drop=True)


def main() -> int:
    status = load_status()
    live = status.setdefault("official_live", {})
    live.update({"last_attempt": utc_now(), "resource_id": RESOURCE_ID, "state": "Maharashtra"})
    api_key = os.environ.get("DATA_GOV_IN_API_KEY", "").strip()
    if not api_key:
        live.update({"ok": False, "error": "DATA_GOV_IN_API_KEY is not configured"})
        save_status(status)
        print("DATA_GOV_IN_API_KEY is not configured; the previous official cache was preserved.")
        return 2
    try:
        incoming = download(api_key)
        combined = merge_cache(incoming)
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        combined.to_csv(LIVE_OUTPUT, index=False)
        live.update(
            {
                "ok": True,
                "error": None,
                "last_success": utc_now(),
                "latest_market_date": str(combined["date"].max()),
                "new_rows_received": int(len(incoming)),
                "cached_rows": int(len(combined)),
                "commodities": sorted(combined["commodity"].unique().tolist()),
                "source_url": SOURCE_URL,
            }
        )
        save_status(status)
        print(f"Saved {len(incoming):,} official observations; cache now has {len(combined):,} rows.")
        print(f"Latest reported market date: {combined['date'].max()}")
        return 0
    except (httpx.HTTPError, ValueError, RuntimeError) as exc:
        live.update({"ok": False, "error": str(exc)})
        save_status(status)
        print(f"Official update failed; the previous cache was preserved: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
