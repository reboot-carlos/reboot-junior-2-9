/**
 * games.js - Jeu Snake + Menu des jeux
 */

/* ================================================
   JEU SNAKE
   ================================================ */

const GRID = 10;
const CELL = 25;

let serpent          = [];
let pomme            = { x: 3, y: 3 };
let direction        = { x: 1, y: 0 };
let prochainDirection = { x: 1, y: 0 };
let gameLoopId       = null;
let score            = 0;
let jeuActif         = false;

function getSnakeCtx() {
  const canvas = document.getElementById('canvas-serpent');
  if (!canvas) return null;
  canvas.width  = GRID * CELL;
  canvas.height = GRID * CELL;
  return canvas.getContext('2d');
}

function demarrerJeu() {
  const ctx = getSnakeCtx();
  if (!ctx) return;

  serpent           = [{ x: 5, y: 5 }];
  direction         = { x: 1, y: 0 };
  prochainDirection = { x: 1, y: 0 };
  score             = 0;
  jeuActif          = true;
  pomme = {
    x: Math.floor(Math.random() * GRID),
    y: Math.floor(Math.random() * GRID),
  };

  const scoreEl = document.getElementById('score-serpent');
  if (scoreEl) scoreEl.textContent = 'Score: 0';

  clearInterval(gameLoopId);
  gameLoopId = setInterval(() => boucleJeu(ctx), 100);
}

function boucleJeu(ctx) {
  direction = { ...prochainDirection };

  const tete = {
    x: serpent[0].x + direction.x,
    y: serpent[0].y + direction.y,
  };

  // Collision avec les murs
  if (tete.x < 0 || tete.x >= GRID || tete.y < 0 || tete.y >= GRID) {
    arreterJeu(ctx);
    return;
  }

  // Collision avec soi-même
  if (serpent.some(s => s.x === tete.x && s.y === tete.y)) {
    arreterJeu(ctx);
    return;
  }

  serpent.unshift(tete);

  // Manger la pomme
  if (tete.x === pomme.x && tete.y === pomme.y) {
    score++;
    const scoreEl = document.getElementById('score-serpent');
    if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    pomme = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } else {
    serpent.pop();
  }

  dessinerJeu(ctx);
}

function dessinerJeu(ctx) {
  // Fond
  ctx.fillStyle = '#1a3322';
  ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);

  // Grille légère
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, GRID * CELL);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(GRID * CELL, i * CELL);
    ctx.stroke();
  }

  // Pomme
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.roundRect(pomme.x * CELL + 2, pomme.y * CELL + 2, CELL - 4, CELL - 4, 4);
  ctx.fill();

  // Serpent
  serpent.forEach((segment, i) => {
    ctx.fillStyle = i === 0 ? '#FF6B9D' : '#FF9FB2';
    ctx.beginPath();
    ctx.roundRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2, 3);
    ctx.fill();
  });
}

function arreterJeu(ctx) {
  clearInterval(gameLoopId);
  jeuActif = false;

  // Récupérer le ctx si non fourni
  if (!ctx) {
    const canvas = document.getElementById('canvas-serpent');
    if (canvas) ctx = canvas.getContext('2d');
  }

  if (ctx) {
    // Écran GAME OVER
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px "Fredoka One", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', (GRID * CELL) / 2, (GRID * CELL) / 2 - 10);

    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Score final : ${score}`, (GRID * CELL) / 2, (GRID * CELL) / 2 + 18);
  }
}

/* ================================================
   MENU DES JEUX
   ================================================ */

function afficherMenuJeux() {
  // Arrêter le jeu en cours si actif
  if (jeuActif) arreterJeu();

  document.getElementById('jeu-serpent-container')?.classList.remove('actif');
  document.getElementById('menu-jeux')?.classList.add('actif');
}

function fermerMenuJeux() {
  if (jeuActif) arreterJeu();
  document.getElementById('menu-jeux')?.classList.remove('actif');
  document.getElementById('jeu-serpent-container')?.classList.remove('actif');
}

function demarrerSnake() {
  document.getElementById('menu-jeux')?.classList.remove('actif');
  document.getElementById('jeu-serpent-container')?.classList.add('actif');
  demarrerJeu();
}

function demarrerSubway() {
  alert('🏃 Subway Surfer — Bientôt disponible !');
}

function demarrerDoodleJump() {
  alert('⬆️ Doodle Jump — Bientôt disponible !');
}

/* ================================================
   CONTRÔLES CLAVIER
   ================================================ */

document.addEventListener('keydown', e => {
  if (!jeuActif) return;

  const map = {
    'ArrowUp':    { x: 0, y: -1 },
    'z':          { x: 0, y: -1 },
    'Z':          { x: 0, y: -1 },
    'ArrowDown':  { x: 0, y:  1 },
    's':          { x: 0, y:  1 },
    'S':          { x: 0, y:  1 },
    'ArrowLeft':  { x: -1, y: 0 },
    'q':          { x: -1, y: 0 },
    'Q':          { x: -1, y: 0 },
    'ArrowRight': { x:  1, y: 0 },
    'd':          { x:  1, y: 0 },
    'D':          { x:  1, y: 0 },
  };

  const newDir = map[e.key];
  if (!newDir) return;

  // Empêcher le demi-tour
  if (newDir.x !== -direction.x || newDir.y !== -direction.y) {
    prochainDirection = newDir;
  }

  // Empêcher le scroll avec les flèches
  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
  }
});
