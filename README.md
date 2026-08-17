# 🔗 patrn.ink — dashboard

Next.js dashboard for [patrn.ink](https://patrn.ink): sign in, manage short links, analytics, QR codes, and API tokens. The Go API lives in the sibling `patrn.ink-api` repo.

**Start here:** [Quick Start](#-quick-start) · [AGENTS.md](AGENTS.md) · [docs/now.md](docs/now.md) · [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (this repo) · `patrn.ink-api/deploy/DEPLOYMENT.md` (EC2 / Nginx / SSM)

## ✨ Features

- Landing page with Google and GitHub login (OAuth is handled by the API)
- Dashboard: quick create, link list, detail, analytics charts, API tokens, settings
- Password / age gates for public links (`app/[code]` is a UI fallback; production redirects are on `api.patrn.ink/{code}`)
- Theme toggle, JWT in `localStorage`, typed API client with retries

## 🚀 Quick Start

### Prerequisites

- Node 20+
- The API running locally (`patrn.ink-api`: `docker compose up --build` or `go run ./cmd/api`)

### Configure and run

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). OAuth client IDs and secrets stay on the API — this UI never needs them.

## 🔧 Environment

| Variable | Local default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | API origin (login + `/api/*`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Metadata / canonical host |

These are `NEXT_PUBLIC_*` values: they are **baked into the JS bundle at `next build`**. Changing container env at runtime does not change them. Local Dockerfile defaults stay on localhost. Production CD passes:

```text
NEXT_PUBLIC_API_URL=https://api.patrn.ink
NEXT_PUBLIC_APP_URL=https://patrn.ink
```

Authoritative list: [`.env.example`](.env.example). Production image notes: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📚 Routes

| Path | Purpose |
| --- | --- |
| `/` | Landing + OAuth |
| `/auth/callback` | Stores `?token=` JWT, goes to the dashboard |
| `/dashboard` | Overview and quick create |
| `/dashboard/links`, `/dashboard/links/[code]` | Library and detail |
| `/dashboard/analytics` | Charts and export |
| `/dashboard/tokens` | Scoped API tokens |
| `/dashboard/settings` | Profile, theme, sign out |
| `/[code]` | Client-side gate (not the production short-link host) |

## 🧪 Checks

```bash
npm run lint
npm run build    # CI uses localhost NEXT_PUBLIC_* values
```

There is no unit-test runner in this repo.

## 🏭 Production

Live: `https://patrn.ink` (this UI) and `https://api.patrn.ink` (API, OAuth, short links). Hosted as a Docker standalone image on the same EC2 box as the API, behind Nginx. This repo does **not** own Compose/Nginx/SSM — that is `patrn.ink-api/deploy/`.

## 🛠️ Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Recharts · Docker (`output: "standalone"`)

## 🤝 Contributing · 📝 License

Portfolio project — suggestions welcome. MIT License.
