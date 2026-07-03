import { PlinkProvider, useSound, usePlink, PlinkButton } from "plinkjs/react";
import { presets } from "plinkjs";

const wrap: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  maxWidth: 640,
  margin: "0 auto",
  padding: "48px 24px",
  color: "#eef0f4",
};
const btn: React.CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: 14,
  background: "#1a1a23",
  color: "#eef0f4",
  border: "1px solid #2d2d3a",
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
};

function Demo() {
  const { enabled, toggle, volume, setVolume } = usePlink();
  const save = useSound("click");

  return (
    <div style={wrap}>
      <h1 style={{ fontWeight: 640 }}>plink · React</h1>
      <p style={{ color: "#9a9aab" }}>
        Every button below plays a synthesised sound. No audio files. Toggle sound off to see the
        provider mute everything.
      </p>

      <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "20px 0" }}>
        <input type="checkbox" checked={enabled} onChange={toggle} /> Sound {enabled ? "on" : "off"}
      </label>

      <label style={{ display: "block", margin: "20px 0", color: "#9a9aab" }}>
        Volume {volume.toFixed(2)}
        <input
          type="range"
          min={0}
          max={1.2}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ display: "block", width: 240, marginTop: 6 }}
        />
      </label>

      <h3>useSound hook</h3>
      <button style={btn} onClick={() => save()}>
        Save (click)
      </button>

      <h3 style={{ marginTop: 28 }}>PlinkButton, one per preset</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(presets) as Array<keyof typeof presets>).map((name) => (
          <PlinkButton key={name} sound={name} style={btn}>
            {name}
          </PlinkButton>
        ))}
      </div>

      <h3 style={{ marginTop: 28 }}>Play on hover</h3>
      <PlinkButton sound="tick" on="hover" style={btn}>
        hover me
      </PlinkButton>
    </div>
  );
}

export default function App() {
  return (
    <PlinkProvider>
      <Demo />
    </PlinkProvider>
  );
}
