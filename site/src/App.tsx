import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import plink, { play, presets, encode, decode, armAutoUnlock, type Sound } from "plinkjs";
import { Knob } from "./components/Knob.js";
import { Scope } from "./components/Scope.js";
import { PRIMARY, SECONDARY, valueOf, fmt, newTick, shuffleSpec, type Param } from "./params.js";

const PRESET_NAMES = Object.keys(presets) as Array<keyof typeof presets>;

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};
const sectionMotion = {
  variants: reveal,
  initial: "hidden" as const,
  whileInView: "show" as const,
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] as const },
};

function loadFromHash(): Sound | null {
  if (!location.hash.startsWith("#s=")) return null;
  try {
    return decode(location.hash.slice(3));
  } catch {
    return null;
  }
}

export function App() {
  const [spec, setSpec] = useState<Sound>(() => loadFromHash() ?? structuredClone(presets.click));
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"wave" | "spec">("wave");
  const [altHeld, setAltHeld] = useState(false);
  const [altLatch, setAltLatch] = useState(false);
  const [preset, setPreset] = useState<string | null>("click");
  const [pulse, setPulse] = useState(0);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);

  const alt = altHeld || altLatch;
  const supported = plink.isSupported();

  // refs for stable handlers
  const specRef = useRef(spec);
  specRef.current = spec;
  const activeRef = useRef(active);
  activeRef.current = Math.min(active, spec.ticks.length - 1);

  useEffect(() => {
    armAutoUnlock();
  }, []);

  const say = useCallback((msg: string) => setToast({ id: Date.now(), msg }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(t);
  }, [toast]);

  const doPlay = useCallback(() => {
    play(specRef.current);
    setPulse((p) => p + 1);
  }, []);

  const doShuffle = useCallback(() => {
    const s = shuffleSpec();
    setSpec(s);
    setActive(0);
    setPreset(null);
    play(s);
    setPulse((p) => p + 1);
  }, []);

  const loadPreset = useCallback((name: keyof typeof presets) => {
    const s = structuredClone(presets[name]);
    setSpec(s);
    setActive(0);
    setPreset(name);
    play(s);
    setPulse((p) => p + 1);
  }, []);

  const setParam = useCallback((key: Param["key"], value: number) => {
    setSpec((s) => ({
      ...s,
      ticks: s.ticks.map((t, i) => (i === activeRef.current ? { ...t, [key]: value } : t)),
    }));
    setPreset(null);
  }, []);

  const setVolume = useCallback((v: number) => setSpec((s) => ({ ...s, volume: v })), []);

  // play the freshest spec once state has committed
  const commit = useCallback(() => {
    requestAnimationFrame(() => play(specRef.current));
  }, []);

  const addTick = useCallback(() => {
    setSpec((s) => {
      const last = s.ticks[s.ticks.length - 1];
      return { ...s, ticks: [...s.ticks, newTick((last?.at ?? 0) + 0.03, last?.freq ?? 3120)] };
    });
    setActive((a) => a + 1);
    setPreset(null);
  }, []);

  const removeTick = useCallback((i: number) => {
    setSpec((s) => ({ ...s, ticks: s.ticks.filter((_, k) => k !== i) }));
    setActive((a) => Math.max(0, a - (i <= a ? 1 : 0)));
    setPreset(null);
  }, []);

  // keyboard: space = play, s = shuffle, Alt/Shift = flip knobs
  useEffect(() => {
    const sync = (e: KeyboardEvent) => setAltHeld(e.altKey || e.shiftKey);
    const onKeyDown = (e: KeyboardEvent) => {
      sync(e);
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        doShuffle();
      } else if (e.code === "Space" || e.key === " ") {
        if (tag === "BUTTON") return; // let a focused button activate itself
        e.preventDefault();
        doPlay();
      }
    };
    const onBlur = () => setAltHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", sync);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", sync);
      window.removeEventListener("blur", onBlur);
    };
  }, [doPlay, doShuffle]);

  const copy = useCallback(
    async (text: string, msg: string) => {
      try {
        await navigator.clipboard.writeText(text);
        say(msg);
      } catch {
        say("copy failed");
      }
    },
    [say]
  );

  const enc = encode(spec);
  const jsSnippet = `import { play } from "plinkjs";\n\nplay(${JSON.stringify(spec, null, 2)});`;
  const tick = spec.ticks[activeRef.current] ?? spec.ticks[0];

  const downloadWav = useCallback(async () => {
    const blob = await plink.toWav(specRef.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plink.wav";
    a.click();
    URL.revokeObjectURL(url);
    say("wav downloaded");
  }, [say]);

  const permalink = useCallback(() => {
    const hash = `#s=${encode(specRef.current)}`;
    history.replaceState(null, "", hash);
    copy(`${location.origin}${location.pathname}${hash}`, "permalink copied");
  }, [copy]);

  return (
    <main className="sheet">
      <header className="topbar">
        <span className="wordmark">
          plink<sup>®</sup>
        </span>
        <span className="model">web audio ui sound synthesiser</span>
        <span className="spacer" />
        <span className="ver">js–01 · mit</span>
      </header>

      <motion.div
        className="hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <h1>
          ui sounds you can <b>feel</b>
        </h1>
        <p className="lead">
          tasteful microinteraction sounds, synthesised live in the browser — no audio files, no
          dependencies. design one below, export the spec, drop it in.
        </p>
        <p className="kbd">
          <kbd>space</kbd> play · <kbd>s</kbd> shuffle · hold <kbd>alt</kbd> to flip the knobs
        </p>
      </motion.div>

      <div className="specs">
        <div>
          <span className="k">type</span>
          <span className="v">synthesised</span>
        </div>
        <div>
          <span className="k">dependencies</span>
          <span className="v">0</span>
        </div>
        <div>
          <span className="k">size</span>
          <span className="v">~2&nbsp;kb gz</span>
        </div>
        <div>
          <span className="k">install</span>
          <span className="v">
            npm i plinkjs
            <button className="mini" onClick={() => copy("npm i plinkjs", "copied")}>
              copy
            </button>
          </span>
        </div>
      </div>

      {/* sticky instrument */}
      <div className="instrument">
        <div className="play-col">
          <button className="knob play" onClick={doPlay} aria-label="Play sound">
            <span className="play-glyph">play</span>
            <AnimatePresence>
              <motion.span
                key={pulse}
                className="pulse"
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 1.35 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </AnimatePresence>
          </button>
          <button className="btn key" onClick={doShuffle} aria-label="Shuffle (s)">
            shuffle
          </button>
        </div>
        <div className="scope-col">
          <div className="scope-head">
            <span className="lcd-label">{mode === "wave" ? "waveform" : "spectrum · db"}</span>
            <div className="tabs" role="group" aria-label="Visualisation">
              {(["wave", "spec"] as const).map((m) => (
                <button
                  key={m}
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className="tab"
                >
                  {mode === m && <motion.span layoutId="tabsel" className="tabsel" />}
                  <span className="tablabel">{m === "wave" ? "wave" : "spectrum"}</span>
                </button>
              ))}
            </div>
          </div>
          {supported ? (
            <Scope spec={spec} mode={mode} />
          ) : (
            <div className="scope noaudio">web audio not available</div>
          )}
        </div>
      </div>

      <motion.section {...sectionMotion}>
        <div className="shead">
          <span className="idx">01</span>
          <h2>presets</h2>
          <span className="note">tap to load &amp; hear</span>
        </div>
        <div className="presets">
          {PRESET_NAMES.map((name) => (
            <button
              key={name}
              className={preset === name ? "on" : ""}
              onClick={() => loadPreset(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </motion.section>
      <hr className="rule" />

      <motion.section {...sectionMotion}>
        <div className="shead">
          <span className="idx">02</span>
          <h2>master</h2>
        </div>
        <div className="master-knob">
          <Knob
            value={spec.volume ?? 0.9}
            min={0}
            max={1.2}
            step={0.01}
            onChange={setVolume}
            onCommit={commit}
            size={88}
            ariaLabel="master volume"
          />
          <div className="knob-labels">
            <span className="pl active">volume</span>
            <span className="val">{(spec.volume ?? 0.9).toFixed(2)}</span>
          </div>
        </div>
      </motion.section>
      <hr className="rule" />

      <motion.section {...sectionMotion}>
        <div className="shead">
          <span className="idx">03</span>
          <h2>ticks</h2>
          <span className="note">one impulse each · {alt ? "alt function" : "hold alt to flip"}</span>
        </div>

        <div className="tickbar">
          {spec.ticks.map((_, i) => (
            <button
              key={i}
              className={`tickchip ${i === activeRef.current ? "on" : ""}`}
              onClick={() => setActive(i)}
            >
              {i === activeRef.current && <motion.span layoutId="ticksel" className="chipsel" />}
              <span className="chiplabel">τ{i + 1}</span>
            </button>
          ))}
          <button className="tickchip add" onClick={addTick} aria-label="Add tick">
            +
          </button>
          {spec.ticks.length > 1 && (
            <button
              className="tickchip del"
              onClick={() => removeTick(activeRef.current)}
              aria-label="Remove current tick"
            >
              remove τ{activeRef.current + 1}
            </button>
          )}
        </div>

        <div className="knobrow">
          {PRIMARY.map((p, i) => {
            const s = SECONDARY[i];
            const activeParam = alt ? s : p;
            const value = valueOf(tick, activeParam.key);
            return (
              <div className="knobcell" key={i}>
                <Knob
                  value={value}
                  min={activeParam.min}
                  max={activeParam.max}
                  step={activeParam.step}
                  accent={alt}
                  onChange={(v) => setParam(activeParam.key, v)}
                  onCommit={commit}
                  ariaLabel={activeParam.label}
                />
                <div className="knob-labels">
                  <span className={`pl ${!alt ? "active" : ""}`}>{p.label}</span>
                  <span className={`sl ${alt ? "active" : ""}`}>{s.label}</span>
                  <span className="val">{fmt(activeParam, value)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="altbar">
          <button
            className={`altbtn ${alt ? "on" : ""}`}
            aria-pressed={alt}
            onClick={() => setAltLatch((x) => !x)}
          >
            alt
          </button>
          <span className="note">click to latch, or hold alt / shift</span>
        </div>
      </motion.section>
      <hr className="rule" />

      <motion.section className="export" {...sectionMotion}>
        <div className="shead">
          <span className="idx">04</span>
          <h2>export</h2>
        </div>
        <div className="explabel">shareable string</div>
        <pre className="wrap-pre">{enc}</pre>
        <div className="explabel">javascript</div>
        <pre className="wrap-pre">{jsSnippet}</pre>
        <div className="exportbtns">
          <button className="btn" onClick={() => copy(enc, "string copied")}>
            copy string
          </button>
          <button className="btn" onClick={() => copy(jsSnippet, "js copied")}>
            copy js
          </button>
          <button className="btn" onClick={permalink}>
            copy permalink
          </button>
          <button className="btn solid" onClick={downloadWav}>
            download wav
          </button>
        </div>
      </motion.section>
      <hr className="rule" />

      <motion.section className="usage" {...sectionMotion}>
        <div className="shead">
          <span className="idx">05</span>
          <h2>drop it in</h2>
        </div>
        <div className="cols">
          <div>
            <div className="explabel">vanilla</div>
            <pre>{`import plink, { armAutoUnlock } from "plinkjs";

armAutoUnlock();
document.querySelector("button")
  .addEventListener("click", () => plink("click"));`}</pre>
          </div>
          <div>
            <div className="explabel">react</div>
            <pre>{`import { useSound } from "plinkjs/react";

function Save() {
  const click = useSound("click");
  return <button onClick={click}>Save</button>;
}`}</pre>
          </div>
        </div>
      </motion.section>
      <hr className="rule" />

      <motion.section className="credits" {...sectionMotion}>
        <div className="shead">
          <span className="idx">06</span>
          <h2>standing on shoulders</h2>
        </div>
        <p>
          everyone who <em>synthesises</em> sound in the browser aimed at retro game sfx; everyone
          aiming at tasteful ui shipped audio <em>files</em>. plink sits in the empty cell — tiny,
          synth-based, tasteful, with a designer. inspirations:{" "}
          <a href="https://github.com/KilledByAPixel/ZzFX">zzfx</a> (frank force) for the sub-1&nbsp;kb
          synth + designer pattern, and <a href="https://haptics.lochie.me/">web-haptics</a> (lochie
          axon) for the design→export loop this mirrors. also{" "}
          <a href="https://www.drpetter.se/project_sfxr.html">sfxr</a>,{" "}
          <a href="https://github.com/chr15m/jsfxr">jsfxr</a>,{" "}
          <a href="https://jfxr.frozenfractal.com/">jfxr</a>,{" "}
          <a href="https://snd.dev/">snd-lib</a>, and{" "}
          <a href="https://github.com/joshwcomeau/use-sound">use-sound</a>. the default{" "}
          <code>click</code> was reverse-engineered from the elevenlabs onboarding sound.
        </p>
      </motion.section>

      <footer>
        <span>plink — web audio ui sound synthesiser</span>
        <span>zero dependencies · mit</span>
      </footer>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
