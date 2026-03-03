from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(title="RecipeHQ - Kitchen OS")

@app.get("/")
def read_root():
    return {
        "message": "RecipeHQ Kitchen is Open!",
        "version": "3.14",
        "db_url": settings.DATABASE_URL.split("@")[-1] # Bezpieczny podgląd hosta
    }