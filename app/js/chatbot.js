/**
 * chatbot.js - Logique du chatbot et traitement des messages
 */

let messageId = 0;
let isWaitingForResponse = false;

class ChatbotEngine {
  constructor() {
    this.responses = {};
    this.language = 'fr';
    this.loadResponses();
  }

  async loadResponses() {
    try {
      const response = await fetch('data/responses.json');
      if (response.ok) {
        const data = await response.json();
        this.responses = data;
      }
    } catch (error) {
      console.warn('⚠️ Réponses par défaut utilisées');
      this.responses = this.getDefaultResponses();
    }
  }

  async processMessage(userMessage) {
    if (isWaitingForResponse || !userMessage.trim()) return null;

    isWaitingForResponse = true;

    try {
      // Ajouter le message de l'utilisateur
      addMessage('user', userMessage);

      // Afficher le statut "en train d'écrire"
      const loadingId = addMessage('loading', '⏳ Je réfléchis...');

      // Traiter la question
      const botResponse = await this.getResponse(userMessage);

      // Supprimer le message de chargement
      removeMessage(loadingId);

      // Ajouter la réponse du bot
      addMessage('bot', botResponse);

      return botResponse;
    } catch (error) {
      console.error('❌ Erreur:', error);
      removeMessage('loading');
      addMessage('bot', '❌ Erreur lors du traitement de la question');
    } finally {
      isWaitingForResponse = false;
    }
  }

  async getResponse(message) {
    const normalizedMessage = this.normalizeText(message);
    const personality = PersonalityManager.getCurrentPersonality();

    // Essayer avec l'API FastAPI d'abord
    try {
      const apiResponse = await this.queryAPI(normalizedMessage);
      if (apiResponse) {
        return PersonalityManager.adaptResponse(apiResponse, personality.id);
      }
    } catch (error) {
      console.log('⚠️ API non disponible, utilisation du mode local');
    }

    // Utiliser la base de connaissances locale
    return this.getLocalResponse(normalizedMessage, personality);
  }

  async queryAPI(message) {
    const config = window.chatbotApp?.config;
    // Allow empty string (same-origin nginx proxy); only skip if truly absent
    if (!config?.api || config.api.fastApiUrl === undefined || config.api.fastApiUrl === null) return null;

    try {
      const response = await fetch(`${config.api.fastApiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texte: message,
          langue: this.language,
        }),
        timeout: config.api.timeout,
      });

      if (response.ok) {
        const data = await response.json();
        return data.reponse;
      }
    } catch (error) {
      console.warn('⚠️ Erreur API:', error);
    }

    return null;
  }

  getLocalResponse(message, personality) {
    // Chercher une réponse correspondante
    const responses = this.responses[personality.id] || this.responses.default || [];

    for (const entry of responses) {
      if (this.matchesKeywords(message, entry.keywords)) {
        return typeof entry.response === 'function' ? entry.response() : entry.response;
      }
    }

    // Réponse par défaut selon la personnalité
    return personality.responses?.confused || '🤔 Je n\'ai pas compris. Peux-tu reformuler?';
  }

  matchesKeywords(text, keywords) {
    if (!keywords) return false;
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

  getDefaultResponses() {
    return {
      default: [
        {
          keywords: ['bonjour', 'salut', 'coucou', 'hello'],
          response: 'Salut ! Comment ça va ? 💕',
        },
        {
          keywords: ['qui es-tu', 'qui êtes-vous', 'ton nom'],
          response: 'Je suis TA CHATBOT ROSÉE ! Je suis là pour t\'aider ! 🌹',
        },
        {
          keywords: ['aide', 'help', 'commande'],
          response: 'Je peux t\'aider avec tes questions, tes devoirs, ou simplement discuter ! 📚',
        },
      ],
    };
  }
}

// Instance globale du chatbot
let chatbotEngine;

// Initialiser le chatbot au chargement
document.addEventListener('DOMContentLoaded', () => {
  chatbotEngine = new ChatbotEngine();
});

// Ajouter un message à la zone de chat
function addMessage(type, content) {
  const chatZone = document.getElementById('chat-zone');
  if (!chatZone) return null;

  const messageDiv = document.createElement('div');
  const id = `msg-${++messageId}`;
  messageDiv.id = id;
  messageDiv.className = `message ${type}`;
  messageDiv.innerHTML = content;

  chatZone.appendChild(messageDiv);

  // Scroller vers le bas
  setTimeout(() => {
    chatZone.scrollTop = chatZone.scrollHeight;
  }, 100);

  return id;
}

// Supprimer un message
function removeMessage(id) {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
  }
}

// Gérer la soumission du formulaire
function handleFormSubmit(event) {
  event.preventDefault();

  const input = document.getElementById('champ-texte');
  const message = input.value.trim();

  if (message) {
    chatbotEngine.processMessage(message);
    input.value = '';
    input.focus();
  }
}

// Envoyer une suggestion pré-définie
function sendSuggestion(text) {
  const input = document.getElementById('champ-texte');
  input.value = text;
  chatbotEngine.processMessage(text);
  input.value = '';
}

// Changer la langue active (appelé par le sélecteur de langue)
function setLanguage(lang) {
  if (chatbotEngine) chatbotEngine.language = lang;
  if (typeof saveSetting === 'function') saveSetting('langue', lang);
}
