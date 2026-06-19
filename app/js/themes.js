/**
 * themes.js — Sélecteur de thème couleur (12 thèmes)
 * Change les CSS variables ET la zone de chat dynamiquement.
 */

const THEMES = [
  { nom: 'Rose',      primary: '#FF6B9D', secondary: '#FF9FB2', accent: '#FFD1DC' },
  { nom: 'Bleu',      primary: '#4A90E2', secondary: '#6CB4F0', accent: '#A8D4FF' },
  { nom: 'Vert',      primary: '#2ECC71', secondary: '#5DDE8A', accent: '#A9EFB5' },
  { nom: 'Orange',    primary: '#E67E22', secondary: '#F39C12', accent: '#F8C471' },
  { nom: 'Violet',    primary: '#9B59B6', secondary: '#C39BD3', accent: '#E8DAEF' },
  { nom: 'Cyan',      primary: '#1ABC9C', secondary: '#48C9B0', accent: '#ABEBC6' },
  { nom: 'Rouge',     primary: '#E74C3C', secondary: '#EC7063', accent: '#F5B7B1' },
  { nom: 'Jaune',     primary: '#F1C40F', secondary: '#F8D88B', accent: '#FCE5A5' },
  { nom: 'Rose Vif',  primary: '#FF1493', secondary: '#FF69B4', accent: '#FFB6D9' },
  { nom: 'Turquoise', primary: '#00CED1', secondary: '#7FFFD4', accent: '#B0F0F7' },
  { nom: 'Indigo',    primary: '#4B0082', secondary: '#9370DB', accent: '#D8BFD8' },
  { nom: 'Lime',      primary: '#32CD32', secondary: '#66BB6A', accent: '#C8E6C9' },
];

function _hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyColorTheme(theme) {
  const root = document.documentElement;

  // ── CSS variables (cascade to header, buttons, etc.) ──
  root.style.setProperty('--primary',     theme.primary);
  root.style.setProperty('--secondary',   theme.secondary);
  root.style.setProperty('--accent',      theme.accent);
  root.style.setProperty('--rouge-clair', theme.secondary);
  root.style.setProperty('--rose-pastel', theme.accent);

  // ── Zone de chat : fond + bordure + ombre ──────────────
  const chatZone = document.getElementById('chat-zone');
  if (chatZone) {
    chatZone.style.background = `linear-gradient(135deg,
      ${_hexToRgba(theme.accent,     0.75)} 0%,
      ${_hexToRgba(theme.secondary,  0.60)} 50%,
      ${_hexToRgba(theme.primary,    0.40)} 100%)`;
    chatZone.style.borderColor = theme.primary;
    chatZone.style.boxShadow =
      `0 0 20px ${_hexToRgba(theme.primary, 0.35)},
       0 0 50px ${_hexToRgba(theme.primary, 0.15)}`;
  }

  // ── Persistance ────────────────────────────────────────
  if (typeof saveSetting === 'function') saveSetting('theme_primary', theme.primary);

  // ── Marquer le swatch actif ────────────────────────────
  document.querySelectorAll('.theme-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.nom === theme.nom);
  });
}

function renderThemePalette(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  THEMES.forEach(theme => {
    const btn = document.createElement('button');
    btn.className = 'theme-swatch';
    btn.dataset.nom = theme.nom;
    btn.title = theme.nom;
    btn.setAttribute('aria-label', `Thème ${theme.nom}`);
    btn.style.cssText =
      `background:${theme.primary};width:100%;aspect-ratio:1;border-radius:50%;` +
      `border:2px solid rgba(255,255,255,0.4);cursor:pointer;` +
      `transition:transform .2s,outline .2s,border-color .2s;padding:0;display:block;`;
    btn.addEventListener('click', () => applyColorTheme(theme));
    container.appendChild(btn);
  });
}

function initThemes() {
  renderThemePalette('palette-couleurs-sidebar');
  if (typeof getSetting === 'function') {
    const saved = THEMES.find(t => t.primary === getSetting('theme_primary', ''));
    if (saved) applyColorTheme(saved);
  }
}
