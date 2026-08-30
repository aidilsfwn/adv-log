import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Session } from "@supabase/supabase-js";
import { Gauge, History, LogOut, Plus, Settings, Wrench } from "lucide-react";
import { toast, Toaster } from "sonner";
import "./App.css";
import type { MaintenanceItem, MaintenanceRecord, Motorcycle } from "./domain";
import { getStatus } from "./domain";
import { deleteRecord, loadCloudData, saveRecord } from "./data";
import { supabase } from "./lib/supabase";
import { Action, StatusMark } from "./presentation/controls";
import { EntryCrossfade, Identity, LoadingGarage, MissingConfiguration, SignIn, Splash } from "./presentation/entry";
import { HistoryScreen } from "./presentation/history";
import { OverviewScreen } from "./presentation/overview";
import { DeleteRecord, RecordEditor, type LogTarget } from "./presentation/record-operations";
import { SettingsScreen } from "./presentation/settings";
import { today } from "./presentation/format";

type View = "overview" | "history" | "settings";
const viewCopy = {
  overview: { marker: "Garage / Route", title: "Maintenance route", detail: "Prioritised checkpoints for the road ahead." },
  history: { marker: "Garage / Archive", title: "Maintenance history", detail: "Completed service, repair and inspection records." },
  settings: { marker: "Garage / Machine", title: "Bike settings", detail: "Motorcycle details and maintenance intervals." },
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [bike, setBike] = useState<Motorcycle | null>(null);
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [motorcycleId, setMotorcycleId] = useState("");
  const [dataUserId, setDataUserId] = useState("");
  const [view, setView] = useState<View>("overview");
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceRecord | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([]);

  useEffect(() => { const timer = window.setTimeout(() => setShowSplash(false), 700); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return;
    let current = true;
    loadCloudData(session.user.id).then((data) => {
      if (!current) return;
      setBike(data.motorcycle); setItems(data.items); setRecords(data.records);
      setMotorcycleId(data.motorcycle.id); setDataUserId(session.user.id);
    }).catch((error: Error) => toast.error("Could not load your garage", { description: error.message }));
    return () => { current = false; };
  }, [session]);

  const statuses = useMemo(() => bike ? items.filter((item) => item.active).map((item) => ({ item, result: getStatus(item, records, bike, today) })) : [], [bike, items, records]);
  const urgent = statuses.filter(({ result }) => ["overdue", "due", "due_soon", "needs_baseline"].includes(result.status));

  async function persistRecord(record: MaintenanceRecord) {
    if (!session || !motorcycleId) return;
    await saveRecord(motorcycleId, record);
    setRecords((current) => [record, ...current.filter((entry) => entry.id !== record.id)]);
    setRecentlyCompleted(record.itemIds); window.setTimeout(() => setRecentlyCompleted([]), 300); setLogTarget(null);
    toast.success(logTarget?.record ? "Maintenance entry updated" : "Maintenance logged", { description: "Your garage record is up to date." });
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    try { await deleteRecord(deleteTarget.id); setRecords((current) => current.filter((record) => record.id !== deleteTarget.id)); toast.success("Entry deleted"); }
    catch (error) { toast.error("Could not delete entry", { description: error instanceof Error ? error.message : "Try again." }); }
    finally { setDeleteTarget(null); }
  }

  const entry = !authReady ? <LoadingGarage /> : !supabase ? <MissingConfiguration /> : !session ? <SignIn /> : !bike || dataUserId !== session.user.id ? <LoadingGarage /> : null;
  if (entry) return <><EntryCrossfade active={showSplash}>{entry}</EntryCrossfade><AnimatePresence>{showSplash && <Splash />}</AnimatePresence></>;

  const currentSession = session!;
  const currentBike = bike!;
  const client = supabase!;
  const activeItem = (view === "overview" ? urgent[0]?.item.id : undefined) ?? items.find((item) => item.active)?.id ?? "";
  const copy = viewCopy[view];
  const initials = currentSession.user.email?.slice(0, 2).toUpperCase() ?? "AL";
  return (
    <>
      <EntryCrossfade active={showSplash}>
        <div className="garage-shell">
          <aside className="garage-rail">
            <Identity />
            <nav aria-label="Primary navigation">
              <button className={view === "overview" ? "is-active" : ""} onClick={() => setView("overview")}><Gauge size={18} /><span>Route</span></button>
              <button className={view === "history" ? "is-active" : ""} onClick={() => setView("history")}><History size={18} /><span>History</span><small>{records.length}</small></button>
              <button className={view === "settings" ? "is-active" : ""} onClick={() => setView("settings")}><Settings size={18} /><span>Bike</span></button>
            </nav>
            <section className="rail-machine"><strong>{currentBike.name}</strong><span><small>Odometer</small>{currentBike.currentOdometerKm.toLocaleString()} km</span></section>
            <section className="rail-account"><span>{initials}</span><div><strong>{currentSession.user.email}</strong><small>Garage online</small></div><button onClick={() => client.auth.signOut()} aria-label="Sign out"><LogOut size={17} /></button></section>
          </aside>
          <main className="garage-main">
            <header className="page-command">
              <div><p className="overline">{copy.marker}</p><h1>{copy.title}</h1><p>{copy.detail}</p></div>
              <div className="page-command__actions">{view === "overview" && <StatusMark tone={urgent.length ? "alert" : "ok"}>{urgent.length ? `${urgent.length} need attention` : "All clear"}</StatusMark>}{view !== "settings" && <Action onClick={() => setLogTarget({ itemId: activeItem })} disabled={!items.some((item) => item.active)}><Plus size={18} />{view === "history" ? "Add entry" : "Log service"}</Action>}</div>
            </header>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                {view === "overview" && <OverviewScreen bike={currentBike} statuses={statuses} urgent={urgent} records={records} recentlyCompleted={recentlyCompleted} onLog={(itemId) => setLogTarget({ itemId })} onEditBike={() => setView("settings")} />}
                {view === "history" && <HistoryScreen records={records} items={items} onAdd={() => setLogTarget({ itemId: activeItem })} onEdit={(record) => setLogTarget({ itemId: record.itemIds[0] ?? "", record })} onDelete={setDeleteTarget} />}
                {view === "settings" && <SettingsScreen bike={currentBike} items={items} userId={currentSession.user.id} motorcycleId={motorcycleId} onBikeSaved={setBike} onItemsChanged={setItems} />}
              </motion.div>
            </AnimatePresence>
          </main>
          <nav className="mobile-dock" aria-label="Mobile navigation"><button className={view === "overview" ? "is-active" : ""} onClick={() => setView("overview")}><Gauge size={19} /><span>Route</span></button><button className={view === "history" ? "is-active" : ""} onClick={() => setView("history")}><History size={19} /><span>History</span></button><button className={view === "settings" ? "is-active" : ""} onClick={() => setView("settings")}><Settings size={19} /><span>Bike</span></button><button onClick={() => setLogTarget({ itemId: activeItem })} disabled={!activeItem}><Wrench size={19} /><span>Log</span></button></nav>
        </div>
        <AnimatePresence>{logTarget && <RecordEditor target={logTarget} items={items.filter((item) => item.active || logTarget.record?.itemIds.includes(item.id))} bike={currentBike} onClose={() => setLogTarget(null)} onSave={persistRecord} />}</AnimatePresence>
        <AnimatePresence>{deleteTarget && <DeleteRecord itemNames={items.filter((item) => deleteTarget.itemIds.includes(item.id)).map((item) => item.name).join(", ")} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}</AnimatePresence>
        <Toaster position="bottom-center" richColors closeButton />
      </EntryCrossfade>
      <AnimatePresence>{showSplash && <Splash />}</AnimatePresence>
    </>
  );
}
