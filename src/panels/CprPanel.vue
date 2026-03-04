<template>
  <div class="panel" style="position:relative;">
    <!-- Dice overlay: show 10 dice visuals for CPR -->
    <DiceRoller
      :play="dicePlay"
      :count="10"
      :duration="900"
      :theme="diceTheme"
      @finished="onDiceFinished"
    />

    <h3>Cyberpunk Red (10 stats)</h3>

    <div class="row">
      <div class="col">
        <label class="small-muted">Handle</label>
        <input v-model="name" class="input" placeholder="Handle / handle" />
      </div>

      <div class="col">
        <label class="small-muted">Role</label>
        <select v-model="role" class="input">
          <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
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
        <div class="small-muted">Rolls</div>
        <div class="rolls">
          <div v-for="(r, idx) in rolls" :key="idx" class="pill">{{ r }}</div>
        </div>

        <div class="assignment-grid" style="margin-top:12px">
          <div v-for="(ability, i) in CPR_ABILITIES" :key="ability" class="card">
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
        <div class="card" style="min-width:160px">
          <div class="small-muted">HP</div>
          <div style="font-weight:700; margin-top:6px">{{ derived.hp }}</div>
        </div>
        <div class="card" style="min-width:160px">
          <div class="small-muted">Humanity</div>
          <div style="font-weight:700; margin-top:6px">{{ derived.humanity }}</div>
        </div>
        <div class="card" style="min-width:160px">
          <div class="small-muted">Death Save</div>
          <div style="font-weight:700; margin-top:6px">{{ derived.deathSave }}</div>
        </div>
        <div class="card" style="min-width:160px">
          <div class="small-muted">Initiative Base</div>
          <div style="font-weight:700; margin-top:6px">{{ derived.ref }} + 1d10</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import DiceRoller from '../components/DiceRoller.vue';
import { CPR_ABILITIES } from '../utils/ttrpgConstants.js';
import { diceThemeFor } from '../js/themes.js';

const diceTheme = diceThemeFor('cpr');
const emit = defineEmits(['finalize','theme-change']);
const name = ref('');
const role = ref(null);
const roles = ['Rocker Boy','Solo','Netrunner','Techie','Medtech','Media','Lawman','Exec','Nomad'];

const rolls = reactive([]);
const assigned = reactive([]);

/* armor/demo placeholders kept for future use */
const armor = reactive([]);
const demoDamage = ref(0);
const demoIsMelee = ref(false);
const demoIsHead = ref(false);
const demoSpot = ref(0);
const demoResult = ref(null);

/* dice overlay guard */
const dicePlay = ref(false);

/* helpers */
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

/* core roll population (executed after animation finishes) */
function doRolls() {
  rolls.length = 0;
  assigned.length = 0;
  for (let i = 0; i < 10; i++){
    const a = randInt(3,8), b = randInt(3,8);
    rolls.push(a + b);
  }
  // tell parent to apply theme when generation actually occurs
  emit('theme-change','cpr');
}

/* animation flow */
function startRoll() {
  if (dicePlay.value) return;
  dicePlay.value = true;
}

/* when DiceRoller finishes: populate rolls and pause for readability */
async function onDiceFinished() {
  doRolls();
  await new Promise(r => setTimeout(r, 1500));
  dicePlay.value = false;
}

/* assign logic (manual or keep order) */
function assign(){
  if (!rolls.length) { alert('No rolls'); return; }
  const opt = window.prompt('1) Manual assign  2) Keep rolled order (enter 1 or 2)', '2');
  if (opt === '1') {
    const available = rolls.slice();
    const out = [];
    for (let i = 0; i < CPR_ABILITIES.length; i++){
      let picked = null;
      while (picked === null){
        const choices = available.map((v,idx)=>`${idx}: ${v}`).join(' | ');
        const input = window.prompt(`Available: ${choices}\nEnter index for ${CPR_ABILITIES[i]}:`);
        const idx = Number(input);
        if (!Number.isNaN(idx) && idx >= 0 && idx < available.length){
          out.push(available.splice(idx,1)[0]);
          picked = idx;
        } else alert('Invalid choice');
      }
    }
    assigned.splice(0, assigned.length, ...out);
  } else {
    assigned.splice(0, assigned.length, ...rolls.slice());
  }
}

/* finalize */
function finalizeCharacter(){
  const source = assigned.length ? assigned : rolls;
  const lines = [
    '--- Cyberpunk Red Character ---',
    `Handle: ${name.value || '(unnamed)'}`,
    `Role: ${role.value || '(none)'}`,
    ...CPR_ABILITIES.map((ab,i)=>`${ab}: ${source[i] ?? '-'}`),
    '-------------------------------'
  ];
  lines.push('');
  lines.push(`HP: ${derived.value.hp}  HUM: ${derived.value.humanity}  Death Save: ${derived.value.deathSave}  REF: ${derived.value.ref}`);
  lines.push('-------------------------------');
  emit('finalize', lines.join('\n'));
}

/* derived */
const totalSP = computed(()=> armor.reduce((s,p)=>s + (Number(p.sp)||0), 0));

const derived = computed(()=> {
  const source = assigned.length ? assigned : rolls;
  const body = Number(source[8] || 0);
  const will = Number(source[5] || 0);
  const emp = Number(source[9] || 0);
  const ref = Number(source[1] || 0);
  const hp = 10 + Math.floor((5 * (body + will)) / 2);
  const humanity = emp * 10;
  const deathSave = body;
  return { hp, humanity, deathSave, ref };
});

const finalReady = computed(()=> assigned.length || rolls.length);
</script>

<style scoped>
.card { min-height:64px; display:flex; flex-direction:column; justify-content:center; }
.pill { min-width:40px; text-align:center; }
</style>
