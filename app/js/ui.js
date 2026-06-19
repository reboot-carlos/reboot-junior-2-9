/**
 * ui.js - Initialisation de l'interface utilisateur
 */

function initUI(config, personalitiesData) {
  console.log('🎨 Initialisation de l\'UI...');

  // Charger les personnalités globalement
  loadPersonalities(personalitiesData);

  // Rendre les personnalités dans la sidebar
  if (sidebarManager) {
    sidebarManager.renderPersonalities(personalitiesData);
  }

  // Initialiser les suggestions
  renderSuggestions(config);

  // Mettre à jour l'historique
  if (sidebarManager) {
    const conversations = getStoredConversations();
    sidebarManager.updateHistory(conversations);
  }

  // Charger la personnalité sauvegardée
  const savedPersonality = localStorage.getItem('current_personality') || 'prof';
  const personality = personalitiesData.find(p => p.id === savedPersonality);
  if (personality) {
    PersonalityManager.setPersonality(personality.id, personality);
  }

  // Appliquer le thème de base
  applyTheme(config.ui.theme);

  // Initialiser les modules de fonctionnalités
  if (typeof initThemes === 'function')             initThemes();
  if (typeof initIcons === 'function')              initIcons();
  if (typeof renderLanguageSwitcher === 'function') renderLanguageSwitcher();

  console.log('✅ UI initialisée');
}

// Suggestions multilingues
const SUGGESTIONS_I18N = {
  fr: [
    { emoji: '💕', text: 'COUCOU !',     action: 'bonjour'   },
    { emoji: '⭐', text: 'T\'ES QUI ?',  action: 'qui es-tu' },
    { emoji: '⭐', text: 'AIDE !',       action: 'aide'      },
    { emoji: '🎵', text: 'MUSIQUE',      action: 'musique'   },
    { emoji: '🎨', text: 'DESSIN',       action: 'dessin'    },
    { emoji: '🎮', text: 'JEUX',         action: 'jeux'      },
  ],
  en: [
    { emoji: '👋', text: 'HI !',         action: 'hello'     },
    { emoji: '⭐', text: 'WHO ARE YOU?', action: 'who are you' },
    { emoji: '⭐', text: 'HELP !',       action: 'help'      },
    { emoji: '🎵', text: 'MUSIC',        action: 'musique'   },
    { emoji: '🎨', text: 'DRAW',         action: 'dessin'    },
    { emoji: '🎮', text: 'GAMES',        action: 'jeux'      },
  ],
  he: [
    { emoji: '👋', text: 'שלום !',       action: 'shalom'    },
    { emoji: '⭐', text: 'מי את?',       action: 'mi ata'    },
    { emoji: '⭐', text: 'עזרה !',       action: 'ezra'      },
    { emoji: '🎵', text: 'מוזיקה',      action: 'musique'   },
    { emoji: '🎨', text: 'ציור',         action: 'dessin'    },
    { emoji: '🎮', text: 'משחקים',      action: 'jeux'      },
  ],
};

function renderSuggestions(configOrLang) {
  const suggestionsContainer = document.getElementById('suggestions');
  if (!suggestionsContainer) return;

  // Accepte soit un objet config, soit directement un code langue
  const lang = (typeof configOrLang === 'string')
    ? configOrLang
    : (chatbotEngine?.language || 'fr');

  const suggestions = SUGGESTIONS_I18N[lang] || SUGGESTIONS_I18N['fr'];

  suggestionsContainer.innerHTML = '';

  suggestions.forEach((suggestion) => {
    const btn = document.createElement('button');
    btn.className = 'btn-suggestion';
    btn.innerHTML = `${suggestion.emoji} ${suggestion.text}`;
    btn.setAttribute('aria-label', suggestion.text);
    btn.dataset.action = suggestion.action;

    btn.addEventListener('click', () => {
      const act = suggestion.action;
      if (act === 'musique') {
        if (typeof ouvrirMusique === 'function') ouvrirMusique();
        else console.warn('ouvrirMusique non disponible');
      } else if (act === 'dessin') {
        if (typeof ouvrirDessin === 'function') ouvrirDessin();
      } else if (act === 'jeux') {
        if (typeof afficherMenuJeux === 'function') afficherMenuJeux();
      } else {
        sendSuggestion(act);
      }
    });

    suggestionsContainer.appendChild(btn);
  });
}

function applyTheme(theme) {
  const root = document.documentElement;

  if (theme) {
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
  }
}

// Écouter les changements de taille de fenêtre pour l'affichage mobile
window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && sidebarManager) {
    sidebarManager.openSidebar();
  }
});

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
  // L'initialisation de l'UI se fait dans main.js via la classe ChatbotApp
});
