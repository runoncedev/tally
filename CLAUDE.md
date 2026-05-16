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

## Local development

The local environment can connect to either the remote Supabase DB or a local instance running in Docker. When using the local instance, login uses username and password (`/login`).

## Useful scripts

- `npm run gen` — generates Supabase types and converts them to Zod schemas via supazod
- `npx supabase` — Supabase CLI
