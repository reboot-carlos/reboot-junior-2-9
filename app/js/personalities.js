/**
 * personalities.js - Gestion des personnalités du chatbot
 */

let currentPersonality = 'prof';
let personalities = [];

class PersonalityManager {
  static setPersonality(personalityId, personalityData) {
    currentPersonality = personalityId;
    localStorage.setItem('current_personality', personalityId);
    console.log(`🎭 Personnalité changée: ${personalityId}`);

    // Rafraîchir la conversation
    refreshConversation(personalityData);

    // Mettre à jour l'UI
    updatePersonalityUI(personalityId);
  }

  static getPersonality(personalityId) {
    return personalities.find(p => p.id === personalityId);
  }

  static getCurrentPersonality() {
    return this.getPersonality(currentPersonality);
  }

  static adaptResponse(response, personalityId) {
    const personality = this.getPersonality(personalityId);
    if (!personality) return response;

    switch (personality.style) {
      case 'pédagogue':
        return response + '<br><br>💡 <em>N\'hésite pas à poser d\'autres questions !</em>';
      case 'amical':
        return response + '<br><br>Et toi, tu en penses quoi ? 🤔';
      case 'créatif':
        return response + '<br><br>✨ <em>La vie est plus belle quand on la colore de rêves !</em> 🌈';
      default:
        return response;
    }
  }
}

function refreshConversation(personalityData) {
  const chatZone = document.getElementById('chat-zone');
  if (!chatZone) return;

  chatZone.innerHTML = '';
  const greeting = personalityData.greeting || 'Bienvenue!';
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';
  messageDiv.innerHTML = greeting;
  chatZone.appendChild(messageDiv);

  // Scroller vers le bas
  chatZone.scrollTop = chatZone.scrollHeight;
}

function updatePersonalityUI(personalityId) {
  // Mettre à jour les boutons de personnalité dans la sidebar
  document.querySelectorAll('.personality-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.querySelector(`[data-personality="${personalityId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Fonction pour charger les personnalités au démarrage
function loadPersonalities(personalitiesData) {
  personalities = personalitiesData;

  // Charger la dernière personnalité utilisée ou utiliser la défaut
  const saved = localStorage.getItem('current_personality') || 'prof';
  currentPersonality = saved;

  console.log(`✅ ${personalities.length} personnalités chargées`);
}

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PersonalityManager, loadPersonalities };
}
