# DialyRounds

Mobile-first dialysis rounds app on Cloudflare Workers + D1 with a React SPA.

## Stack

- **Client:** React + Vite, plain CSS, hand-rolled routing and fetch helpers
- **Server:** Cloudflare Worker with URLPattern router, D1, PBKDF2 auth
- **Shared:** TypeScript types and validators (no Zod)

Runtime npm dependencies: `react` and `react-dom` only.

## Setup

```bash
npm install
npm run db:migrate:local --workspace=server
npm run dev
```

To load mock patients and visits for local testing:

```bash
npm run db:seed:mock:local
```

This adds ~72 patients (3 per shift × 4 shifts × 6 units) plus visit history for the current month. Safe to re-run — duplicates are skipped.

- Client: http://localhost:5173 (proxies `/api` to the Worker)
- Worker: http://127.0.0.1:8787

On first API request, the Worker seeds dialysis units and a default admin if the database is empty.

**Default admin:** `admin@dialyrounds.local` / `ChangeMe123!` (you will be forced to change the password)

## Deploy

1. Create a D1 database: `wrangler d1 create dialyrounds`
2. Update `database_id` in `server/wrangler.toml`
3. Apply migrations: `wrangler d1 migrations apply dialyrounds --remote`
4. Build and deploy: `npm run build && npm run deploy --workspace=server`

## HIPAA note

Built with RBAC, audit logging, and session controls. A Cloudflare Enterprise BAA is required before storing real PHI.
