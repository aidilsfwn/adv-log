create extension if not exists "pgcrypto";

create table public.motorcycles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Honda ADV150', make text not null default 'Honda', model text not null default 'ADV150',
  purchase_date date, start_date date, current_odometer_km integer not null default 0 check (current_odometer_km >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id)
);
create type public.maintenance_basis as enum ('time','distance','condition');
create table public.maintenance_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade, name text not null, basis public.maintenance_basis not null,
  interval_months integer check (interval_months is null or interval_months > 0), interval_km integer check (interval_km is null or interval_km > 0),
  sort_order integer not null default 0, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint interval_matches_basis check ((basis='time' and interval_months is not null and interval_km is null) or (basis='distance' and interval_km is not null and interval_months is null) or (basis='condition' and interval_km is null and interval_months is null))
);
create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade, maintenance_item_id uuid not null references public.maintenance_items(id) on delete cascade,
  performed_date date not null, odometer_km integer not null check (odometer_km >= 0), cost_sen integer check (cost_sen is null or cost_sen >= 0), provider text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index records_motorcycle_date on public.maintenance_records(motorcycle_id, performed_date desc);
create index records_motorcycle_item on public.maintenance_records(motorcycle_id, maintenance_item_id);
alter table public.motorcycles enable row level security; alter table public.maintenance_items enable row level security; alter table public.maintenance_records enable row level security;
create policy "owner motorcycles" on public.motorcycles for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "owner items" on public.maintenance_items for all using (user_id=auth.uid()) with check (user_id=auth.uid() and exists(select 1 from public.motorcycles m where m.id=motorcycle_id and m.user_id=auth.uid()));
create policy "owner records" on public.maintenance_records for all using (user_id=auth.uid()) with check (user_id=auth.uid() and exists(select 1 from public.motorcycles m where m.id=motorcycle_id and m.user_id=auth.uid()));

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger motorcycles_updated before update on public.motorcycles for each row execute function public.set_updated_at();
create trigger items_updated before update on public.maintenance_items for each row execute function public.set_updated_at();
create trigger records_updated before update on public.maintenance_records for each row execute function public.set_updated_at();

-- Run as an authenticated owner after creating the motorcycle; this seeds the agreed catalog.
create or replace function public.seed_adv150_items(p_motorcycle_id uuid) returns void language plpgsql security invoker as $$
begin
  insert into public.maintenance_items(user_id,motorcycle_id,name,basis,interval_months,interval_km,sort_order)
  select auth.uid(),p_motorcycle_id,* from (values
    ('Engine oil','time'::public.maintenance_basis,6,null,1),('Gear / final drive oil','time',24,null,2),('CVT service / inspection','distance',null,12000,3),('Drive belt','distance',null,24000,4),('Air filter','distance',null,12000,5),('Spark plug','distance',null,12000,6),('Coolant','time',36,null,7),('Brake fluid','time',24,null,8),('Front tyre','condition',null,null,9),('Rear tyre','condition',null,null,10),('Brake pads','condition',null,null,11),('Battery','condition',null,null,12)
  ) as items(name,basis,interval_months,interval_km,sort_order);
end $$;
