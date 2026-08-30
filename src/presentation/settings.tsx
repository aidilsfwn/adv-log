import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Check, Eye, Milestone, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Basis, MaintenanceItem, Motorcycle } from "../domain";
import { createItem, removeItem, saveItem, saveMotorcycle } from "../data";
import { Action, EmptyMessage, Field, Modal } from "./controls";

function ItemEditor({ item, nextSortOrder, onClose, onSave }: {
  item?: MaintenanceItem;
  nextSortOrder: number;
  onClose: () => void;
  onSave: (item: Omit<MaintenanceItem, "id"> & { id?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [basis, setBasis] = useState<Basis>(item?.basis ?? "distance");
  const [interval, setInterval] = useState(String(item?.intervalKm ?? item?.intervalMonths ?? ""));
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...(item ? { id: item.id } : {}),
        name: name.trim(),
        basis,
        intervalMonths: basis === "time" ? Number(interval) : undefined,
        intervalKm: basis === "distance" ? Number(interval) : undefined,
        sortOrder: item?.sortOrder ?? nextSortOrder,
        active: true,
      });
    } catch {
      setSaving(false);
    }
  }
  return (
    <Modal title={item ? "Edit service item" : "Add service item"} description="Choose how this checkpoint is measured." onClose={onClose}>
      <form className="operation-form" onSubmit={submit}>
        <Field label="Item name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Engine oil" required autoFocus /></Field>
        <Field label="Reminder type"><select value={basis} onChange={(event) => { setBasis(event.target.value as Basis); setInterval(""); }}><option value="distance">Mileage based</option><option value="time">Time based</option><option value="condition">Condition check</option></select></Field>
        {basis !== "condition" && <Field label={basis === "time" ? "Interval in months" : "Interval in kilometres"}><input type="number" min="1" value={interval} onChange={(event) => setInterval(event.target.value)} required /></Field>}
        <div className="form-actions"><Action kind="secondary" type="button" onClick={onClose}>Cancel</Action><Action type="submit" disabled={saving}><Check size={18} />{saving ? "Saving…" : item ? "Save changes" : "Add item"}</Action></div>
      </form>
    </Modal>
  );
}

export function SettingsScreen({ bike, items, userId, motorcycleId, onBikeSaved, onItemsChanged }: {
  bike: Motorcycle;
  items: MaintenanceItem[];
  userId: string;
  motorcycleId: string;
  onBikeSaved: (bike: Motorcycle) => void;
  onItemsChanged: (items: MaintenanceItem[]) => void;
}) {
  const [draft, setDraft] = useState(bike);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<MaintenanceItem | "new" | null>(null);
  const [removing, setRemoving] = useState<MaintenanceItem | null>(null);
  const active = items.filter((item) => item.active);

  async function saveBike(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await saveMotorcycle(userId, motorcycleId, draft);
      setDraft(saved);
      onBikeSaved(saved);
      toast.success("Motorcycle saved");
    } catch (error) {
      toast.error("Could not save motorcycle", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function persistItem(candidate: Omit<MaintenanceItem, "id"> & { id?: string }) {
    try {
      if (candidate.id) {
        const updated = { ...candidate, id: candidate.id } as MaintenanceItem;
        await saveItem(candidate.id, updated);
        onItemsChanged(items.map((item) => item.id === candidate.id ? updated : item));
      } else {
        const created = await createItem(userId, motorcycleId, candidate);
        onItemsChanged([...items, created]);
      }
      setEditing(null);
      toast.success(candidate.id ? "Service item updated" : "Service item added");
    } catch (error) {
      toast.error("Could not save service item", { description: error instanceof Error ? error.message : "Try again." });
      throw error;
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await removeItem(removing.id);
      onItemsChanged(items.map((item) => item.id === removing.id ? { ...item, active: false } : item));
      toast.success("Service item removed", { description: "Past maintenance entries remain in history." });
    } catch (error) {
      toast.error("Could not remove service item", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="settings-stage">
      <form className="machine-form" onSubmit={saveBike}>
        <header className="section-heading"><div><p className="overline">Machine profile</p><h2>Motorcycle</h2><p>These values drive due dates and mileage reminders.</p></div><Action type="submit" disabled={saving}><Check size={18} />{saving ? "Saving…" : "Save motorcycle"}</Action></header>
        <div className="machine-form__fields">
          <Field label="Display name"><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></Field>
          <Field label="Make"><input value={draft.make} onChange={(event) => setDraft({ ...draft, make: event.target.value })} required /></Field>
          <Field label="Model"><input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} required /></Field>
          <Field label="Tracking since"><input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} /></Field>
          <Field label="Current odometer (km)"><input type="number" min="0" value={draft.currentOdometerKm} onChange={(event) => setDraft({ ...draft, currentOdometerKm: Math.max(0, Number(event.target.value)) })} required /></Field>
        </div>
      </form>
      <section className="item-config">
        <header className="section-heading"><div><p className="overline">Reminder configuration</p><h2>Service items</h2><p>Add, remove or change how each checkpoint is measured.</p></div><Action onClick={() => setEditing("new")}><Plus size={18} />Add item</Action></header>
        <div className="item-config__head" aria-hidden="true"><span>Service item</span><span>Reminder</span><span>Actions</span></div>
        <AnimatePresence initial={false}>
          {active.map((item) => {
            const Icon = item.basis === "time" ? CalendarClock : item.basis === "distance" ? Milestone : Eye;
            const reminder = item.basis === "time" ? `Every ${item.intervalMonths} months` : item.basis === "distance" ? `Every ${item.intervalKm?.toLocaleString()} km` : "Condition check";
            return <motion.article className="item-config__row" key={item.id} layout initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2, ease: "easeOut" }}><span><i><Icon size={17} /></i><span><strong>{item.name}</strong><small>{item.basis} based</small></span></span><strong>{reminder}</strong><span><Action kind="quiet" className="icon-action" onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}><Pencil size={17} /></Action><Action kind="quiet" className="icon-action" onClick={() => setRemoving(item)} aria-label={`Remove ${item.name}`}><Trash2 size={17} /></Action></span></motion.article>;
          })}
        </AnimatePresence>
        {!active.length && <EmptyMessage icon={<Milestone size={20} />} title="No service items" detail="Add an item to begin building the maintenance route." />}
      </section>
      <AnimatePresence>{editing && <ItemEditor item={editing === "new" ? undefined : editing} nextSortOrder={Math.max(0, ...items.map((item) => item.sortOrder)) + 1} onClose={() => setEditing(null)} onSave={persistItem} />}</AnimatePresence>
      <AnimatePresence>{removing && <Modal title={`Remove ${removing.name}?`} description="It will leave the schedule and logging options. Existing history remains intact." onClose={() => setRemoving(null)}><div className="form-actions"><Action kind="secondary" onClick={() => setRemoving(null)}>Cancel</Action><Action kind="danger" onClick={confirmRemove}><Trash2 size={18} />Remove item</Action></div></Modal>}</AnimatePresence>
    </div>
  );
}
