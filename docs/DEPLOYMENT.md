# माझे Kisan deployment guide

माझे Kisan can be deployed from this project folder, but the full application is not suitable for static hosting alone. It has a React frontend, an Express API, a Python ML service, and mutable data.

## Recommended production layout

Deploy these components:

1. **Frontend:** run `npm run build` and serve the generated `dist/` files from a static host or web server.
2. **Application API:** deploy the Express application as a Node.js service.
3. **ML API:** deploy `ml/api.py` as a Python service with the packages in `ml/requirements.txt` and the packaged model/data files.
4. **Database:** replace `server/data/db.json` with PostgreSQL or another managed transactional database.

The current development command mounts Express directly into Vite. That convenient development integration does not automatically become a production server. The standalone `npm run server` command exposes the API but does not serve `dist/`.

## Changes required before public deployment

- Make the frontend/API base URL configurable for separate domains, or serve both behind one reverse proxy.
- Make the ML service URL configurable instead of relying on `http://localhost:8000` in server routes.
- Set a strong, stable `KISANSETU_SESSION_SECRET` through the hosting platform's secret manager.
- Replace JSON-file persistence with a production database and migrations.
- Configure HTTPS, trusted origins, request limits, structured logs, backups, and monitoring.
- Connect a real OTP provider before relying on phone verification.
- Connect an approved payment/escrow provider before processing real money.
- Validate any live mandi, weather, scheme, logistics, and buyer data providers.
- Add privacy controls and secure storage before accepting real identity or farm documents.
- Run security, accessibility, browser, and end-to-end testing.

## Build check

From a clean checkout or extracted source archive:

```bash
npm install
npm run build
```

The frontend build appears in `dist/`. Do not commit or share that folder unless a specific hosting workflow requires prebuilt assets.

## Environment values

The current server recognizes:

| Variable | Purpose |
|---|---|
| `KISANSETU_SESSION_SECRET` | Signs login tokens; mandatory and secret in production |
| `KISANSETU_DB_DIR` | Overrides the local JSON data directory for controlled prototype hosting |
| `BACKEND_PORT` or `API_PORT` | Port for the standalone Express API |
| `PORT` | Vite development/preview port |
| `NODE_ENV=production` | Prevents simulated OTP values from being returned by the API |
| `ML_SERVICE_URL` | Address of the deployed Python ML service |
| `DATA_GOV_IN_API_KEY` | Private key used by the scheduled official mandi-data updater |

`KISANSETU_DB_DIR` can help with a private demonstration on persistent storage, but it is not a replacement for a database under concurrent real-world use.

## Practical deployment path

For a college or stakeholder demonstration, run all services on one controlled machine or virtual server behind HTTPS and keep the JSON data backed up. For a real farmer-facing release, complete the production changes above and use managed Node, Python, database, and object-storage services.

## Release checklist

- Frontend build succeeds
- API tests pass
- ML health endpoint responds
- Production secrets are configured outside the repository
- No `.env`, `node_modules`, `.venv`, private documents, or development credentials are in the release
- Database backup and restore are tested
- OTP and payments are in test mode until legal and operational approval
- Monitoring and a rollback procedure are ready

## Market-data schedule

Configure the hosting platform to run `ml/sync_market_data.py` once each morning with `DATA_GOV_IN_API_KEY` supplied by its secret manager. Do not place the key in source code. Keep the last successful cache when an update fails, monitor `/api/mandi/data-status`, and show the reported market date to users. Full details are in [MARKET_DATA.md](MARKET_DATA.md).
