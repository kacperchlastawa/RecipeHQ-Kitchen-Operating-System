import uuid
import json
from typing import List,Optional, Set
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.s3 import s3_service
from app.db.models import User, Recipe, UserRole, ProjectParticipant, project_recipes
from app.db.session import get_db
from app.schemas.recipe import RecipeCreate, RecipeResponse, RecipeUpdate

router = APIRouter()
ROLE_PERMISSIONS = {
    UserRole.OWNER: {"title", "description", "cooking_time", "difficulty", "kcal", "ingredients", "allergens", "file"},
    UserRole.DIETICIAN: {"kcal", "allergens", "file"},
    UserRole.COOK: {"title", "description", "cooking_time", "difficulty", "ingredients", "file"},
    UserRole.VIEWER: set()
}

# --- CREATE ---
@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
        title: str = Form(...),
        description: str = Form(None),
        cooking_time: int = Form(30),
        difficulty: str = Form("Medium"),
        kcal: int = Form(500),
        ingredients: str = Form("[]"),
        allergens: str = Form("[]"),
        file: Optional[UploadFile] = File(None),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.global_role not in [UserRole.OWNER, UserRole.COOK]:
        raise HTTPException(
            status_code=403,
            detail="Your role can not let you create new recipes"
        )
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
    # 3. Obsługa zdjęcia
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

#-----READ ONE
@router.get("/{recipe_id}", response_model=RecipeResponse)
async def read_recipe(
        recipe_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Pobiera szczegóły konkretnej receptury."""
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().one_or_none()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receptura nie została znaleziona"
        )

    return recipe
# --- READ ALL ---
@router.get("/", response_model=List[RecipeResponse])
async def read_recipes(
        db: AsyncSession = Depends(get_db),
        skip: int = 0,
        limit: int = 50
):
    result = await db.execute(select(Recipe).offset(skip).limit(limit))
    return result.scalars().all()


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
    # 2. Pobieramy recepturę oraz ROLE użytkownika w powiązanych projektach (Jeden SQL Join!)
    stmt = (
        select(Recipe, ProjectParticipant.role)
        .outerjoin(project_recipes, Recipe.id == project_recipes.c.recipe_id)
        .outerjoin(ProjectParticipant, (project_recipes.c.project_id == ProjectParticipant.project_id) &
                   (ProjectParticipant.user_id == current_user.id))
        .where(Recipe.id == recipe_id)
    )
    result = await db.execute(stmt)
    rows = result.all()

    if not rows:
        raise HTTPException(status_code=404, detail="Receptura nie istnieje")

    recipe = rows[0][0]

    user_roles = {row[1] for row in rows if row[1]}

    if recipe.owner_id == current_user.id:
        user_roles.add(UserRole.OWNER)

    allowed_fields: Set[str] = set()
    for role in user_roles:
        allowed_fields.update(ROLE_PERMISSIONS.get(role, set()))

    if not allowed_fields:
        raise HTTPException(status_code=403, detail="Brak uprawnień do edycji tej receptury")

    # 4. Mapujemy przychodzące dane i sprawdzamy uprawnienia dla każdego pola
    incoming_updates = {
        "title": title,
        "description": description,
        "cooking_time": cooking_time,
        "difficulty": difficulty,
        "kcal": kcal,
        "ingredients": ingredients,
        "allergens": allergens,
        "file": file
    }

    updated = False
    for field, value in incoming_updates.items():
        if value is not None:
            if field not in allowed_fields:
                raise HTTPException(
                    status_code=403,
                    detail=f"Twoja rola nie pozwala na edycję pola: {field}"
                )

            if field in ["ingredients", "allergens"]:
                setattr(recipe, field, json.loads(value))
            elif field == "file":
                # Obsługa zdjęcia przez S3
                unique_filename = f"{recipe_id}_{uuid.uuid4().hex}.jpg"
                file_content = await value.read()
                image_url = await s3_service.upload_recipe_image(
                    file_content=file_content,
                    file_name=unique_filename,
                    content_type=value.content_type
                )
                recipe.image_url = image_url
            else:
                setattr(recipe, field, value)

            updated = True

    if not updated:
        raise HTTPException(status_code=400, detail="Nie przesłano żadnych danych do aktualizacji")

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



