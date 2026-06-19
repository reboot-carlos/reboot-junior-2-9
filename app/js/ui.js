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

function renderSuggestions(config) {
  const suggestionsContainer = document.getElementById('suggestions');
  if (!suggestionsContainer) return;

  const suggestions = [
    { emoji: '💕', text: 'COUCOU !', action: 'bonjour' },
    { emoji: '⭐', text: 'T\'ES QUI TOI ?', action: 'qui es-tu' },
    { emoji: '⭐', text: 'AIDE MAGIQUE !', action: 'aide' },
    { emoji: '🎨', text: 'DESSIN', action: 'dessin' },
    { emoji: '🎮', text: 'JEUX', action: 'jeux' },
  ];

  suggestionsContainer.innerHTML = '';

  suggestions.forEach((suggestion) => {
    const btn = document.createElement('button');
    btn.className = 'btn-suggestion';
    btn.innerHTML = `${suggestion.emoji} ${suggestion.text}`;
    btn.setAttribute('aria-label', suggestion.text);

    btn.addEventListener('click', () => {
      if (suggestion.action === 'dessin') {
        if (typeof ouvrirDessin === 'function') ouvrirDessin();
      } else if (suggestion.action === 'jeux') {
        if (typeof afficherMenuJeux === 'function') afficherMenuJeux();
      } else {
        sendSuggestion(suggestion.action);
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
