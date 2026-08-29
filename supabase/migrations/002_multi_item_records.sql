create table public.maintenance_record_items (
  record_id uuid not null references public.maintenance_records(id) on delete cascade,
  maintenance_item_id uuid not null references public.maintenance_items(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (record_id, maintenance_item_id)
);

insert into public.maintenance_record_items(record_id, maintenance_item_id, user_id)
select id, maintenance_item_id, user_id from public.maintenance_records
on conflict do nothing;

create index record_items_maintenance_item on public.maintenance_record_items(maintenance_item_id);
alter table public.maintenance_record_items enable row level security;
create policy "owner record items" on public.maintenance_record_items for all
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.maintenance_records r
    where r.id = record_id and r.user_id = auth.uid()
  )
);

create or replace function public.save_maintenance_record(
  p_id uuid,
  p_motorcycle_id uuid,
  p_item_ids uuid[],
  p_performed_date date,
  p_odometer_km integer,
  p_cost_sen integer default null,
  p_provider text default null,
  p_notes text default null
) returns void language plpgsql security invoker as $$
begin
  if coalesce(cardinality(p_item_ids), 0) = 0 then
    raise exception 'Choose at least one maintenance item';
  end if;

  if exists (
    select 1 from unnest(p_item_ids) selected(id)
    where not exists (
      select 1 from public.maintenance_items item
      where item.id = selected.id
        and item.motorcycle_id = p_motorcycle_id
        and item.user_id = auth.uid()
    )
  ) then
    raise exception 'Invalid maintenance item';
  end if;

  insert into public.maintenance_records(
    id, user_id, motorcycle_id, maintenance_item_id, performed_date,
    odometer_km, cost_sen, provider, notes
  ) values (
    p_id, auth.uid(), p_motorcycle_id, p_item_ids[1], p_performed_date,
    p_odometer_km, p_cost_sen, p_provider, p_notes
  )
  on conflict (id) do update set
    maintenance_item_id = excluded.maintenance_item_id,
    performed_date = excluded.performed_date,
    odometer_km = excluded.odometer_km,
    cost_sen = excluded.cost_sen,
    provider = excluded.provider,
    notes = excluded.notes;

  delete from public.maintenance_record_items where record_id = p_id;
  insert into public.maintenance_record_items(record_id, maintenance_item_id, user_id)
  select p_id, selected.id, auth.uid() from unnest(p_item_ids) selected(id);
end $$;
