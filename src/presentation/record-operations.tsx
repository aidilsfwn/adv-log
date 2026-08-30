import { useState, type FormEvent } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MaintenanceItem, MaintenanceRecord, Motorcycle } from "../domain";
import { Action, Field, Modal } from "./controls";
import { today } from "./format";

export type LogTarget = { itemId: string; record?: MaintenanceRecord };

export function RecordEditor({ target, items, bike, onClose, onSave }: {
  target: LogTarget; items: MaintenanceItem[]; bike: Motorcycle; onClose: () => void;
  onSave: (record: MaintenanceRecord) => Promise<void>;
}) {
  const original = target.record;
  const [itemIds, setItemIds] = useState(original?.itemIds ?? (target.itemId ? [target.itemId] : []));
  const [date, setDate] = useState(original?.performedDate ?? today);
  const [odometer, setOdometer] = useState(String(original?.odometerKm ?? bike.currentOdometerKm));
  const [cost, setCost] = useState(original?.costSen == null ? "" : String(original.costSen / 100));
  const [provider, setProvider] = useState(original?.provider ?? "");
  const [notes, setNotes] = useState(original?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!itemIds.length) { toast.error("Choose at least one maintenance item"); return; }
    setSaving(true);
    try {
      await onSave({ id: original?.id ?? crypto.randomUUID(), itemIds, performedDate: date,
        odometerKm: Math.max(0, Number(odometer)), costSen: cost === "" ? undefined : Math.round(Number(cost) * 100),
        provider: provider.trim() || undefined, notes: notes.trim() || undefined });
    } catch (error) {
      toast.error("Could not save this entry", { description: error instanceof Error ? error.message : "Try again." });
      setSaving(false);
    }
  }

  return (
    <Modal title={original ? "Edit maintenance" : "Log maintenance"} description={original ? "Update the completed work in your garage history." : "Add completed work to the motorcycle record."} onClose={onClose}>
      <form className="operation-form" onSubmit={submit}>
        <fieldset className="item-picker"><legend>Maintenance items</legend>{items.map((item) => <label key={item.id}><input type="checkbox" checked={itemIds.includes(item.id)} onChange={(event) => setItemIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span>{item.name}</span></label>)}</fieldset>
        <div className="form-grid"><Field label="Date performed"><input type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} required /></Field><Field label="Odometer (km)"><input type="number" min="0" value={odometer} onChange={(event) => setOdometer(event.target.value)} required /></Field></div>
        <div className="form-grid"><Field label="Cost (RM)"><input type="number" min="0" step="0.01" value={cost} onChange={(event) => setCost(event.target.value)} placeholder="Optional" /></Field><Field label="Workshop / provider"><input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="Optional" /></Field></div>
        <Field label="Notes"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Parts, observations or anything worth remembering" /></Field>
        <div className="form-actions"><Action kind="secondary" type="button" onClick={onClose}>Cancel</Action><Action type="submit" disabled={saving}><Check size={18} />{saving ? "Saving…" : original ? "Save changes" : "Save record"}</Action></div>
      </form>
    </Modal>
  );
}

export function DeleteRecord({ itemNames, onClose, onConfirm }: { itemNames: string; onClose: () => void; onConfirm: () => void }) {
  return <Modal title="Delete maintenance entry?" description={`${itemNames || "This entry"} will be permanently removed from the garage history.`} onClose={onClose}><div className="form-actions"><Action kind="secondary" onClick={onClose}>Keep entry</Action><Action kind="danger" onClick={onConfirm}><Trash2 size={18} />Delete entry</Action></div></Modal>;
}
