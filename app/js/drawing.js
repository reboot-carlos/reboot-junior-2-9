/**
 * drawing.js - Application dessin (basique) + Créateur d'image (avancé)
 */

/* ================================================
   APPLICATION DESSIN — Basique (crayon + gomme)
   ================================================ */

let canvasDessin = null;
let ctxDessin    = null;
let isDrawingD   = false;
let drawTool     = 'crayon';
let drawColor    = '#FF6B9D';
let drawSize     = 3;

function ouvrirDessin() {
  const modal   = document.getElementById('modal-dessin');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.add('active');
  if (overlay) overlay.classList.add('active');

  // Init canvas après que le modal soit visible (sinon offsetWidth = 0)
  setTimeout(() => {
    canvasDessin = document.getElementById('canvas-dessin');
    if (!canvasDessin) return;

    canvasDessin.width  = canvasDessin.offsetWidth  || 460;
    canvasDessin.height = canvasDessin.offsetHeight || 280;
    ctxDessin = canvasDessin.getContext('2d');

    // Lier les événements une seule fois
    if (!canvasDessin._drawingBound) {
      canvasDessin.addEventListener('mousedown', startDrawD);
      canvasDessin.addEventListener('mousemove', doDrawD);
      canvasDessin.addEventListener('mouseup',   () => { isDrawingD = false; });
      canvasDessin.addEventListener('mouseleave', () => { isDrawingD = false; });
      canvasDessin._drawingBound = true;
    }
  }, 15);
}

function fermerDessin() {
  const modal   = document.getElementById('modal-dessin');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function startDrawD(e) {
  isDrawingD = true;
  ctxDessin.beginPath();
  ctxDessin.moveTo(e.offsetX, e.offsetY);
}

function doDrawD(e) {
  if (!isDrawingD || !ctxDessin) return;
  ctxDessin.lineWidth   = drawSize;
  ctxDessin.lineCap     = 'round';
  ctxDessin.lineJoin    = 'round';
  ctxDessin.strokeStyle = drawTool === 'gomme' ? '#ffffff' : drawColor;
  ctxDessin.lineTo(e.offsetX, e.offsetY);
  ctxDessin.stroke();
}

function changerOutil(outil) {
  drawTool = outil;
  document.querySelectorAll('#modal-dessin .btn-tool').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('btn-' + outil);
  if (btn) btn.classList.add('active');
}

function telechargerDessin() {
  if (!canvasDessin) return;
  const a = document.createElement('a');
  a.href = canvasDessin.toDataURL('image/png');
  a.download = 'dessin-rosee.png';
  a.click();
}

function effacerDessin() {
  if (!ctxDessin || !canvasDessin) return;
  ctxDessin.clearRect(0, 0, canvasDessin.width, canvasDessin.height);
}

/* ================================================
   CRÉATEUR D'IMAGE — Avancé (5 outils + formes)
   ================================================ */

let canvasCreateur  = null;
let ctxCreateur     = null;
let isDrawingC      = false;
let creatorTool     = 'crayon';
let creatorColor    = '#FF6B9D';
let creatorSize     = 5;
let xStart          = 0;
let yStart          = 0;
let savedImageData  = null;

function ouvrirCreateurImage() {
  const modal   = document.getElementById('modal-createur-image');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.add('active');
  if (overlay) overlay.classList.add('active');

  setTimeout(() => {
    canvasCreateur = document.getElementById('canvas-createur-image');
    if (!canvasCreateur) return;

    canvasCreateur.width  = canvasCreateur.offsetWidth  || 620;
    canvasCreateur.height = canvasCreateur.offsetHeight || 360;
    ctxCreateur = canvasCreateur.getContext('2d');

    // Fond blanc initial
    ctxCreateur.fillStyle = '#ffffff';
    ctxCreateur.fillRect(0, 0, canvasCreateur.width, canvasCreateur.height);

    if (!canvasCreateur._drawingBound) {
      canvasCreateur.addEventListener('mousedown', startDrawC);
      canvasCreateur.addEventListener('mousemove', doDrawC);
      canvasCreateur.addEventListener('mouseup',   endDrawC);
      canvasCreateur.addEventListener('mouseleave', endDrawC);
      canvasCreateur._drawingBound = true;
    }
  }, 15);
}

function fermerCreateurImage() {
  const modal   = document.getElementById('modal-createur-image');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function changerOutilCreateur(outil) {
  creatorTool = outil;
  document.querySelectorAll('#modal-createur-image .btn-tool').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('btn-' + outil + '-createur');
  if (btn) btn.classList.add('active');
}

function startDrawC(e) {
  if (!ctxCreateur) return;
  isDrawingC = true;
  xStart = e.offsetX;
  yStart = e.offsetY;
  // Sauvegarder l'état du canvas pour la prévisualisation des formes
  savedImageData = ctxCreateur.getImageData(0, 0, canvasCreateur.width, canvasCreateur.height);

  if (creatorTool === 'crayon' || creatorTool === 'gomme') {
    ctxCreateur.beginPath();
    ctxCreateur.moveTo(xStart, yStart);
  }
}

function doDrawC(e) {
  if (!isDrawingC || !ctxCreateur) return;
  const x = e.offsetX;
  const y = e.offsetY;

  ctxCreateur.strokeStyle = creatorTool === 'gomme' ? '#ffffff' : creatorColor;
  ctxCreateur.lineWidth   = creatorSize;
  ctxCreateur.lineCap     = 'round';
  ctxCreateur.lineJoin    = 'round';

  if (creatorTool === 'crayon' || creatorTool === 'gomme') {
    ctxCreateur.lineTo(x, y);
    ctxCreateur.stroke();
  } else {
    // Restaurer l'état + dessiner la forme en prévisualisation live
    ctxCreateur.putImageData(savedImageData, 0, 0);
    ctxCreateur.beginPath();

    if (creatorTool === 'ligne') {
      ctxCreateur.moveTo(xStart, yStart);
      ctxCreateur.lineTo(x, y);
    } else if (creatorTool === 'rectangle') {
      ctxCreateur.rect(xStart, yStart, x - xStart, y - yStart);
    } else if (creatorTool === 'cercle') {
      const r = Math.hypot(x - xStart, y - yStart);
      ctxCreateur.arc(xStart, yStart, r, 0, 2 * Math.PI);
    }

    ctxCreateur.stroke();
  }
}

function endDrawC() {
  isDrawingC = false;
}

function telechargerImage() {
  if (!canvasCreateur) return;
  const a = document.createElement('a');
  a.href = canvasCreateur.toDataURL('image/png');
  a.download = 'creation-rosee.png';
  a.click();
}

function copierImageCreateur() {
  if (!canvasCreateur) return;
  canvasCreateur.toBlob(blob => {
    if (!blob) return;
    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      .then(() => alert('✅ Image copiée dans le presse-papiers !'))
      .catch(() => alert('❌ Copie non supportée par ce navigateur'));
  });
}

function effacerImageCreateur() {
  if (!ctxCreateur || !canvasCreateur) return;
  ctxCreateur.fillStyle = '#ffffff';
  ctxCreateur.fillRect(0, 0, canvasCreateur.width, canvasCreateur.height);
}
