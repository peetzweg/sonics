import plink, {
  play,
  render,
  presets,
  encode,
  decode,
  armAutoUnlock,
  type Sound,
  type Tick,
} from "plinkjs";

armAutoUnlock();

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
type Field = {
  k: keyof Tick;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  scale: number;
  fx: number;
};

const FIELDS: Field[] = [
  { k: "at", label: "Time", min: 0, max: 0.2, step: 0.001, unit: "ms", scale: 1000, fx: 1 },
  { k: "gain", label: "Gain", min: 0, max: 1, step: 0.01, unit: "", scale: 1, fx: 2 },
  { k: "freq", label: "Resonance", min: 200, max: 6000, step: 10, unit: "Hz", scale: 1, fx: 0 },
  { k: "q", label: "Q", min: 1, max: 20, step: 0.5, unit: "", scale: 1, fx: 1 },
  { k: "decay", label: "Decay τ", min: 0.001, max: 0.03, step: 0.0005, unit: "ms", scale: 1000, fx: 1 },
  { k: "noise", label: "Noise", min: 0, max: 1, step: 0.01, unit: "", scale: 1, fx: 2 },
  { k: "tail", label: "Tail", min: 0, max: 1, step: 0.01, unit: "", scale: 1, fx: 2 },
  { k: "bright", label: "Brightness", min: 0, max: 1, step: 0.01, unit: "", scale: 1, fx: 2 },
];

const DEF: Required<Omit<Tick, "partial">> & { partial: number } = {
  at: 0,
  gain: 0.5,
  freq: 3120,
  q: 7,
  decay: 0.0032,
  noise: 1,
  tail: 0.6,
  bright: 0.55,
  partial: 3.3,
};

let spec: Sound = loadFromHash() ?? structuredClone(presets.click);
let mode: "wave" | "spec" = "wave";
let lastBuffer: AudioBuffer | null = null;

function loadFromHash(): Sound | null {
  if (!location.hash.startsWith("#s=")) return null;
  try {
    return decode(location.hash.slice(3));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Editor rendering
// ---------------------------------------------------------------------------
function renderPresets() {
  const box = $("presets");
  box.innerHTML = "";
  (Object.keys(presets) as Array<keyof typeof presets>).forEach((name) => {
    const b = document.createElement("button");
    b.textContent = name;
    b.onclick = () => {
      spec = structuredClone(presets[name]);
      syncMaster();
      buildTicks();
      refresh();
      doPlay();
    };
    box.appendChild(b);
  });
}

const fmt = (f: Field, v: number) => (v * f.scale).toFixed(f.fx) + (f.unit ? " " + f.unit : "");

function buildTicks() {
  const box = $("ticks");
  box.innerHTML = "";
  $("tickCount").textContent = `· ${spec.ticks.length}`;
  spec.ticks.forEach((tick, i) => {
    const card = document.createElement("div");
    card.className = "tick";
    const head = document.createElement("div");
    head.className = "thead";
    const b = document.createElement("b");
    b.textContent = "Tick " + (i + 1);
    head.appendChild(b);
    if (spec.ticks.length > 1) {
      const del = document.createElement("button");
      del.className = "del";
      del.textContent = "remove";
      del.onclick = () => {
        spec.ticks.splice(i, 1);
        buildTicks();
        refresh();
        doPlay();
      };
      head.appendChild(del);
    }
    card.appendChild(head);
    const grid = document.createElement("div");
    grid.className = "sliders";
    FIELDS.forEach((f) => {
      const val = (tick[f.k] as number | undefined) ?? DEF[f.k as keyof typeof DEF];
      const ctl = document.createElement("div");
      ctl.className = "ctl";
      const lab = document.createElement("label");
      const span = document.createElement("span");
      span.textContent = f.label;
      const out = document.createElement("b");
      out.textContent = fmt(f, val);
      lab.append(span, out);
      const inp = document.createElement("input");
      inp.type = "range";
      inp.min = String(f.min);
      inp.max = String(f.max);
      inp.step = String(f.step);
      inp.value = String(val);
      inp.oninput = () => {
        (tick[f.k] as number) = parseFloat(inp.value);
        out.textContent = fmt(f, tick[f.k] as number);
        refresh();
      };
      inp.onchange = () => doPlay();
      ctl.append(lab, inp);
      grid.appendChild(ctl);
    });
    card.appendChild(grid);
    box.appendChild(card);
  });
}

function syncMaster() {
  ($("vol") as HTMLInputElement).value = String(spec.volume ?? 0.9);
  $("volVal").textContent = (spec.volume ?? 0.9).toFixed(2);
}

// ---------------------------------------------------------------------------
// Export panels
// ---------------------------------------------------------------------------
function refresh() {
  $("enc").textContent = encode(spec);
  $("js").textContent = `import { play } from "plinkjs";\n\nplay(${JSON.stringify(spec, null, 2)});`;
  drawScope();
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------
const supported = plink.isSupported();
if (!supported) $("hint").textContent = "Web Audio not available in this browser";

async function doPlay() {
  if (!supported) return;
  play(spec);
  const btn = $("play");
  btn.classList.remove("hit");
  void btn.offsetWidth;
  btn.classList.add("hit");
  await drawScope();
}

async function drawScope() {
  if (!supported) return;
  try {
    lastBuffer = await render(spec);
  } catch {
    return;
  }
  mode === "wave" ? drawWave() : drawSpec();
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------
const cv = $<HTMLCanvasElement>("scope");
const cx = cv.getContext("2d")!;
const HOT = "#ff8a3d",
  MAG = "#e0417f",
  FAINT = "#3a3a46";

function drawWave() {
  const W = cv.width,
    H = cv.height,
    mid = H / 2;
  cx.clearRect(0, 0, W, H);
  cx.strokeStyle = FAINT;
  cx.lineWidth = 1;
  cx.beginPath();
  cx.moveTo(0, mid);
  cx.lineTo(W, mid);
  cx.stroke();
  if (!lastBuffer) return;
  const d = lastBuffer.getChannelData(0),
    N = d.length,
    dur = N / lastBuffer.sampleRate;
  let pk = 1e-6;
  for (let i = 0; i < N; i++) {
    const a = Math.abs(d[i]);
    if (a > pk) pk = a;
  }
  const scale = (H * 0.44) / pk;
  const g = cx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, MAG);
  g.addColorStop(1, HOT);
  cx.strokeStyle = g;
  cx.lineWidth = 2;
  cx.lineJoin = "round";
  cx.beginPath();
  for (let x = 0; x < W; x++) {
    const i = Math.floor((x / W) * N);
    const y = mid - d[i] * scale;
    x ? cx.lineTo(x, y) : cx.moveTo(x, y);
  }
  cx.stroke();
  cx.fillStyle = "#5f5f70";
  cx.font = "20px ui-monospace,monospace";
  for (let ms = 0; ms <= dur * 1000; ms += 10) {
    const x = (ms / 1000 / dur) * W;
    cx.fillRect(x, mid - 4, 1, 8);
    if (ms % 20 === 0) cx.fillText(ms + "ms", x + 5, H - 12);
  }
}

function drawSpec() {
  const W = cv.width,
    H = cv.height,
    padB = 38;
  cx.clearRect(0, 0, W, H);
  if (!lastBuffer) return;
  const d = lastBuffer.getChannelData(0),
    SR = lastBuffer.sampleRate;
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
    return H - padB - Math.max(0, (db + 70) / 70) * (H - padB - 12);
  };
  const g = cx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(255,138,61,.55)");
  g.addColorStop(1, "rgba(224,65,127,.04)");
  cx.beginPath();
  cx.moveTo(0, H - padB);
  for (let k = 0; k < M; k++) cx.lineTo(xOf(k), yOf(mags[k]));
  cx.lineTo(W, H - padB);
  cx.closePath();
  cx.fillStyle = g;
  cx.fill();
  cx.beginPath();
  for (let k = 0; k < M; k++) {
    const x = xOf(k),
      y = yOf(mags[k]);
    k ? cx.lineTo(x, y) : cx.moveTo(x, y);
  }
  cx.strokeStyle = HOT;
  cx.lineWidth = 2;
  cx.stroke();
  cx.fillStyle = "#5f5f70";
  cx.font = "20px ui-monospace,monospace";
  [500, 1000, 2000, 3100, 5000, 10000].forEach((f) => {
    const k = (Math.log(f / fmin) / Math.log(fmax / fmin)) * (M - 1),
      x = xOf(k);
    cx.strokeStyle = FAINT;
    cx.beginPath();
    cx.moveTo(x, 8);
    cx.lineTo(x, H - padB);
    cx.stroke();
    cx.fillText(f >= 1000 ? f / 1000 + "k" : String(f), x + 5, H - 12);
  });
}

// ---------------------------------------------------------------------------
// Toast + clipboard
// ---------------------------------------------------------------------------
let toastEl: HTMLDivElement | null = null;
let toastTimer = 0;
function toast(msg: string) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl?.classList.remove("show"), 1600);
}
async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(label);
  } catch {
    toast("copy failed");
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
$("play").onclick = doPlay;
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
    e.preventDefault();
    doPlay();
  }
});
$("tabWave").onclick = () => setMode("wave");
$("tabSpec").onclick = () => setMode("spec");
function setMode(m: "wave" | "spec") {
  mode = m;
  $("tabWave").setAttribute("aria-pressed", String(m === "wave"));
  $("tabSpec").setAttribute("aria-pressed", String(m === "spec"));
  $("scopeLabel").textContent = m === "wave" ? "Waveform" : "Spectrum · log frequency (dB)";
  drawScope();
}

const volInput = $("vol") as HTMLInputElement;
volInput.oninput = () => {
  spec.volume = parseFloat(volInput.value);
  $("volVal").textContent = spec.volume.toFixed(2);
  refresh();
};
volInput.onchange = () => doPlay();

$("addTick").onclick = () => {
  const last = spec.ticks[spec.ticks.length - 1] ?? DEF;
  spec.ticks.push({ ...DEF, at: (last.at ?? 0) + 0.03, freq: last.freq ?? 3120 });
  buildTicks();
  refresh();
  doPlay();
};

$("copyEnc").onclick = () => copy($("enc").textContent || "", "string copied");
$("copyJs").onclick = () => copy($("js").textContent || "", "JS copied");
$("permalink").onclick = () => {
  const url = `${location.origin}${location.pathname}#s=${encode(spec)}`;
  history.replaceState(null, "", `#s=${encode(spec)}`);
  copy(url, "permalink copied");
};
$("wav").onclick = async () => {
  const blob = await plink.toWav(spec);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plink.wav";
  a.click();
  URL.revokeObjectURL(url);
  toast("WAV downloaded");
};
document.querySelectorAll<HTMLElement>("[data-copy]").forEach((el) => {
  el.addEventListener("click", () => copy(el.dataset.copy || "", "copied"));
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
renderPresets();
syncMaster();
buildTicks();
refresh();
