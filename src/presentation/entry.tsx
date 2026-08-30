import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Wrench } from "lucide-react";
import { toast, Toaster } from "sonner";
import { supabase } from "../lib/supabase";
import { Action, Field } from "./controls";

export function Identity({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`identity${compact ? " identity--compact" : ""}`}>
      <span className="identity-mark"><img src="/favicon-96x96.png" alt="" /></span>
      <span><strong>ADV LOG</strong>{!compact && <small>Service intelligence</small>}</span>
    </div>
  );
}

export function Splash() {
  return (
    <motion.div className="power-on" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, ease: "easeOut" }}>
        <Identity />
        <motion.div className="power-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }} />
      </motion.div>
    </motion.div>
  );
}

export function EntryCrossfade({ active, children }: { active: boolean; children: ReactNode }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: active ? 0 : 1 }} transition={{ duration: 0.2, ease: "easeOut" }}>{children}</motion.div>;
}

export function LoadingGarage() {
  return (
    <main className="entry-stage">
      <section className="loading-rack">
        <Identity />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--copy" />
        <div className="skeleton skeleton--stat" />
        {[0, 1, 2].map((row) => <div className="skeleton skeleton--row" key={row} />)}
      </section>
    </main>
  );
}

export function MissingConfiguration() {
  return (
    <main className="entry-stage">
      <section className="notice-panel">
        <Wrench size={24} />
        <p className="overline">Setup required</p>
        <h1>Connect the garage database</h1>
        <p>Add the Supabase URL and publishable key to start ADV Log.</p>
      </section>
    </main>
  );
}

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    if (resetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) toast.error("Could not send reset email", { description: error.message });
      else toast.success("Check your inbox", { description: "Password reset instructions are on the way." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Could not sign in", { description: error.message });
    }
    setSubmitting(false);
  }

  return (
    <main className="access-stage">
      <section className="access-intro">
        <Identity />
        <div>
          <p className="overline">Private maintenance log</p>
          <h1>Know the machine.<br />Ride the distance.</h1>
          <p>Service history, mileage and upcoming work—kept in one focused instrument.</p>
        </div>
        <div className="privacy-note"><ShieldCheck size={20} /><span><strong>Private by default</strong><small>Your garage is protected by your account.</small></span></div>
      </section>
      <section className="access-form">
        <p className="overline">Account access</p>
        <h2>{resetMode ? "Reset password" : "Welcome back"}</h2>
        <p>{resetMode ? "We’ll send a secure reset link." : "Sign in to open your garage."}</p>
        <form onSubmit={submit}>
          <Field label="Email address"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></Field>
          {!resetMode && <Field label="Password"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></Field>}
          <Action type="submit" disabled={submitting}>{submitting ? "Please wait…" : resetMode ? "Send reset link" : "Sign in"}<ArrowRight size={18} /></Action>
          <Action kind="quiet" type="button" onClick={() => setResetMode((value) => !value)}>{resetMode ? "Back to sign in" : "Forgot password?"}</Action>
        </form>
      </section>
      <Toaster position="bottom-center" richColors />
    </main>
  );
}
