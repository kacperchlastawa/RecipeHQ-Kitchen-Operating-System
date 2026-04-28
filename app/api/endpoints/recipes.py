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
    """
     Create a new recipe, handles optional image uploads to S3 and verifies user permission.
    :param title: Title of the recipe
    :param description:
    :param cooking_time:
    :param difficulty: Difficulty level(Easy, Medium, Hard)
    :param kcal: Total calories count
    :param ingredients: the list of ingredients - JSON-encoded string
    :param allergens: list of allergens - JSON-encoded string
    :param file: optional image file
    :param db: Async database session
    :param current_user: The user object
    :return: Newly created recipe instance.
    :raises HTTPException: 403 if the user is not a COOK or OWNER, 400 if
    the image format is invalid
    """
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

    if file:
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(status_code=400, detail="Incorrect format (only JPG/PNG)")

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

):
    """
     Get recipe by recipe id.
    :param recipe_id: id of the recipe
    :param db: Async database session
    :return: recipe instance with matching id
    :raises HTTPException: if recipe does not exist
    """
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().one_or_none()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    return recipe

# --- READ ALL ---
@router.get("/", response_model=List[RecipeResponse])
async def read_recipes(
        db: AsyncSession = Depends(get_db),
        skip: int = 0,
        limit: int = 50
):
    """
    Get a list of all recipes from the database.
    :param db: Async database session
    :param skip: Number of records to skip (used for dividing data)
    :param limit: Maximum number of records.
    :return: A list of Recipe objects.
    """
    result = await db.execute(select(Recipe).offset(skip).limit(limit))
    return result.scalars().all()


#---UPDATE--
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
    """
    Updates a recipe partially based on the user's permissions and roles.
    The function checks the user's role within the project and their ownership status
    to determine which fields they are allowed to modify using the ROLE_PERMISSIONS mapping.
    :param recipe_id:
    :param title:
    :param description:
    :param cooking_time:
    :param difficulty:
    :param kcal:
    :param ingredients:
    :param allergens:
    :param file:
    :param db:
    :param current_user:
    :return: The updated Recipe instance
    :raises HTTPException: if recipe does not exist - 404, if the user has no permission
                            or tries to edit a restricted field, 400 if no data provided
    """
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
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe = rows[0][0]

    user_roles = {row[1] for row in rows if row[1]}

    if recipe.owner_id == current_user.id:
        user_roles.add(UserRole.OWNER)

    allowed_fields: Set[str] = set()
    for role in user_roles:
        allowed_fields.update(ROLE_PERMISSIONS.get(role, set()))

    if not allowed_fields:
        raise HTTPException(status_code=403, detail="You do not have permission to update this recipe")

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
                    detail=f"Your role do not allow you to edit this field: {field}"
                )

            if field in ["ingredients", "allergens"]:
                setattr(recipe, field, json.loads(value))
            elif field == "file":
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
        raise HTTPException(status_code=400, detail="No data to update")

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
    """
    Deleting recipe base on id, only the user who created the recipe is permitted to delete it.
    :param recipe_id: ID of recipe to delete
    :param db: Async database session
    :param current_user: User object.
    :return: no return
    :raises HTTPException: 404 if recipe does not exist, 403 if the user has no permission
    """
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
    """
    Uploads or updates the image for a specific recipe and stores it in S3.

    Verifies ownership, validates the file format, generates an unique filename before uploading
    to the S3 bucket.
    :param recipe_id: ID of recipe of which the image is being uploaded.
    :param file: The image provided in the form request
    :param db: Async database session
    :param current_user:  The user object - user making the request.
    :return: The updated Recipe object containing the new image URL.
    :raises HTTPException: 404 if recipe does not exist, 403 if the user has no permission,
                           400 if the file type is invalid.
    """
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



