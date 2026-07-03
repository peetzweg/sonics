import { useRef, type PointerEvent as RPointerEvent, type KeyboardEvent as RKeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

const SWEEP = 270; // total degrees of travel
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round6 = (n: number) => parseFloat(n.toFixed(6));

export type KnobProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  accent?: boolean; // orange (alt-function) styling
  size?: number;
  ariaLabel?: string;
};

export function Knob({
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  accent = false,
  size = 78,
  ariaLabel,
}: KnobProps) {
  const reduce = useReducedMotion();
  const span = max - min || 1;
  const angle = -SWEEP / 2 + clamp01((value - min) / span) * SWEEP;

  const drag = useRef<{ startY: number; startVal: number; raf: number; pending: number | null } | null>(
    null
  );

  const applyDelta = (clientY: number) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - clientY; // up = increase
    let v = d.startVal + (dy / 220) * span; // 220px ≈ full range
    v = Math.min(max, Math.max(min, Math.round(v / step) * step));
    onChange(round6(v));
  };

  const onPointerDown = (e: RPointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startVal: value, raf: 0, pending: null };
    e.preventDefault();
  };
  const onPointerMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    d.pending = e.clientY;
    if (!d.raf) {
      d.raf = requestAnimationFrame(() => {
        if (!drag.current) return;
        drag.current.raf = 0;
        if (drag.current.pending != null) applyDelta(drag.current.pending);
      });
    }
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    if (d.raf) cancelAnimationFrame(d.raf);
    drag.current = null;
    onCommit?.();
  };

  const onKeyDown = (e: RKeyboardEvent) => {
    const big = e.shiftKey ? 5 : 1;
    let v = value;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") v += step * big;
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") v -= step * big;
    else return;
    e.preventDefault();
    onChange(round6(Math.min(max, Math.max(min, v))));
    onCommit?.();
  };

  return (
    <motion.div
      className="knob"
      data-accent={accent || undefined}
      style={{ width: size, height: size }}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      whileTap={{ scale: 0.94 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div className="knob-dial">
        <motion.div
          className="knob-needle-wrap"
          animate={{ rotate: angle }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
        >
          <span className="knob-needle" />
        </motion.div>
      </div>
    </motion.div>
  );
}
