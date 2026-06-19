/**
 * planning.js — Générateur de planning de révision personnalisé
 */

// ── État ──────────────────────────────────────────────────────────────────────
let _planningExams    = [];
let _planningHeures   = '2';
let _planningJours    = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

// ── Ouvrir / Fermer ───────────────────────────────────────────────────────────
function ouvrirPlanning() {
  const modal   = document.getElementById('modal-planning');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
  _renderExams();
}

function fermerPlanning() {
  document.getElementById('modal-planning')?.classList.remove('active');
  document.getElementById('modal-overlay')?.classList.remove('active');
}

// ── Ajouter / supprimer un examen ─────────────────────────────────────────────
function _addExam() {
  _planningExams.push({ matiere: '', date: '', maitrise: 'Quelques notions', type: 'Contrôle' });
  _renderExams();
  setTimeout(() => {
    const inputs = document.querySelectorAll('.planning-exam-card .pi-matiere');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 60);
}

function _renderExams() {
  const container = document.getElementById('planning-exams-list');
  if (!container) return;

  if (_planningExams.length === 0) {
    container.innerHTML = '<p class="planning-empty">Clique sur <strong>+ Ajouter</strong> pour saisir tes examens 👆</p>';
    return;
  }

  container.innerHTML = _planningExams.map((ex, i) => `
    <div class="planning-exam-card" data-idx="${i}">
      <div class="planning-exam-fields">
        <input  class="planning-input pi-matiere" type="text"  placeholder="Matière (ex: Maths)"
                value="${_esc(ex.matiere)}" data-i="${i}" data-f="matiere" />
        <input  class="planning-input pi-date"    type="date"  value="${_esc(ex.date)}"
                data-i="${i}" data-f="date" />
        <select class="planning-select" data-i="${i}" data-f="maitrise">
          ${_opt(['😰 Je suis perdu','🤔 Quelques notions','😊 À moitié prêt','💪 Bien préparé'], ex.maitrise)}
        </select>
        <select class="planning-select" data-i="${i}" data-f="type">
          ${_opt(['📝 Contrôle','📚 Examen','🎤 Oral','🏠 DM'], ex.type)}
        </select>
      </div>
      <button class="planning-remove" data-rm="${i}" aria-label="Supprimer">✕</button>
    </div>
  `).join('');

  // Binding événements
  container.querySelectorAll('.planning-input').forEach(el => {
    el.addEventListener('input',  e => _updateExam(e));
    el.addEventListener('change', e => _updateExam(e));
  });
  container.querySelectorAll('.planning-select').forEach(el => {
    el.addEventListener('change', e => _updateExam(e));
  });
  container.querySelectorAll('.planning-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      _planningExams.splice(parseInt(btn.dataset.rm), 1);
      _renderExams();
    });
  });
}

function _updateExam(e) {
  const i = parseInt(e.target.dataset.i);
  const f = e.target.dataset.f;
  // Nettoyer le préfixe emoji des select
  _planningExams[i][f] = e.target.value.replace(/^[^\s]+\s/, '');
}

function _opt(options, current) {
  return options.map(o => {
    const val   = o.replace(/^[^\s]+\s/, '');
    const sel   = val === current ? 'selected' : '';
    return `<option value="${val}" ${sel}>${o}</option>`;
  }).join('');
}

function _esc(s) { return (s || '').replace(/"/g, '&quot;'); }

// ── Pills heures & jours ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Heures
  document.querySelectorAll('#planning-hours-pills .planning-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#planning-hours-pills .planning-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _planningHeures = btn.dataset.val;
    });
  });

  // Jours (multi-sélect toggle)
  document.querySelectorAll('#planning-days-pills .planning-day-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const day = btn.dataset.day;
      if (btn.classList.contains('active')) {
        if (!_planningJours.includes(day)) _planningJours.push(day);
      } else {
        _planningJours = _planningJours.filter(d => d !== day);
      }
    });
  });

  // Bouton sidebar (backup event listener)
  document.querySelectorAll('[data-open-planning]').forEach(btn => {
    btn.addEventListener('click', ouvrirPlanning);
  });
});

// ── Générer le planning ───────────────────────────────────────────────────────
async function genererPlanning() {
  const examsValides = _planningExams.filter(ex => ex.matiere.trim() && ex.date.trim());

  if (examsValides.length === 0) {
    const list = document.getElementById('planning-exams-list');
    if (list) {
      list.style.outline = '2px solid #E74C3C';
      setTimeout(() => { list.style.outline = ''; }, 2000);
    }
    alert('⚠️ Ajoute au moins un contrôle avec une matière et une date !');
    return;
  }
  if (_planningJours.length === 0) {
    alert('⚠️ Sélectionne au moins un jour disponible !');
    return;
  }

  const btn     = document.getElementById('btn-generer-planning');
  const loading = document.getElementById('planning-loading');
  const result  = document.getElementById('planning-result');

  if (btn)     { btn.disabled = true; btn.textContent = '⏳ Création en cours...'; }
  if (loading) loading.style.display = 'flex';
  if (result)  result.style.display  = 'none';

  const notes = document.getElementById('planning-notes')?.value.trim() || '';

  try {
    const resp = await fetch('/planning', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examens:          examsValides,
        heures_par_jour:  parseInt(_planningHeures),
        jours_disponibles: _planningJours,
        notes,
      }),
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    const out = document.getElementById('planning-output');
    if (out) out.textContent = data.planning;
    if (loading) loading.style.display = 'none';
    if (result)  { result.style.display = 'block'; result.scrollIntoView({ behavior: 'smooth' }); }

  } catch (err) {
    console.error('Planning error:', err);
    if (loading) loading.style.display = 'none';
    const out = document.getElementById('planning-output');
    if (out) out.textContent = '❌ Erreur. Vérifie ta connexion et réessaie !';
    if (result) result.style.display = 'block';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📅 CRÉER MON PLANNING PERSONNALISÉ'; }
  }
}

// ── Actions résultat ──────────────────────────────────────────────────────────
function copierPlanning() {
  const text = document.getElementById('planning-output')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copier-planning');
    if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => { btn.textContent = '📋 Copier'; }, 2000); }
  });
}

function telechargerPlanning() {
  const text = document.getElementById('planning-output')?.textContent || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'planning-revision.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

function nouveauPlanning() {
  _planningExams  = [];
  _planningHeures = '2';
  _planningJours  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const notes = document.getElementById('planning-notes');
  if (notes) notes.value = '';
  const result = document.getElementById('planning-result');
  if (result) result.style.display = 'none';
  _renderExams();

  // Reset pills UI
  document.querySelectorAll('#planning-hours-pills .planning-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.val === '2');
  });
  document.querySelectorAll('#planning-days-pills .planning-day-pill').forEach(b => {
    const defaut = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
    b.classList.toggle('active', defaut.includes(b.dataset.day));
  });
}
