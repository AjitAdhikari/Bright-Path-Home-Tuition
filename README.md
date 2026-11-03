# Setu — Home Tuition Matching Platform

> **Setu** (सेतु, "bridge") is a trusted bridge between parents and verified
> home tutors in Nepal. Parents post what their child needs, a real person
> verifies and matches them with background-checked tutors, and Setu earns a
> one-time commission when a tuition is confirmed.

Built with **Next.js (App Router)** + **Supabase** (Postgres, Auth, Storage,
Edge Functions), as specified in the project workflow doc.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Start Supabase locally (Docker required) and apply schema + seed
npx supabase start
npx supabase db reset        # runs migrations in supabase/migrations + seed

# 3. Generate DB types (overwrites the placeholder lib/database.types.ts)
npm run db:types

# 4. Configure env
cp .env.example .env.local   # fill in the values printed by `supabase start`

# 5. Run
npm run dev                  # http://localhost:3000
```

> Make yourself an admin after signing up:
> `update profiles set role = 'admin' where email = 'you@example.com';`

---

## What's inside

| Area | Where |
| --- | --- |
| Public site (home, find-tutor, become-tutor, how-it-works, fees, about, privacy) | `app/(public)/` |
| Auth (login, phone OTP) | `app/(auth)/` |
| Tutor dashboard | `app/tutor/` |
| Parent dashboard | `app/parent/` |
| Admin panel (cases, approvals, payments) | `app/admin/` |
| Payment route handlers (eSewa, Khalti) | `app/api/payments/` |
| Design system tokens | `app/globals.css` |
| UI primitives | `components/ui/` |
| Supabase clients + middleware | `lib/supabase/`, `middleware.ts` |
| Database schema, RLS, storage, seed | `supabase/migrations/` |

## Folder structure

```
app/
  (public)/            # marketing + the two public forms
    find-tutor/        #   parent requirement form  (Server Action)
    become-tutor/      #   tutor sign-up + docs      (Server Action)
    how-it-works/  fees-and-terms/  about/  privacy/
  (auth)/              # login
  tutor/               # role = tutor  (guarded by middleware + RLS)
  parent/              # role = parent
  admin/               # role = admin  (set by hand in the DB)
  api/payments/        # initiate + gateway callbacks (verify server-side)
  auth/signout/        # POST sign-out
components/
  ui/                  # Button, Card, Field, Badge  (design system)
  site/                # Header, Footer, WhatsApp button
  dashboard/           # Shell + StatTile
lib/
  supabase/            # browser + server (+ service-role) clients
  payments/            # esewa.ts, khalti.ts
  constants.ts utils.ts database.types.ts
supabase/
  migrations/          # 0001 schema · 0002 RLS · 0003 storage + seed
middleware.ts          # session refresh + role gate for /tutor /parent /admin
```

## Security model

- **RLS is on for every table.** A tutor can never read another tutor's
  documents or a parent's full address. See `supabase/migrations/0002_rls.sql`.
- The user's **role lives in the JWT** (via a Custom Access Token hook) so
  middleware and RLS can read it cheaply. New sign-ups are only `parent` or
  `tutor`; `admin` is set by hand.
- **Phone + full address** are revealed to the other party only once a match
  reaches `chosen`. Public tutor data is served through the `public_tutors`
  view (no contact details).
- Tutor documents live in a **private Storage bucket**; admins view them via
  short-lived signed URLs. The `service_role` key is server-only.
- **Payments are never trusted from the browser redirect** — the server
  re-verifies with eSewa / Khalti before marking anything `paid`.

## Design system

A calm, trustworthy palette defined as tokens in `app/globals.css`:

- **Brand** — deep teal (trust + education)
- **Accent** — warm saffron (a quiet nod to Nepal)
- **Paper / Ink** — warm neutrals that stay easy on the eyes in long admin lists

Reusable radii, soft/lift shadows, a dotted hero texture and a gentle `rise`
entrance animation keep the whole product feeling like one system.

## Roadmap (from the spec)

1. Schema, RLS, Auth ✅ scaffolded
2. Public pages + forms ✅ scaffolded
3. Admin panel: approvals, cases, matching, notes ✅ scaffolded
4. Tutor + parent dashboards ✅ scaffolded
5. Wire live data → forms, manual payments, then eSewa/Khalti once merchant
   accounts are approved
6. SMS/WhatsApp automation, reviews, attendance, public search, mobile app

> Dashboard tables currently show representative data so the UI reads clearly;
> swap each for its Supabase query (the schema + RLS already back every screen).
```
