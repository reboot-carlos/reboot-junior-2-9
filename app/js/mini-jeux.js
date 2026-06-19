/**
 * mini-jeux.js — Devinette & Jeux de mots interactifs
 */

// ══════════════════════════════════════════════════════════════════════════════
//  DEVINETTE
// ══════════════════════════════════════════════════════════════════════════════

let _devScore      = 0;
let _devTotal      = 0;
let _devReponse    = '';   // réponse correcte stockée côté client
let _devIndice     = '';
let _devExplication = '';
let _devDiff       = 'Moyen';
let _devEnCours    = false;

function demarrerDevinette() {
  document.getElementById('menu-jeux')?.classList.remove('actif');
  document.getElementById('jeu-devinette-container')?.classList.add('actif');
  _devScore = 0;
  _devTotal = 0;
  _devEnCours = false;
  _majScoreDevinette();
  _resetDevinette();
  _bindDevinettePills();
}

function _bindDevinettePills() {
  document.querySelectorAll('#dev-diff-pills .jeu-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#dev-diff-pills .jeu-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _devDiff = btn.dataset.val;
    });
  });
  document.getElementById('btn-nouvelle-devinette')?.addEventListener('click', _chargerDevinette);
  document.getElementById('btn-valider-dev')?.addEventListener('click', _validerDevinette);
  document.getElementById('btn-indice-dev')?.addEventListener('click', _montrerIndice);
  document.getElementById('dev-reponse')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _validerDevinette();
  });
}

function _resetDevinette() {
  const texte    = document.getElementById('dev-texte');
  const inputZ   = document.getElementById('dev-input-zone');
  const feedback = document.getElementById('dev-feedback');
  const loading  = document.getElementById('dev-loading');
  if (texte)    texte.textContent = 'Clique sur "Nouvelle devinette" pour commencer ! 🎲';
  if (inputZ)   inputZ.style.display = 'none';
  if (feedback) { feedback.style.display = 'none'; feedback.textContent = ''; }
  if (loading)  loading.style.display = 'none';
}

function _majScoreDevinette() {
  const s = document.getElementById('dev-score');
  const t = document.getElementById('dev-total');
  if (s) s.textContent = _devScore;
  if (t) t.textContent = _devTotal;
}

async function _chargerDevinette() {
  if (_devEnCours) return;

  const texte    = document.getElementById('dev-texte');
  const inputZ   = document.getElementById('dev-input-zone');
  const feedback = document.getElementById('dev-feedback');
  const loading  = document.getElementById('dev-loading');
  const input    = document.getElementById('dev-reponse');

  if (loading)  loading.style.display = 'block';
  if (texte)    texte.textContent = '';
  if (feedback) { feedback.style.display = 'none'; feedback.textContent = ''; }
  if (inputZ)   inputZ.style.display = 'none';
  if (input)    input.value = '';

  try {
    const resp = await fetch('/devinette', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulte: _devDiff }),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    _devReponse     = (data.reponse     || '').toLowerCase().trim();
    _devIndice      = data.indice        || '';
    _devExplication = data.explication   || '';
    _devEnCours     = true;
    _devTotal++;
    _majScoreDevinette();

    if (loading) loading.style.display = 'none';
    if (texte)   texte.textContent = data.devinette || '❓ Erreur de génération';
    if (inputZ)  inputZ.style.display = 'flex';
    if (input) { input.value = ''; input.focus(); }

  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (texte)   texte.textContent = '❌ Erreur de connexion. Réessaie !';
  }
}

function _validerDevinette() {
  if (!_devEnCours) return;
  const input    = document.getElementById('dev-reponse');
  const feedback = document.getElementById('dev-feedback');
  const inputZ   = document.getElementById('dev-input-zone');
  if (!input || !feedback) return;

  const tentative = input.value.trim().toLowerCase();
  if (!tentative) { input.focus(); return; }

  _devEnCours = false;

  // Comparaison souple (contient la réponse ou la réponse la contient)
  const correct = tentative === _devReponse
    || tentative.includes(_devReponse)
    || _devReponse.includes(tentative);

  if (correct) {
    _devScore++;
    _majScoreDevinette();
    feedback.className = 'dev-feedback dev-correct';
    feedback.innerHTML = `✅ <strong>Bravo !</strong> C'était bien <em>${_devReponse}</em>.<br>${_devExplication}`;
  } else {
    feedback.className = 'dev-feedback dev-wrong';
    feedback.innerHTML = `❌ Pas tout à fait… La réponse était <em>${_devReponse}</em>.<br>💡 ${_devExplication}`;
  }

  feedback.style.display = 'block';
  if (inputZ) inputZ.style.display = 'none';
}

function _montrerIndice() {
  const feedback = document.getElementById('dev-feedback');
  if (!feedback || !_devIndice) return;
  feedback.className = 'dev-feedback dev-indice';
  feedback.innerHTML = `💡 Indice : <em>${_devIndice}</em>`;
  feedback.style.display = 'block';
}

function fermerDevinette() {
  document.getElementById('jeu-devinette-container')?.classList.remove('actif');
  afficherMenuJeux();
}


// ══════════════════════════════════════════════════════════════════════════════
//  JEUX DE MOTS
// ══════════════════════════════════════════════════════════════════════════════

let _motsScore   = 0;
let _motsTotal   = 0;
let _motsReponses = [];  // liste des réponses valides
let _motsType    = 'Anagramme';
let _motsEnCours = false;

function demarrerJeuxMots() {
  document.getElementById('menu-jeux')?.classList.remove('actif');
  document.getElementById('jeu-mots-container')?.classList.add('actif');
  _motsScore = 0;
  _motsTotal = 0;
  _motsEnCours = false;
  _majScoreMots();
  _resetJeuxMots();
  _bindMotsPills();
}

function _bindMotsPills() {
  document.querySelectorAll('#mots-type-pills .jeu-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mots-type-pills .jeu-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _motsType = btn.dataset.val;
    });
  });
  document.getElementById('btn-nouveau-mot')?.addEventListener('click', _chargerJeuMots);
  document.getElementById('btn-valider-mots')?.addEventListener('click', _validerJeuMots);
  document.getElementById('btn-indice-mots')?.addEventListener('click', _montrerIndiceMots);
  document.getElementById('mots-reponse')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _validerJeuMots();
  });
}

function _resetJeuxMots() {
  const enonce   = document.getElementById('mots-enonce');
  const inputZ   = document.getElementById('mots-input-zone');
  const feedback = document.getElementById('mots-feedback');
  const loading  = document.getElementById('mots-loading');
  if (enonce)   enonce.textContent = 'Choisis un type de jeu et clique sur "Jouer" ! 🔤';
  if (inputZ)   inputZ.style.display = 'none';
  if (feedback) { feedback.style.display = 'none'; feedback.textContent = ''; }
  if (loading)  loading.style.display = 'none';
}

function _majScoreMots() {
  const s = document.getElementById('mots-score');
  const t = document.getElementById('mots-total');
  if (s) s.textContent = _motsScore;
  if (t) t.textContent = _motsTotal;
}

async function _chargerJeuMots() {
  if (_motsEnCours) return;

  const enonce   = document.getElementById('mots-enonce');
  const inputZ   = document.getElementById('mots-input-zone');
  const feedback = document.getElementById('mots-feedback');
  const loading  = document.getElementById('mots-loading');
  const input    = document.getElementById('mots-reponse');
  const label    = document.getElementById('mots-label-reponse');

  if (loading)  loading.style.display = 'block';
  if (enonce)   enonce.textContent = '';
  if (feedback) { feedback.style.display = 'none'; feedback.textContent = ''; }
  if (inputZ)   inputZ.style.display = 'none';
  if (input)    input.value = '';

  // Adapter le label selon le type
  const labels = {
    Anagramme:     '🔤 Quel mot se cache ici ?',
    Rime:          '🎵 Propose un mot qui rime :',
    'Mot mystère': '🔍 Quel est ce mot ?',
    Calembour:     '😄 Complète le jeu de mots :',
  };
  if (label) label.textContent = labels[_motsType] || '💬 Ta réponse :';

  try {
    const resp = await fetch('/jeu-mots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type_jeu: _motsType }),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    // Stocker toutes les réponses valides (séparées par "/" dans la réponse)
    _motsReponses = (data.reponse || '')
      .toLowerCase().split('/').map(r => r.trim()).filter(Boolean);
    _motsEnCours = true;
    _motsTotal++;
    _majScoreMots();

    if (loading) loading.style.display = 'none';
    if (enonce)  enonce.textContent = data.enonce || '❓';
    if (inputZ)  inputZ.style.display = 'flex';
    if (input) { input.value = ''; input.focus(); }

    // Stocker l'indice et l'explication globalement
    window._motsIndice      = data.indice      || '';
    window._motsExplication = data.explication || '';

  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (enonce)  enonce.textContent = '❌ Erreur de connexion. Réessaie !';
  }
}

function _validerJeuMots() {
  if (!_motsEnCours) return;
  const input    = document.getElementById('mots-reponse');
  const feedback = document.getElementById('mots-feedback');
  const inputZ   = document.getElementById('mots-input-zone');
  if (!input || !feedback) return;

  const tentative = input.value.trim().toLowerCase();
  if (!tentative) { input.focus(); return; }

  _motsEnCours = false;

  const correct = _motsReponses.some(r =>
    tentative === r || tentative.includes(r) || r.includes(tentative)
  );

  const bonneRep = _motsReponses[0] || '?';
  if (correct) {
    _motsScore++;
    _majScoreMots();
    feedback.className = 'dev-feedback dev-correct';
    feedback.innerHTML = `✅ <strong>Excellent !</strong> "${_motsReponses[0]}" — c'est ça !<br>${window._motsExplication}`;
  } else {
    feedback.className = 'dev-feedback dev-wrong';
    feedback.innerHTML = `❌ Raté ! La réponse était <em>${bonneRep}</em>.<br>💡 ${window._motsExplication}`;
  }

  feedback.style.display = 'block';
  if (inputZ) inputZ.style.display = 'none';
}

function _montrerIndiceMots() {
  const feedback = document.getElementById('mots-feedback');
  if (!feedback) return;
  feedback.className = 'dev-feedback dev-indice';
  feedback.innerHTML = `💡 Indice : <em>${window._motsIndice || 'Réfléchis encore...'}</em>`;
  feedback.style.display = 'block';
}

function fermerJeuxMots() {
  document.getElementById('jeu-mots-container')?.classList.remove('actif');
  afficherMenuJeux();
}
