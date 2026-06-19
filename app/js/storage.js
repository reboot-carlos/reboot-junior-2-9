/**
 * storage.js - Gestion du localStorage et de l'historique
 */

let storageConfig = {
  historyKey: 'chatbot_history',
  settingsKey: 'chatbot_settings',
  maxHistoryItems: 50,
};

function initStorage(config) {
  if (config?.storage) {
    storageConfig = { ...storageConfig, ...config.storage };
  }
}

// Conversation
function saveConversationToStorage(name) {
  const chatZone = document.getElementById('chat-zone');
  if (!chatZone) return;

  const conversations = getStoredConversations();
  const personality = PersonalityManager.getCurrentPersonality();

  const conversation = {
    id: Date.now(),
    name: name,
    content: chatZone.innerHTML,
    date: new Date().toLocaleString('fr-FR'),
    personality: currentPersonality,
  };

  conversations.unshift(conversation);

  // Limiter le nombre d'éléments
  if (conversations.length > storageConfig.maxHistoryItems) {
    conversations.pop();
  }

  localStorage.setItem(storageConfig.historyKey, JSON.stringify(conversations));

  console.log('✅ Conversation sauvegardée:', name);
  return conversation;
}

function getStoredConversations() {
  const data = localStorage.getItem(storageConfig.historyKey);
  return data ? JSON.parse(data) : [];
}

function loadSpecificConversation(id) {
  const conversations = getStoredConversations();
  const conversation = conversations.find(c => c.id === id);

  if (conversation) {
    const chatZone = document.getElementById('chat-zone');
    if (chatZone) {
      chatZone.innerHTML = conversation.content;
      currentPersonality = conversation.personality;
      updatePersonalityUI(conversation.personality);
      console.log('✅ Conversation chargée:', conversation.name);
    }
  }
}

function loadLastConversation() {
  const conversations = getStoredConversations();
  if (conversations.length > 0) {
    const lastLoaded = localStorage.getItem('last_loaded_conversation');
    if (lastLoaded) {
      loadSpecificConversation(parseInt(lastLoaded));
      return;
    }
  }
}

// Paramètres utilisateur
function saveSetting(key, value) {
  const settings = getSettings();
  settings[key] = value;
  localStorage.setItem(storageConfig.settingsKey, JSON.stringify(settings));
}

function getSetting(key, defaultValue = null) {
  const settings = getSettings();
  return settings[key] ?? defaultValue;
}

function getSettings() {
  const data = localStorage.getItem(storageConfig.settingsKey);
  return data ? JSON.parse(data) : {};
}

// Cacher la dernière conversation accédée
function saveLastConversation(id) {
  localStorage.setItem('last_loaded_conversation', id);
}

// Exporter
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initStorage,
    saveConversationToStorage,
    getStoredConversations,
    loadSpecificConversation,
    saveSetting,
    getSetting,
  };
}
