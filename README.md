This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `NEXT_PUBLIC_API_URL`: The base URL for your backend/API (which also handles OAuth with Google/GitHub).
- `NEXT_PUBLIC_APP_URL`: The public URL where your frontend will be hosted (used for metadata and links).

**Note:** OAuth client secrets/IDs are only needed by your backend API, not by this UI.

## Production

Live domains:

- App: `https://patrn.ink`
- API: `https://api.patrn.ink`

Those URLs are passed as Docker **build arguments**. They are not read from the container environment at runtime. Local Dockerfile defaults stay on localhost.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The EC2 / Nginx / SSM stack is documented in the API repo at `patrn.ink-api/deploy/DEPLOYMENT.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome.

Production hosting is Docker on EC2 behind Nginx. Vercel is not used.
