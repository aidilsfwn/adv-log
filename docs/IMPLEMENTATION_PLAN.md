# ADV Log — Implementation Plan

## Phase 1 — Foundation

- Scaffold React + Vite + TypeScript.
- Add shadcn/ui, Tailwind, and Supabase client.
- Configure Vercel deployment and environment variables.

## Phase 2 — Database and seed data

- Create `motorcycles`, `maintenance_items`, and `maintenance_records`.
- Add constraints, indexes, timestamps, and RLS.
- Bootstrap one Honda ADV150 and the twelve agreed maintenance items.
- Verify owner/non-owner access isolation.

## Phase 3 — Domain logic

- Implement date/month and kilometre arithmetic.
- Implement status calculation with explicit `today` and odometer inputs.
- Add tests for due, due soon, overdue, baseline, and condition states.

## Phase 4 — UI and CRUD

- Build auth and motorcycle setup/current odometer flow.
- Build dashboard status cards and item details.
- Build log/edit/delete maintenance forms and history.
- Add configurable interval editing while preserving one interval per item.

## Phase 5 — Release

- Test at 320px, on iPhone Safari, and on MacBook.
- Run typecheck, lint, automated tests, and production build.
- Configure custom domain/subdomain and Supabase redirect URLs.

## Definition of done

The acceptance criteria in `PRD.md` pass; the dashboard correctly handles both low-mileage time reminders and kilometre reminders; condition-based items remain inspection prompts; history is durable and synced; and the app is deployable without a custom backend.
