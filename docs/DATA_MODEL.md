# ADV Log — Data Model

## `motorcycles`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK to `auth.users.id`, not null |
| `name` | text | default `Honda ADV150` |
| `make` | text | `Honda` |
| `model` | text | `ADV150` |
| `purchase_date` | date | nullable |
| `start_date` | date | nullable baseline for time calculations |
| `current_odometer_km` | integer | >= 0 |
| `created_at` | timestamptz | server default |
| `updated_at` | timestamptz | maintained on update |

## `maintenance_items`

One configured item per maintenance concern. The catalog is seeded with the defaults in `PRD.md`.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK, not null |
| `motorcycle_id` | uuid | FK, not null |
| `name` | text | not null |
| `basis` | text/enum | `time`, `distance`, `condition` |
| `interval_months` | integer | nullable; required for time |
| `interval_km` | integer | nullable; required for distance |
| `sort_order` | integer | default 0 |
| `active` | boolean | default true |
| `created_at` | timestamptz | server default |
| `updated_at` | timestamptz | maintained on update |

## `maintenance_records`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK, not null |
| `motorcycle_id` | uuid | FK, not null |
| `maintenance_item_id` | uuid | FK, not null |
| `performed_date` | date | not null |
| `odometer_km` | integer | >= 0 |
| `cost_sen` | integer | nullable, >= 0 |
| `provider` | text | nullable |
| `notes` | text | nullable |
| `created_at` | timestamptz | server default |
| `updated_at` | timestamptz | maintained on update |

## Derived status

```ts
type MaintenanceStatus =
  | 'up_to_date' | 'due_soon' | 'due' | 'overdue'
  | 'condition_based' | 'needs_baseline';
```

Do not persist `next_due_date`, `next_due_odometer`, or `status`; calculate them from the item, latest record, baseline, current odometer, and supplied current date.

## Integrity and access

- RLS restricts all rows to `user_id = auth.uid()`.
- Child rows must reference a motorcycle owned by the same user.
- Add indexes on `(motorcycle_id, performed_date desc)` and `(motorcycle_id, maintenance_item_id)`.
- Enforce basis/interval consistency with database checks where practical.
