/**
 * outfit.js — Conseiller Mode & Outfit
 */

let _outfitImg64   = null;
let _outfitImgType = 'image/jpeg';
let _outfitSaison   = 'Printemps';
let _outfitOccasion = 'Casual';
let _outfitStyle    = 'Streetwear';

// ── Ouvrir / Fermer ───────────────────────────────────────────────────────────
function ouvrirOutfit() {
  const modal   = document.getElementById('modal-outfit');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function fermerOutfit() {
  const modal   = document.getElementById('modal-outfit');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

// ── Pills ─────────────────────────────────────────────────────────────────────
function _outfitPills(groupId, setter) {
  document.querySelectorAll(`#${groupId} .outfit-pill`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${groupId} .outfit-pill`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setter(btn.dataset.value);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  _outfitPills('outfit-saison-pills',   v => { _outfitSaison   = v; });
  _outfitPills('outfit-occasion-pills', v => { _outfitOccasion = v; });
  _outfitPills('outfit-style-pills',    v => { _outfitStyle    = v; });

  // Event listener robuste sur le bouton sidebar (backup du onclick inline)
  document.querySelectorAll('.btn-mode-sidebar').forEach(btn => {
    btn.addEventListener('click', ouvrirOutfit);
  });
});

// ── Upload image ──────────────────────────────────────────────────────────────
function handleOutfitImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  _outfitImgType = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = e => {
    _outfitImg64 = e.target.result.split(',')[1];
    const prev = document.getElementById('outfit-img-preview');
    const ph   = document.getElementById('outfit-upload-ph');
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
    if (ph)   ph.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ── Générer les tenues ────────────────────────────────────────────────────────
async function genererOutfit() {
  const desc = document.getElementById('outfit-description')?.value.trim() || '';

  if (!desc && !_outfitImg64) {
    const ta = document.getElementById('outfit-description');
    if (ta) {
      ta.style.borderColor = '#E74C3C';
      const orig = ta.placeholder;
      ta.placeholder = '⚠️ Décris tes vêtements ou envoie une photo !';
      setTimeout(() => { ta.style.borderColor = ''; ta.placeholder = orig; }, 2500);
    }
    return;
  }

  const btn     = document.getElementById('btn-generer-outfit');
  const loading = document.getElementById('outfit-loading');
  const result  = document.getElementById('outfit-result');

  if (btn)     { btn.disabled = true; btn.innerHTML = '⏳ Ton styliste réfléchit...'; }
  if (loading) loading.style.display = 'flex';
  if (result)  result.style.display  = 'none';

  try {
    const resp = await fetch('/outfit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description:  desc,
        image_base64: _outfitImg64,
        media_type:   _outfitImgType,
        saison:       _outfitSaison,
        occasion:     _outfitOccasion,
        style:        _outfitStyle,
      }),
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    const out = document.getElementById('outfit-suggestions');
    if (out) out.textContent = data.suggestions;
    if (loading) loading.style.display = 'none';
    if (result)  { result.style.display = 'block'; result.scrollIntoView({ behavior: 'smooth' }); }

  } catch (err) {
    console.error('Outfit error:', err);
    if (loading) loading.style.display = 'none';
    const out = document.getElementById('outfit-suggestions');
    if (out) out.textContent = '❌ Erreur. Vérifie ta connexion et réessaie !';
    if (result) result.style.display = 'block';
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '✨ CRÉER MES TENUES IDÉALES ✨'; }
  }
}

// ── Actions résultats ─────────────────────────────────────────────────────────
function copierOutfit() {
  const text = document.getElementById('outfit-suggestions')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copier-outfit');
    if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => { btn.textContent = '📋 Copier'; }, 2000); }
  }).catch(() => alert('❌ Copie non supportée'));
}

function nouvelleRecherche() {
  const result = document.getElementById('outfit-result');
  const desc   = document.getElementById('outfit-description');
  if (result) result.style.display = 'none';
  if (desc)   desc.value = '';
  _outfitImg64 = null;
  const prev = document.getElementById('outfit-img-preview');
  const ph   = document.getElementById('outfit-upload-ph');
  if (prev) { prev.style.display = 'none'; prev.src = ''; }
  if (ph)   ph.style.display = 'flex';
  const inp = document.getElementById('outfit-image-input');
  if (inp)  inp.value = '';
}
