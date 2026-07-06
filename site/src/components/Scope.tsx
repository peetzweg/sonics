import { useEffect, useRef } from "react";
import { render, type Sound } from "sonics";

// Fixed LCD palette — the scope is always a dark display.
const WAVE = "#f05a24";
const GRID = "#2b2b31";
const DIM = "#8a8a92";

export type ScopeProps = { spec: Sound; mode: "wave" | "spec" };

export function Scope({ spec, mode }: ScopeProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cv = ref.current;
      if (!cv) return;
      let buf: AudioBuffer;
      try {
        buf = await render(spec);
      } catch {
        return;
      }
      if (cancelled) return;
      mode === "wave" ? drawWave(cv, buf) : drawSpec(cv, buf);
    })();
    return () => {
      cancelled = true;
    };
  }, [spec, mode]);

  return <canvas ref={ref} width={1720} height={360} className="scope" aria-hidden="true" />;
}

function drawWave(cv: HTMLCanvasElement, buf: AudioBuffer) {
  const cx = cv.getContext("2d")!;
  const W = cv.width,
    H = cv.height,
    mid = H / 2;
  cx.clearRect(0, 0, W, H);
  cx.strokeStyle = GRID;
  cx.lineWidth = 1;
  cx.beginPath();
  cx.moveTo(0, mid);
  cx.lineTo(W, mid);
  cx.stroke();
  const d = buf.getChannelData(0),
    N = d.length,
    dur = N / buf.sampleRate;
  let pk = 1e-6;
  for (let i = 0; i < N; i++) {
    const a = Math.abs(d[i]);
    if (a > pk) pk = a;
  }
  const scale = (H * 0.42) / pk;
  cx.strokeStyle = WAVE;
  cx.lineWidth = 3;
  cx.lineJoin = "round";
  cx.beginPath();
  for (let x = 0; x < W; x++) {
    const i = Math.floor((x / W) * N);
    const y = mid - d[i] * scale;
    x ? cx.lineTo(x, y) : cx.moveTo(x, y);
  }
  cx.stroke();
  cx.fillStyle = DIM;
  cx.font = "18px ui-monospace, monospace";
  for (let ms = 0; ms <= dur * 1000; ms += 10) {
    const x = (ms / 1000 / dur) * W;
    cx.fillRect(x, mid - 3, 1, 6);
    if (ms % 20 === 0) cx.fillText(ms + "ms", x + 6, H - 12);
  }
}

function drawSpec(cv: HTMLCanvasElement, buf: AudioBuffer) {
  const cx = cv.getContext("2d")!;
  const W = cv.width,
    H = cv.height,
    padB = 34;
  cx.clearRect(0, 0, W, H);
  const d = buf.getChannelData(0),
    SR = buf.sampleRate;
  let pk = 0,
    pi = 0;
  for (let i = 0; i < d.length; i++) {
    const a = Math.abs(d[i]);
    if (a > pk) {
      pk = a;
      pi = i;
    }
  }
  const NW = 2048,
    start = Math.max(0, pi - 256),
    seg = new Float32Array(NW);
  for (let i = 0; i < NW; i++) {
    const s = start + i < d.length ? d[start + i] : 0;
    seg[i] = s * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / NW));
  }
  const fmin = 200,
    fmax = 16000,
    M = 200;
  const mags = new Float32Array(M);
  let mmax = 1e-9;
  for (let k = 0; k < M; k++) {
    const f = fmin * Math.pow(fmax / fmin, k / (M - 1)),
      w = (2 * Math.PI * f) / SR;
    let re = 0,
      im = 0;
    for (let i = 0; i < NW; i++) {
      re += seg[i] * Math.cos(w * i);
      im -= seg[i] * Math.sin(w * i);
    }
    const m = Math.hypot(re, im);
    mags[k] = m;
    if (m > mmax) mmax = m;
  }
  const xOf = (k: number) => (k / (M - 1)) * W;
  const yOf = (m: number) => {
    const db = 20 * Math.log10(m / mmax + 1e-9);
    return H - padB - Math.max(0, (db + 70) / 70) * (H - padB - 10);
  };
  cx.strokeStyle = GRID;
  cx.fillStyle = DIM;
  cx.font = "18px ui-monospace, monospace";
  cx.lineWidth = 1;
  [500, 1000, 2000, 3100, 5000, 10000].forEach((f) => {
    const x = xOf((Math.log(f / fmin) / Math.log(fmax / fmin)) * (M - 1));
    cx.beginPath();
    cx.moveTo(x, 6);
    cx.lineTo(x, H - padB);
    cx.stroke();
    cx.fillText(f >= 1000 ? f / 1000 + "k" : String(f), x + 6, H - 12);
  });
  cx.beginPath();
  cx.moveTo(0, H - padB);
  for (let k = 0; k < M; k++) cx.lineTo(xOf(k), yOf(mags[k]));
  cx.lineTo(W, H - padB);
  cx.closePath();
  cx.save();
  cx.globalAlpha = 0.14;
  cx.fillStyle = WAVE;
  cx.fill();
  cx.restore();
  cx.beginPath();
  for (let k = 0; k < M; k++) {
    const x = xOf(k),
      y = yOf(mags[k]);
    k ? cx.lineTo(x, y) : cx.moveTo(x, y);
  }
  cx.strokeStyle = WAVE;
  cx.lineWidth = 3;
  cx.stroke();
}
