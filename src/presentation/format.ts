import type { MaintenanceStatus } from "../domain";

export const today = new Date().toISOString().slice(0, 10);

export const statusLabel: Record<MaintenanceStatus, string> = {
  overdue: "Overdue",
  due: "Due now",
  due_soon: "Due soon",
  up_to_date: "On schedule",
  condition_based: "Inspect",
  needs_baseline: "Set baseline",
};

export function statusTone(status: MaintenanceStatus) {
  if (status === "overdue" || status === "due") return "alert" as const;
  if (status === "due_soon") return "warn" as const;
  if (status === "up_to_date") return "ok" as const;
  return "neutral" as const;
}

export function dateLabel(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Not set";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-MY", options ?? {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
