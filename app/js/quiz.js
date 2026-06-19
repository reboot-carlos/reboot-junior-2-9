/**
 * quiz.js — Quiz Inhabituel : génération auto par Claude
 */

// ── État global ───────────────────────────────────────────────────────────────
let _quizData    = null;   // {titre, questions[]}
let _quizCurQ    = 0;      // index question courante
let _quizScore   = 0;      // bonnes réponses
let _quizAnswers = [];     // [{right, question, choix_correct}]
let _quizNbQ     = 5;      // nombre de questions sélectionné
let _quizDiff    = 'moyen';
let _quizImg64   = null;
let _quizImgType = 'image/jpeg';

// ── Navigation entre écrans ───────────────────────────────────────────────────
function _quizScreen(id) {
  ['quiz-screen-config','quiz-screen-loading','quiz-screen-question','quiz-screen-results']
    .forEach(s => {
      const el = document.getElementById(s);
      if (el) el.style.display = s === id ? 'block' : 'none';
    });
}

// ── Ouvrir / Fermer ───────────────────────────────────────────────────────────
function ouvrirQuiz() {
  const modal   = document.getElementById('modal-quiz');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
  _quizScreen('quiz-screen-config');
}

function fermerQuiz() {
  document.getElementById('modal-quiz')?.classList.remove('active');
  document.getElementById('modal-overlay')?.classList.remove('active');
}

// ── Pills sélecteurs ──────────────────────────────────────────────────────────
function _initPills(groupId, onSelect) {
  document.querySelectorAll(`#${groupId} .quiz-pill`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${groupId} .quiz-pill`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(btn.dataset.value);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  _initPills('quiz-nb-pills',   v => { _quizNbQ = parseInt(v); });
  _initPills('quiz-diff-pills', v => { _quizDiff = v; });
});

// ── Upload image ──────────────────────────────────────────────────────────────
function handleQuizImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  _quizImgType = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = e => {
    _quizImg64 = e.target.result.split(',')[1];
    const prev = document.getElementById('quiz-img-preview');
    const ph   = document.getElementById('quiz-upload-ph');
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
    if (ph)   ph.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ── Générer le quiz ───────────────────────────────────────────────────────────
async function demarrerQuiz() {
  const sujet = document.getElementById('quiz-sujet')?.value.trim() || '';
  const texte = document.getElementById('quiz-texte')?.value.trim() || '';

  if (!sujet && !texte && !_quizImg64) {
    const inp = document.getElementById('quiz-sujet');
    if (inp) {
      inp.style.borderColor = '#E74C3C';
      const orig = inp.placeholder;
      inp.placeholder = '⚠️ Tape un sujet ici !';
      setTimeout(() => { inp.style.borderColor = ''; inp.placeholder = orig; }, 2500);
    }
    return;
  }

  _quizScreen('quiz-screen-loading');

  try {
    const lang = (typeof chatbotEngine !== 'undefined' && chatbotEngine?.language) ? chatbotEngine.language : 'fr';
    const resp = await fetch('/quiz', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sujet, texte,
        image_base64: _quizImg64,
        media_type:   _quizImgType,
        nb_questions: _quizNbQ,
        difficulte:   _quizDiff,
        langue:       lang,
      }),
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (!data.questions?.length) throw new Error('Aucune question');

    _quizData    = data;
    _quizCurQ    = 0;
    _quizScore   = 0;
    _quizAnswers = [];

    // Mettre à jour le titre de la modale
    const h3 = document.querySelector('#modal-quiz .modal-header h3');
    if (h3) h3.textContent = `🎯 ${data.titre}`;

    _renderQuestion();

  } catch (err) {
    console.error('Quiz error:', err);
    _quizScreen('quiz-screen-config');
    alert('❌ Erreur de génération. Vérifie ta connexion et réessaie !');
  }
}

// ── Afficher la question courante ─────────────────────────────────────────────
function _renderQuestion() {
  if (!_quizData || _quizCurQ >= _quizData.questions.length) {
    _renderResults();
    return;
  }

  _quizScreen('quiz-screen-question');

  const q     = _quizData.questions[_quizCurQ];
  const total = _quizData.questions.length;
  const cur   = _quizCurQ + 1;

  // Barre de progression
  const fill = document.getElementById('quiz-prog-fill');
  const txt  = document.getElementById('quiz-prog-txt');
  if (fill) fill.style.width = `${(cur / total) * 100}%`;
  if (txt)  txt.textContent  = `${cur} / ${total}`;

  // Texte de la question
  const qEl = document.getElementById('quiz-q-text');
  if (qEl) qEl.textContent = q.question;

  // Choix
  const choicesEl = document.getElementById('quiz-choices');
  if (choicesEl) {
    const LETTERS = ['A','B','C','D'];
    choicesEl.innerHTML = '';
    q.choix.forEach((choix, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-choice-btn';
      btn.innerHTML = `<span class="quiz-letter">${LETTERS[i]}</span><span class="quiz-choice-text">${choix}</span>`;
      btn.addEventListener('click', () => _answerQuestion(i));
      choicesEl.appendChild(btn);
    });
  }

  // Cacher le feedback de la question précédente
  const fb = document.getElementById('quiz-feedback');
  if (fb) fb.style.display = 'none';
}

// ── Sélectionner une réponse ──────────────────────────────────────────────────
function _answerQuestion(chosen) {
  const q       = _quizData.questions[_quizCurQ];
  const correct = chosen === q.bonne_reponse;
  if (correct) _quizScore++;
  _quizAnswers.push({ right: correct, question: q.question, bonneReponse: q.choix[q.bonne_reponse] });

  // Coloriser les boutons
  document.querySelectorAll('.quiz-choice-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.bonne_reponse)        btn.classList.add('choice-correct');
    else if (i === chosen && !correct) btn.classList.add('choice-wrong');
    else                               btn.classList.add('choice-dim');
  });

  // Feedback
  const fb     = document.getElementById('quiz-feedback');
  const fbIcon = document.getElementById('quiz-fb-icon');
  const fbTxt  = document.getElementById('quiz-fb-txt');
  const fbExpl = document.getElementById('quiz-fb-expl');
  const fbNext = document.getElementById('quiz-fb-next');

  if (fb) { fb.style.display = 'block'; fb.className = `quiz-feedback ${correct ? 'fb-correct' : 'fb-wrong'}`; }

  if (fbIcon) fbIcon.textContent = correct ? '✅' : '❌';
  if (fbTxt)  fbTxt.textContent  = correct
    ? ['Super ! 🎉','Exactement ! 🌟','Parfait ! 💪','Bravo ! ✨'][Math.floor(Math.random()*4)]
    : `Pas tout à fait… La bonne réponse était : « ${q.choix[q.bonne_reponse]} »`;
  if (fbExpl) fbExpl.textContent = q.explication ? `💡 ${q.explication}` : '';
  if (fbNext) fbNext.textContent = _quizCurQ + 1 >= _quizData.questions.length
    ? '🏆 Voir mes résultats !'
    : 'Question suivante →';
}

function _nextQ() {
  _quizCurQ++;
  _renderQuestion();
}

// ── Résultats finaux ──────────────────────────────────────────────────────────
function _renderResults() {
  _quizScreen('quiz-screen-results');

  const total = _quizData.questions.length;
  const pct   = Math.round((_quizScore / total) * 100);

  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '😊' : pct >= 40 ? '💪' : '📚';
  const msg   = pct === 100 ? 'PARFAIT ! Tu es imbattable !'
    : pct >= 80 ? 'Excellent ! Encore un petit effort !'
    : pct >= 60 ? 'Bien joué ! Tu progresses vraiment !'
    : pct >= 40 ? 'Continue, tu vas y arriver ! 💪'
    : 'Révise encore ce sujet — tu peux le faire ! 📖';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('quiz-res-emoji', emoji);
  set('quiz-res-score', `${_quizScore} / ${total}`);
  set('quiz-res-pct',   `${pct}%`);
  set('quiz-res-msg',   msg);

  const recapEl = document.getElementById('quiz-res-recap');
  if (recapEl) {
    recapEl.innerHTML = '';
    _quizAnswers.forEach((ans, i) => {
      const div = document.createElement('div');
      div.className = `quiz-recap-item ${ans.right ? 'recap-right' : 'recap-wrong'}`;
      const qText = _quizData.questions[i].question;
      div.innerHTML = `<span>${ans.right ? '✅' : '❌'}</span><span class="recap-q">${qText.length > 60 ? qText.slice(0, 60) + '…' : qText}</span>`;
      recapEl.appendChild(div);
    });
  }
}

// ── Actions résultats ─────────────────────────────────────────────────────────
function rejouerQuiz() {
  _quizCurQ    = 0;
  _quizScore   = 0;
  _quizAnswers = [];
  _renderQuestion();
}

function nouveauQuiz() {
  _quizData  = null;
  _quizImg64 = null;
  _quizCurQ  = 0; _quizScore = 0; _quizAnswers = [];
  const prev = document.getElementById('quiz-img-preview');
  const ph   = document.getElementById('quiz-upload-ph');
  if (prev) { prev.style.display = 'none'; prev.src = ''; }
  if (ph)   ph.style.display = 'flex';
  ['quiz-sujet','quiz-texte'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const inp = document.getElementById('quiz-image-input');
  if (inp) inp.value = '';
  const h3 = document.querySelector('#modal-quiz .modal-header h3');
  if (h3) h3.textContent = '🎯 QUIZ INHABITUEL';
  _quizScreen('quiz-screen-config');
}
