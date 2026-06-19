/**
 * icons.js - Sélecteur d'icône/emoji pour le logo du chatbot
 */

const ICONES_DISPONIBLES = [
  '💕', '✨', '🌹', '💫', '🎀', '🎨',
  '🌈', '💡', '⭐', '🎭', '🔮', '🎪',
  '🎉', '🎊', '🌟', '💖',
];

function ouvrirSelecteurIcone() {
  const grid = document.getElementById('grille-icones');
  if (grid) {
    grid.innerHTML = '';
    ICONES_DISPONIBLES.forEach(icone => {
      const btn = document.createElement('button');
      btn.textContent = icone;
      btn.title = icone;
      btn.setAttribute('aria-label', `Choisir ${icone}`);
      btn.addEventListener('click', () => changerIcone(icone));
      grid.appendChild(btn);
    });
  }

  const modal = document.getElementById('modal-icone');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function fermerSelecteurIcone() {
  const modal = document.getElementById('modal-icone');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function changerIcone(icone) {
  const el = document.getElementById('logo-emoji');
  if (el) el.textContent = icone;

  if (typeof saveSetting === 'function') {
    saveSetting('logoEmoji', icone);
  }

  fermerSelecteurIcone();
}

function validerIconeCustom() {
  const input = document.getElementById('input-icone-custom');
  if (!input) return;
  const val = input.value.trim();
  if (val) {
    // Prendre le premier graphème (emoji complet)
    const premier = [...val][0];
    changerIcone(premier);
    input.value = '';
  }
}

function initIcons() {
  // Restaurer l'icône sauvegardée
  const saved = typeof getSetting === 'function'
    ? getSetting('logoEmoji', '💕')
    : '💕';
  const el = document.getElementById('logo-emoji');
  if (el) el.textContent = saved;
}
