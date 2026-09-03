# माझे Kisan backend and ML status

This project now uses the existing Express API as the source of truth for application data.

## Implemented

- Signed bearer authentication with a 24-hour lifetime. Tokens remain verifiable after a server restart when the same session secret is used.
- Password verification with SHA-256 hashing for newly created accounts and transparent upgrade of seeded plaintext passwords after successful login.
- Real OTP generation/expiry in development; OTP is not returned in production.
- Protected application API routes and role checks.
- Farmer-owned crop CRUD, field-to-storage harvesting, quantity reduction, and dependent financial recalculation.
- Stored-crop lifecycle support, including quality grade and marketplace selling flow.
- Farmer-owned marketplace listing creation.
- Buyer marketplace ordering with quantity checks, demo escrow wallet checks, listing quantity reduction and sold status.
- Order ownership checks and forward-only status transitions.
- Escrow release protection against duplicate releases and premature release.
- User-specific notifications and read protection.
- Buyer-specific demands and negotiation visibility.
- Live frontend reads for buyer marketplace/orders/demands and mandi analytics instead of the old buyer mock-data fallbacks.
- Buyer transport choices now load from the backend.
- Personalized scheme discovery with eligibility explanations and responsible credit guidance.
- Optional Python price-intelligence service for mandi forecasting and scheme-side intelligence, with prototype fallbacks if that service is offline.
- Farmer-facing financial guidance expressed in practical selling language instead of relying only on finance terminology.

## Deliberate prototype limitations
- `server/data/db.json` remains the persistence layer for the hackathon prototype. It is not a production database.
- Escrow is a demo ledger, not a real payment gateway.
- Market and weather datasets are packaged prototype data; no guaranteed live government feed is connected yet.
- Quality assay is a deterministic prototype service, not computer vision.
- Buyer recommendations are a deterministic scoring service, not a trained ML model.
- OTP delivery is simulated in development because no SMS provider is configured.
- The standalone Express command exposes the API but does not serve the production frontend build.
- The default local session secret is for development only.

## Run

Install dependencies on the machine where the project is being run. Do not copy `node_modules` or `ml/.venv` from another computer or operating system.

```bash
npm install
npm run dev
```

The Vite configuration mounts the Express `/api/*` backend into the dev server, so the frontend can call `/api/...` directly.

For the optional ML service, create a Python environment, install `ml/requirements.txt`, and run:

```bash
python -m uvicorn api:app --app-dir ml --host 127.0.0.1 --port 8000
```

Exact Windows commands are in `docs/WINDOWS_SETUP.md`.

For a standalone backend:

```bash
npm run server
```

Optional backend port:

```bash
BACKEND_PORT=5000 npm run server
```

## Demo accounts

- Farmer: `98220 14589` / `password123`
- Buyer: `sunil@deccanfresh.com` / `password123`

These are seeded demo accounts only. New registrations are stored in `server/data/db.json`.

## Production readiness

Before a public deployment, replace the JSON datastore with a managed database, configure a strong `KISANSETU_SESSION_SECRET`, connect real OTP/payment/market data providers, configure HTTPS and allowed origins, and deploy the frontend, Express API, and Python ML service. See `docs/DEPLOYMENT.md`.
