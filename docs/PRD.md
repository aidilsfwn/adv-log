# ADV Log — Product Requirements Document

## Product summary

ADV Log is a private maintenance tracker for one Honda ADV150. It records maintenance history, current odometer readings, and due/overdue status using one practical interval per scheduled item. It is optimized for a light-use bike: approximately 14,800 km after four years, an office commute under 10 km each way, office travel up to three days per week, and occasional short local trips.

## Goals

- Make the next maintenance action obvious.
- Record what was done, when, at what odometer, and optional cost/notes.
- Use one interval per item, selected as mileage-based or time-based.
- Handle low mileage with time-based reminders where age matters.
- Keep condition-based items visible without inventing artificial due dates.

## MVP maintenance defaults

| Item | Interval/status | Basis |
|---|---:|---|
| Engine oil | 6 months | time-based for low usage |
| Gear/final drive oil | 2 years | time-based |
| CVT service/inspection | 12,000 km | mileage-based |
| Drive belt | 24,000 km | mileage-based |
| Air filter | 12,000 km | mileage-based; inspect sooner if unusually dirty |
| Spark plug | 12,000 km | mileage-based |
| Coolant | 3 years | time-based |
| Brake fluid | 2 years | time-based |
| Front tyre | condition-based | no scheduled due date |
| Rear tyre | condition-based | no scheduled due date |
| Brake pads | condition-based | no scheduled due date |
| Battery | condition-based | no scheduled due date |

These are app defaults, not a replacement for Honda's manual, workshop advice, or safety inspection.

## MVP scope

- One authenticated owner and one motorcycle profile.
- Current odometer entry/update.
- Preloaded maintenance item catalog with editable labels/intervals.
- Log maintenance with item, date, odometer, cost, provider, and notes.
- Dashboard showing due soon, due, overdue, and condition-based items.
- Maintenance history with edit/delete.
- Cross-device sync through Supabase.
- Mobile-first PWA for iPhone Safari and MacBook.

## Non-goals

- Multiple bikes or multi-user sharing.
- Automatic connection to Honda, service centers, GPS, or vehicle telemetry.
- Predictive diagnostics.
- Parts inventory, invoicing, booking, or push-notification infrastructure.
- Two competing schedules for the same item.
- Artificial due dates for tyres, brake pads, or battery.

## Due-date rules

- Mileage item is due when current odometer is at or above last completed odometer + interval.
- Time item is due when today is at or after last completed date + interval.
- If no completion exists, calculate from the bike's start date/first-use date when available; otherwise mark `Needs baseline` rather than guessing.
- `Overdue` means past the due threshold.
- `Due soon` means within 30 days or 500 km, as applicable.
- Condition-based items always show `Inspect condition`; they are never automatically overdue.

## Acceptance criteria

- Owner can set and update the current odometer with a non-decreasing value.
- Owner can log, edit, and delete a maintenance record.
- Every scheduled item has exactly one interval or is explicitly condition-based.
- Dashboard status uses the rules above and identifies the reason: date, mileage, baseline, or condition.
- A time-based oil item becomes due after six months from its last completion, even if mileage is low.
- A mileage-based CVT item becomes due at the configured kilometre threshold.
- Condition-based items never show a fabricated due date.
- History is sorted newest first and preserves the maintenance odometer.
- Data syncs across iPhone Safari and MacBook for the same account.
- RLS prevents another user from reading or changing the bike data.
- App is usable at 320px width and deployable on free-cost infrastructure.
