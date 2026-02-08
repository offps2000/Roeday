from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import random
import threading
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from sentence_transformers import SentenceTransformer

# =========================================================
# CONFIG
# =========================================================
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBED_DIM = 384
BATCH_SIZE = 64
EPOCHS = 20
LR = 1e-3
MAX_QUESTIONS = 20

LABELS = {
    "too far away": 0,
    "no": 1,
    "i don't know": 2,
    "close": 3,
    "yes": 4
}
ID2LABEL = {v: k for k, v in LABELS.items()}

# =========================================================
# ROSE SEMANTIC KNOWLEDGE
# =========================================================
CONCEPTS = {
    "yes": [
        "a living thing", "alive", "a plant", "a flowering plant", "a flower",
        "a non animal living thing", "a biological organism", "a natural organism",
        "a photosynthetic organism", "something that grows",
        "alive but not an animal", "a stationary living thing",
        "an angiosperm", "a garden plant", "an ornamental plant",
        "having petals", "having a stem", "having leaves"
    ],
    "no": [
        "an animal", "a mammal", "a bird", "a fish", "an insect",
        "a human", "a person", "a machine", "a robot", "a vehicle",
        "electronics", "software", "a tree", "a fruit",
        "a vegetable", "meat", "a herb",
        "jasmine", "lily", "lotus", "tulip", "sunflower", "orchid",
        "daisy", "marigold", "hibiscus", "lavender", "chrysanthemum",
        "carnation", "daffodil", "peony", "iris", "poppy", "magnolia",
        "geranium", "begonia", "petunia", "azalea", "camellia",
        "gardenia", "freesia", "anemone", "bluebell", "buttercup",
        "dahlia", "gladiolus", "hydrangea", "lilac", "pansy",
        "primrose", "snapdragon", "tuberose", "violet", "zinnia", "walk", "speak", "run"
    ],
    "close": [
        "red", "pink", "white", "yellow", "fragrant", "beautiful",
        "used in romance", "symbolic", "having thorns",
        "used in weddings", "used on valentine's day"
    ],
    "i don't know": [
        "expensive", "rare", "popular", "lucky", "special"
    ],
    "too far away": [
        "a planet", "a galaxy", "a weapon", "a building",
        "a country", "a city", "furniture", "clothing",
        "a musical instrument"
    ]
}

TEMPLATES = [
    "Is it {}?",
    "Is this a {}?",
    "Would you classify it as {}?",
    "Can it be described as {}?",
    "Does it belong to {}?"
]


# =========================================================
# MODEL DEFINITION
# =========================================================
class RoseClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(EMBED_DIM, 256),
            nn.ReLU(),
            nn.Linear(256, 5)
        )

    def forward(self, x):
        return self.net(x)


# =========================================================
# GLOBAL STATE
# =========================================================
encoder = None
model = None
model_ready = False

game_state = {
    "question_count": 0,
    "game_over": False,
    "guessed_correctly": False,
}


# =========================================================
# DATASET GENERATION
# =========================================================
def generate_dataset(size=2000):
    data = []
    for label, concepts in CONCEPTS.items():
        for c in concepts:
            for t in TEMPLATES:
                data.append((t.format(c), LABELS[label]))

    yes_id = [
        "is it rose?", "is it a rose?",
        "is the answer rose?", "are you thinking of rose?"
    ]
    no_id = [
        "is it tulip?", "is it lotus?",
        "is it dog?", "is it car?"
    ]
    for q in yes_id:
        data.append((q, LABELS["yes"]))
    for q in no_id:
        data.append((q, LABELS["no"]))

    random.shuffle(data)
    return data[:size]


# =========================================================
# NORMALIZATION
# =========================================================
def normalize_question(q):
    q = q.lower().strip()
    if "living thing" in q:
        return "is it a living thing?"
    if any(x in q for x in ["can it die", "does it die"]):
        return "is it a living thing?"
    if any(x in q for x in ["can it grow", "does it grow"]):
        return "is it a plant?"
    if any(x in q for x in ["does it breathe", "does it eat"]):
        return "is it an animal?"
    return q


# =========================================================
# TRAINING FUNCTION (runs in background thread)
# =========================================================
def train_model():
    global encoder, model, model_ready

    print("[ML] Generating dataset...")
    dataset = generate_dataset()
    print(f"[ML] Samples: {len(dataset)}")

    print("[ML] Loading sentence transformer...")
    encoder_local = SentenceTransformer(MODEL_NAME)

    texts, labels = zip(*dataset)
    print("[ML] Encoding texts...")
    embeddings = encoder_local.encode(list(texts), convert_to_tensor=True)
    labels_tensor = torch.tensor(labels)

    model_local = RoseClassifier()

    loader = DataLoader(
        TensorDataset(embeddings, labels_tensor),
        batch_size=BATCH_SIZE,
        shuffle=True
    )
    optimizer = torch.optim.Adam(model_local.parameters(), lr=LR)
    loss_fn = nn.CrossEntropyLoss()

    print("[ML] Training...")
    for epoch in range(EPOCHS):
        total = 0
        for x, y in loader:
            optimizer.zero_grad()
            loss = loss_fn(model_local(x), y)
            loss.backward()
            optimizer.step()
            total += loss.item()
        if (epoch + 1) % 5 == 0:
            print(f"[ML] Epoch {epoch+1}/{EPOCHS} | Loss: {total:.4f}")

    # Assign to global
    encoder = encoder_local
    model = model_local
    model_ready = True
    print("[ML] Training complete. Model ready!")


# =========================================================
# FASTAPI APP
# =========================================================
app = FastAPI()

cors_origins = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    thread = threading.Thread(target=train_model, daemon=True)
    thread.start()


# =========================================================
# PYDANTIC MODELS
# =========================================================
class QuestionRequest(BaseModel):
    question: str


class GuessRequest(BaseModel):
    guess: str


# =========================================================
# API ENDPOINTS
# =========================================================
@app.get("/api/")
def root():
    return {"message": "Rose Day AI Game API"}


@app.get("/api/game/status")
def get_game_status():
    return {
        "model_ready": model_ready,
        "question_count": game_state["question_count"],
        "max_questions": MAX_QUESTIONS,
        "game_over": game_state["game_over"],
        "guessed_correctly": game_state["guessed_correctly"],
    }


@app.post("/api/game/ask")
def ask_question(req: QuestionRequest):
    if not model_ready:
        raise HTTPException(status_code=503, detail="Model is still loading. Please wait...")

    if game_state["game_over"]:
        return {
            "label": "game_over",
            "response": "Game is already over!",
            "question_count": game_state["question_count"],
            "max_questions": MAX_QUESTIONS,
            "game_over": True,
            "guessed_correctly": game_state["guessed_correctly"],
        }

    # Check if user is guessing directly
    user_text = req.question.strip().lower()
    if user_text in ["rose", "a rose", "the rose", "is it rose", "is it a rose", "its a rose", "it's a rose"]:
        game_state["guessed_correctly"] = True
        game_state["game_over"] = True
        return {
            "label": "guessed",
            "response": "YES! You guessed it! The answer is ROSE!",
            "question_count": game_state["question_count"],
            "max_questions": MAX_QUESTIONS,
            "game_over": True,
            "guessed_correctly": True,
        }

    game_state["question_count"] += 1

    if game_state["question_count"] > MAX_QUESTIONS:
        game_state["game_over"] = True
        return {
            "label": "game_over",
            "response": "20 questions used! The answer was ROSE!",
            "question_count": game_state["question_count"],
            "max_questions": MAX_QUESTIONS,
            "game_over": True,
            "guessed_correctly": False,
        }

    normalized = normalize_question(req.question)
    emb = encoder.encode(normalized, convert_to_tensor=True)

    with torch.no_grad():
        pred = torch.argmax(model(emb)).item()

    label = ID2LABEL[pred]

    return {
        "label": label,
        "question_count": game_state["question_count"],
        "max_questions": MAX_QUESTIONS,
        "game_over": False,
        "guessed_correctly": False,
    }


@app.post("/api/game/guess")
def make_guess(req: GuessRequest):
    if not model_ready:
        raise HTTPException(status_code=503, detail="Model is still loading...")

    if game_state["game_over"]:
        return {
            "correct": game_state["guessed_correctly"],
            "message": "Game is already over!",
            "question_count": game_state["question_count"],
            "game_over": True,
        }

    guess = req.guess.strip().lower()
    if guess in ["rose", "a rose", "the rose"]:
        game_state["guessed_correctly"] = True
        game_state["game_over"] = True
        return {
            "correct": True,
            "message": "YES! You guessed it correctly. The answer is ROSE!",
            "question_count": game_state["question_count"],
            "game_over": True,
        }
    else:
        game_state["question_count"] += 1
        if game_state["question_count"] > MAX_QUESTIONS:
            game_state["game_over"] = True
        return {
            "correct": False,
            "message": f"Nope, it's not '{guess}'!",
            "question_count": game_state["question_count"],
            "game_over": game_state["game_over"],
        }


@app.post("/api/game/reset")
def reset_game():
    game_state["question_count"] = 0
    game_state["game_over"] = False
    game_state["guessed_correctly"] = False
    return {"message": "Game reset successfully", "status": "ok"}
