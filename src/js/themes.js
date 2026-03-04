export const THEMES = {
  default: {
    name: 'default',
    '--bg': '#0f172a',
    '--panel': '#0b1828',
    '--muted': '#9aa6c0',
    '--accent': '#7c3aed',
    '--white': '#e6eef8',
    // dice-specific helpers (optional - convenient to pass into DiceRoller)
    die: {
      accent: '#7c3aed',
      faceBg: '#0b1828',
      pip: '#e6eef8',
      glow: '0 8px 24px rgba(124,58,237,0.12)'
    }
  },

  // D&D
  dnd: {
    name: 'dnd',
    '--bg': '#101820',
    '--panel': '#1e2a2f',
    '--muted': '#c8c3b8',
    '--accent': '#a62828',
    '--white': '#f3efe6',

    die: {
      accent: '#1b1b1b',
      faceBg: '#a62828',
      pip: '#e6dcc7',
      glow: '0 8px 20px rgba(166,40,40,0.35)'
    }
  },

  // Cyberpunk Red: neon / dark
  cpr: {
    name: 'cpr',
    '--bg': '#fb0a26',
    '--panel': '#2e3133',
    '--muted': '#9be3ff',
    '--accent': '#fb0a26',
    '--white': '#eaf6ff',
    die: {
      accent: '#ff2d9c',
      faceBg: '#0a0720',
      pip: '#9be3ff',
      glow: '0 10px 30px rgba(255,45,156,0.35)'
    }
  },

  // Call of Cthulhu: old paper (classic)
  cocPaper: {
    name: 'cocPaper',
    '--bg': '#0b0a05',
    '--panel': '#1a1206',
    '--muted': '#bda27a',
    '--accent': '#9c6b2f',
    '--white': '#f3ead6',
    die: {
      accent: '#9c6b2f',
      faceBg: '#e8dcc1',
      pip: '#2e2314',
      glow: '0 10px 24px rgba(156,107,47,0.08)'
    }
  },

  // Call of Cthulhu: eldritch (green + purple vibe)
  cocEldritch: {
    name: 'cocEldritch',
    '--bg': '#bda27a',
    '--panel': '#19221a',
    '--muted': '#9fbf9a',
    '--accent': '#6e2e8a',
    '--white': '#f3ead6',
    die: {
      accent: '#6e2e8a',
      faceBg: '#dfe8d8',
      pip: '#1f6b3a',
      glow: '0 12px 28px rgba(31,107,58,0.35)'
    }
  }
};

/**
 * Apply a theme to :root by setting CSS custom properties
 * @param {object|string} theme - theme object (one of THEMES values) OR a theme key
 */
export function applyTheme(theme) {
  const t = typeof theme === 'string' ? THEMES[theme] || THEMES.default : (theme || THEMES.default);
  const root = document.documentElement;

  // set CSS variables
  Object.entries(t).forEach(([k, v]) => {
    if (k.startsWith('--')) {
      root.style.setProperty(k, v);
    }
  });

  // also set a data-theme attribute (optional; helpful for CSS selectors)
  root.setAttribute('data-theme', (t.name || 'custom'));

  return t;
}

/**
 * Convenience to extract a dice theme object for components like DiceRoller
 * Usage: <DiceRoller :theme="diceThemeFor('cocPaper')" />
 */
export function diceThemeFor(keyOrTheme) {
  const t = typeof keyOrTheme === 'string' ? THEMES[keyOrTheme] || THEMES.default : (keyOrTheme || THEMES.default);
  return (t && t.die) ? t.die : THEMES.default.die;
}
