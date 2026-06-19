from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Chatbot Rosee API")

API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
client = Anthropic(api_key=API_KEY) if API_KEY else None

print("=" * 50)
if API_KEY:
    print("✅ Clé API Claude détectée")
    print("🤖 Claude API intégrée et active !")
else:
    print("⚠️  Pas de clé API Claude — mode local activé")
print("=" * 50)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageRequest(BaseModel):
    texte: str
    langue: str = "fr"


class FicheRequest(BaseModel):
    texte:        str           = ""
    image_base64: Optional[str] = None
    media_type:   str           = "image/jpeg"
    langue:       str           = "fr"


class FicheResponse(BaseModel):
    fiche: str


class MessageResponse(BaseModel):
    reponse: str
    score: Optional[int] = None


base_de_connaissances = {
    "fr": {
        "bonjour": "Salut ! 💕 Je suis super contente de t'aider ! Comment puis-je t'assister aujourd'hui ? 📚✨",
        "qui_es_tu": "Je suis TA CHATBOT ROSEE ! 🌹 Je suis là pour t'aider avec tes devoirs et tes questions ! 💡✨",
        "merci": "De rien ! 💕 C'est mon plaisir de t'aider ! 🎀",
    },
    "en": {
        "hello": "Hello! 💕 I'm so happy to help you! What can I do for you today? 📚✨",
        "who_are_you": "I'm YOUR CHATBOT ROSEE! 🌹 I'm here to help with homework and questions! 💡✨",
        "thank_you": "You're welcome! 💕 It's my pleasure to help you! 🎀",
    },
    "he": {
        "shalom": "שלום! 💕 אני כל כך שמחה לעזור לך! 📚✨",
        "who": "אני ה-CHATBOT ROSEE שלך! 🌹 אני כאן כדי לעזור! 💡✨",
        "todah": "בכיף! 💕 זה ההנאה שלי לעזור לך! 🎀",
    },
}


def normaliser_texte(texte: str) -> str:
    import unicodedata
    texte = texte.lower()
    texte = unicodedata.normalize("NFD", texte)
    return "".join(c for c in texte if unicodedata.category(c) != "Mn")


def traiter_avec_claude(texte: str, langue: str) -> Optional[str]:
    if not client:
        return None

    prompts = {
        "fr": (
            f"Tu es TA CHATBOT ROSEE, une assistante intelligente pour collégiens.\n"
            f"Réponds en français, en 2-3 phrases max, avec des emojis, de façon sympathique.\n\n"
            f"Question: {texte}\n\nRéponds directement."
        ),
        "en": (
            f"You are CHATBOT ROSEE, an intelligent assistant for students.\n"
            f"Answer in English, 2-3 sentences max, with emojis, in a friendly way.\n\n"
            f"Question: {texte}\n\nAnswer directly."
        ),
        "he": (
            f"אתה CHATBOT ROSEE, עוזרת חכמה לתלמידים.\n"
            f"ענה בעברית, עד 3 משפטים, עם אימוג'י, בצורה ידידותית.\n\n"
            f"שאלה: {texte}\n\nענה ישירות."
        ),
    }

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompts.get(langue, prompts["fr"])}],
        )
        print(f"✅ Claude: {texte[:40]}...")
        return message.content[0].text
    except Exception as e:
        print(f"❌ Erreur Claude: {e}")
        return None


def traiter_question(texte: str, langue: str) -> str:
    texte_norm = normaliser_texte(texte)

    reponse_claude = traiter_avec_claude(texte, langue)
    if reponse_claude:
        return reponse_claude

    mots_cles = {
        "fr": {
            "bonjour": ["bonjour", "salut", "coucou", "hello", "yo"],
            "qui_es_tu": ["qui es-tu", "qui es tu", "ton nom", "tu es qui"],
            "merci": ["merci", "merci beaucoup"],
        },
        "en": {
            "hello": ["hello", "hi", "hey"],
            "who_are_you": ["who are you", "your name"],
            "thank_you": ["thank you", "thanks"],
        },
        "he": {
            "shalom": ["שלום", "היי"],
            "who": ["מי אתה", "שמך"],
            "todah": ["תודה"],
        },
    }

    base = base_de_connaissances.get(langue, base_de_connaissances["fr"])
    cles = mots_cles.get(langue, mots_cles["fr"])

    for cle, mots in cles.items():
        if any(mot in texte_norm for mot in mots):
            return base.get(cle, "Je n'ai pas compris 🤔 Peux-tu reformuler ?")

    return "Hmm, je n'ai pas bien compris ta question ! 🤔 Peux-tu la reformuler ? 💕"


# ── API routes (must be declared BEFORE static mounts) ───────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "claude": bool(client)}


@app.post("/chat")
def chat(message: MessageRequest) -> MessageResponse:
    if not message.texte.strip():
        return MessageResponse(reponse="S'il te plaît écris quelque chose ! 💕")
    reponse = traiter_question(message.texte, message.langue)
    return MessageResponse(reponse=reponse, score=len(reponse))


@app.get("/langues")
def get_langues():
    return {
        "langues": ["fr", "en", "he"],
        "descriptions": {"fr": "Français", "en": "English", "he": "עברית"},
    }


# ── Fiche de révision ────────────────────────────────────────────────────────

FICHE_PROMPT = """\
Tu es un assistant pédagogique pour collégiens (11-15 ans). \
Crée une FICHE DE RÉVISION claire et bien structurée. \
Utilise un langage simple, des emojis pour rendre la fiche attrayante, \
et respecte EXACTEMENT ce format :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 [TITRE DU COURS EN MAJUSCULES]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 MOTS-CLÉS ET DÉFINITIONS
• [Mot clé] → [Définition courte et claire]
• [Mot clé] → [Définition courte et claire]
(liste tous les mots importants du cours)

📖 L'ESSENTIEL EN 3 PHRASES
[Résumé du cours en 3 phrases simples]

🔑 À RETENIR ABSOLUMENT
⭐ [Point crucial 1]
⭐ [Point crucial 2]
⭐ [Point crucial 3]
(ajoute autant de points que nécessaire)

📊 DATES / CHIFFRES / FORMULES
• [Si applicable : dates historiques, formules de maths/physique, \
statistiques importantes. Écris "Rien de spécifique" si vide]

❓ QUESTIONS D'ENTRAÎNEMENT
1. [Question facile]
2. [Question moyenne]
3. [Question difficile]

💪 ASTUCE POUR MÉMORISER
[Un moyen mnémotechnique ou conseil pratique adapté au sujet]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


@app.post("/fiche")
def creer_fiche(request: FicheRequest) -> FicheResponse:
    if not client:
        return FicheResponse(
            fiche="❌ Claude API non disponible.\n"
                  "Configure ta clé ANTHROPIC_API_KEY dans le fichier .env"
        )

    if not request.texte.strip() and not request.image_base64:
        return FicheResponse(fiche="❌ Envoie un texte ou une image de ton cours !")

    try:
        if request.image_base64:
            # Mode vision : analyse la photo du cours
            content = [
                {
                    "type": "image",
                    "source": {
                        "type":       "base64",
                        "media_type": request.media_type,
                        "data":       request.image_base64,
                    },
                },
                {
                    "type": "text",
                    "text": (
                        f"Voici une photo d'un cours. "
                        f"{'Voici aussi du texte complémentaire : ' + request.texte if request.texte else ''}\n\n"
                        f"Crée une fiche de révision en suivant EXACTEMENT ce format :\n{FICHE_PROMPT}"
                    ),
                },
            ]
        else:
            content = (
                f"Voici le cours :\n\n{request.texte}\n\n"
                f"Crée une fiche de révision en suivant EXACTEMENT ce format :\n{FICHE_PROMPT}"
            )

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1800,
            system=(
                "Tu es un assistant pédagogique expert pour collégiens (11-15 ans). "
                "Tu crées des fiches de révision claires, structurées et motivantes. "
                "Tu utilises un langage simple et des emojis. "
                "Tu RESPECTES TOUJOURS le format demandé."
            ),
            messages=[{"role": "user", "content": content}],
        )
        print(f"✅ Fiche générée ({len(message.content[0].text)} chars)")
        return FicheResponse(fiche=message.content[0].text)

    except Exception as e:
        print(f"❌ Erreur fiche: {e}")
        return FicheResponse(
            fiche="❌ Une erreur est survenue. Réessaie dans quelques instants !"
        )


# ── Static frontend routes ────────────────────────────────────────────────────
# Explicit routes for root-level files (prevents exposing main.py etc.)

@app.get("/")
def serve_index():
    return FileResponse("index.html")


@app.get("/landing.html")
def serve_landing():
    return FileResponse("landing.html")


@app.get("/test.html")
def serve_test():
    return FileResponse("test.html")


@app.get("/config.json")
def serve_config():
    return FileResponse("config.json", media_type="application/json")


@app.get("/plage.svg")
def serve_svg():
    return FileResponse("plage.svg", media_type="image/svg+xml")


@app.get("/2e87c374b4c9c8609ea04f1455684d60.jpeg")
def serve_bg():
    return FileResponse(
        "2e87c374b4c9c8609ea04f1455684d60.jpeg", media_type="image/jpeg"
    )


# Mount /app directory last (serves chatbot.html, css/, js/, data/)
app.mount("/app", StaticFiles(directory="app"), name="app_static")


# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
