# DialyRounds

Mobile-first dialysis rounds app on Cloudflare Workers + D1 with a React SPA.

## Stack

- **Client:** React + Vite, plain CSS, hand-rolled routing and fetch helpers
- **Server:** Cloudflare Worker with URLPattern router, D1, PBKDF2 auth
- **Shared:** TypeScript types and validators (no Zod)

Runtime npm dependencies: `react` and `react-dom` only.

## URLs (production)

| Host | Routes |
|------|--------|
| `dialyrounds.com` | `/` landing, `/security`, `/privacy` |
| `app.dialyrounds.com` | `/login`, `/patients`, `/patients/:id`, `/attest`, `/import`, `/reports`, `/admin`, `/api/*` |

Log in from the marketing site → `https://app.dialyrounds.com/login`

See [docs/SECURITY.md](docs/SECURITY.md) for security and HIPAA planning.

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

- Client: http://localhost:5173 (proxies `/api` to the Worker; treated as app host)
- Worker: http://127.0.0.1:8787

To preview the marketing site locally, set `VITE_SITE_MODE=marketing` in `client/.env.local`.

**Default admin (local only):** `admin@dialyrounds.local` / `ChangeMe123!`

## Deploy to Cloudflare

### 1. Prerequisites

- Domain `dialyrounds.com` on Cloudflare (nameservers pointed to Cloudflare)
- `npx wrangler login`

### 2. Create production D1

```bash
cd server
npx wrangler d1 create dialyrounds
```

Copy the `database_id` into `server/wrangler.toml` and set `ENVIRONMENT = "production"`.

### 3. Apply migrations

```bash
npx wrangler d1 migrations apply dialyrounds --remote
```

### 4. Build and deploy

```bash
cd ..
npm run build
npm run deploy --workspace=server
```

### 5. Custom domains

In **Workers & Pages** → `dialyrounds` → **Domains & Routes**, add:

- `dialyrounds.com`
- `app.dialyrounds.com`

Optional: redirect `www.dialyrounds.com` → apex (Worker handles this).

### 6. DNS

Cloudflare usually creates proxied records when attaching Worker domains. Verify:

- `@` → Worker
- `app` → Worker

Enable **Always Use HTTPS** under SSL/TLS.

### 7. Post-deploy

- Log in at `https://app.dialyrounds.com/login` and change the default admin password
- Confirm `https://dialyrounds.com` shows the landing page
- Confirm `https://app.dialyrounds.com/robots.txt` disallows crawlers
- Before real PHI: Cloudflare Enterprise BAA required (see docs/SECURITY.md)

## HIPAA note

Built with RBAC, audit logging, and session controls. A Cloudflare Enterprise BAA is required before storing real PHI.
