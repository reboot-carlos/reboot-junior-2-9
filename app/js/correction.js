/**
 * correction.js — Correcteur de texte & rédaction par Claude
 */

let _corrNiveau    = '6ème-5ème';
let _corrTypeTexte = 'Rédaction';

// ── Ouvrir / Fermer ───────────────────────────────────────────────────────────
function ouvrirCorrection() {
  document.getElementById('modal-correction')?.classList.add('active');
  document.getElementById('modal-overlay')?.classList.add('active');
  document.getElementById('corr-texte')?.focus();
}

function fermerCorrection() {
  document.getElementById('modal-correction')?.classList.remove('active');
  document.getElementById('modal-overlay')?.classList.remove('active');
}

// ── Pills niveau & type ───────────────────────────────────────────────────────
function _corrPills(groupId, setter) {
  document.querySelectorAll(`#${groupId} .corr-pill`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${groupId} .corr-pill`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setter(btn.dataset.val);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  _corrPills('corr-niveau-pills', v => { _corrNiveau    = v; });
  _corrPills('corr-type-pills',   v => { _corrTypeTexte = v; });

  document.querySelectorAll('[data-open-correction]').forEach(btn => {
    btn.addEventListener('click', ouvrirCorrection);
  });
});

// ── Corriger le texte ─────────────────────────────────────────────────────────
async function corrigerTexte() {
  const texte = document.getElementById('corr-texte')?.value.trim() || '';

  if (!texte) {
    const ta = document.getElementById('corr-texte');
    if (ta) {
      ta.style.borderColor = '#E74C3C';
      const orig = ta.placeholder;
      ta.placeholder = '⚠️ Colle ton texte ici avant de corriger !';
      setTimeout(() => { ta.style.borderColor = ''; ta.placeholder = orig; }, 2500);
    }
    return;
  }

  if (texte.length < 10) {
    alert('⚠️ Le texte est trop court. Colle au moins une phrase complète.');
    return;
  }

  const btn     = document.getElementById('btn-corriger');
  const loading = document.getElementById('corr-loading');
  const result  = document.getElementById('corr-result');

  if (btn)     { btn.disabled = true; btn.textContent = '⏳ Correction en cours...'; }
  if (loading) loading.style.display = 'flex';
  if (result)  result.style.display  = 'none';

  try {
    const resp = await fetch('/corriger', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texte,
        niveau:     _corrNiveau,
        type_texte: _corrTypeTexte,
      }),
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    const out = document.getElementById('corr-output');
    if (out) out.textContent = data.correction;
    if (loading) loading.style.display = 'none';
    if (result)  { result.style.display = 'block'; result.scrollIntoView({ behavior: 'smooth' }); }

  } catch (err) {
    console.error('Correction error:', err);
    if (loading) loading.style.display = 'none';
    const out = document.getElementById('corr-output');
    if (out) out.textContent = '❌ Erreur. Vérifie ta connexion et réessaie !';
    if (result) result.style.display = 'block';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✍️ CORRIGER MON TEXTE'; }
  }
}

// ── Actions résultat ──────────────────────────────────────────────────────────
function copierCorrection() {
  const text = document.getElementById('corr-output')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copier-corr');
    if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => { btn.textContent = '📋 Copier'; }, 2000); }
  });
}

function telechargerCorrection() {
  const text = document.getElementById('corr-output')?.textContent || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'correction.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

function nouvelleCorrection() {
  document.getElementById('corr-result')?.style && (document.getElementById('corr-result').style.display = 'none');
  const ta = document.getElementById('corr-texte');
  if (ta) { ta.value = ''; ta.focus(); }
}
