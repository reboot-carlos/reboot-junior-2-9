from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from anthropic import Anthropic
from dotenv import load_dotenv

# Charge les variables d'environnement du fichier .env
load_dotenv()

app = FastAPI(title="Chatbot Rosee API")

# Initialise le client Claude
API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
client = Anthropic(api_key=API_KEY) if API_KEY else None

print("=" * 50)
if API_KEY:
    print("✅ Clé API Claude détectée")
    print("🤖 Claude API intégrée et active !")
else:
    print("⚠️  Pas de clé API Claude détectée")
    print("📖 Le chatbot utilisera le mode local")
    print("💡 Pour activer Claude, ajoute ta clé dans le fichier .env")
print("=" * 50)

# CORS - Pour que ton HTML puisse faire des requêtes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèle de la requête
class MessageRequest(BaseModel):
    texte: str
    langue: str = "fr"

# Modèle de la réponse
class MessageResponse(BaseModel):
    reponse: str
    score: Optional[int] = None

# Base de connaissances du chatbot (tu peux l'étendre)
base_de_connaissances = {
    "fr": {
        "bonjour": "Salut ! 💕 Je suis super contente de t'aider ! Comment puis-je t'assister aujourd'hui ? 📚✨",
        "qui_es_tu": "Je suis TA CHATBOT ROSEE ! 🌹 Je suis créée pour t'aider avec tes devoirs, tes questions d'école et plein d'autres choses ! Je suis intelligent et je peux te donner des explications détaillées ! 💡✨",
        "merci": "De rien ! 💕 C'est mon plaisir de t'aider ! 🎀",
    },
    "en": {
        "hello": "Hello! 💕 I'm so happy to help you! What can I do for you today? 📚✨",
        "who_are_you": "I'm YOUR CHATBOT ROSEE! 🌹 I'm created to help you with homework, school questions and much more! I'm intelligent and can give you detailed explanations! 💡✨",
        "thank_you": "You're welcome! 💕 It's my pleasure to help you! 🎀",
    },
    "he": {
        "shalom": "שלום! 💕 אני כל כך שמחה לעזור לך! מה אני יכולה לעשות בשבילך היום? 📚✨",
        "who": "אני ה-CHATBOT ROSEE שלך! 🌹 אני נוצרתי כדי לעזור לך בשיעורי בית, שאלות בבית ספר ועוד הרבה דברים! 💡✨",
        "todah": "בכיף! 💕 זה ההנאה שלי לעזור לך! 🎀",
    }
}

def normaliser_texte(texte: str) -> str:
    """Enlève les accents et met en minuscules"""
    import unicodedata
    texte = texte.lower()
    texte = unicodedata.normalize('NFD', texte)
    texte = ''.join(char for char in texte if unicodedata.category(char) != 'Mn')
    return texte

def traiter_avec_claude(texte: str, langue: str) -> str:
    """Utilise Claude API pour répondre intelligemment"""
    if not client or not API_KEY:
        return None

    prompts = {
        "fr": f"""Tu es TA CHATBOT ROSEE, une assistante intelligente créée pour aider les collégiens avec leurs questions d'école.

Réponds toujours en français, de manière courte et intelligente (2-3 phrases max).
Ajoute des emojis pertinents.
Sois sympathique et encourageant.

Question de l'utilisateur: {texte}

Réponds directement sans préambule.""",
        "en": f"""You are CHATBOT ROSEE, an intelligent assistant created to help students with their school questions.

Always respond in English, briefly and intelligently (2-3 sentences max).
Add relevant emojis.
Be friendly and encouraging.

User question: {texte}

Answer directly without preamble.""",
        "he": f"""אתה CHATBOT ROSEE, עוזרת חכמה שנוצרה כדי לעזור לתלמידים עם שאלות בבית ספר.

תגיבי תמיד בעברית, בקצרה ובחכמה (מקסימום 2-3 משפטים).
הוסף אימוג'י רלוונטיים.
היה ידידותי ומעודד.

שאלת המשתמש: {texte}

ענה ישירות ללא הקדמה."""
    }

    try:
        prompt = prompts.get(langue, prompts["fr"])
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        print(f"✅ Réponse Claude pour: {texte[:30]}...")
        return message.content[0].text
    except Exception as e:
        print(f"❌ Erreur Claude API: {e}")
        return None

def traiter_question(texte: str, langue: str) -> str:
    """Traite la question et retourne une réponse intelligente"""
    texte_normalise = normaliser_texte(texte)

    # Essayer Claude API d'abord
    reponse_claude = traiter_avec_claude(texte, langue)
    if reponse_claude:
        return reponse_claude

    # Sinon, utiliser les mots-clés
    mots_cles = {
        "fr": {
            "bonjour": ["bonjour", "salut", "coucou", "hello", "yo"],
            "qui_es_tu": ["qui es-tu", "qui es tu", "ton nom", "tu es qui"],
            "merci": ["merci", "thanks", "merci beaucoup"],
            "aide": ["aide", "help", "commandes", "?"],
        },
        "en": {
            "hello": ["hello", "hi", "hey", "bonjour"],
            "who_are_you": ["who are you", "who is", "your name"],
            "thank_you": ["thank you", "thanks"],
            "help": ["help", "aide", "commands", "?"],
        },
        "he": {
            "shalom": ["שלום", "היי", "הי", "hello"],
            "who": ["מי אתה", "מי אני", "שמך"],
            "todah": ["תודה", "thanks"],
            "help": ["עזרה", "help"],
        }
    }

    # Chercher les mots-clés
    base = base_de_connaissances.get(langue, base_de_connaissances["fr"])
    cles = mots_cles.get(langue, mots_cles["fr"])

    for cle, mots in cles.items():
        for mot in mots:
            if mot in texte_normalise:
                return base.get(cle, "Je n'ai pas compris 🤔 Peux-tu reformuler ?")

    # Réponse par défaut si rien n'est reconnu
    return "Hmm, je n'ai pas bien compris ta question ! 🤔 Peux-tu la reformuler ? 💕"

@app.get("/")
def lire_racine():
    """Endpoint de test"""
    return {"message": "Chatbot Rosee API est actif ! 🌹💕"}

@app.post("/chat")
def chat(message: MessageRequest) -> MessageResponse:
    """
    Endpoint pour traiter un message du chatbot

    Exemple:
    {
        "texte": "Bonjour",
        "langue": "fr"
    }
    """
    if not message.texte.strip():
        return MessageResponse(reponse="S'il te plaît écris quelque chose ! 💕")

    reponse = traiter_question(message.texte, message.langue)

    return MessageResponse(
        reponse=reponse,
        score=len(reponse)
    )

@app.get("/langues")
def get_langues():
    """Retourne les langues disponibles"""
    return {
        "langues": ["fr", "en", "he"],
        "descriptions": {
            "fr": "Français",
            "en": "English",
            "he": "עברית"
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Lance le serveur sur localhost:8000
    uvicorn.run(app, host="127.0.0.1", port=8001)
