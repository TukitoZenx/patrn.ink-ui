# patrn.ink UI — production notes

The live host layout, Nginx, TLS, IAM, SSM, and Compose stack live in the API repository:

`patrn.ink-api/deploy/DEPLOYMENT.md`

This file only covers what this repo must get right.

## Domain contract

| Variable | Production value | When it is applied |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.patrn.ink` | **Docker build-arg** (baked into the JS bundle) |
| `NEXT_PUBLIC_APP_URL` | `https://patrn.ink` | **Docker build-arg** |

Local defaults in `Dockerfile` and `.env.example` stay on localhost. Do not change them to production URLs.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

The API continues to run from `patrn.ink-api` via `docker compose up` or `go run ./cmd/api`.

## Production image

The CD workflow builds with:

```text
NEXT_PUBLIC_API_URL=https://api.patrn.ink
NEXT_PUBLIC_APP_URL=https://patrn.ink
```

Manual equivalent:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.patrn.ink \
  --build-arg NEXT_PUBLIC_APP_URL=https://patrn.ink \
  -t patrn-ink-ui:local \
  .
```

Runtime env cannot change those two values after the image is built.

## CI/CD

- Pull requests: `npm ci`, `npm run lint`, `npm run build` using localhost public URLs (no secrets).
- Tags `v*` or `workflow_dispatch`: OIDC → ECR push (SHA + ref tags) → SSM `deploy.sh` on the EC2 host.

GitHub configuration (this repo):

| Kind | Name |
| --- | --- |
| Secret | `AWS_ROLE_ARN` |
| Variable | `AWS_REGION` |
| Variable | `ECR_UI_REPOSITORY` |
| Variable | `EC2_INSTANCE_ID` |

No SSH keys. No long-lived AWS access keys.

OAuth client IDs and secrets stay on the API. This UI never needs them.
