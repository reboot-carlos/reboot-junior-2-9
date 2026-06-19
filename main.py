from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import re
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


class MusiqueRequest(BaseModel):
    humeur:         str       = "Motivé(e)"
    genres:         List[str] = []
    artistes_aimes: str       = ""
    avec_tendances: bool      = True


class MusiqueResponse(BaseModel):
    recommandations: str


class CorrectionRequest(BaseModel):
    texte:      str
    niveau:     str = "6ème-5ème"
    type_texte: str = "Rédaction"


class CorrectionResponse(BaseModel):
    correction: str


class PlanningExam(BaseModel):
    matiere: str
    date:    str
    maitrise: str = "Quelques notions"
    type:    str  = "Contrôle"


class PlanningRequest(BaseModel):
    examens:           List[PlanningExam]
    heures_par_jour:   int       = 2
    jours_disponibles: List[str] = []
    notes:             str       = ""


class PlanningResponse(BaseModel):
    planning: str


class OutfitRequest(BaseModel):
    description:  str           = ""
    image_base64: Optional[str] = None
    media_type:   str           = "image/jpeg"
    saison:       str           = "Printemps"
    occasion:     str           = "Casual"
    style:        str           = "Streetwear"


class OutfitResponse(BaseModel):
    suggestions: str


class QuizRequest(BaseModel):
    sujet:        str           = ""
    texte:        str           = ""
    image_base64: Optional[str] = None
    media_type:   str           = "image/jpeg"
    nb_questions: int           = 5
    difficulte:   str           = "moyen"
    langue:       str           = "fr"


class QuizQuestion(BaseModel):
    question:     str
    choix:        List[str]
    bonne_reponse: int
    explication:  str


class QuizResponse(BaseModel):
    titre:     str
    questions: List[QuizQuestion]


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


# ── Recommandations musicales ────────────────────────────────────────────────

@app.post("/musique")
def recommander_musique(request: MusiqueRequest) -> MusiqueResponse:
    if not client:
        return MusiqueResponse(recommandations="❌ Claude API non disponible.")

    genres_str  = ", ".join(request.genres) if request.genres else "tous genres"
    artistes_str = request.artistes_aimes.strip()

    prompt = (
        f"Humeur : {request.humeur}\n"
        f"Genres préférés : {genres_str}\n"
        + (f"Artistes aimés : {artistes_str}\n" if artistes_str else "")
        + "\n"
        "Recommande des musiques personnalisées en respectant EXACTEMENT ce format :\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🎵 PLAYLIST IA — {request.humeur.upper()}\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🔥 HITS EN CE MOMENT (TikTok & Réseaux)\n"
        "1. [Artiste] — « [Titre] »\n"
        "   → [Pourquoi cette chanson colle à l'humeur - 1 ligne]\n"
        "[Donne 6 chansons tendance réelles et populaires]\n\n"
        "🎵 SÉLECTION POUR TON HUMEUR\n"
        "1. [Artiste] — « [Titre] » ([année/album])\n"
        "   🎯 [Pourquoi c'est parfait maintenant]\n"
        "[Donne 8 chansons parfaitement adaptées à l'humeur]\n\n"
        "💿 ARTISTES À DÉCOUVRIR MAINTENANT\n"
        "• [Artiste] — [Genre] | Si tu aimes [artiste similaire], tu vas adorer parce que [raison]\n"
        "[Donne 4 artistes à découvrir]\n\n"
        "📱 PLAYLISTS PARFAITES (Spotify / YouTube)\n"
        '• "[Nom de playlist connue]" — [Ambiance en 5 mots]\n'
        "[Donne 4 playlists réelles et connues]\n\n"
        "⭐ LE COUP DE CŒUR DU DJ IA\n"
        "[Une chanson coup de cœur avec une explication enthousiaste de 2-3 phrases]\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "💬 Fun fact musical\n"
        "[Un fait insolite sur la musique ou sur un des artistes recommandés]"
    )

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1800,
            system=(
                "Tu es un DJ et expert musical pour jeunes (10-18 ans). "
                "Tu connais parfaitement les tendances musicales TikTok, Spotify, YouTube. "
                "Tu recommandes des vraies chansons et artistes populaires récents. "
                "Tes recommandations sont fun, enthousiasmes et hyper personnalisées. "
                "Tu connais la scène française (Aya Nakamura, Freeze Corleone, Gazo, PNL...) "
                "et internationale (Taylor Swift, Drake, Billie Eilish, NewJeans, Bad Bunny...)."
            ),
            messages=[{"role": "user", "content": prompt}],
        )
        print(f"✅ Playlist générée : {request.humeur} / {genres_str}")
        return MusiqueResponse(recommandations=message.content[0].text)

    except Exception as e:
        print(f"❌ Erreur musique: {e}")
        return MusiqueResponse(recommandations="❌ Erreur lors de la génération. Réessaie !")


# ── Correcteur de texte ──────────────────────────────────────────────────────

@app.post("/corriger")
def corriger_texte(request: CorrectionRequest) -> CorrectionResponse:
    if not client:
        return CorrectionResponse(correction="❌ Claude API non disponible.")

    texte = request.texte.strip()
    if not texte:
        return CorrectionResponse(correction="❌ Le texte est vide.")

    niveaux = {
        "CM1-CM2":    "primaire (CM1-CM2, 9-11 ans). Corrections simples, vocabulaire accessible, encouragements++",
        "6ème-5ème":  "collège début (6ème-5ème, 11-13 ans). Corrections orthographe + grammaire de base",
        "4ème-3ème":  "collège fin (4ème-3ème, 13-15 ans). Corrections complètes + style + cohérence",
        "Lycée":      "lycée (15-18 ans). Corrections approfondies, style, argumentation, syntaxe avancée",
    }
    desc_niveau = niveaux.get(request.niveau, niveaux["6ème-5ème"])

    prompt = (
        f"Voici un {request.type_texte} d'un(e) élève de niveau {request.niveau} :\n\n"
        f"--- TEXTE ORIGINAL ---\n{texte}\n--- FIN DU TEXTE ---\n\n"
        "Corrige ce texte en respectant EXACTEMENT ce format :\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "✅ TEXTE CORRIGÉ\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "[Le texte entièrement réécrit avec TOUTES les corrections intégrées]\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "📋 MES CORRECTIONS (liste chaque faute trouvée)\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        '❌ "[mot/phrase fautif]"  →  ✅ "[correction]"\n'
        "   💡 [Explication courte et claire]\n\n"
        "[Répète pour chaque faute, numérotée]\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "✨ SUGGESTIONS D'AMÉLIORATION\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "• [Suggestion 1 : vocabulaire, structure, connecteurs...]\n"
        "• [Suggestion 2]\n"
        "• [Suggestion 3]\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "📊 BILAN\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "• Fautes d'orthographe : [nombre]\n"
        "• Fautes de grammaire/conjugaison : [nombre]\n"
        "• Ponctuation : [commentaire]\n"
        "• Style : [commentaire adapté au niveau]\n"
        "• 🌟 Note estimée : [X/20]\n\n"
        "💪 [Message d'encouragement personnalisé et bienveillant]"
    )

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            system=(
                f"Tu es un professeur de français bienveillant pour un(e) élève de {desc_niveau}. "
                "Tu corriges les textes avec précision mais bienveillance. "
                "Tu expliques chaque erreur clairement et simplement. "
                "Tu adaptes ton niveau d'exigence et de vocabulaire au niveau scolaire. "
                "Tu termines toujours par un encouragement positif et motivant."
            ),
            messages=[{"role": "user", "content": prompt}],
        )
        print(f"✅ Correction générée ({len(texte)} chars, niveau {request.niveau})")
        return CorrectionResponse(correction=message.content[0].text)

    except Exception as e:
        print(f"❌ Erreur correction: {e}")
        return CorrectionResponse(correction="❌ Erreur lors de la correction. Réessaie !")


# ── Planning de révision ─────────────────────────────────────────────────────

@app.post("/planning")
def creer_planning(request: PlanningRequest) -> PlanningResponse:
    if not client:
        return PlanningResponse(planning="❌ Claude API non disponible. Configure ta clé dans .env")

    if not request.examens:
        return PlanningResponse(planning="❌ Ajoute au moins un examen !")

    # Formater la liste des examens
    lignes_examens = "\n".join(
        f"  • {ex.matiere} — {ex.type} le {ex.date} "
        f"(niveau : {ex.maitrise})"
        for ex in sorted(request.examens, key=lambda e: e.date)
    )

    jours_str = ", ".join(request.jours_disponibles) if request.jours_disponibles else "Tous les jours"
    notes_str = f"\nInfos supplémentaires : {request.notes}" if request.notes.strip() else ""

    prompt = (
        f"Voici les examens à préparer :\n{lignes_examens}\n\n"
        f"Disponibilités :\n"
        f"  • {request.heures_par_jour}h de révision par jour\n"
        f"  • Jours disponibles : {jours_str}"
        f"{notes_str}\n\n"
        "Crée un programme de révision PERSONNALISÉ, RÉALISTE et MOTIVANT. "
        "Respecte EXACTEMENT ce format :\n\n"
        "📅 MON PROGRAMME DE RÉVISION PERSONNALISÉ\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🎯 MES PRIORITÉS\n"
        "• [Matière la plus urgente/difficile] — [pourquoi en priorité]\n"
        "• [Matière suivante] — [raison]\n"
        "(liste toutes les matières par priorité)\n\n"
        "📆 MON PLANNING JOUR PAR JOUR\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "[Pour chaque jour disponible jusqu'au dernier examen :]\n"
        "📌 [Jour] [Date]\n"
        f"  🕐 Créneau 1 ([durée]) : [Matière] — [activité précise ex: fiches résumé chapitre X]\n"
        f"  🕐 Créneau 2 ([durée]) : [Matière] — [activité précise]\n"
        "  ⏸️ Pause de 10 min entre chaque créneau !\n\n"
        "[Répète pour chaque jour. La veille d'un examen, révision légère uniquement.]\n\n"
        "💡 MES ASTUCES PERSONNALISÉES\n"
        "• [Conseil adapté à la situation de cet élève]\n"
        "• [Conseil méthode de révision]\n"
        "• [Conseil bien-être/gestion du stress]\n\n"
        "💪 MON MOT DE MOTIVATION\n"
        "[Phrase motivante et bienveillante personnalisée selon les examens]"
    )

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            system=(
                "Tu es un expert en méthodes d'apprentissage et révision pour collégiens (11-15 ans). "
                "Tu crées des plannings réalistes, motivants et adaptés à chaque élève. "
                "Tu tiens compte du niveau de maîtrise, du temps disponible et des dates d'examens. "
                "Tes plannings sont concrets (activités précises, pas vague), bienveillants et encourageants."
            ),
            messages=[{"role": "user", "content": prompt}],
        )
        print(f"✅ Planning généré pour {len(request.examens)} examen(s)")
        return PlanningResponse(planning=message.content[0].text)

    except Exception as e:
        print(f"❌ Erreur planning: {e}")
        return PlanningResponse(planning="❌ Erreur lors de la génération. Réessaie dans quelques instants !")


# ── Mode & Outfit ────────────────────────────────────────────────────────────

@app.post("/outfit")
def suggerer_outfit(request: OutfitRequest) -> OutfitResponse:
    if not client:
        return OutfitResponse(suggestions="❌ Claude API non disponible. Configure ta clé dans .env")

    if not request.description.strip() and not request.image_base64:
        return OutfitResponse(suggestions="❌ Décris tes vêtements ou envoie une photo !")

    prompt = (
        f"Vêtements disponibles : {request.description or '(voir la photo ci-jointe)'}\n"
        f"Saison : {request.saison}\n"
        f"Occasion : {request.occasion}\n"
        f"Style recherché : {request.style}\n\n"
        "Propose 3 idées de tenues créatives et adaptées. "
        "Utilise EXACTEMENT ce format pour chaque tenue :\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "✨ TENUE [N] — [Nom créatif de la tenue]\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "👕 Haut : [description précise]\n"
        "👖 Bas : [description précise]\n"
        "👟 Chaussures : [suggestion]\n"
        "💎 Accessoires : [sac, bijoux, casquette...]\n"
        "💡 Astuce style : [conseil en 1 phrase]\n\n"
        "[Répète ce format pour les 3 tenues]\n\n"
        "🌟 CONSEIL DU STYLISTE\n"
        "[Un conseil mode personnalisé selon la saison et l'occasion — 2 phrases max]"
    )

    try:
        if request.image_base64:
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
                    "text": f"Voici une photo de la garde-robe. "
                            f"{'Infos complémentaires : ' + request.description if request.description else ''}\n\n{prompt}",
                },
            ]
        else:
            content = prompt

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            system=(
                "Tu es un styliste de mode expert, bienveillant et fun pour jeunes (10-18 ans). "
                "Tu proposes des tenues créatives, accessibles et adaptées à tous les styles et morphologies. "
                "Tu utilises des emojis pour rendre tes suggestions visuelles et attrayantes. "
                "Tes conseils sont positifs et inclusifs."
            ),
            messages=[{"role": "user", "content": content}],
        )
        print(f"✅ Outfit généré : {request.saison} / {request.occasion} / {request.style}")
        return OutfitResponse(suggestions=message.content[0].text)

    except Exception as e:
        print(f"❌ Erreur outfit: {e}")
        return OutfitResponse(suggestions="❌ Erreur lors de la génération. Réessaie dans quelques instants !")


# ── Quiz Inhabituel ──────────────────────────────────────────────────────────

def _clean_json(text: str) -> str:
    """Extrait le JSON de la réponse Claude (supprime les blocs markdown)."""
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*',     '', text)
    text = text.strip()
    start, end = text.find('{'), text.rfind('}') + 1
    if start != -1 and end > start:
        text = text[start:end]
    return text


@app.post("/quiz")
def creer_quiz(request: QuizRequest) -> QuizResponse:
    if not client:
        return QuizResponse(
            titre="Quiz non disponible",
            questions=[QuizQuestion(
                question="Claude API non configurée.",
                choix=["Configure .env", "...", "...", "..."],
                bonne_reponse=0,
                explication="Ajoute ta clé ANTHROPIC_API_KEY dans .env"
            )]
        )

    sujet_affiche = request.sujet or "le cours fourni"
    diff_map      = {"facile": "simples", "moyen": "modérées", "difficile": "difficiles et subtiles"}
    niveau        = diff_map.get(request.difficulte, "modérées")

    json_template = (
        '{\n'
        '  "titre": "Quiz Inhabituel : [SUJET]",\n'
        '  "questions": [\n'
        '    {\n'
        '      "question": "Ta question surprenante ici ?",\n'
        '      "choix": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],\n'
        '      "bonne_reponse": 0,\n'
        '      "explication": "Explication courte et mémorable."\n'
        '    }\n'
        '  ]\n'
        '}'
    )

    instructions = (
        f"Génère EXACTEMENT {request.nb_questions} questions de difficulté {niveau} "
        f"sur : {sujet_affiche}.\n\n"
        "RÈGLES IMPORTANTES :\n"
        "- Questions INHABITUELLES et surprenantes (pas les classiques ennuyeuses)\n"
        "- Inclure des faits insolites, analogies amusantes, connexions inattendues\n"
        "- Les mauvaises réponses doivent être plausibles\n"
        "- Explication courte, claire et mémorable\n"
        "- Toujours 4 choix (index 0 à 3), bonne_reponse = index correct\n\n"
        f"Réponds UNIQUEMENT avec ce JSON (rien d'autre, aucun texte autour) :\n{json_template}"
    )

    try:
        if request.image_base64:
            content = [
                {
                    "type": "image",
                    "source": {
                        "type":       "base64",
                        "media_type": request.media_type,
                        "data":       request.image_base64,
                    },
                },
                {"type": "text", "text": f"Analyse ce cours en image puis :\n{instructions}"},
            ]
        elif request.texte:
            content = f"Voici le cours :\n\n{request.texte}\n\n{instructions}"
        else:
            content = instructions

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            system=(
                "Tu es un créateur de quiz INHABITUEL et surprenant pour collégiens (11-15 ans). "
                "Tes questions sont originales, inattendues, amusantes. "
                "Tu génères UNIQUEMENT du JSON valide, rien d'autre."
            ),
            messages=[{"role": "user", "content": content}],
        )

        raw  = message.content[0].text
        data = json.loads(_clean_json(raw))

        questions = [
            QuizQuestion(
                question      = q["question"],
                choix         = q["choix"][:4],
                bonne_reponse = int(q["bonne_reponse"]),
                explication   = q.get("explication", ""),
            )
            for q in data.get("questions", [])
        ]

        print(f"✅ Quiz généré : {len(questions)} questions sur '{sujet_affiche}'")
        return QuizResponse(titre=data.get("titre", f"Quiz : {sujet_affiche}"), questions=questions)

    except Exception as e:
        print(f"❌ Erreur quiz: {e}")
        return QuizResponse(
            titre="Erreur",
            questions=[QuizQuestion(
                question     = "Une erreur est survenue lors de la génération.",
                choix        = ["Réessaie !", "...", "...", "..."],
                bonne_reponse = 0,
                explication  = str(e)[:100],
            )]
        )


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
