from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.db.models import User, Recipe
from app.schemas.recipe import RecipeCreate, RecipeResponse, RecipeUpdate
from app.api.deps import get_current_user

router = APIRouter()


# --- CREATE ---
@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
        recipe_in: RecipeCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    new_recipe = Recipe(
        **recipe_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(new_recipe)
    await db.commit()
    await db.refresh(new_recipe)
    return new_recipe


# --- READ ALL --- for
@router.get("/", response_model=List[RecipeResponse])
async def read_recipes(db: AsyncSession = Depends(get_db), skip: int = 0, limit: int = 50):
    result = await db.execute(select(Recipe).offset(skip).limit(limit))
    return result.scalars().all()


# --- UPDATE --- for owner
@router.patch("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
        recipe_id: int,
        recipe_in: RecipeUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if recipe.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="To nie Twój przepis! Nie możesz go edytować."
        )

    update_data = recipe_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(recipe, key, value)

    await db.commit()
    await db.refresh(recipe)
    return recipe


# --- DELETE --- for owner
@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
        recipe_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if recipe.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Tylko właściciel może usunąć ten przepis."
        )

    await db.delete(recipe)
    await db.commit()
    return None