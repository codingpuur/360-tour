# Auth

_Last updated: 2026-06-07 — Phase 2 complete_

## Strategy

Single admin — no user table, no multi-tenancy. Credentials are stored as env vars:

- `ADMIN_EMAIL` — the login email
- `ADMIN_PASSWORD_HASH` — bcrypt hash (12 rounds) of the admin password

## Generating the Password Hash

```bash
PLAIN_PASSWORD=yourpassword npx tsx scripts/create-admin-hash.ts
```

Output: `ADMIN_PASSWORD_HASH=$2b$12$...`  
Copy this into `.env.local` (dev) or Vercel env vars (prod).

## NextAuth Config (`lib/auth.ts`)

- Provider: `CredentialsProvider`
- Compares `credentials.email` against `ADMIN_EMAIL` env var.
- Compares `credentials.password` against `ADMIN_PASSWORD_HASH` using `bcrypt.compare`.
- Session strategy: `jwt` (no DB session table needed).
- Custom sign-in page: `/login`.
- Secret: `NEXTAUTH_SECRET` env var (required for JWT signing).

## Route

`app/api/auth/[...nextauth]/route.ts` exports NextAuth as `GET` and `POST` handlers.

## Protecting Routes

### Admin pages (Server Components)

`app/(admin)/layout.tsx` calls `getServerSession(authOptions)`. If no session → `redirect('/login')`.

```ts
import { getServerSession } from 'next-auth/next'
const session = await getServerSession(authOptions)
if (!session) redirect('/login')
```

### API routes

Every protected API route calls `getServerSession` before any DB operation:

```ts
const session = await getServerSession(authOptions)
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Public routes

`app/api/public/[slug]/route.ts` and the public viewer pages (`/tour/[slug]`, `/embed/[slug]`) require **no auth**.

## Session Provider

`app/SessionProvider.tsx` wraps `NextAuthSessionProvider` as a `'use client'` component. This enables `useSession()` and `signIn()` / `signOut()` in client components (e.g. the login page, dashboard header).

It is mounted in `app/layout.tsx`.
