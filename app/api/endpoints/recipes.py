from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db.models import User, Recipe
from app.schemas.recipe import RecipeCreate, RecipeResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
        recipe_in: RecipeCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)):

    """Metoda do tworzenia przepisów dla
     kucharzy zalogowanych.
    """
    new_recipe = Recipe(
        **recipe_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(new_recipe)
    await db.commit()
    await db.refresh(new_recipe)
    return new_recipe