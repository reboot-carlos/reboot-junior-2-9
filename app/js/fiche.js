/**
 * fiche.js — Générateur de fiche de révision
 */

let ficheImageBase64 = null;
let ficheMediaType   = 'image/jpeg';

function ouvrirFiche() {
  document.getElementById('modal-fiche')?.classList.add('active');
  document.getElementById('modal-overlay')?.classList.add('active');
}

function fermerFiche() {
  document.getElementById('modal-fiche')?.classList.remove('active');
  document.getElementById('modal-overlay')?.classList.remove('active');
  // Reset
  ficheImageBase64 = null;
  const ta = document.getElementById('fiche-texte');
  if (ta) ta.value = '';
  const prev = document.getElementById('fiche-image-preview');
  if (prev) { prev.style.display = 'none'; prev.src = ''; }
  const ph = document.getElementById('fiche-upload-placeholder');
  if (ph) ph.style.display = 'flex';
  document.getElementById('fiche-loading')?.style && (document.getElementById('fiche-loading').style.display = 'none');
  document.getElementById('fiche-resultat-container')?.style && (document.getElementById('fiche-resultat-container').style.display = 'none');
  const inp = document.getElementById('fiche-image-input');
  if (inp) inp.value = '';
}

function handleFicheImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  ficheMediaType = file.type || 'image/jpeg';

  const reader = new FileReader();
  reader.onload = (e) => {
    ficheImageBase64 = e.target.result.split(',')[1];

    const prev = document.getElementById('fiche-image-preview');
    const ph   = document.getElementById('fiche-upload-placeholder');
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
    if (ph)   ph.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function genererFiche() {
  const texte = document.getElementById('fiche-texte')?.value.trim() || '';

  if (!texte && !ficheImageBase64) {
    const zone = document.getElementById('fiche-texte');
    if (zone) {
      zone.style.borderColor = '#E74C3C';
      zone.placeholder = '⚠️ Colle ton cours ici ou envoie une photo !';
      setTimeout(() => {
        zone.style.borderColor = '';
        zone.placeholder = "Colle le texte de ton cours ici... Par exemple : 'La photosynthèse est le processus par lequel les plantes transforment la lumière en énergie...'";
      }, 2500);
    }
    return;
  }

  const btn     = document.getElementById('btn-generer-fiche');
  const loading = document.getElementById('fiche-loading');
  const result  = document.getElementById('fiche-resultat-container');

  if (btn)     { btn.disabled = true; btn.innerHTML = '⏳ Création en cours...'; }
  if (loading) loading.style.display = 'flex';
  if (result)  result.style.display  = 'none';

  try {
    const lang = (typeof chatbotEngine !== 'undefined' && chatbotEngine?.language) ? chatbotEngine.language : 'fr';
    const resp = await fetch('/fiche', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texte,
        image_base64: ficheImageBase64,
        media_type:   ficheMediaType,
        langue:       lang,
      }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    const out = document.getElementById('fiche-resultat');
    if (out) out.textContent = data.fiche;
    if (result) result.style.display = 'block';
    result?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Erreur fiche:', err);
    const out = document.getElementById('fiche-resultat');
    if (out) out.textContent = '❌ Une erreur est survenue. Vérifie ta connexion et réessaie !';
    if (result) result.style.display = 'block';
  } finally {
    if (loading) loading.style.display = 'none';
    if (btn)     { btn.disabled = false; btn.innerHTML = '✨ CRÉER MA FICHE DE RÉVISION ✨'; }
  }
}

function copierFiche() {
  const text = document.getElementById('fiche-resultat')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copier-fiche');
    if (btn) {
      btn.textContent = '✅ Copié !';
      setTimeout(() => { btn.textContent = '📋 Copier'; }, 2000);
    }
  }).catch(() => alert('❌ Copie non supportée par ce navigateur'));
}

function telechargerFiche() {
  const text = document.getElementById('fiche-resultat')?.textContent || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'fiche-revision.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}
