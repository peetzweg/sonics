import { useRef, type PointerEvent as RPointerEvent, type KeyboardEvent as RKeyboardEvent } from "react";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

export type FaderProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  markAt?: number; // draw a reference tick (e.g. unity / 100%)
  onChange: (v: number) => void;
  onCommit?: () => void;
  ariaLabel?: string;
};

/** Vertical volume fader, Final-Cut style: drag the cap up/down. */
export function Fader({
  value,
  min = 0,
  max = 1.2,
  step = 0.01,
  markAt = 1,
  onChange,
  onCommit,
  ariaLabel = "volume",
}: FaderProps) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const raf = useRef(0);
  const pending = useRef<number | null>(null);

  const setFromY = (clientY: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = clamp01(1 - (clientY - r.top) / r.height);
    let v = min + ratio * (max - min);
    v = Math.round(v / step) * step;
    onChange(round2(Math.min(max, Math.max(min, v))));
  };

  const onPointerDown = (e: RPointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = true;
    setFromY(e.clientY);
    e.preventDefault();
  };
  const onPointerMove = (e: RPointerEvent) => {
    if (!drag.current) return;
    pending.current = e.clientY;
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        if (pending.current != null) setFromY(pending.current);
      });
    }
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = false;
    if (raf.current) cancelAnimationFrame(raf.current);
    onCommit?.();
  };
  const onKeyDown = (e: RKeyboardEvent) => {
    const big = e.shiftKey ? 10 : 1;
    let v = value;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") v += step * big;
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") v -= step * big;
    else return;
    e.preventDefault();
    onChange(round2(Math.min(max, Math.max(min, v))));
    onCommit?.();
  };

  const pct = (clamp01((value - min) / (max - min)) * 100).toFixed(1);
  const markPct = (clamp01((markAt - min) / (max - min)) * 100).toFixed(1);
  const boosted = value > markAt + 1e-6;

  return (
    <div className="fader" title="master gain — baked into the exported sound">
      <div
        className="fader-track"
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div className="fader-fill" style={{ height: `${pct}%` }} />
        <div className="fader-mark" style={{ bottom: `${markPct}%` }} />
        <div
          className="fader-cap"
          data-boost={boosted || undefined}
          style={{ bottom: `${pct}%` }}
        />
      </div>
      <div className="fader-val">{Math.round(value * 100)}%</div>
      <div className="fader-lab">vol</div>
    </div>
  );
}
