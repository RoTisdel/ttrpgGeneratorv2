<template>
  <div class="dice-roller" :class="{ playing: play }" :style="hostStyle">
    <div
      v-for="i in count"
      :key="i"
      class="die"
      :style="dieStyle"
      :aria-hidden="!play"
    >
      <svg viewBox="0 0 100 100" class="die-svg" :class="faceClass">
        <rect x="5" y="5" width="90" height="90" rx="14" ry="14" class="die-bg" />
        <g v-if="faceIsPips(currentFaceFor(i-1))" v-html="pipsHtmlFor(currentFaceFor(i-1))" class="pips" :style="{ fill: 'var(--pip)' }" />
        <g v-else class="numeric-face">
          <text x="50" y="55" text-anchor="middle" dominant-baseline="middle" :style="{ fill: 'var(--pip)', fontSize: numericFontSize }">
            {{ currentFaceFor(i-1) }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, toRef } from 'vue';

const props = defineProps({
  count: { type: Number, default: 6 },
  duration: { type: Number, default: 900 }, // ms animation length
  play: { type: Boolean, default: false },
  settleDelay: { type: Number, default: 120 }, // ms final settle visible to parent
  theme: {
    type: Object,
    default: () => ({
      accent: '#7c3aed',
      faceBg: '#0b1828',
      pip: '#e6eef8',
      glow: '0 8px 24px rgba(124,58,237,0.2)'
    })
  },
  // sides (how many faces the die has, e.g., 4,6,8,10,12,20,100)
  sides: { type: Number, default: 6 },
  values: { type: Array, default: () => [] }
});
const emit = defineEmits(['finished']);

// expose commonly used props to the template
const play = toRef(props, 'play');
const count = toRef(props, 'count');
const duration = toRef(props, 'duration');

// pip SVG templates for common 1..6 faces (unchanged)
const pipsTemplates = {
  1: '<circle cx="50" cy="50" r="6"/>',
  2: '<circle cx="30" cy="35" r="6"/><circle cx="70" cy="65" r="6"/>',
  3: '<circle cx="30" cy="35" r="6"/><circle cx="50" cy="50" r="6"/><circle cx="70" cy="65" r="6"/>',
  4: '<circle cx="30" cy="30" r="6"/><circle cx="70" cy="30" r="6"/><circle cx="30" cy="70" r="6"/><circle cx="70" cy="70" r="6"/>',
  5: '<circle cx="30" cy="30" r="6"/><circle cx="70" cy="30" r="6"/><circle cx="50" cy="50" r="6"/><circle cx="30" cy="70" r="6"/><circle cx="70" cy="70" r="6"/>',
  6: '<circle cx="25" cy="25" r="6"/><circle cx="25" cy="50" r="6"/><circle cx="25" cy="75" r="6"/><circle cx="75" cy="25" r="6"/><circle cx="75" cy="50" r="6"/><circle cx="75" cy="75" r="6"/>'
};

// per-die rolling indices (current shown face numbers)
const rollingFaces = ref(Array.from({ length: count.value }, () => 1));

// recompute array when count changes (keeps existing ones when growing/shrinking)
watch(count, (nv) => {
  const arr = rollingFaces.value.slice(0, nv);
  while (arr.length < nv) arr.push(1);
  rollingFaces.value = arr;
});

// helper: return numeric face for an index (used by template)
function currentFaceFor(index) {
  return rollingFaces.value[index] ?? 1;
}

const isRunning = ref(false);
watch(play, async (val) => {
  if (!val) return;
  if (isRunning.value) return;
  isRunning.value = true;

  const start = performance.now();
  const end = start + duration.value;
  const sides = Math.max(2, Math.floor(props.sides) || 6);

  // rolling loop: update every die each tick (keeps them visually separate)
  while (performance.now() < end && play.value) {
    for (let i = 0; i < rollingFaces.value.length; i++) {
      // show random face from 1..sides while playing
      rollingFaces.value[i] = 1 + Math.floor(Math.random() * sides);
    }
    const remaining = Math.max(0, end - performance.now());
    const pace = Math.max(20, Math.min(150, Math.floor(remaining / 8)));
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, pace));
    if (!play.value) break;
  }

  if (!play.value) {
    isRunning.value = false;
    return;
  }

  // Determine final faces:
  // If props.values is present and has enough entries, map them to faces.
  // Otherwise pick random face per die.
  if (Array.isArray(props.values) && props.values.length >= count.value) {
    for (let i = 0; i < rollingFaces.value.length; i++) {
      const v = Number(props.values[i]);
      // convert 0..100 -> 1..sides (same mapping used by parent)
      const faceFloat = 1 + (Math.max(0, Math.min(100, v)) / 100) * (sides - 1);
      rollingFaces.value[i] = Math.max(1, Math.min(sides, Math.round(faceFloat)));
    }
  } else {
    for (let i = 0; i < rollingFaces.value.length; i++) {
      rollingFaces.value[i] = 1 + Math.floor(Math.random() * sides);
    }
  }

  await new Promise((r) => setTimeout(r, props.settleDelay));
  emit('finished');
  isRunning.value = false;
});

// helper: decide if we should render pips or numeric label
function faceIsPips(face) {
  return props.sides === 6 && face >= 1 && face <= 6;
}

// return pip html for faces 1..6
function pipsHtmlFor(face) {
  return pipsTemplates[face] ?? '';
}

// numeric font size calculation (smaller for 3-digit like d100)
const numericFontSize = computed(() => {
  // if sides can be large (100), adjust font-size
  if (props.sides >= 100) return '22px';
  if (props.sides >= 20) return '22px';
  return '28px';
});

// style object that always defines CSS variables (defaults if theme lacks them)
const hostStyle = computed(() => {
  const t = props.theme || {};
  return {
    '--accent': t.accent ?? '#7c3aed',
    '--die-bg': t.faceBg ?? '#1c1c1c',
    '--pip': t.pip ?? '#ffffff',
    '--glow': t.glow ?? '0 8px 20px rgba(0,0,0,0.25)'
  };
});

const dieStyle = computed(() => ({
  animationDuration: `${duration.value}ms`
}));

const faceClass = computed(() => '');

</script>

<style scoped>
.dice-roller {
  display:flex;
  gap:10px;
  justify-content:center;
  align-items:center;
  pointer-events:none;
  position:absolute;
  inset:0;
  z-index:40;
}
.dice-roller .die {
  width:48px;
  height:48px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transform-origin:center;
  transition:transform 260ms ease, opacity 200ms ease;
  opacity:1;
}
.dice-roller:not(.playing) .die { opacity:0; transform: translateY(-6px) scale(0.9); pointer-events:none; }

.die-svg { width:100%; height:100%; display:block; }
.die-bg {
  fill: var(--die-bg, #222);
  stroke: var(--accent, #999);
  stroke-width: 2;
  /* SVG drop-shadow works reliably for the <rect> */
  filter: drop-shadow(var(--glow, 0 8px 20px rgba(0,0,0,0.25)));
}
.pips circle {
  fill: var(--pip, #fff);
}
.numeric-face text {
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  font-weight: 700;
  fill: var(--pip, #fff);
}

/* optional spin while playing */
.dice-roller.playing .die {
  animation: bob 900ms ease-in-out infinite;
}
@keyframes bob {
  0% { transform: translateY(0) rotate(0deg) }
  25% { transform: translateY(-6px) rotate(6deg) }
  50% { transform: translateY(0) rotate(0deg) }
  75% { transform: translateY(6px) rotate(-4deg) }
  100% { transform: translateY(0) rotate(0deg) }
}
</style>
