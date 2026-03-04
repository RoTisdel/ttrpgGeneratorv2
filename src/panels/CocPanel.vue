<template>
  <div class="panel" style="position:relative;">
    <!-- Dice overlay: 8 visuals (5x 3d6×5 + 3x (2d6+6)×5) -->
    <DiceRoller
      :play="dicePlay"
      :count="8"
      :duration="900"
      :theme="diceTheme"
      :values="pendingValues"
      @finished="onDiceFinished"
    />

    <h3>Call of Cthulhu</h3>

    <div class="row">
      <div class="col">
        <label class="small-muted">Name</label>
        <input v-model="name" class="input" placeholder="Investigator name" />
      </div>
      <div class="col">
        <label class="small-muted">Occupation</label>
        <select v-model="occupation" class="input">
          <option v-for="o in occupations" :key="o" :value="o">{{ o }}</option>
          <option :value="null">None</option>
        </select>
      </div>
    </div>

    <div class="row" style="margin-top:12px">
      <button class="btn primary" @click="startRoll" :disabled="dicePlay">Roll Stats</button>
      <button class="btn" @click="startRoll" :disabled="!rolls.length || dicePlay">Re-Roll</button>
      <button class="btn" @click="assign" :disabled="!rolls.length || dicePlay">Assign / Keep Order</button>
      <button class="btn" @click="finalizeCharacter" :disabled="!finalReady">Finalize</button>
    </div>

    <div class="panel" style="margin-top:12px">
      <div v-if="rolls.length">
        <div class="small-muted">Rolls — first 5 are 3d6×5; last 3 are (2d6+6)×5</div>
        <div class="rolls" style="margin-top:8px">
          <div v-for="(r, idx) in rolls" :key="idx" class="pill">{{ r }}</div>
        </div>

        <div class="assignment-grid" style="margin-top:12px">
          <div v-for="(ability, i) in COC_ABILITIES" :key="ability" class="card">
            <div class="small-muted">{{ ability }}</div>
            <div style="margin-top:8px">
              <div v-if="assigned.length">{{ assigned[i] ?? '-' }}</div>
              <div v-else class="small-muted">Not assigned</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="small-muted">No rolls yet. Click "Roll Stats".</div>
    </div>

    <!-- Derived -->
    <div v-if="finalReady" class="panel" style="margin-top:12px">
      <div class="small-muted">Derived Stats</div>
      <div class="row" style="margin-top:8px">
        <div class="card" style="min-width:150px;">
          <div class="small-muted">HP</div>
          <div style="font-weight:700; margin-top:6px">{{ derived.hp }}</div>
        </div>
        <div class="card" style="min-width:150px;">
          <div class="small-muted">SAN</div>
          <div style="font-weight:700; margin-top:6px">{{ derived.san }}</div>
        </div>
        <div class="card" style="min-width:150px;">
          <div class="small-muted">MP</div>
          <div style="font-weight:700; margin-top:6px">{{ derived.mp }}</div>
        </div>
        <div class="card" style="min-width:150px;">
          <div class="small-muted">Luck</div>
          <div style="font-weight:700; margin-top:6px">{{ derived.luck }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import DiceRoller from '../components/DiceRoller.vue';
import { COC_ABILITIES } from '../utils/ttrpgConstants.js';
import { diceThemeFor } from '../js/themes.js';

const diceTheme = diceThemeFor('cocEldritch');
const emit = defineEmits(['finalize','theme-change']);

/* state */
const name = ref('');
const occupation = ref(null);
const occupations = ['Anthropologist','Archaeologist','Curator','Inventor','Librarian','Oceanographer','Professor','Researcher','Student','Entertainer','Artist','Clergyman','Coroner','Detective','Doctor','Reporter','Lawyer','Nurse','Occultist','Psychiatrist','Mortician','Soldier','Police','Politician','Businessperson','Adventurer','Sailor','Thief','Smuggler'];

const rolls = reactive([]);        // what the UI shows after finalize of an animation
const assigned = reactive([]);

/* dice overlay state */
const dicePlay = ref(false);
/* pending values that the DiceRoller will settle to */
const pendingValues = ref([]);

/* helpers */
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

/* prepareRolls: generate the final numbers but don't put them into 'rolls' yet */
function prepareRolls() {
  const out = [];
  // first five: 3d6 * 5
  for (let i = 0; i < 5; i++) {
    const total = (randInt(1,6) + randInt(1,6) + randInt(1,6)) * 5;
    out.push(total);
  }
  // last three: (2d6 + 6) * 5
  for (let i = 0; i < 3; i++) {
    const total = (randInt(1,6) + randInt(1,6) + 6) * 5;
    out.push(total);
  }
  return out;
}

/* startRoll: build pendingValues, start dice overlay (DiceRoller reads :values) */
function startRoll() {
  if (dicePlay.value) return;           // guard double-click
  pendingValues.value = prepareRolls(); // prepare final faces
  dicePlay.value = true;                // start the DiceRoller animation (component will settle to pendingValues)
  // optionally ask parent to switch theme immediately
  emit('theme-change','cocEldritch');
}

/* when DiceRoller finishes: copy pendingValues into visible rolls, pause so user can read, then hide overlay */
async function onDiceFinished() {
  // commit the pending values into the UI
  rolls.length = 0;
  assigned.length = 0;
  rolls.push(...pendingValues.value);

  // keep overlay visible for a short moment so user can read the faces
  await new Promise(r => setTimeout(r, 1200));

  // hide the animation overlay
  dicePlay.value = false;
}

/* assignment and finalize logic unchanged (uses `rolls`) */
function assign(){
  if (!rolls.length) { alert('No rolls'); return; }
  const opt = window.prompt('1) Manual assign (pool-limited)  2) Keep rolled order (enter 1 or 2)', '2');
  if (opt === '1') {
    const pool3 = rolls.slice(0,5);
    const pool2 = rolls.slice(5,8);
    const out = [];
    for (let i = 0; i < COC_ABILITIES.length; i++){
      const needs3 = i <= 4;
      let picked = null;
      while (picked === null){
        const pool = needs3 ? pool3 : pool2;
        const choices = pool.map((v,idx)=>`${idx}: ${v}`).join(' | ');
        const input = window.prompt(`Available (${needs3 ? '3d6×5' : '(2d6+6)×5'}): ${choices}\nEnter index for ${COC_ABILITIES[i]}:`);
        const idx = Number(input);
        if (!Number.isNaN(idx) && idx >= 0 && idx < pool.length) {
          out.push(pool.splice(idx,1)[0]);
          picked = idx;
        } else alert('Invalid choice');
      }
    }
    assigned.splice(0, assigned.length, ...out);
  } else {
    assigned.splice(0, assigned.length, ...rolls.slice());
  }
}

/* derived values: HP, SAN, MP, Luck — luck computed on demand */
const derived = computed(()=> {
  const source = assigned.length ? assigned : rolls;
  const con = Number(source[1] || 0);
  const siz = Number(source[5] || 0);
  const pow = Number(source[2] || 0);
  const hp = Math.floor((con + siz) / 10);
  const san = pow;
  const mp = Math.floor(pow / 5);
  // compute luck once per derived evaluation (it's just a roll for flavor)
  const luck = (randInt(1,6) + randInt(1,6) + randInt(1,6)) * 5;
  return { hp, san, mp, luck };
});

/* finalize summary: uses abilities and derived values */
function finalizeCharacter(){
  const source = assigned.length ? assigned : rolls;
  const lines = [
    '--- Call of Cthulhu Character ---',
    `Name: ${name.value || '(unnamed)'}`,
    `Occupation: ${occupation.value || '(none)'}`,
    'Abilities:'
  ];
  for (let i = 0; i < COC_ABILITIES.length; i++) {
    lines.push(`${COC_ABILITIES[i]}: ${source[i] ?? '-'}`);
  }
  lines.push('');
  lines.push(`HP: ${derived.value.hp}  SAN: ${derived.value.san}  MP: ${derived.value.mp}  Luck: ${derived.value.luck}`);
  lines.push('---------------------------------');
  emit('finalize', lines.join('\n'));
}

const finalReady = computed(()=> assigned.length || rolls.length);
</script>

<style scoped>
.panel { position: relative; }
.card { min-height:64px; display:flex; flex-direction:column; justify-content:center; }
.pill { min-width:40px; text-align:center; }
</style>
