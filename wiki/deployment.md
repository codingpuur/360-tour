# Deployment

_Last updated: 2026-06-07 — Phase 1 (project setup)_

## Required Environment Variables

| Variable | Where | Description |
|---|---|---|
| `MONGODB_URI` | Server | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | Server | Random secret for JWT signing. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Server | Full URL of the app (`https://yourdomain.com` in prod) |
| `ADMIN_EMAIL` | Server | The admin login email |
| `ADMIN_PASSWORD_HASH` | Server | bcrypt hash of admin password (see below) |
| `CLOUDINARY_CLOUD_NAME` | Server | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Server | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Server | Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Client | Same as above — used for public URL construction |
| `NEXT_PUBLIC_APP_URL` | Client | Full URL of the app (used in embed snippet, OG tags) |

## Generating the Admin Password Hash

```bash
# Set your plain password temporarily
PLAIN_PASSWORD=yourpassword npx tsx scripts/create-admin-hash.ts
```

Copy the output `ADMIN_PASSWORD_HASH=...` line into `.env.local` (dev) or Vercel env vars (prod).

## Vercel Deployment

1. Push to GitHub.
2. Import the repo on Vercel.
3. Set all env vars listed above in Vercel → Settings → Environment Variables.
4. Vercel auto-detects Next.js — no build config needed.
5. Set `NEXTAUTH_URL` to your Vercel deployment URL.

## Cloudinary Setup

1. Create a free Cloudinary account.
2. Note your Cloud Name from the dashboard.
3. Go to Settings → Access Keys → generate API Key + Secret.
4. Panoramas upload to folder `360-tour-platform/panoramas/`.

## Local Development

```bash
# Fill in .env.local, then:
npm run dev
```

App runs at `http://localhost:3000`.

- Admin: `http://localhost:3000/dashboard` (redirects to `/login` if not authenticated)
- Editor: `http://localhost:3000/editor/[tourId]`
- Public viewer: `http://localhost:3000/tour/[slug]`
- Embed: `http://localhost:3000/embed/[slug]`

Note: `app/(admin)/` is a Next.js route group — the `(admin)` segment does NOT appear in the URL.
