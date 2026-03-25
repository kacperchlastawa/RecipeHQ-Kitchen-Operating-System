from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.api.endpoints import auth, recipes, projects
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.db.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- TO DZIEJE SIĘ PRZY STARCIE ---
    async with engine.begin() as conn:
        # Sprawdza modele i tworzy brakujące tabele w Postgresie
        await conn.run_sync(Base.metadata.create_all)
    yield
    # --- TO DZIEJE SIĘ PRZY WYŁĄCZANIU ---
    await engine.dispose()

app = FastAPI(
    title="RecipeHQ - Kitchen OS",
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"], # Pozwalamy na GET, POST, PATCH, DELETE
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])

app.include_router(recipes.router, prefix="/api/v1/recipes", tags=["Recipes"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])

@app.get("/")
def read_root():
    return {
        "message": "RecipeHQ Kitchen is Open!",
        "version": "3.14",
        "db_url": settings.DATABASE_URL.split("@")[-1]
    }