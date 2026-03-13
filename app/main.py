from fastapi import FastAPI
from app.core.config import settings
from app.api.endpoints import auth
app = FastAPI(title="RecipeHQ - Kitchen OS")

app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
@app.get("/")
def read_root():
    return {
        "message": "RecipeHQ Kitchen is Open!",
        "version": "3.14",
        "db_url": settings.DATABASE_URL.split("@")[-1] # Bezpieczny podgląd hosta
    }