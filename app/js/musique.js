/**
 * musique.js — Recommandations musicales personnalisées
 */

let _musicHumeur  = 'Motivé(e)';
let _musicGenres  = [];
let _musicTendance = true;

// ── Ouvrir / Fermer ───────────────────────────────────────────────────────────
function ouvrirMusique() {
  document.getElementById('modal-musique')?.classList.add('active');
  document.getElementById('modal-overlay')?.classList.add('active');
}

function fermerMusique() {
  document.getElementById('modal-musique')?.classList.remove('active');
  document.getElementById('modal-overlay')?.classList.remove('active');
}

// ── Pills humeur (single select) ──────────────────────────────────────────────
// ── Pills genre (multi select) ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Humeur — un seul actif
  document.querySelectorAll('#music-humeur-pills .music-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#music-humeur-pills .music-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _musicHumeur = btn.dataset.val;
    });
  });

  // Genre — multi-sélect toggle
  document.querySelectorAll('#music-genre-pills .music-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const g = btn.dataset.val;
      if (btn.classList.contains('active')) {
        if (!_musicGenres.includes(g)) _musicGenres.push(g);
      } else {
        _musicGenres = _musicGenres.filter(x => x !== g);
      }
    });
  });

  // Bouton dans la barre de suggestion
  document.querySelectorAll('[data-open-musique]').forEach(btn => {
    btn.addEventListener('click', ouvrirMusique);
  });
});

// ── Générer les recommandations ───────────────────────────────────────────────
async function genererMusique() {
  const artistes = document.getElementById('music-artistes')?.value.trim() || '';

  const btn     = document.getElementById('btn-generer-musique');
  const loading = document.getElementById('music-loading');
  const result  = document.getElementById('music-result');

  if (btn)     { btn.disabled = true; btn.innerHTML = '⏳ Le DJ IA réfléchit...'; }
  if (loading) loading.style.display = 'flex';
  if (result)  result.style.display  = 'none';

  try {
    const resp = await fetch('/musique', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        humeur:         _musicHumeur,
        genres:         _musicGenres,
        artistes_aimes: artistes,
        avec_tendances: _musicTendance,
      }),
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    const out = document.getElementById('music-output');
    if (out) out.textContent = data.recommandations;
    if (loading) loading.style.display = 'none';
    if (result)  { result.style.display = 'block'; result.scrollIntoView({ behavior: 'smooth' }); }

  } catch (err) {
    console.error('Music error:', err);
    if (loading) loading.style.display = 'none';
    const out = document.getElementById('music-output');
    if (out) out.textContent = '❌ Erreur. Réessaie !';
    if (result) result.style.display = 'block';
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '🎵 GÉNÉRER MA PLAYLIST'; }
  }
}

// ── Actions résultat ──────────────────────────────────────────────────────────
function copierMusique() {
  const text = document.getElementById('music-output')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copier-musique');
    if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => { btn.textContent = '📋 Copier'; }, 2000); }
  });
}

function nouvelleMusique() {
  document.getElementById('music-result')?.style && (document.getElementById('music-result').style.display = 'none');
  const inp = document.getElementById('music-artistes');
  if (inp) inp.value = '';
}
