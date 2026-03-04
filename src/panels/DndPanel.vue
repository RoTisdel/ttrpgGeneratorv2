<template>
  <div class="panel" style="position:relative;">
    <!-- Dice roller overlay -->
    <DiceRoller
      :play="dicePlay"
      :count="6"
      :duration="900"
      :theme="diceTheme"
      @finished="onDiceFinished"
    />

    <h3>D&D (4d6 drop lowest)</h3>

    <div class="row">
      <div class="col">
        <label class="small-muted">Name</label>
        <input v-model="name" class="input" placeholder="Adventurer name" />
      </div>

      <div class="col">
        <label class="small-muted">Class</label>
        <select v-model="cls" class="input">
          <option v-for="c in classes" :key="c" :value="c">{{ c }}</option>
          <option :value="null">None</option>
        </select>
      </div>

      <div class="col" style="min-width:120px;">
        <label class="small-muted">Level</label>
        <input class="input" type="number" v-model.number="level" min="1" max="20" />
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

        <div class="assignment-grid">
          <div v-for="(ability, i) in DND_ABILITIES" :key="ability" class="card">
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

    <!-- Derived: modifiers & saves -->
    <div v-if="finalReady" class="panel" style="margin-top:12px">
      <div class="small-muted">Ability modifiers</div>
      <div class="assignment-grid" style="margin-top:8px">
        <div v-for="(ab,i) in DND_ABILITIES" :key="ab" class="card" style="text-align:center;">
          <div class="small-muted">{{ ab }}</div>
          <div style="font-weight:700;margin-top:6px">{{ formatMod(mods[i]) }}</div>
          <div class="small-muted" style="margin-top:6px">Score: {{ (assigned.length ? assigned[i] : rolls[i]) ?? '-' }}</div>
        </div>
      </div>

      <div style="margin-top:12px">
        <div class="small-muted">Saving Throws (• = proficient)</div>
        <div class="assignment-grid" style="margin-top:8px">
          <div v-for="s in saves" :key="s.ability" class="card" :style="{ borderColor: s.isProf ? 'var(--accent)' : 'transparent' }">
            <div class="small-muted">{{ s.ability }} {{ s.isProf ? '•' : '' }}</div>
            <div style="font-weight:700;margin-top:6px">{{ s.total >= 0 ? '+' + s.total : s.total }}</div>
            <div class="small-muted" style="font-size:0.8rem;margin-top:6px">(mod {{ s.mod >= 0 ? '+' + s.mod : s.mod }})</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import DiceRoller from '../components/DiceRoller.vue';
import { DND_ABILITIES, CLASS_SAVE_PROFS } from '../utils/ttrpgConstants.js';
import { diceThemeFor } from '../js/themes.js';

const diceTheme = diceThemeFor('dnd');
const emit = defineEmits(['finalize','theme-change']);

/* local state */
const name = ref('');
const cls = ref(null);
const level = ref(1);
const classes = ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
const rolls = reactive([]);
const assigned = reactive([]);

/* dice animation state */
const dicePlay = ref(false);

/* helpers */
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function abilityMod(score) { return Math.floor((Number(score||0)-10)/2); }
function profBonus(l){ const lvl = Math.min(20,Math.max(1,Number(l)||1)); return 2 + Math.floor((lvl-1)/4); }
function formatMod(v){ return v>=0 ? '+'+v : String(v); }

/* computed derived */
const mods = computed(()=> {
  const source = assigned.length ? assigned : rolls;
  return DND_ABILITIES.map((_,i) => abilityMod(source[i] ?? 0));
});
const saves = computed(()=> {
  const prof = profBonus(level.value);
  const profSet = CLASS_SAVE_PROFS[cls.value] || [];
  const m = mods.value;
  return m.map((mod, i) => {
    const ability = DND_ABILITIES[i];
    const isProf = profSet.includes(ability);
    return { ability, mod, prof: isProf ? prof : 0, total: mod + (isProf ? prof : 0), isProf };
  });
});

/* core roll logic (called after animation finishes) */
function doRolls() {
  rolls.length = 0;
  assigned.length = 0;
  for(let i=0;i<6;i++){
    const r = [randInt(1,6),randInt(1,6),randInt(1,6),randInt(1,6)].sort((a,b)=>a-b);
    r.shift();
    rolls.push(r.reduce((s,x)=>s+x,0));
  }

  emit('theme-change','dnd');
}

/* public API: start rolling (show animation), onDiceFinished does the real work */
function startRoll() {
  if (dicePlay.value)  {
    return;
  }

  dicePlay.value = true;
}

/* called from DiceRoller when animation finishes */
async function onDiceFinished() {
  doRolls();
  await new Promise(resolve => setTimeout(resolve, 1500));
  dicePlay.value = false;
}

function assign(){
  if(!rolls.length){ alert('No rolls'); return; }
  const opt = window.prompt('1) Manual assign  2) Keep rolled order (enter 1 or 2)','2');
  if(opt==='1'){
    const available = rolls.slice();
    const out = [];
    for(let i=0;i<DND_ABILITIES.length;i++){
      let picked = null;
      while(picked===null){
        const choices = available.map((v,idx)=>`${idx}: ${v}`).join(' | ');
        const input = window.prompt(`Available: ${choices}\nEnter index for ${DND_ABILITIES[i]}:`);
        const idx = Number(input);
        if(!Number.isNaN(idx) && idx>=0 && idx<available.length) { out.push(available.splice(idx,1)[0]); picked=idx; }
        else alert('Invalid choice');
      }
    }
    assigned.splice(0,assigned.length,...out);
  } else {
    assigned.splice(0,assigned.length,...rolls.slice());
  }
}

function finalizeCharacter(){
  const source = assigned.length ? assigned : rolls;
  const prof = profBonus(level.value);
  const conScore = (source[2] ?? 0);
  const hp = computeHpForCharacter(cls.value, level.value, conScore);
  const lines = [
    '--- DND Character ---',
    `Name: ${name.value || '(unnamed)'}`,
    `Class: ${cls.value || '(none)'}  Level: ${level.value || 1}`,
    `Proficiency Bonus: ${prof >= 0 ? '+'+prof : String(prof)}`,
    `HP: ${hp}`,
    '---------------------',
    'Abilities:'
  ];

  for (let i = 0; i < DND_ABILITIES.length; i++) {
    const score = source[i] ?? '-';
    const mod = mods.value[i] ?? 0;
    lines.push(`${DND_ABILITIES[i]}: ${score} (${formatMod(mod)})`);
  }

  lines.push('');
  lines.push('Saving Throws:');
  for (const s of saves.value) {
    const profMarker = s.isProf ? ' •' : '';
    const totalStr = s.total >= 0 ? '+' + s.total : String(s.total);
    const modStr = s.mod >= 0 ? '+' + s.mod : String(s.mod);
    lines.push(`${s.ability}${profMarker}: ${totalStr} (mod ${modStr}${s.isProf ? ` + prof ${prof >=0? '+'+prof:prof}` : ''})`);
  }

  lines.push('---------------------');
  const out = lines.join('\n');
  emit('finalize', out);
}

/* derived helper to detect final readiness for display */
const finalReady = computed(()=> (assigned.length || rolls.length));
</script>

<style scoped>
.card { min-height:64px; display:flex; flex-direction:column; justify-content:center; }
.pill { min-width:40px; text-align:center; }
</style>
