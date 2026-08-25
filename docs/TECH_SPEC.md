# ADV Log — Technical Specification

## Stack and architecture

- React + Vite + TypeScript.
- shadcn/ui + Tailwind CSS.
- Supabase Auth + Postgres + RLS on the free tier.
- Static hosting with custom domain/subdomain.
- PWA shell for iPhone Safari and MacBook browsers.
- No custom API server in MVP.

```text
React UI -> typed maintenance/status functions -> Supabase client -> Postgres + RLS
```

Keep due calculations pure and deterministic. Pass an explicit `today` and current odometer into the calculation functions so tests do not depend on the system clock.

## Screens and components

- Auth screen.
- Dashboard: odometer, status summary, next actions, and condition checks.
- Maintenance item list/detail: interval, last completion, next due, status.
- Log maintenance form.
- History list with edit/delete confirmation.
- Settings: motorcycle baseline, interval configuration, sign out, optional export.

## Status algorithm

For each item:

1. If condition-based, return `condition_based`.
2. Find the most recent completion for that item.
3. If no baseline exists, return `needs_baseline`.
4. For a time interval, compare `today` with `last_date + interval_months`.
5. For a distance interval, compare `current_odometer` with `last_odometer + interval_km`.
6. If below due threshold but within 30 days/500 km, return `due_soon`; otherwise `up_to_date`.

Prefer calendar-month arithmetic for month intervals and document end-of-month behavior in tests.

## Validation and UX

- Odometer and cost must be non-negative; maintenance odometer cannot be below the bike's known prior odometer without an explicit correction flow.
- Maintenance date cannot be in the far future; allow same-day entries.
- Deletion requires confirmation.
- Status cards must show both label and explanation, e.g. `Due in 420 km` or `Overdue by 18 days`.
- Failed writes remain visible as errors.

## Security and PWA

Use Supabase Auth with email magic link or password login. Store only the anon key in the client. Apply `user_id = auth.uid()` RLS to every table. Cache static assets and previously loaded pages; require or visibly detect connectivity for MVP writes.

## Testing

- Unit-test each default interval and every status branch.
- Test leap years, month ends, missing baselines, equal thresholds, odometer increases, and condition-based items.
- Test CRUD forms and dashboard refresh.
- Test RLS with owner and non-owner accounts.
- Run typecheck, lint, production build, and manual mobile/browser QA.
