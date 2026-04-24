# SafeGuard

A women's safety web app — real-time SOS with live GPS, trusted-contact web push alerts, safety check-in timer, passcode-gated live-location sharing, shake detection, voice SOS, and an admin dashboard. Built on **Next.js 16 + Supabase + Vercel**, on free tiers end-to-end.

> **Not a substitute for emergency services.** Always call 112 (India / EU), 911 (US), or 1091 (Indian women's helpline) in a life-threatening emergency.

---

## Project layout

```
WomenApp/
├── .git/
├── .gitignore
├── README.md                 ← you are here (deployment guide)
└── safeguard/                ← the Next.js 16 app
    ├── app/                  ← App Router (routes, layouts, server actions)
    ├── components/           ← shadcn/ui + feature components + layout shell
    ├── lib/                  ← supabase clients, validation (Zod), push, utils
    ├── supabase/             ← migrations + seed SQL
    ├── proxy.ts              ← auth middleware (v16 renamed from middleware.ts)
    └── ... (next.config.ts, package.json, etc.)
```

---

## Wave 0 — what's done

✅ **Scaffold** — Next.js 16.2, React 19, Tailwind v4, TypeScript
✅ **Design system** — shadcn/ui (base-nova), dark navy + pink theme, Syne + DM Sans fonts
✅ **App shell** — responsive sidebar (desktop) + bottom-tab nav (mobile) + sticky header + user menu with sign-out
✅ **Auth flow** — email-OTP sign-in, Supabase SSR cookies, `proxy.ts` route protection
✅ **Legal pages** — Privacy Policy, Terms of Service, disclaimer banners
✅ **Landing page** — hero, stats bar, features, how-it-works, trust section, CTA, footer
✅ **12 routes compiling** — `/`, `/sign-in`, `/dashboard`, `/sos`, `/contacts`, `/map`, `/checkin`, `/tracking`, `/history`, `/settings`, `/privacy`, `/terms`
✅ **Database migrations** — 4 idempotent SQL files covering tables, RLS, functions/triggers, admin bootstrap, plus a seed
✅ **Zod validation schemas** — shared between server actions and client forms
✅ **Audit log + rate limit tables** — SOS abuse guard, idempotency keys for cron
✅ **Supabase clients** — `browser.ts` / `server.ts` / `service.ts` (`server-only`-gated)

---

## Everything you need to do before deployment

### 1. Local setup (5 minutes)

```bash
cd safeguard
cp .env.local.example .env.local   # fill in the blanks — see step 3
npm run dev
# → http://localhost:3000
```

### 2. Install the Vercel CLI (needed for `vercel env pull` and `vercel deploy`)

```bash
npm i -g vercel
```

### 3. Create the Supabase project

1. Sign up free at <https://supabase.com>. No card needed.
2. Create a new project. **Region: `ap-south-1` (Mumbai)** if you're in India, otherwise pick nearest.
3. Wait ~1 min for provisioning.
4. From **Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-only)
   - JWT Secret (**Settings → API → JWT Settings**) → `SUPABASE_JWT_SECRET`

### 4. Run the database migrations

Option A — Supabase SQL editor (easiest):

1. Open your project → **SQL Editor** → **New query**.
2. Paste the contents of each file **in this order** and run:
   1. `safeguard/supabase/migrations/20260423000000_init.sql`
   2. `safeguard/supabase/migrations/20260423000100_rls.sql`
   3. `safeguard/supabase/migrations/20260423000200_functions.sql`
   4. Sign up once via `/sign-in` in the app (creates your auth.users row).
   5. Edit `20260423000300_bootstrap_admin.sql` — change the email to yours — then run it to grant yourself admin.
   6. (Optional) Run `safeguard/supabase/seed.sql` for demo data.

Option B — Supabase CLI (once you get comfortable):

```bash
npm i -g supabase
cd safeguard
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 5. Generate Web Push VAPID keys

```bash
cd safeguard
npx web-push generate-vapid-keys
```

Copy both keys into `.env.local`:

- `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` get the same public value.
- `VAPID_PRIVATE_KEY` is server-only, never prefixed with `NEXT_PUBLIC_`.
- `VAPID_SUBJECT` is `mailto:you@example.com` — required by the push spec.

### 6. Generate `CRON_SECRET`

Any random 32-byte string. Example:

```bash
# bash / zsh / git-bash / WSL
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Paste into `.env.local` as `CRON_SECRET`. Vercel will auto-inject this as an `Authorization: Bearer` header on every cron invocation.

### 7. Generate TypeScript types from Supabase

Once migrations are live:

```bash
cd safeguard
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.types.ts
```

### 8. Deploy to Vercel (Wave 5)

```bash
cd safeguard
vercel                          # first-time link
# Follow prompts — accept defaults. This creates the Vercel project.

# Then, upload your env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_JWT_SECRET
vercel env add VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add VAPID_SUBJECT
vercel env add CRON_SECRET
vercel env add NEXT_PUBLIC_APP_URL        # https://your-project.vercel.app

# First production deploy:
vercel deploy --prod
```

---

## Free-tier budget cheat sheet

| Service            | Free limit                 | Watch out for                                          |
| ------------------ | -------------------------- | ------------------------------------------------------ |
| Vercel Hobby       | 100 GB bandwidth/month     | Realtime on the /track page streams continuously       |
| Vercel Cron        | 2 jobs, min 1-min schedule | We use exactly 2: check-in sweep + retention sweep     |
| Supabase DB        | 500 MB                     | Retention cron prunes `location_logs` >30d             |
| Supabase Storage   | 1 GB                       | Voice SOS clips — ~200 KB each                         |
| Supabase egress    | 2 GB/month                 | Throttle `location_logs` writes to 1 per 5-10 s        |
| Supabase MAU       | 50,000                     | Ignore — way below this                                |
| **Inactivity pause** | **after 7 days idle**    | **Critical risk.** Keep-alive cron hits an endpoint weekly |

The keep-alive cron is a Wave 5 task (weekly GitHub Action or a third Vercel cron slot).

---

## Security and compliance checklist (before real users)

- [ ] Email deliverability: Supabase default sender lands in spam for Gmail → swap to Resend (100 free emails/day) via **Auth → SMTP Settings**.
- [ ] `SUPABASE_JWT_SECRET` rotated from default (if you ever commit one to git by accident).
- [ ] Admin bootstrap migration (`20260423000300`) reverted to a placeholder before re-committing — don't ship your email in public migrations.
- [ ] Privacy Policy at `/privacy` updated with your actual company name, contact email, jurisdiction.
- [ ] Terms of Service at `/terms` reviewed by a lawyer before processing real-user safety data.
- [ ] Age-gate (`age_confirmed_18`) enforced during sign-up (Wave 1 task).
- [ ] Emergency-contact consent checkbox in Contacts page (Wave 1 task).
- [ ] Account deletion + JSON export available in Settings (Wave 5 task).

---

## Upcoming waves

| Wave  | Scope                                                                 |
| ----- | --------------------------------------------------------------------- |
| **1** | Profile CRUD, Contacts CRUD, History page, Map with Leaflet + Overpass, Chat |
| **2** | Web push subscriptions, SOS button + server action, rate limiter, audit log writes, admin read-only alerts chart |
| **3** | Shake detector, Voice SOS (MediaRecorder → Storage → signed URL), Fake Call |
| **4** | Check-in timer + Vercel Cron, Retention cron, Share Live Location with custom-JWT RLS |
| **5** | Admin dashboard (users, alerts, heatmap), PWA polish, keep-alive cron, production deploy |

---

## Tech stack

- **Framework** — Next.js 16.2 (App Router) + React 19 + TypeScript
- **Styling** — Tailwind CSS v4 + shadcn/ui (`base-nova`) + Syne + DM Sans
- **Auth + DB + Realtime + Storage** — Supabase (free tier)
- **Hosting + Cron** — Vercel (Hobby free)
- **Maps** — Leaflet + OpenStreetMap tiles + Overpass API (zero cost, no billing account)
- **Push** — Web Push (VAPID) via service worker, `web-push` library
- **Validation** — Zod shared between server actions and client forms
- **Icons** — lucide-react

---

## License

Private project. See [safeguard/AGENTS.md](safeguard/AGENTS.md) for project conventions.
