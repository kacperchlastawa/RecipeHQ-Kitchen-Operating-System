from fastapi import FastAPI
from app.core.config import settings
from app.api.endpoints import auth, recipes
app = FastAPI(title="RecipeHQ - Kitchen OS")

app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
app.include_router(recipes.router, prefix="/api/v1", tags=["Recipes"])
@app.get("/")
def read_root():
    return {
        "message": "RecipeHQ Kitchen is Open!",
        "version": "3.14",
        "db_url": settings.DATABASE_URL.split("@")[-1]
    }