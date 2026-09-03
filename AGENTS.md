# माझे Kisan development guide

माझे Kisan is a React, Vite, Tailwind CSS, Express, and optional Python ML application.

## Development Server

A Vite development server may already be running on `$PORT` (default 8443) in the Codex/Figma Make workspace. Outside that workspace, run `npm run dev`.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `server/` - Express API, authentication, persistence, and marketplace/business routes
- `server/data/db.json` - portable demo datastore; not intended for production
- `ml/` - optional FastAPI price-intelligence service, model artifacts, and training utilities
- `README.md` - setup, usage, troubleshooting, and project overview
- `docs/` - detailed Windows and deployment instructions
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt
- Backend: Express 5 and TypeScript
- ML service: Python 3.13+ with FastAPI, scikit-learn, and XGBoost

Use `npm` and `package-lock.json` as the portable default when sharing the project. Never distribute `node_modules`, `ml/.venv`, `dist`, Python caches, or macOS metadata; recipients must install dependencies on their own operating system.

## Application architecture

During development, `npm run dev` starts Vite and mounts the Express API under `/api`, so the browser uses one origin. The optional Python service runs separately on `http://localhost:8000`; the Express mandi and scheme routes call it and use prototype fallbacks when it is unavailable.

For production, do not treat `vite preview` as the backend. Deploy the built frontend, Express API, and Python ML service as documented in `docs/DEPLOYMENT.md`.

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
- Preserve farmer ownership checks whenever modifying crop, storage, listing, order, or scheme routes.
- Keep credentials and session secrets in environment variables in production.
