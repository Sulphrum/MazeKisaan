# Official market data and model updates

माझे Kisan uses the Government of India's daily mandi-price resource generated
from AGMARKNET. The feed contains market, commodity, variety, grade, reporting
date, and wholesale minimum, maximum, and modal prices.

## Important distinction

- `ml/data/live_market_prices.csv` is the cache of downloaded official prices.
- `ml/data/maharashtra_prices.csv` is currently labelled development history.
  It is useful for demonstrating the ML flow, but it is not official historical
  evidence and must not be presented to farmers as current data.
- `ml/data/market_data_status.json` records the last update attempt, last
  successful update, source, reported market date, crops, and any error.

The updater never generates substitute values and never deletes the last good
official cache after a failed request.

## One-time setup

1. Register at `https://data.gov.in` and create a personal API key.
2. Store the key outside the repository as `DATA_GOV_IN_API_KEY`.
3. Start the Python ML service as described in the main README.

macOS or Linux:

```bash
export DATA_GOV_IN_API_KEY="your-private-key"
npm run data:sync
```

Windows PowerShell:

```powershell
$env:DATA_GOV_IN_API_KEY="your-private-key"
ml\.venv\Scripts\python.exe ml\sync_market_data.py
```

The old public demonstration key is not used because it is not authorised for
production access.

## Automatic updates

Run `ml/sync_market_data.py` once each morning after mandis have reported their
previous-day transactions. A production host should use its scheduler or cron
service rather than keeping a scheduler inside the web request process.

Example cron entry for 06:30 India time on a server configured to IST:

```cron
30 6 * * * cd /path/to/majhe-kisan && /path/to/python ml/sync_market_data.py
```

The FastAPI service notices changes to the live CSV without a restart. The
Express `/api/mandi/prices` route prefers those official records and returns the
demo feed only when no official cache is available.

## Model retraining policy

Do not retrain the prediction model after every API call. A safer production
cycle is:

1. Download and validate official prices daily.
2. Accumulate history by commodity, variety, grade, and mandi.
3. Retrain weekly only after each crop has enough clean observations.
4. Evaluate on a later time window that was not used for training.
5. Promote the candidate only when it improves error and does not create a
   serious regression for any major crop.
6. Keep the previous model available for rollback.

The current public price resource does not consistently include arrival
quantity. Missing arrivals remain missing in the official cache; they are not
invented. A production forecasting model should add a verified arrival-volume
source before using arrivals as a major prediction feature.

## Supported crops

The shared crop configuration currently supports tomato, onion, potato,
brinjal, green chilli, cabbage, cauliflower, okra, capsicum, cucumber, bottle
gourd, bitter gourd, pumpkin, carrot, radish, peas, garlic, ginger, grapes, and
wheat. It also maps known AGMARKNET spellings such as `Bhindi(Ladies Finger)`,
`Cucumbar(Kheera)`, `Raddish`, and `Ginger(Green)` to simple names shown in the
website.

Adding a crop in `ml/commodity_config.py` makes the downloader recognise it and
keeps the training and prediction services on the same crop list.

