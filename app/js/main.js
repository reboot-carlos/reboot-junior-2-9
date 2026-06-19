/**
 * Main.js - Point d'entrée de l'application Chatbot
 * Initialise l'application et charge la configuration
 */

class ChatbotApp {
  constructor() {
    this.config = null;
    this.personalities = null;
    this.currentPersonality = 'prof';
    this.language = 'fr';
    this.init();
  }

  async init() {
    console.log('🚀 Initialisation du Chatbot...');

    try {
      // Charger la configuration
      await this.loadConfig();

      // Charger les personnalités
      await this.loadPersonalities();

      // Initialiser le stockage
      initStorage(this.config.storage);

      // Initialiser l'interface utilisateur
      initUI(this.config, this.personalities);

      // Charger la dernière conversation sauvegardée si elle existe
      loadLastConversation();

      // Marquer l'initialisation comme complète
      document.body.classList.add('initialized');
      console.log('✅ Chatbot initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      showError('Erreur d\'initialisation du chatbot');
    }
  }

  async loadConfig() {
    try {
      const response = await fetch('../config.json');
      if (!response.ok) throw new Error('Config non trouvée');
      this.config = await response.json();
      console.log('✅ Configuration chargée');
    } catch (error) {
      console.warn('⚠️ Config non disponible, utilisation des paramètres par défaut');
      this.config = this.getDefaultConfig();
    }
  }

  async loadPersonalities() {
    try {
      const response = await fetch('data/personalities.json');
      if (!response.ok) throw new Error('Personnalités non trouvées');
      const data = await response.json();
      this.personalities = data.personalities;
      console.log('✅ Personnalités chargées');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des personnalités:', error);
      this.personalities = this.getDefaultPersonalities();
    }
  }

  getDefaultConfig() {
    return {
      app: {
        name: 'TA CHATBOT ROSÉE',
        version: '1.0.0',
      },
      ui: {
        theme: {
          primary: '#FF6B9D',
          secondary: '#FF9FB2',
          accent: '#FFD1DC',
        },
      },
      storage: {
        historyKey: 'chatbot_history',
        maxHistoryItems: 50,
      },
      api: {
        fastApiUrl: 'http://localhost:8001',
        timeout: 5000,
      },
    };
  }

  getDefaultPersonalities() {
    return [
      {
        id: 'prof',
        name: 'LE PROF',
        emoji: '👨‍🏫',
        description: 'Maîtrise toutes les matières',
      },
      {
        id: 'amie',
        name: 'L\'AMIE',
        emoji: '👩‍🤝‍👨',
        description: 'Ta meilleure amie',
      },
      {
        id: 'rosee',
        name: 'ROSÉE',
        emoji: '🌹',
        description: 'Créative et inspirante',
      },
    ];
  }
}

// Fonction utilitaire pour afficher les erreurs
function showError(message) {
  console.error(message);
  // Afficher un message d'erreur à l'utilisateur
  const chatZone = document.getElementById('chat-zone');
  if (chatZone) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message bot';
    errorDiv.textContent = `❌ ${message}`;
    chatZone.appendChild(errorDiv);
  }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  window.chatbotApp = new ChatbotApp();
});

// Gestion du service worker (optionnel, pour la prise en charge hors ligne)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../../sw.js').then(
      (registration) => console.log('✅ Service Worker enregistré'),
      (error) => console.log('⚠️ Service Worker non disponible:', error)
    );
  });
}
