from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, onboarding, quests, journal, social

app = FastAPI(
    title="Wayward API",
    description="Backend API for Wayward — the personalized adventure app. Go Wayward.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to app domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(quests.router)
app.include_router(journal.router)
app.include_router(social.router)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "app": "Wayward API", "tagline": "Go Wayward."}
