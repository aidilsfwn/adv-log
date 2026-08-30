import { useEffect, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { X } from "lucide-react";

export function Action({
  kind = "primary",
  className = "",
  children,
  ...props
}: HTMLMotionProps<"button"> & {
  kind?: "primary" | "secondary" | "quiet" | "danger";
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`action action--${kind} ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="control-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <motion.div
      className="modal-shade"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <header className="modal-heading">
          <div>
            <p className="overline">Garage operation</p>
            <h2 id="modal-title">{title}</h2>
            {description && <p id="modal-description">{description}</p>}
          </div>
          <Action kind="quiet" className="icon-action" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Action>
        </header>
        {children}
      </motion.section>
    </motion.div>
  );
}

export function StatusMark({
  tone,
  children,
  pulse = false,
}: {
  tone: "ok" | "warn" | "alert" | "neutral";
  children: ReactNode;
  pulse?: boolean;
}) {
  return (
    <span className={`status-mark status-mark--${tone}`}>
      <motion.i
        aria-hidden="true"
        animate={pulse ? { scale: [1, 1.15, 1] } : undefined}
        transition={pulse ? { duration: 1.8, repeat: Infinity, ease: "easeOut" } : undefined}
      />
      {children}
    </span>
  );
}

export function EmptyMessage({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <motion.div
      className="empty-message"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <span>{icon}</span>
      <div><strong>{title}</strong><p>{detail}</p></div>
    </motion.div>
  );
}
