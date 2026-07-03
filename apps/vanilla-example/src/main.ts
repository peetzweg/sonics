import plink, { play, presets, armAutoUnlock, type Sound } from "plinkjs";

armAutoUnlock();

const box = document.getElementById("presets")!;
(Object.keys(presets) as Array<keyof typeof presets>).forEach((name) => {
  const b = document.createElement("button");
  b.textContent = name;
  b.onclick = () => plink(name);
  box.appendChild(b);
});

const doorbell: Sound = {
  volume: 0.9,
  ticks: [
    { at: 0, gain: 0.5, freq: 2637, q: 8, decay: 0.006, tail: 0.9 },
    { at: 0.09, gain: 0.55, freq: 3520, q: 8, decay: 0.008, tail: 0.9 },
  ],
};
document.getElementById("custom")!.onclick = () => play(doorbell);
