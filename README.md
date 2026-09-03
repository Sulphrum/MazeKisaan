# माझे Kisan

माझे Kisan is a farmer-first crop decision and trading prototype. It helps a farmer manage crops from the field through harvest and storage, understand the current value of produce in plain language, compare selling choices, discover nearby buyer demand, and find relevant government schemes. It also includes an optional ML service for price intelligence.

## What the prototype includes

- Farmer and buyer demo sign-in
- Field crop, harvest, and storage lifecycle with quantity updates
- Plain-language crop value and selling guidance
- Storage-led selling flow with quality grade and quantity selection
- Nearby buyer demand and marketplace listings
- Buyer orders, negotiation visibility, notifications, and demo escrow
- Mandi trends and optional ML-assisted price forecasting
- Personalized scheme discovery, eligibility reasons, and responsible credit guidance
- English, Marathi, and Hindi-oriented interface content

## Technology

- Frontend: React 19, TypeScript, Vite 8, and Tailwind CSS 4
- Application API: Express 5 and TypeScript
- Demo persistence: `server/data/db.json`
- ML service: Python, FastAPI, scikit-learn, and XGBoost

In development, Vite and Express are integrated into one command. The optional Python service runs separately on port 8000.

## Requirements

Install these tools on the computer that will run the project:

- Node.js 22 (recommended)
- npm, included with Node.js
- Python 3.13 or 3.14, 64-bit (required only for full ML predictions)
- About 1 GB of free space for downloaded dependencies

Do not share or reuse `node_modules` or `ml/.venv` between macOS and Windows. They contain operating-system-specific files.

## Quick start on Windows

Open PowerShell in the extracted `माझे Kisan` folder.

1. Install the website dependencies:

   ```powershell
   npm install
   ```

2. Create and prepare the optional ML environment:

   ```powershell
   py -3.13 -m venv ml\.venv
   ml\.venv\Scripts\python.exe -m pip install --upgrade pip
   ml\.venv\Scripts\python.exe -m pip install -r ml\requirements.txt
   ```

   If Python 3.14 is installed instead, replace `-3.13` with `-3.14`.

3. Start the ML service in the first PowerShell window:

   ```powershell
   ml\.venv\Scripts\python.exe -m uvicorn api:app --app-dir ml --host 127.0.0.1 --port 8000
   ```

4. Open a second PowerShell window in the same folder and start माझे Kisan:

   ```powershell
   npm run dev
   ```

5. Open `http://localhost:8443` in a browser.

The website can run without step 2 and step 3, but ML-backed forecasts will use the available prototype fallback behavior. See [the complete Windows guide](docs/WINDOWS_SETUP.md) for installation checks and troubleshooting.

## Quick start on macOS or Linux

```bash
npm install
python3 -m venv ml/.venv
ml/.venv/bin/python -m pip install --upgrade pip
ml/.venv/bin/python -m pip install -r ml/requirements.txt
```

Start the optional ML service:

```bash
ml/.venv/bin/python -m uvicorn api:app --app-dir ml --host 127.0.0.1 --port 8000
```

In another terminal, start the application:

```bash
npm run dev
```

Then open `http://localhost:8443`.

## Demo accounts

| Role | Login | Password |
|---|---|---|
| Farmer (Ramesh Patil) | `98220 14589` | `password123` |
| Buyer (Sunil / Deccan Fresh) | `sunil@deccanfresh.com` | `password123` |

These credentials and the included records are demonstration data only.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Run the frontend and integrated Express API for development |
| `npm run build` | Create the optimized frontend in `dist/` |
| `npm run server` | Run only the Express API, normally on port 5000 |
| `npm run test:api` | Run the API integration checks |
| `npm run format` | Format project source files |
| `npm run data:sync` | Download and cache the latest official Maharashtra mandi prices |
| `npm run data:seed-demo` | Explicitly recreate labelled offline demo history for all supported crops |
| `npm run ml:train` | Retrain and evaluate the local price model |

## Project structure

```text
माझे Kisan/
├── src/                 React interface and client services
├── server/              Express API, routes, and demo datastore
├── ml/                  Python service, datasets, and trained models
├── docs/                Windows and deployment guides
├── vite.config.ts       Vite configuration and integrated development API
├── package.json         JavaScript commands and dependencies
└── README.md            Main project guide
```

## Data and security notes

- `server/data/db.json` is a local demo database. Back it up before demonstrations where entered data matters.
- The included ML training CSV is explicitly labelled demo history. Official current prices are downloaded separately with a private `DATA_GOV_IN_API_KEY`; see [the market-data guide](docs/MARKET_DATA.md).
- Set `KISANSETU_SESSION_SECRET` to a long, random value in production. The built-in value is only for local development.
- Development OTP delivery is simulated; no real SMS provider is configured.
- Escrow, quality checks, recommendations, market feeds, and several buyer records are prototype demonstrations, not live financial or procurement services.
- Never commit `.env` files, production credentials, real identity documents, or payment information.

## Sharing the project

Share the clean source ZIP, not the entire working folder. A recipient must extract it and install Node and Python dependencies using the instructions above. Excluding installed environments keeps the archive small and makes it portable across operating systems.

The clean ZIP should include source code, model artifacts, datasets, documentation, `package.json`, `package-lock.json`, and `ml/requirements.txt`. It should exclude `node_modules`, `ml/.venv`, `dist`, caches, `.git`, `.DS_Store`, and existing ZIP files.

## Deployment

The complete application is not a static-only website. A production deployment needs three parts:

1. The built React frontend
2. The Express application API
3. The Python ML service for full prediction functionality

It also needs production secrets and persistent storage. Follow [the deployment guide](docs/DEPLOYMENT.md) before publishing it publicly.

## Troubleshooting

- **`npm` is not recognized:** install Node.js, close PowerShell, and open it again.
- **`py` is not recognized:** install 64-bit Python and enable the installer option that adds the launcher/Python to PATH.
- **Port 8443 is already in use:** in PowerShell run `$env:PORT=8444; npm run dev`, then open port 8444.
- **ML predictions are unavailable:** confirm that the ML terminal is still running and reports port 8000.
- **A package install fails after copying from another computer:** delete the copied `node_modules` or `ml/.venv` and reinstall locally.
- **Saved demo changes disappeared or conflict:** restore a known copy of `server/data/db.json`; this prototype does not yet use a production database.

For current backend capabilities and prototype limitations, read [BACKEND_STATUS.md](BACKEND_STATUS.md).
