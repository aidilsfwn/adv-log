import { AnimatePresence, motion } from "motion/react";
import { History, Pencil, Plus, Trash2 } from "lucide-react";
import type { MaintenanceItem, MaintenanceRecord } from "../domain";
import { formatMoney } from "../domain";
import { Action, EmptyMessage } from "./controls";
import { dateLabel } from "./format";

export function HistoryScreen({ records, items, onAdd, onEdit, onDelete }: {
  records: MaintenanceRecord[];
  items: MaintenanceItem[];
  onAdd: () => void;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (record: MaintenanceRecord) => void;
}) {
  const sorted = [...records].sort((a, b) => b.performedDate.localeCompare(a.performedDate));
  return (
    <section className="history-ledger">
      <div className="history-head" aria-hidden="true"><span>Date</span><span>Service record</span><span>Odometer</span><span>Cost</span><span>Actions</span></div>
      {sorted.length ? (
        <AnimatePresence initial={false}>
          {sorted.map((record) => {
            const names = record.itemIds.map((id) => items.find((item) => item.id === id)?.name).filter(Boolean).join(", ");
            return (
              <motion.article className="history-entry" key={record.id} layout initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                <time dateTime={record.performedDate}><strong>{dateLabel(record.performedDate, { day: "2-digit" })}</strong><span>{dateLabel(record.performedDate, { month: "short", year: "numeric" })}</span></time>
                <div className="history-entry__work"><strong>{names || "Maintenance"}</strong>{record.provider && <span>{record.provider}</span>}{record.notes && <p>{record.notes}</p>}</div>
                <div className="history-entry__reading"><small>Odometer</small><strong>{record.odometerKm.toLocaleString()} km</strong></div>
                <div className="history-entry__cost"><small>Cost</small><strong>{formatMoney(record.costSen)}</strong></div>
                <div className="history-entry__actions"><Action kind="quiet" className="icon-action" onClick={() => onEdit(record)} aria-label={`Edit ${names || "record"}`}><Pencil size={17} /></Action><Action kind="quiet" className="icon-action" onClick={() => onDelete(record)} aria-label={`Delete ${names || "record"}`}><Trash2 size={17} /></Action></div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      ) : (
        <div className="history-empty"><EmptyMessage icon={<History size={21} />} title="No entries yet" detail="Log the first service to begin the maintenance timeline." /><Action onClick={onAdd}><Plus size={18} />Log maintenance</Action></div>
      )}
    </section>
  );
}
