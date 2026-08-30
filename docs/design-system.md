# ADV Log — Design System ("Rugged Garage")

A dark, industrial, instrument-panel-inspired design system for the ADV Log motorcycle maintenance tracker. Use this as the fixed reference for every UI change — do not deviate from these values without updating this doc first.

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#121212` | App background |
| `bg-surface` | `#1C1C1E` | Cards, panels, modals |
| `border-default` | `#2C2C2E` | 1px borders on surfaces (used instead of shadows) |
| `accent-primary` | `#D97B2E` | Primary actions, active states, key highlights (burnt orange) |
| `accent-secondary` | `#4A9B8E` | Completed/OK status (muted teal) |
| `accent-alert` | `#C4453A` | Overdue/warning states (rust red) |
| `text-primary` | `#EDEDED` | Main text |
| `text-secondary` | `#8E8E93` | Muted/secondary text |

**Rule:** Base surfaces are flat (border + slight background shift, never drop shadows). Gradients are allowed as *contained radial glows within a single hero stat card* (see Hero Stat Component below) — never as a full-page or full-button background.

### Contextual glow colors (per data category)

Instead of one fixed accent per state, hero cards can use a radial gradient glow whose color maps to the data category/severity shown, similar to a dashboard warning-light system:

| Category | Glow color |
|---|---|
| Overdue / critical | `#C4453A` → transparent (rust red) |
| Due soon / caution | `#D97B2E` → transparent (burnt orange) |
| Healthy / on schedule | `#4A9B8E` → transparent (muted teal) |
| Informational / neutral highlight | `#5B6EE1` → transparent (muted indigo — used sparingly, only for this glow context) |

Glow sits behind the card's content as a soft radial gradient (`radial-gradient(circle at top, COLOR 0%, transparent 70%)`), confined to that card's bounds only.

## Typography

- Font family: Inter or IBM Plex Sans (pick one, use system-ui as fallback)
- Weights: Regular (400) and Semibold (600) only
- Fixed scale (px): `12 / 14 / 16 / 20 / 24 / 32`
- **Numeric data** (mileage, dates, intervals): use `font-variant-numeric: tabular-nums` or a monospace font so columns of numbers align cleanly — this is what makes the log feel "instrumented"

## Spacing

4px base unit. Only use: `4 / 8 / 12 / 16 / 24 / 32 / 48`. No arbitrary values.

## Components

- Corner radius: 4–6px (not the default rounded-xl/2xl look)
- Borders over shadows, everywhere
- Data is shown as tables/lists, not card grids
- Status indicators: small colored dot + label, never a big filled badge chip
- Buttons: solid `accent-primary` fill for primary actions; outlined/ghost style for secondary actions. No gradient buttons, no glow effects.

## Hero Stat Component

For key at-a-glance metrics (e.g. "days/km until next service," "last check-up score"), use a hero card pattern instead of a plain data row:

- Large numeral dominates the card (48–64px), everything else small underneath
- Numeral uses a segmented/dot-matrix digit style (e.g. a font like "Doto" or similar dot-matrix/seven-segment display font) so it reads like an instrument cluster readout, not a UI label
- Contained radial gradient glow behind the numeral, colored per the category table above
- Supporting context in small text below (e.g. "Steady and healthy, 1,200km until next service")
- Small pill-shaped status tag where relevant (e.g. "DUE SOON") — pill shape, not a full block badge

### Gauge / dial visual

For threshold-based metrics (e.g. how close a part is to its service interval), use a horizontal dial/slider visual rather than only a numeral:
- Thin arc or horizontal gradient track from "slow/low" to "fast/high" (or "just serviced" to "overdue")
- A marker/pointer showing current position on the track
- Small min/max labels at each end

### Line charts

- Thin single-color line, no gridlines, minimal axis labels
- No fill under the line unless it's a very subtle low-opacity gradient matching the card's category color

## Motion

Keep all motion fast and purposeful — 150–300ms, `easeOut` or a light spring. Slow, generic fades are as much a tell of AI-slop as gradients are.

**Library:** Framer Motion (`motion` package) for anything involving mount/unmount (splash, empty states, list item enter/exit). Plain CSS transitions are fine for hover/press states.

### Splash screen
"Instrument cluster power-on" sequence, total duration under ~800ms:
1. Logo/wordmark fades + scales in slightly (0.95 → 1, opacity 0 → 1), ~250ms
2. A thin horizontal accent-colored line sweeps left-to-right beneath it, ~300ms
3. Brief hold (~150ms), then whole splash fades out as app content fades in (crossfade, ~200ms)

```jsx
// Example splash screen with Framer Motion
import { motion, AnimatePresence } from "motion/react";

function SplashScreen({ onComplete }) {
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Logo />
      </motion.div>
      <motion.div
        className="accent-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
        style={{ transformOrigin: "left", background: "var(--accent-primary)" }}
      />
    </motion.div>
  );
}
```

### Odometer-style counters
Animate numeric values (mileage, etc.) counting up rather than snapping to the new value.

```jsx
import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

function AnimatedNumber({ value }) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => { spring.set(value); }, [value]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}
```

### Micro-interactions
- Completing a maintenance item: brief teal flash on the row (opacity pulse), then settle
- Overdue item: subtle pulse on the status dot only, not the full row — `scale: [1, 1.15, 1]` looped slowly
- Button press: `whileTap={{ scale: 0.97 }}`
- Empty states: icon/text fade + scale in (0.95 → 1), ~200ms, no bounce

### Loading states
Skeleton blocks shaped like the real content (matching row/card dimensions), not a spinner.

## Avoid List

- Full-page or full-button gradients (gradients are only allowed as contained radial glows within hero stat cards — see Color Palette)
- Glassmorphism
- Emoji used as icons
- Centered hero-style empty states
- Large border-radius + soft drop shadows on flat surfaces (hero stat cards may use a subtle glow instead, per the Hero Stat Component section)
- Card-grid layout for what is fundamentally a log/table of records (hero stat cards are the exception, for key at-a-glance metrics only)
- Slow, generic ease-in-out fades on everything (the motion equivalent of gradient slop)
