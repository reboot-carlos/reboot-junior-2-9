/**
 * musique.js — Recommandations musicales personnalisées
 * Toutes les interactions sont bindées via addEventListener (pas d'onclick HTML).
 */

let _musicHumeur   = 'Motivé(e)';
let _musicGenres   = [];

// ── Ouvrir / Fermer ───────────────────────────────────────────────────────────
function ouvrirMusique() {
  const modal   = document.getElementById('modal-musique');
  const overlay = document.getElementById('modal-overlay');
  if (!modal) { console.error('[Musique] #modal-musique introuvable'); return; }
  modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function fermerMusique() {
  document.getElementById('modal-musique')?.classList.remove('active');
  document.getElementById('modal-overlay')?.classList.remove('active');
}

// ── Initialisation au chargement du DOM ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Pills humeur — single select
  document.querySelectorAll('#music-humeur-pills .music-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#music-humeur-pills .music-pill')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _musicHumeur = btn.dataset.val;
    });
  });

  // Pills genre — multi select
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

  // Bouton Générer (bind JS — ne pas dépendre du onclick HTML)
  const btnGenerer = document.getElementById('btn-generer-musique');
  if (btnGenerer) btnGenerer.addEventListener('click', genererMusique);

  // Bouton Copier
  const btnCopier = document.getElementById('btn-copier-musique');
  if (btnCopier) btnCopier.addEventListener('click', copierMusique);

  // Bouton Nouvelle humeur
  const btnNouveau = document.getElementById('btn-nouvelle-musique');
  if (btnNouveau) btnNouveau.addEventListener('click', nouvelleMusique);

  // Bouton Fermer dans le header
  const btnFermer = document.getElementById('btn-fermer-musique');
  if (btnFermer) btnFermer.addEventListener('click', fermerMusique);

  // Boutons sidebar éventuels avec data-open-musique
  document.querySelectorAll('[data-open-musique]').forEach(btn => {
    btn.addEventListener('click', ouvrirMusique);
  });
});

// ── Générer les recommandations ───────────────────────────────────────────────
async function genererMusique() {
  const artistes = (document.getElementById('music-artistes')?.value || '').trim();

  const btn     = document.getElementById('btn-generer-musique');
  const loading = document.getElementById('music-loading');
  const result  = document.getElementById('music-result');
  const out     = document.getElementById('music-output');

  if (btn)     { btn.disabled = true; btn.textContent = '⏳ Ton DJ IA réfléchit...'; }
  if (loading) loading.style.display = 'flex';
  if (result)  result.style.display  = 'none';

  try {
    const body = JSON.stringify({
      humeur:         _musicHumeur,
      genres:         _musicGenres,
      artistes_aimes: artistes,
      avec_tendances: true,
    });

    const resp = await fetch('/musique', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    if (out) out.textContent = data.recommandations || '❌ Réponse vide du serveur.';
    if (loading) loading.style.display = 'none';
    if (result)  {
      result.style.display = 'block';
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (err) {
    console.error('[Musique] Erreur fetch:', err);
    if (out) out.textContent = `❌ Erreur : ${err.message}\nVérifie ta connexion et réessaie !`;
    if (loading) loading.style.display = 'none';
    if (result)  result.style.display  = 'block';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🎵 GÉNÉRER MA PLAYLIST'; }
  }
}

// ── Actions résultat ──────────────────────────────────────────────────────────
function copierMusique() {
  const text = document.getElementById('music-output')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copier-musique');
    if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => { btn.textContent = '📋 Copier'; }, 2000); }
  }).catch(() => alert('❌ Copie non supportée par ce navigateur'));
}

function nouvelleMusique() {
  const result = document.getElementById('music-result');
  const inp    = document.getElementById('music-artistes');
  if (result) result.style.display = 'none';
  if (inp)    inp.value = '';
  // Reset genre sélections
  _musicGenres = [];
  document.querySelectorAll('#music-genre-pills .music-pill')
    .forEach(b => b.classList.remove('active'));
}
