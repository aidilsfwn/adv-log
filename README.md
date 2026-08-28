# ADV Log

A responsive motorcycle maintenance tracker backed exclusively by Supabase. It includes email/password authentication, maintenance history, editable time- and mileage-based service items, condition checks, and motorcycle settings.

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` and in the Vercel project environment. The database schema and row-level security policies are in [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).

## Validation

```bash
npm run lint
npm run build
```
