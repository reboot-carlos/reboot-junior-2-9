/**
 * oral.js — Entraînement à la présentation orale
 */

let _oralContexte = 'Exposé classe';
let _oralNiveau   = '6ème-5ème';
let _oralDuree    = '5 min';

// ── Ouvrir / Fermer ───────────────────────────────────────────────────────────
function ouvrirOral() {
  document.getElementById('modal-oral')?.classList.add('active');
  document.getElementById('modal-overlay')?.classList.add('active');
  setTimeout(() => document.getElementById('oral-texte')?.focus(), 80);
}

function fermerOral() {
  document.getElementById('modal-oral')?.classList.remove('active');
  document.getElementById('modal-overlay')?.classList.remove('active');
}

// ── Initialisation ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _bindPills('#oral-contexte-pills', v => { _oralContexte = v; });
  _bindPills('#oral-niveau-pills',   v => { _oralNiveau   = v; });
  _bindPills('#oral-duree-pills',    v => { _oralDuree    = v; });

  document.getElementById('btn-analyser-oral')?.addEventListener('click', analyserOral);
  document.getElementById('btn-copier-oral')?.addEventListener('click',   copierOral);
  document.getElementById('btn-nouvel-oral')?.addEventListener('click',   nouvelOral);
  document.getElementById('btn-fermer-oral')?.addEventListener('click',   fermerOral);
});

function _bindPills(selector, setter) {
  document.querySelectorAll(`${selector} .oral-pill`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`${selector} .oral-pill`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setter(btn.dataset.val);
    });
  });
}

// ── Analyser ──────────────────────────────────────────────────────────────────
async function analyserOral() {
  const texte = (document.getElementById('oral-texte')?.value || '').trim();
  const sujet = (document.getElementById('oral-sujet')?.value || '').trim();

  if (!texte) {
    const ta = document.getElementById('oral-texte');
    if (ta) {
      ta.style.borderColor = '#E74C3C';
      const o = ta.placeholder;
      ta.placeholder = '⚠️ Colle le texte de ta présentation ici !';
      setTimeout(() => { ta.style.borderColor = ''; ta.placeholder = o; }, 2500);
    }
    return;
  }

  const btn     = document.getElementById('btn-analyser-oral');
  const loading = document.getElementById('oral-loading');
  const result  = document.getElementById('oral-result');
  const out     = document.getElementById('oral-output');

  if (btn)     { btn.disabled = true; btn.textContent = '⏳ Analyse en cours...'; }
  if (loading) loading.style.display = 'flex';
  if (result)  result.style.display  = 'none';

  try {
    const resp = await fetch('/oral', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texte, sujet, contexte: _oralContexte, niveau: _oralNiveau, duree: _oralDuree }),
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    if (out) out.textContent = data.conseils;
    if (loading) loading.style.display = 'none';
    if (result)  { result.style.display = 'block'; result.scrollIntoView({ behavior: 'smooth' }); }

  } catch (err) {
    console.error('[Oral] Erreur:', err);
    if (out) out.textContent = `❌ Erreur : ${err.message}. Réessaie !`;
    if (loading) loading.style.display = 'none';
    if (result)  result.style.display  = 'block';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🎤 ANALYSER MON ORAL'; }
  }
}

// ── Actions résultat ──────────────────────────────────────────────────────────
function copierOral() {
  const text = document.getElementById('oral-output')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copier-oral');
    if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => { btn.textContent = '📋 Copier'; }, 2000); }
  }).catch(() => alert('❌ Copie non supportée'));
}

function nouvelOral() {
  const result = document.getElementById('oral-result');
  const texte  = document.getElementById('oral-texte');
  const sujet  = document.getElementById('oral-sujet');
  if (result) result.style.display = 'none';
  if (texte)  { texte.value = ''; texte.focus(); }
  if (sujet)  sujet.value = '';
}
