<template>
  <div class="app">
    <div class="header">
      <div class="brand">TTRPG Stat Generator</div>
      <div class="small-muted">D&D • Cyberpunk Red • Call of Cthulhu — Demo</div>
    </div>

    <div class="menu panel">
      <div class="row">
        <button class="btn" @click="view='menu'">Main Menu</button>
        <button class="btn" @click="setView('dnd')">D&D</button>
        <button class="btn" @click="setView('cpr')">Cyberpunk Red</button>
        <button class="btn" @click="setView('coc')">Call of Cthulhu</button>
        <button class="btn" @click="setView('resources')">Resources</button>
      </div>
    </div>

    <div v-if="view==='menu'" class="panel card">
      <h3>Main Menu</h3>
      <p class="small-muted">Choose a system above. Finalized characters are saved to "Last Summary".</p>

      <div style="margin-top:12px" class="row">
        <button class="btn" @click="view = 'dnd'">Start D&D</button>
        <button class="btn" @click="view = 'cpr'">Start Cyberpunk</button>
        <button class="btn" @click="view = 'coc'">Start CoC</button>
      </div>
    </div>

    <div v-if="view==='dnd'">
      <DndPanel @finalize="handleFinalize" @theme-change="applyTheme" />
    </div>

    <div v-if="view==='cpr'">
      <CprPanel @finalize="handleFinalize" @theme-change="applyTheme" />
    </div>

    <div v-if="view==='coc'">
      <CocPanel @finalize="handleFinalize" @theme-change="applyTheme" />
    </div>
    <div v-if="view==='resources'">
      <resources-panel @theme-change="applyTheme"/>
    </div>
    <div class="panel" style="margin-top:12px">
      <div class="row" style="align-items:center;">
        <div class="col">
          <div class="small-bold">Last Summary:</div>
          <div v-if="lastSummary" class="card" style="white-space:pre-wrap; margin-top:8px;">{{ lastSummary }}</div>
          <div v-else class="small-muted" style="margin-top:8px">No character finalized yet.</div>
        </div>

        <div style="min-width:220px; display:flex; gap:8px; align-items:center;">
          <button class="btn" @click="copyLast" :disabled="!lastSummary">Copy</button>
          <button class="btn" @click="downloadLast" :disabled="!lastSummary">Download</button>
          <button class="btn" @click="clearLast" :disabled="!lastSummary">Clear</button>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="small-muted">This is a frontend-only starter — to save a character download the JSON after creation.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import DndPanel from './panels/DndPanel.vue';
import CprPanel from './panels/CprPanel.vue';
import CocPanel from './panels/CocPanel.vue';
import { applyTheme } from './js/themes.js';
import resourcesPanel from './panels/resourcesPanel.vue';

/* ---- state ---- */
const view = ref('menu');
const lastSummary = ref(null);

/* ---- react to view changes and set theme using the imported helper ---- */
watch(view, (nv) => {
  if (nv === 'dnd') applyTheme('dnd');
  else if (nv === 'cpr') applyTheme('cpr');
  else if (nv === 'coc') applyTheme('cocEldritch');
  else applyTheme('default');
});

/* initialize theme once on mount */
onMounted(() => applyTheme('default'));

/* ---- exported helpers called by panels ---- */
async function handleFinalize(summary) {
  lastSummary.value = summary;
  window.alert('Character finalized — saved to Last Summary.');
}

/* Panels can call applyTheme('dnd'|'cpr'|'coc') to change site colors */
function setView(v) {
  view.value = v;
  // proactively apply theme (watch also handles it — this is immediate)
  if (v === 'dnd') applyTheme('dnd');
  else if (v === 'cpr') applyTheme('cpr');
  else if (v === 'coc') applyTheme('cocEldritch');
  else applyTheme('default');
}

/* ---- Last summary utilities ---- */
function copyLast() {
  if (!lastSummary.value) return;
  navigator.clipboard?.writeText(lastSummary.value).then(() => {
    alert('Copied to clipboard.');
  }).catch(() => {
    alert('Copy failed — browser may block clipboard access.');
  });
}

function downloadLast() {
  if (!lastSummary.value) return;
  const blob = new Blob([lastSummary.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'character.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function clearLast() {
  lastSummary.value = null;
  alert('Last summary cleared.');
}
</script>
