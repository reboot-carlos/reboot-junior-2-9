# 🌹 TA CHATBOT ROSEE - Guide d'utilisation

## 📋 Structure du projet

- **index.html** : Ton chatbot (interface utilisateur)
- **main.py** : Backend FastAPI (traitement intelligent)
- **requirements.txt** : Dépendances Python

## 🚀 Comment lancer le chatbot avec FastAPI

### Étape 1 : Installer les dépendances

```bash
cd /home/rebootconseil/Documents/RebootJR
pip install -r requirements.txt
```

### Étape 2 : Lancer le serveur FastAPI

```bash
python main.py
```

Tu devrais voir :
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Étape 3 : Ouvrir le chatbot

Ouvre `index.html` dans ton navigateur. Le chatbot va automatiquement :
- ✅ Utiliser l'API FastAPI si le serveur est disponible
- ✅ Fonctionner en mode local si le serveur n'est pas lancé

## 📚 Comment ça marche

### Mode avec API (Recommandé)
1. Tu écris un message dans le chatbot
2. Le navigateur envoie la requête au serveur FastAPI (`http://localhost:8000/chat`)
3. Le serveur Python traite ta question
4. La réponse s'affiche dans le chatbot

### Mode sans API (Fallback)
Si le serveur FastAPI n'est pas disponible, le chatbot fonctionne localement avec le code JavaScript existant.

## 🔧 Comment ajouter des réponses intelligentes

### Dans `main.py` (côté serveur Python)

```python
base_de_connaissances = {
    "fr": {
        "math": "Les mathématiques c'est cool ! 📐",
        "histoire": "L'histoire nous aide à comprendre le présent ! 📚",
    }
}

mots_cles = {
    "fr": {
        "math": ["math", "mathematique", "calcul"],
        "histoire": ["histoire", "histoire-geo"],
    }
}
```

### Ou dans `index.html` (mode local)

Tu peux continuer à modifier la `baseDeConnaissances` et les `messages` comme avant !

## 📡 Endpoints FastAPI disponibles

### 1. Test du serveur
```
GET http://localhost:8000/
```
Réponse: `{"message": "Chatbot Rosee API est actif ! 🌹💕"}`

### 2. Chat avec le chatbot
```
POST http://localhost:8000/chat
```

Body:
```json
{
  "texte": "Bonjour",
  "langue": "fr"
}
```

Réponse:
```json
{
  "reponse": "Salut ! 💕 Je suis super contente de t'aider ! ...",
  "score": 85
}
```

### 3. Voir les langues disponibles
```
GET http://localhost:8000/langues
```

## 🎮 Jeu du Serpent

Le jeu du serpent s'active automatiquement quand tu attends une réponse ! 🐍
- Contrôles : Flèches ou ZQSD
- Attrape les pommes pour grandir !

## 🌍 Langues supportées

- 🇫🇷 Français
- 🇬🇧 English
- 🇮🇱 עברית

## ⚡ Améliorations possibles

1. Ajouter une base de données pour sauvegarder les conversations
2. Intégrer un vrai modèle d'IA (Claude API, etc.)
3. Ajouter l'authentification utilisateur
4. Créer un admin dashboard pour gérer les réponses

## 🐛 Troubleshooting

### "Erreur CORS"
C'est normal si tu lances le HTML localement. La CORS est configurée pour accepter tous les domaines en développement.

### "Serveur non disponible"
Le chatbot fonctionnera en mode local. Relance : `python main.py`

### "ModuleNotFoundError: No module named 'fastapi'"
Réinstalle les dépendances : `pip install -r requirements.txt`

## 💕 Ton chatbot est prêt !

À toi de jouer et d'améliorer ton chatbot ROSEE ! 🌹✨
