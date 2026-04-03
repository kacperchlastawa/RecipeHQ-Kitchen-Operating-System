import uuid
import json
from typing import List,Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
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
        title: str = Form(...),
        description: str = Form(None),
        cooking_time: int = Form(30),
        difficulty: str = Form("Medium"),
        kcal: int = Form(500),
        ingredients: str = Form("[]"),  # Odbieramy jako string JSON
        allergens: str = Form("[]"),    # Odbieramy jako string JSON
        file: Optional[UploadFile] = File(None),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        ingredients_list = json.loads(ingredients)
        allergens_list = json.loads(allergens)
    except json.JSONDecodeError:
        ingredients_list = []
        allergens_list = []

        # 2. Tworzenie obiektu przepisu
    new_recipe = Recipe(
        title=title,
        description=description,
        cooking_time=cooking_time,
        difficulty=difficulty,
        kcal=kcal,
        ingredients=ingredients_list,
        allergens=allergens_list,
        owner_id=current_user.id,
        image_url=None
    )
    # 3. Obsługa zdjęcia (jeśli zostało wysłane w tym samym zapytaniu)
    if file:
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(status_code=400, detail="Nieprawidłowy format zdjęcia (tylko JPG/PNG)")

        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"new_{uuid.uuid4().hex}.{file_extension}"

        file_content = await file.read()
        image_url = await s3_service.upload_recipe_image(
            file_content=file_content,
            file_name=unique_filename,
            content_type=file.content_type
        )
        new_recipe.image_url = image_url

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
        title: Optional[str] = Form(None),
        description: Optional[str] = Form(None),
        cooking_time: Optional[int] = Form(None),
        difficulty: Optional[str] = Form(None),
        kcal: Optional[int] = Form(None),
        ingredients: Optional[str] = Form(None),
        allergens: Optional[str] = Form(None),
        file: Optional[UploadFile] = File(None),
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

    if title is not None: recipe.title = title
    if description is not None: recipe.description = description
    if cooking_time is not None: recipe.cooking_time = cooking_time
    if kcal is not None: recipe.kcal = kcal
    if difficulty is not None: recipe.difficulty = difficulty

    if ingredients is not None:
        recipe.ingredients = json.loads(ingredients)
    if allergens is not None:
        recipe.allergens = json.loads(allergens)

    if file:
        unique_filename = f"{recipe_id}_{uuid.uuid4().hex}.jpg"
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