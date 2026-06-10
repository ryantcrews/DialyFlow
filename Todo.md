# DialyRounds — What's Left

## Tonight's session (done)

These were the recent fixes — all working on **dev** (`devapp.dialyrounds.com`):

- **Date-based roster** with MWF/TTS day alignment
- **Dynamic weekly Basic target** (2/2 on Wed, not 2/3)
- **Off-day navigation** (nearest valid dialysis dates)
- **Mock seed admission dates** fixed + re-seeded (June 5 roster now shows patients)
- **Dev deploy** with latest patient-list logic
- **Activity log** — reduced noisy read-only events
- **Landing page** — demo unit renamed to North Dialysis Center

---

## Bucket 1 — Quick housekeeping (good next session, ~15 min)

| Item | Status | Notes |
|------|--------|-------|
| **Uncommitted changes** | Open | Large diff on `main` is not committed/pushed |
| **Duplicate import bug** | Open | `server/src/index.ts` imports `isApiHost` twice — can break server TypeScript build |
| **Mock seed script fix** | Done in code | `generate-mock-seed.mjs` updates admission dates on re-seed; DB already fixed remotely |

---

## Bucket 2 — Production go-live (biggest remaining block)

Code for launch items 2–4 is **already built**. What’s left is **Cloudflare + DNS**, not app features:

1. Wait for **dialyrounds.com** nameservers to be Active in Cloudflare
2. Create/confirm production D1, apply migrations `--remote`
3. Set `ENVIRONMENT = "production"` in `server/wrangler.toml`
4. `npm run deploy --workspace=server`
5. Attach custom domains + verify landing, login, `/patients`, `/attest`

---

## Bucket 3 — Legal / organizational (before real PHI)

| Item | Status |
|------|--------|
| **Privacy policy** | Placeholder only — `client/src/pages/PrivacyPage.tsx` |
| **Cloudflare Enterprise BAA** | Not signed |
| **HIPAA policies / training / risk assessment** | Documented in `docs/SECURITY.md` as checklist, not executed |

---

## Bucket 4 — Optional product polish (not blocking demo/dev)

Still optional if you want to go further:

- **Forgot password** — admin reset only today; no self-service flow
- **PA vs Physician permissions** — same clinical access now; split later if needed
- **Landing polish** — testimonials, real screenshots (marketing is functional)
- **Minor UX** — favicon.ico 404 in some browsers (svg favicon exists), tablet scroll edge cases on Attest

---

## Recommended order for next sessions

1. **Fix `isApiHost` duplicate import** + commit/push current work
2. **Production deploy** once DNS is ready
3. **Privacy policy + BAA** before any real patient data
4. **Polish backlog** only as you feel pain in daily use

---

## Bottom line

**The app itself is in good shape for dev/demo.** The main pending items are **git cleanup**, **one small server TS bug**, **production deployment** (waiting on DNS), and **legal/organizational HIPAA steps** — not missing core rounding/attest functionality.
