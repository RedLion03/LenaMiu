# LenaMiu

Private polaroid-style video gallery + message wall. Guests join via QR code, leave videos/messages, and an admin moderates everything.

## Stack

- **Next.js 16** (App Router, RSC + Server Actions) + **React 19** + **Tailwind v4**
- **Supabase** — Postgres + Auth (email + password)
- **Cloudinary** — video upload and streaming
- **Resend** — transactional email (optional in dev)
- Runs on **Node.js ≥ 20**

## Prerequisites

- **Node 20+** (`node --version`)
- **npm 10+**
- [Supabase](https://supabase.com) account (free)
- [Cloudinary](https://cloudinary.com) account (free)
- (Optional) [Resend](https://resend.com) account — without it, emails are silently skipped
- (Optional) [Docker](https://docs.docker.com/engine/install/) — only if you want to run Supabase locally

---

## Quick setup

```bash
git clone <repo>
cd lenamiu
npm install
cp .env.example .env.local
```

Now open `.env.local` and fill in the 7 variables (instructions on where to find each one below).

### 1. Supabase

Two options — **cloud** is the normal path for solo dev.

**Option A — Cloud** (recommended):

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Project Settings → **API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (Reveal) → `SUPABASE_SERVICE_ROLE_KEY`
3. Apply the migration:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   (Alternative without the CLI: paste the contents of [`supabase/migrations/20260520190704_init_schema.sql`](supabase/migrations/20260520190704_init_schema.sql) into the dashboard's **SQL Editor**.)

**Option B — Local** (requires Docker):
```bash
npx supabase start
```
This will print the 3 env vars to the terminal. Copy them into `.env.local`. The migration is applied automatically.

### 2. Cloudinary

1. [console.cloudinary.com](https://console.cloudinary.com) → Settings (⚙) → **API Keys**
2. Copy:
   - `Cloud Name` → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` (Reveal) → `CLOUDINARY_API_SECRET`

### 3. Resend (optional)

Skip this if you don't want to test emails yet. Without a key, the helper degrades silently (logs to the terminal).

1. [resend.com](https://resend.com) → API Keys → **Create**
2. Copy → `RESEND_API_KEY`
3. `RESEND_FROM_EMAIL`: for dev use `onboarding@resend.dev` (already enabled). For production, verify your own domain.

### 4. Create the first admin

```bash
npm run admin:create -- your-email@here.com
```
This prints the generated password (e.g. `XXXXX-XXXXX-XXXXX-XXXXX`). **Save it — it only appears once.** Re-running with the same email resets the password.

### 5. Start the dev server

```bash
npm run dev
```
[http://localhost:3000](http://localhost:3000)

Admin login at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Next + Turbopack) on :3000 |
| `npm run build` | Production build |
| `npm start` | Run the built bundle |
| `npm run type-check` | TypeScript validation without building |
| `npm run lint` | ESLint |
| `npm run admin:create -- <email> [password]` | Create/reset admin (password is auto-generated if omitted) |
| `npm run test:rls` | Smoke test for RLS policies (needs `.env.local` configured) |
| `npm run db:reset` | Reset local DB + reapply migration (DESTRUCTIVE, local only) |
| `npm run db:gen-types` | Regenerate `database.types.ts` (needs local Supabase) |

---

## Structure

```
src/
├── app/
│   ├── page.tsx                    # public gallery (memories + messages tabs)
│   ├── q/[token]/                  # QR user landing page
│   ├── request/                    # normal user form (video or message)
│   ├── subscribe/                  # mailing list signup
│   ├── unsubscribe/[token]/        # one-click unsubscribe
│   ├── admin/
│   │   ├── (public)/login/         # email + password login
│   │   └── (protected)/            # gated via admins table
│   │       ├── videos/             # CRUD + moderation
│   │       ├── messages/           # CRUD + moderation
│   │       ├── invites/            # generate/revoke QR invites
│   │       ├── admins/             # add/remove admins
│   │       └── page.tsx            # dashboard
│   └── api/upload-signature/       # generates signed Cloudinary upload
├── components/                     # Polaroid, Lightbox, MessageWall, etc.
├── lib/
│   ├── supabase/                   # browser/server/service clients + types
│   ├── auth.ts                     # requireAdmin (service role gate)
│   ├── cloudinary.ts               # signUpload, deriveThumb
│   ├── notifications.ts            # Resend templates + triggers
│   ├── messages.ts                 # fetchApprovedMessages, fetchQrVideoLabels
│   └── invite.ts                   # validateInviteToken
├── proxy.ts                        # Supabase session refresh
scripts/
├── create-admin.ts                 # CLI for admin bootstrap
└── test-rls.ts                     # anon RLS smoke test
supabase/
├── migrations/                     # 1 consolidated init
└── config.toml                     # local Supabase config
```

---

## Flows

| Role | Identification | What they can do |
|---|---|---|
| **Admin** | email + password login → row in `admins` | CRUD videos · CRUD messages · approve/reject pending · generate/revoke QR invites · manage other admins |
| **QR user** | UUID token in the URL `/q/<token>` | view gallery · 1 like per video · 1 message · 1 video |
| **Normal user** | email in the form | view gallery · request a video · request a message · subscribe to updates |

Every contribution starts with status `pending` → admin approves/rejects → `approved` shows up publicly.

---

## Deploy (Vercel)

1. Push to GitHub
2. [vercel.com/new](https://vercel.com/new) → import the repo
3. **Environment Variables**: paste the same 7 from `.env.local`
4. Deploy

By default the Cloudinary CSP and Supabase redirect URLs are wired dynamically against `NEXT_PUBLIC_SUPABASE_URL`. If you ever use password reset / magic link, add the production URL under **Supabase → Authentication → URL Configuration**.

---

## Security notes

Architecture follows the "anon only sees approved, everything else via service role" model. RLS is enabled on all tables and:

- `videos` and `messages` have a public policy for `status='approved'`
- Everything else is locked (admins, qr_invites, likes, subscribers) — accessed server-side via service role after auth

CSP, headers (`X-Frame-Options: DENY`, `Permissions-Policy`, etc.) and httpOnly cookies live in [`next.config.ts`](next.config.ts).

To rotate an admin: `npm run admin:create -- <email>` resets the password. To remove an admin: UI at `/admin/admins`.

---

## Troubleshooting

- **"Cloudinary env vars missing"** when uploading a video — missing `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` in `.env.local`. Restart `npm run dev` after editing.
- **Login redirects to "/admin/login?error=no-access"** — your email isn't in `admins`. Run `npm run admin:create -- your-email`.
- **`/admin/login` throws 500** — Supabase env vars missing. Check `NEXT_PUBLIC_SUPABASE_URL` + keys.
- **Messages don't show up in the gallery** — only approved ones go public. Approve at `/admin/messages?status=pending`.
- **I changed `.env.local` but dev isn't picking it up** — Next only reads env vars on boot. Restart `npm run dev`.
