<script setup>
import { ref } from 'vue';
import DiceRoller from '../components/DiceRoller.vue';

const search = ref('');

/* ---------- Dice State ---------- */

const dieType = ref('d20');
const count = ref(1);

const dicePlay = ref(false);
const pendingValues = ref([]);
const results = ref([]);
const DIE_SIDES = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
  If your DiceRoller expects 0-100 style values (like your console showed),
  we map faces (1..sides) into 0..100.
*/
function mapFaceToValue(face, sides) {
  if (sides <= 1) return 0;
  return Math.round(((face - 1) / (sides - 1)) * 100);
}

function rollDice() {
  if (dicePlay.value) return;

  const sides = DIE_SIDES[dieType.value];
  const faces = [];

  for (let i = 0; i < count.value; i += 1) {
    faces.push(randInt(1, sides));
  }

  results.value = [];
  pendingValues.value = faces.map((f) => mapFaceToValue(f, sides));
  dicePlay.value = true;
}

async function onDiceFinished() {
  const sides = DIE_SIDES[dieType.value];

  results.value = pendingValues.value.map((v) => {
    const faceFloat = 1 + (v / 100) * (sides - 1);
    return Math.round(faceFloat);
  });

  await new Promise((r) => setTimeout(r, 800));
  dicePlay.value = false;
}

function sidesFor(die) {
  switch (die) {
    case 'd4': return 4;
    case 'd6': return 6;
    case 'd8': return 8;
    case 'd10': return 10;
    case 'd12': return 12;
    case 'd20': return 20;
    case 'd100': return 100;
    default: return 6;
  }
}

</script>

<template>
  <div class="panel resource-panel">
    <h3>Resources</h3>

    <div class="small-muted" style="margin-top:6px">
      PDFs, character sheets, references, downloads.
    </div>

    <!-- Search Section -->
    <div class="panel" style="margin-top:12px">
      <div class="row">
        <input
          v-model="search"
          placeholder="Search resources..."
          class="input"
        />
      </div>

      <div class="small-muted" style="margin-top:12px">
        (No resources yet — coming soon)
      </div>
    </div>

    <!-- Dice Roller Section -->
    <div class="panel" style="margin-top:16px; position:relative;">
      <h4>Dice Roller</h4>

      <div class="row" style="margin-top:8px; gap:8px;">
        <select v-model="dieType" class="input" style="width:100px;">
          <option value="d4">d4</option>
          <option value="d6">d6</option>
          <option value="d8">d8</option>
          <option value="d10">d10</option>
          <option value="d12">d12</option>
          <option value="d20">d20</option>
          <option value="d100">d100</option>
        </select>

        <input
          v-model.number="count"
          type="number"
          min="1"
          max="20"
          class="input"
          style="width:70px;"
        />

        <button
          class="btn primary"
          :disabled="dicePlay"
          @click="rollDice"
        >
          Roll
        </button>
      </div>

      <!-- Dice Animation Overlay -->
      <DiceRoller
        :play="dicePlay"
        :count="count"
        :duration="900"
        :sides="sidesFor(dieType)"
        :values="pendingValues"
        @finished="onDiceFinished"
      />

      <!-- Results -->
      <div v-if="results.length" class="roll-results" style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <div
          v-for="(r, i) in results"
          :key="i"
          class="card"
          style="min-width:60px; text-align:center;"
        >
          <div style="font-weight:700;">{{ r }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-panel {
  min-height: 200px;
}
</style>
