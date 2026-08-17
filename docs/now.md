---
type: now
updated: 2026-08-17
horizon: 2026-08-17 → 2026-08-31
---

# Now

The dashboard is live at `https://patrn.ink`. Smoke tests (Google/GitHub login, create and follow a short link) passed.

## Focus

1. Keep production `NEXT_PUBLIC_*` baked at image build (`https://api.patrn.ink`, `https://patrn.ink`).
2. Do not add a production Compose tree to this repo.

## Next

- [ ] None required for UI unless a product bug appears

## Blocked

—

## Do not do

- Do not point `.env.example` or Dockerfile defaults at production
- Do not copy `patrn.ink-api/deploy/` into this repo
- Do not treat `app/[code]` as the production short-link path
