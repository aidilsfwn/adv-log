export type Basis = "time" | "distance" | "condition";
export type MaintenanceStatus =
  | "up_to_date"
  | "due_soon"
  | "due"
  | "overdue"
  | "condition_based"
  | "needs_baseline";
export type MaintenanceItem = {
  id: string;
  name: string;
  basis: Basis;
  intervalMonths?: number;
  intervalKm?: number;
  sortOrder: number;
  active: boolean;
};
export type MaintenanceRecord = {
  id: string;
  itemIds: string[];
  performedDate: string;
  odometerKm: number;
  costSen?: number;
  provider?: string;
  notes?: string;
};
export type Motorcycle = {
  name: string;
  make: string;
  model: string;
  startDate: string;
  currentOdometerKm: number;
};
export const DEFAULT_ITEMS: MaintenanceItem[] = [
  ["oil", "Engine oil", "time", 6],
  ["gear-oil", "Gear / final drive oil", "time", 24],
  ["cvt", "CVT service / inspection", "distance", 12000],
  ["belt", "Drive belt", "distance", 24000],
  ["filter", "Air filter", "distance", 12000],
  ["plug", "Spark plug", "distance", 12000],
  ["coolant", "Coolant", "time", 36],
  ["brake-fluid", "Brake fluid", "time", 24],
  ["front-tyre", "Front tyre", "condition"],
  ["rear-tyre", "Rear tyre", "condition"],
  ["pads", "Brake pads", "condition"],
  ["battery", "Battery", "condition"],
].map(([id, name, basis, interval], n) => ({
  id: String(id),
  name: String(name),
  basis: basis as Basis,
  ...(basis === "time"
    ? { intervalMonths: Number(interval) }
    : basis === "distance"
      ? { intervalKm: Number(interval) }
      : {}),
  sortOrder: n + 1,
  active: true,
}));
export function addMonths(input: string, months: number) {
  const d = new Date(`${input}T12:00:00`);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(
    Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()),
  );
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() -
      new Date(`${a}T12:00:00`).getTime()) /
      86400000,
  );
}
export function getStatus(
  item: MaintenanceItem,
  records: MaintenanceRecord[],
  bike: Motorcycle,
  today: string,
) {
  if (item.basis === "condition") return { status: "condition_based" as const };
  const last = records
    .filter((r) => r.itemIds.includes(item.id))
    .sort((a, b) => b.performedDate.localeCompare(a.performedDate))[0];
  if (!last && !bike.startDate) return { status: "needs_baseline" as const };
  if (item.basis === "time") {
    const base = last?.performedDate ?? bike.startDate;
    if (!base || !item.intervalMonths)
      return { status: "needs_baseline" as const };
    const dueDate = addMonths(base, item.intervalMonths);
    const days = daysBetween(today, dueDate);
    return {
      status:
        days < 0
          ? ("overdue" as const)
          : days === 0
            ? ("due" as const)
            : days <= 30
              ? ("due_soon" as const)
              : ("up_to_date" as const),
      dueDate,
      days,
      last,
    };
  }
  const dueKm = (last?.odometerKm ?? 0) + (item.intervalKm ?? 0);
  const remaining = dueKm - bike.currentOdometerKm;
  return {
    status:
      remaining < 0
        ? ("overdue" as const)
        : remaining === 0
          ? ("due" as const)
          : remaining <= 500
            ? ("due_soon" as const)
            : ("up_to_date" as const),
    dueKm,
    remaining,
    last,
  };
}
export function formatMoney(sen?: number) {
  return sen == null ? "—" : `RM ${(sen / 100).toFixed(2)}`;
}
