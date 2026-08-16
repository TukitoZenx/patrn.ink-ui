---
type: decision
---

# 0001. Bake `NEXT_PUBLIC_*` at Docker build time

Status: accepted
Date: 2026-08-13
Deciders: TukitoZenx
Supersedes: —
Superseded-by: —

## Context

Next.js inlines `NEXT_PUBLIC_*` into the client bundle at `next build`. Runtime container env cannot change those values.

## Options

- A. Rely on runtime env in the container
- B. Pass `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` as Docker **build-args** in CD; keep Dockerfile defaults as localhost

## Decision

We will use option B. Production CD sets `https://api.patrn.ink` and `https://patrn.ink`. Local defaults stay localhost.

## Assumptions

- [A1] A new UI image is required whenever those URLs change (revisit if we add a runtime config endpoint)

## Consequences

A UI image built without build-args will call `localhost:8080` in production.

## Revisit if

We need the same image to target staging and production without rebuild.
