import { useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";
import { Activity, CalendarClock, Check, Eye, Gauge, Milestone, Pencil, Plus, Wrench } from "lucide-react";
import type { MaintenanceItem, MaintenanceRecord, Motorcycle } from "../domain";
import { getStatus } from "../domain";
import { Action, EmptyMessage, StatusMark } from "./controls";
import { dateLabel, statusLabel, statusTone } from "./format";

type StatusRow = { item: MaintenanceItem; result: ReturnType<typeof getStatus> };

function RollingNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (current) => Math.max(0, Math.round(current)).toLocaleString());
  useEffect(() => spring.set(value), [spring, value]);
  return <motion.span>{display}</motion.span>;
}

function HeroMetric({ row, onLog }: { row?: StatusRow; onLog: (id: string) => void }) {
  const status = row?.result.status ?? "up_to_date";
  const timeBased = row?.item.basis === "time";
  const value = !row || status === "due" ? 0 : status === "needs_baseline" ? null : Math.abs(timeBased ? row.result.days ?? 0 : row.result.remaining ?? 0);
  const unit = !row ? "items due" : status === "needs_baseline" ? "baseline needed" : status === "due" ? "due now" : `${timeBased ? "days" : "km"} ${status === "overdue" ? "overdue" : "remaining"}`;
  const tone = statusTone(status);
  const position = !row ? 8 : status === "overdue" ? 94 : status === "due" ? 78 : status === "due_soon" ? 62 : status === "needs_baseline" ? 50 : 24;
  const explanation = !row
    ? "Every scheduled item is currently clear."
    : status === "needs_baseline"
      ? `Log ${row.item.name} once to start interval tracking.`
      : status === "overdue"
        ? `${row.item.name} has passed its service interval.`
        : status === "due"
          ? `${row.item.name} has reached its service interval.`
          : `${row.item.name} is the next checkpoint.`;

  return (
    <section className={`hero-metric hero-metric--${tone}`}>
      <div className="hero-metric__top"><p className="overline">Next checkpoint</p><StatusMark tone={tone}>{statusLabel[status]}</StatusMark></div>
      <div className="hero-metric__reading"><strong>{value == null ? "--" : <RollingNumber value={value} />}</strong><span>{unit}</span></div>
      <div className="hero-metric__context"><strong>{row?.item.name ?? "Route is clear"}</strong><p>{explanation}</p></div>
      <div className="threshold" aria-label={`Service interval position ${position} percent`}>
        <div className="threshold__track"><i style={{ left: `${position}%` }} /></div>
        <div><span>Just serviced</span><span>Overdue</span></div>
      </div>
      {row && <Action onClick={() => onLog(row.item.id)}><Wrench size={18} />Log work</Action>}
    </section>
  );
}

function MachineReadout({ bike, onEdit }: { bike: Motorcycle; onEdit: () => void }) {
  return (
    <section className="machine-readout">
      <header className="machine-readout__tools"><Action kind="quiet" className="icon-action" onClick={onEdit} aria-label="Edit motorcycle"><Pencil size={17} /></Action></header>
      <h2>{bike.name}</h2>
      <dl><div><dt>Make / model</dt><dd>{bike.make} {bike.model}</dd></div><div><dt>Tracked since</dt><dd>{dateLabel(bike.startDate, { month: "short", year: "numeric" })}</dd></div></dl>
      <div className="odometer-readout"><span><Gauge size={16} />Odometer</span><strong><RollingNumber value={bike.currentOdometerKm} /></strong><small>km</small></div>
    </section>
  );
}

function statusDetail({ item, result }: StatusRow) {
  if (result.status === "overdue") return item.basis === "time" ? `${Math.abs(result.days ?? 0)} days overdue` : `${Math.abs(result.remaining ?? 0).toLocaleString()} km overdue`;
  if (result.status === "due") return "Due today";
  if (result.status === "due_soon") return item.basis === "time" ? `Due in ${result.days} days` : `Due in ${result.remaining?.toLocaleString()} km`;
  if (result.status === "needs_baseline") return "Log once to begin tracking";
  if (item.basis === "condition") return "Inspect before the next long ride";
  return "No action needed";
}

function ServiceRow({ row, completed, onLog }: { row: StatusRow; completed: boolean; onLog: (id: string) => void }) {
  const { item, result } = row;
  const Icon = item.basis === "time" ? CalendarClock : item.basis === "distance" ? Milestone : Eye;
  const cycle = item.basis === "time" ? `Every ${item.intervalMonths} months` : item.basis === "distance" ? `Every ${item.intervalKm?.toLocaleString()} km` : "Condition check";
  return (
    <motion.button
      className="service-line"
      onClick={() => onLog(item.id)}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: completed ? [1, 0.72, 1] : 1, x: 0, backgroundColor: completed ? ["#1C1C1E", "#4A9B8E", "#1C1C1E"] : "#1C1C1E" }}
      transition={{ duration: completed ? 0.3 : 0.2, ease: "easeOut" }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="service-line__name"><i><Icon size={17} /></i><span><strong>{item.name}</strong><small>{item.basis === "condition" ? "Visual inspection" : `${item.basis} based`}</small></span></span>
      <span className="service-line__cycle"><small>Service cycle</small><strong>{cycle}</strong></span>
      <span className="service-line__status"><StatusMark tone={statusTone(result.status)} pulse={result.status === "overdue"}>{statusLabel[result.status]}</StatusMark><small>{statusDetail(row)}</small></span>
      <span className="service-line__action"><Plus size={16} />Log</span>
    </motion.button>
  );
}

function MileageTrace({ records }: { records: MaintenanceRecord[] }) {
  const points = [...records].sort((a, b) => a.performedDate.localeCompare(b.performedDate)).slice(-8);
  if (points.length < 2) return null;
  const values = points.map((record) => record.odometerKm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const path = values.map((value, index) => `${(index / (values.length - 1)) * 100},${38 - ((value - min) / range) * 32}`).join(" ");
  return (
    <section className="mileage-trace">
      <div><p className="overline"><Activity size={15} />Mileage progression</p><strong>{values.at(-1)?.toLocaleString()} km</strong></div>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" role="img" aria-label="Odometer progression across recent maintenance records"><polyline points={path} /></svg>
      <div className="mileage-trace__labels"><span>{dateLabel(points[0].performedDate, { month: "short", year: "2-digit" })}</span><span>{dateLabel(points.at(-1)!.performedDate, { month: "short", year: "2-digit" })}</span></div>
    </section>
  );
}

export function OverviewScreen({ bike, statuses, urgent, records, recentlyCompleted, onLog, onEditBike }: {
  bike: Motorcycle;
  statuses: StatusRow[];
  urgent: StatusRow[];
  records: MaintenanceRecord[];
  recentlyCompleted: string[];
  onLog: (id: string) => void;
  onEditBike: () => void;
}) {
  const scheduled = urgent.length ? statuses.filter(({ item }) => !urgent.some((row) => row.item.id === item.id)) : statuses;
  return (
    <div className="overview-stage">
      <div className="instrument-pair"><HeroMetric row={urgent[0]} onLog={onLog} /><MachineReadout bike={bike} onEdit={onEditBike} /></div>
      <MileageTrace records={records} />
      <section className="service-manifest">
        <header className="section-heading"><div><p className="overline">Full service manifest</p><h2>Maintenance ledger</h2><p>Active checkpoints ordered by what the machine needs next.</p></div><dl><div><dt>Tracked</dt><dd>{String(statuses.length).padStart(2, "0")}</dd></div><div><dt>Attention</dt><dd>{String(urgent.length).padStart(2, "0")}</dd></div></dl></header>
        {urgent.length > 0 && <div className="manifest-group"><div className="manifest-group__title"><StatusMark tone="alert">Attention queue</StatusMark><small>{urgent.length} {urgent.length === 1 ? "item" : "items"}</small></div>{urgent.map((row) => <ServiceRow key={row.item.id} row={row} completed={recentlyCompleted.includes(row.item.id)} onLog={onLog} />)}</div>}
        <div className="manifest-group"><div className="manifest-group__title"><StatusMark tone="ok">Scheduled checkpoints</StatusMark><small>{scheduled.length} {scheduled.length === 1 ? "item" : "items"}</small></div>{scheduled.length ? scheduled.map((row) => <ServiceRow key={row.item.id} row={row} completed={recentlyCompleted.includes(row.item.id)} onLog={onLog} />) : <EmptyMessage icon={<Check size={20} />} title="Manifest clear" detail="No remaining scheduled checkpoints." />}</div>
      </section>
    </div>
  );
}
