/**
 * sidebar.js - Gestion de la barre latérale
 */

class SidebarManager {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.toggleBtn = document.getElementById('btn-toggle-sidebar');
    this.initEventListeners();
  }

  initEventListeners() {
    // Fermer la sidebar sur mobile quand on clique sur un élément
    const personalitiesContainer = document.getElementById('personalities-container');
    if (personalitiesContainer) {
      personalitiesContainer.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          this.closeSidebar();
        }
      });
    }
  }

  openSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.add('visible');
    }
    if (this.toggleBtn) {
      this.toggleBtn.classList.remove('visible');
    }
    // Afficher l'overlay sur mobile
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay && window.innerWidth <= 768) {
      overlay.style.display = 'block';
    }
  }

  closeSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.remove('visible');
    }
    if (this.toggleBtn) {
      this.toggleBtn.classList.add('visible');
    }
    // Masquer l'overlay
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  toggleSidebar() {
    if (this.sidebar?.classList.contains('visible')) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  renderPersonalities(personalities) {
    const container = document.getElementById('personalities-container');
    if (!container) return;

    container.innerHTML = '';

    personalities.forEach((personality) => {
      // Bouton de personnalité
      const btn = document.createElement('button');
      btn.className = 'personality-btn';
      if (personality.id === currentPersonality) {
        btn.classList.add('active');
      }
      btn.setAttribute('data-personality', personality.id);
      btn.setAttribute('aria-label', personality.name);

      btn.innerHTML = `<span class="personality-name">${personality.emoji} ${personality.name}</span>`;

      btn.addEventListener('click', () => {
        PersonalityManager.setPersonality(personality.id, personality);
      });

      container.appendChild(btn);

      // Description
      const desc = document.createElement('div');
      desc.className = 'personality-desc';
      desc.textContent = personality.description;
      container.appendChild(desc);
    });
  }

  updateHistory(conversations) {
    const container = document.getElementById('history-container');
    if (!container) return;

    if (conversations.length === 0) {
      container.innerHTML = '<div class="history-empty">Aucune conversation sauvegardée</div>';
      return;
    }

    container.innerHTML = '';

    conversations.forEach((conv) => {
      const item = document.createElement('button');
      item.className = 'history-item';
      item.title = conv.date;
      item.textContent = `💬 ${conv.name}`;

      item.addEventListener('click', () => {
        loadSpecificConversation(conv.id);
      });

      container.appendChild(item);
    });
  }
}

// Fonctions globales pour la sidebar
let sidebarManager;

document.addEventListener('DOMContentLoaded', () => {
  sidebarManager = new SidebarManager();

  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');

  if (window.innerWidth > 768) {
    // Desktop : sidebar sticky toujours visible, bouton toggle caché
    if (sidebar)    sidebar.classList.add('visible');
    if (toggleBtn)  toggleBtn.classList.remove('visible');
  } else {
    // Mobile : sidebar masquée par défaut, bouton toggle visible
    if (sidebar)    sidebar.classList.remove('visible');
    if (toggleBtn)  toggleBtn.classList.add('visible');
  }
});

function openSidebar() {
  console.log('📂 Ouverture sidebar');
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (sidebar) {
    sidebar.classList.add('visible');
    console.log('✅ Classe visible ajoutée');
  }
  if (toggleBtn) {
    toggleBtn.classList.remove('visible');
  }
  if (overlay && window.innerWidth <= 768) {
    overlay.style.display = 'block';
  }
}

function closeSidebar() {
  console.log('❌ Fermeture sidebar');
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (sidebar) {
    sidebar.classList.remove('visible');
    console.log('✅ Classe visible supprimée');
  }
  if (toggleBtn) {
    toggleBtn.classList.add('visible');
  }
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function toggleSidebar() {
  if (sidebarManager) {
    sidebarManager.toggleSidebar();
  }
}

// Fonctions pour gérer l'historique
function newConversation() {
  if (confirm('Êtes-vous sûr? Les messages non sauvegardés seront perdus.')) {
    const chatZone = document.getElementById('chat-zone');
    if (chatZone) {
      chatZone.innerHTML = '';
      const personality = PersonalityManager.getCurrentPersonality();
      const greeting = personality?.greeting || 'Bienvenue!';
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot';
      messageDiv.innerHTML = greeting;
      chatZone.appendChild(messageDiv);
    }
  }
}

function saveConversation() {
  ouvrirModalSauvegarde();
}

function loadConversation() {
  const conversations = getStoredConversations();
  if (conversations.length === 0) {
    alert('❌ Aucune conversation sauvegardée');
    return;
  }

  let message = 'Sélectionnez une conversation:\n\n';
  conversations.forEach((conv, index) => {
    message += `${index + 1}. ${conv.name}\n`;
  });

  const choice = prompt(message);
  if (choice) {
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < conversations.length) {
      loadSpecificConversation(conversations[index].id);
    }
  }
}

function updateHistoryDisplay() {
  if (sidebarManager) {
    const conversations = getStoredConversations();
    sidebarManager.updateHistory(conversations);
  }
}

/* ---- Modal de sauvegarde nommée ---- */
function ouvrirModalSauvegarde() {
  const modal   = document.getElementById('modal-sauvegarde');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
  setTimeout(() => {
    const input = document.getElementById('nom-discussion');
    if (input) input.focus();
  }, 50);
}

function confirmerSauvegarde() {
  const input = document.getElementById('nom-discussion');
  if (!input) return;
  const nom = input.value.trim();
  if (!nom) {
    input.style.borderColor = '#E74C3C';
    setTimeout(() => { input.style.borderColor = ''; }, 1000);
    return;
  }
  saveConversationToStorage(nom);
  fermerModalSauvegarde();
  updateHistoryDisplay();
}

function fermerModalSauvegarde() {
  const modal   = document.getElementById('modal-sauvegarde');
  const overlay = document.getElementById('modal-overlay');
  if (modal)   modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  const input = document.getElementById('nom-discussion');
  if (input) input.value = '';
}

/* ---- Menu paramètres (engrenage header) ---- */
function afficherMenuParametres() {
  document.getElementById('menu-parametres')?.classList.add('active');
}

function fermerMenuParametres() {
  document.getElementById('menu-parametres')?.classList.remove('active');
}

/* ---- Sélecteur de langue ---- */
function renderLanguageSwitcher() {
  const container = document.getElementById('language-container');
  if (!container) return;

  container.innerHTML = '';
  const langs = [
    { code: 'fr', flag: '🇫🇷', label: 'Français' },
    { code: 'en', flag: '🇬🇧', label: 'English'  },
    { code: 'he', flag: '🇮🇱', label: 'עברית'     },
  ];

  langs.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'btn-langue';
    btn.dataset.lang = lang.code;
    btn.innerHTML = `<span class="flag">${lang.flag}</span><span class="code">${lang.code.toUpperCase()}</span>`;
    btn.title = lang.label;
    btn.setAttribute('aria-label', `Langue : ${lang.label}`);
    btn.addEventListener('click', () => changerLangue(lang.code, btn));
    container.appendChild(btn);
  });

  const saved = typeof getSetting === 'function' ? getSetting('langue', 'fr') : 'fr';
  container.querySelectorAll('.btn-langue').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === saved);
  });
}

function changerLangue(lang, btn) {
  document.querySelectorAll('.btn-langue').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (typeof setLanguage === 'function') setLanguage(lang);
}

/* ---- Fermer tous les modals (clic overlay) ---- */
function fermerTousLesModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.settings-dropdown').forEach(d => d.classList.remove('active'));
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

// Exporter la classe
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SidebarManager };
}
