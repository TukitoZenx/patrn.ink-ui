# Agent protocol

This is the Next.js dashboard for patrn.ink. The Go API and production host layout live in the sibling repo `patrn.ink-api`.

## Commands

- Install: `npm ci`
- Dev: `cp .env.example .env.local` then `npm run dev` — UI on `:3000`, expects API at `http://localhost:8080`
- Lint: `npm run lint`
- Build: `npm run build` (set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL`; CI uses localhost)
- Start (standalone): `npm start`
- There is no unit-test runner. Use lint + build as the check.

## Hard rules

- Minimal diffs. Touch only what the task requires.
- Do not add a dependency without an explicit ask.
- Never commit secrets or `.env*` files except `.env.example`.
- Do not change local Dockerfile / `.env.example` defaults to production URLs. Production `NEXT_PUBLIC_*` values are **Docker build-args** in CD.
- Do not add a `deploy/` tree here. EC2 Compose, Nginx, and `deploy.sh` are owned by `patrn.ink-api`.
- Do not route short links through this app. Production redirects are `https://api.patrn.ink/{code}`.
- For work that will edit more than two files, write `PLAN.md` first (gitignored session file).
- Run `npm run lint` and, for UI behavior changes, `npm run build` before calling the task done.

## Authority

- Level 0 (not facts): `PLAN.md`, chat
- Level 2 (constraints): accepted files in `docs/decisions/`, [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Level 4 (do not edit unless asked): this file, [README.md](README.md) product scope

System-wide identity, architecture, and production ADRs live in `patrn.ink-api` (`docs/` and `deploy/DEPLOYMENT.md`).

## Where to read

| Need | File |
| --- | --- |
| What this is | [README.md](README.md) |
| What we are doing now | [docs/now.md](docs/now.md) |
| UI production contract | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Why public env is baked at build | [docs/decisions/0001-bake-public-env-at-build.md](docs/decisions/0001-bake-public-env-at-build.md) |

## After you finish

Propose, do not silently apply: a `docs/now.md` patch, a decision draft if you chose something. Do not silently edit this file.
