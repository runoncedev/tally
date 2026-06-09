# Tally

Personal expense tracking web app. React + Vite, Supabase for DB and auth.

## Stack

- **Package manager:** npm
- **UI:** React, Tailwind CSS, @base-ui/react (headless components), Framer Motion (only for animations CSS can't handle)
- **Router:** TanStack Router (`src/router.tsx`)
- **DB / Auth:** Supabase
- **State / Optimistic UI:** TanStack DB (collections)
- **Styling:** Tailwind CSS with Prettier for class sorting
- **Linting:** ESLint
- **Tests:** Vitest, jsdom, MSW

## Types and schemas

- **DB types:** `src/types/database.types.ts` — generated via the Supabase CLI (`npm run gen`)
- **Zod schemas:** `src/types/database.schemas.ts` — auto-generated from types using supazod (same `gen` script)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Month-by-month expense overview. Each month shows income, expenses, and balance, and links to its detail page. |
| `/:month` (e.g. `/2025-05`) | Month detail: income/expenses/balance summary, buttons to add expenses or income, navigation between months. |
| `/categories` | Category list. Recurring categories show an "Add recurring" button on the `/:month` view. |
| `/inbox` | Gmail-synced transaction inbox. User reviews, edits, saves, or discards mail_transactions parsed from email. |

## Inbox / Gmail sync feature

Automated expense detection from Gmail:

1. **Webhook** (Supabase Edge Function) receives Gmail push notifications with a `history_id`
2. Uses the stored **refresh token** (saved after first OAuth login) to obtain a fresh access token
3. Queries Gmail with the `history_id` to fetch new messages
4. For each new message, fetches full email details from Gmail
5. Matches the `from` field against configured **extractors**
6. If matched, the extractor parses the email and saves structured data to **`mail_transactions`**
7. In `/inbox`, the user reviews pending `mail_transactions` and can:
   - **Save** → pre-fills the add transaction form
   - **Discard** → dismisses the entry

## Local development

The local environment can connect to either the remote Supabase DB or a local instance running in Docker. When using the local instance, login uses username and password (`/login`).

## Important rules

- **Never push to the remote database without explicit confirmation from the user.** Always show what will be pushed and ask first.
- **Never deploy to production without explicit confirmation from the user.** This includes Edge Functions (`supabase functions deploy`) and any other production deployments.

## Useful scripts

- `npm run gen` — generates Supabase types and converts them to Zod schemas via supazod (against remote DB). Run this after any DB schema changes.
- `npm run gen -- --local` — same but against local DB
- `npx supabase` — Supabase CLI
- `npx supabase migration up` — apply pending migrations to local DB
- `npx supabase db push` — apply pending migrations to remote DB (**always ask user before running**)
- `npx supabase db dump --linked --data-only -f backup_prod_$(date +%Y%m%d).sql` — backup production data
- `npx tsc -b` — type check (always use `-b`, not `--noEmit`)
