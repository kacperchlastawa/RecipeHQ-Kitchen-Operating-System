import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.s3 import s3_service
from app.db.models import User, Recipe
from app.db.session import get_db
from app.schemas.recipe import RecipeCreate, RecipeResponse, RecipeUpdate

router = APIRouter()


# --- CREATE ---
@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
        recipe_in: RecipeCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Tworzy nowy przepis dla zalogowanego kucharza."""
    new_recipe = Recipe(
        **recipe_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(new_recipe)
    await db.commit()
    await db.refresh(new_recipe)
    return new_recipe


# --- READ ALL ---
@router.get("/", response_model=List[RecipeResponse])
async def read_recipes(
        db: AsyncSession = Depends(get_db),
        skip: int = 0,
        limit: int = 50
):
    result = await db.execute(select(Recipe).offset(skip).limit(limit))
    return result.scalars().all()


# --- UPDATE ---
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
            detail="It is not your recipe. You can not edit it"
        )

    update_data = recipe_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(recipe, key, value)

    await db.commit()
    await db.refresh(recipe)
    return recipe


# --- DELETE ---
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
            detail="Only owner can delete the recipe."
        )

    await db.delete(recipe)
    await db.commit()
    return None


# --- POST IMAGE ---
@router.post("/{recipe_id}/image", response_model=RecipeResponse)
async def upload_recipe_image(
        recipe_id: int,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if recipe.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="It is not your recipe!")

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{recipe_id}_{uuid.uuid4().hex}.{file_extension}"

    file_content = await file.read()
    image_url = await s3_service.upload_recipe_image(
        file_content=file_content,
        file_name=unique_filename,
        content_type=file.content_type
    )

    recipe.image_url = image_url
    await db.commit()
    await db.refresh(recipe)
    return recipe