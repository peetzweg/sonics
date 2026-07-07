<script setup lang="ts">
import { ref } from "vue";
import { play, presets, armAutoUnlock, type Sound } from "sonics";

armAutoUnlock();

const names = Object.keys(presets) as Array<keyof typeof presets>;
const volume = ref(0.9);

function playPreset(name: keyof typeof presets) {
  play(name, { volume: volume.value });
}

const doorbell: Sound = {
  volume: 0.9,
  ticks: [
    { at: 0, gain: 0.5, freq: 2637, q: 8, decay: 0.006, tail: 0.9 },
    { at: 0.09, gain: 0.55, freq: 3520, q: 8, decay: 0.008, tail: 0.9 },
  ],
};
</script>

<template>
  <main>
    <h1>sonics · Vue</h1>
    <p>Every button plays a sound synthesised at runtime — no audio files loaded.</p>

    <div class="row">
      <button v-for="name in names" :key="name" @click="playPreset(name)">{{ name }}</button>
    </div>

    <label class="vol">
      volume {{ volume.toFixed(2) }}
      <input type="range" min="0" max="1.2" step="0.01" v-model.number="volume" />
    </label>

    <h3>Custom sound</h3>
    <button @click="play(doorbell, { volume })">play a doorbell spec</button>
  </main>
</template>

<style>
main {
  font-family: system-ui, sans-serif;
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px;
  color: #0f0e12;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
button {
  font-family: ui-monospace, monospace;
  font-size: 14px;
  background: #fff;
  border: 1px solid #0f0e12;
  padding: 9px 15px;
  cursor: pointer;
}
button:hover {
  background: #f05a24;
  color: #fff;
  border-color: #f05a24;
}
.vol {
  display: block;
  margin: 24px 0;
  font-family: ui-monospace, monospace;
  font-size: 13px;
}
</style>
