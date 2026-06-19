from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, delete
import os
from PIL import Image
import io
from sqlalchemy.orm import selectinload
from app.core.config import settings
from app.db.session import get_db
from app.db.models import Project, ProjectParticipant, UserRole, Recipe, User, DocumentType, Document
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectRecipeAdd, ProjectPublicResponse
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_user, check_project_owner
from typing import List
import boto3


router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
#--- MAX size set as 50 MB
MAX_STORAGE_BYTES = 50 * 1024 * 1024

def optimize_image(file_content: bytes, filename: str):
    """
    Function to help with conversion to WebP and resizing
    :param bytes
    :param filename: name of the file
    :return: converted and resized image
    """
    img = Image.open(io.BytesIO(file_content))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    if img.width > 1200:
        new_width = 1200
        new_height = int(img.height * (new_width / img.width))
        img = img.resize((new_width, new_height), Image.LANCZOS)

    buffer = io.BytesIO()
    img.save(buffer, format="WEBP", quality=80)
    optimized_content = buffer.getvalue()

    new_filename = os.path.splitext(filename)[0] + ".webp"
    return optimized_content, new_filename

#-------------CREATE
@router.post("/", response_model=ProjectResponse)
async def create_event(
        project_in: ProjectCreate,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
     Creates a new event in the database.
    :param project_in: projectCreate schema
    :param db: Async database session
    :param current_user: currentUser object
    :return: Newly created project instance.
    :raise HTTPException: 403 when there is no permission to create a project.
    """
    project_data = project_in.model_dump()

    if current_user.global_role != UserRole.OWNER:
        raise HTTPException(status_code=403,detail = "Only Chef or Owner can create new project")

    if project_data.get("event_date"):
        project_data["event_date"] = project_data["event_date"].replace(tzinfo=None)

    new_project = Project(
        **project_data,
        total_files_size=0
    )

    db.add(new_project)
    await db.commit()

    participant = ProjectParticipant(
        user_id=current_user.id,
        project_id=new_project.id,
        role=UserRole.OWNER
    )
    db.add(participant)
    await db.commit()
    result = await db.execute(
        select(Project)
        .where(Project.id == new_project.id)
        .options(
            selectinload(Project.recipes),
            selectinload(Project.documents),
            selectinload(Project.participants).selectinload(ProjectParticipant.user)
        )
    )
    project_final = result.scalars().one()

    return project_final


@router.post("/{project_id}/recipes")
async def add_recipe_to_project(
        project_id: int,
        data: ProjectRecipeAdd,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Function that adds recipe to a project
    :param project_id: id of project where we want to add recipe.
    :param data: Adding recipe schema.
    :param db: Async database session
    :param current_user: Current user object.
    :return: Positive feedback with project count or info that the recipe already exists in a project
    :raise HTTPException: 404, when project or recipe not found
    """

    result_proj = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.recipes))
    )
    project = result_proj.scalars().one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result_rec = await db.execute(select(Recipe).where(Recipe.id == data.recipe_id))
    recipe = result_rec.scalars().one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if recipe not in project.recipes:
        project.recipes.append(recipe)
        project.recipes_count += 1
        await db.commit()
        await db.refresh(project)
        return {
            "message": f"Recipe {recipe.title} successfully added to project {project.name}",
            "current_recipes_count": project.recipes_count
        }
    else:
        return {"message": "Recipe already in project"}


#------------READ
@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 100
):
    """
    List of projects.
    :param db: db session
    :param current_user: Current user object.
    :param skip: How many rows to skip.
    :param limit: Max numbers of rows.
    :return: list of projects
    """

    query = (
        select(Project)
        .join(ProjectParticipant)
        .where(ProjectParticipant.user_id == current_user.id)
        .options(
            selectinload(Project.recipes),
            selectinload(Project.documents),
            selectinload(Project.participants).selectinload(ProjectParticipant.user)
        )
        .offset(skip).limit(limit).distinct()
    )
    result = await db.execute(query)
    projects = result.scalars().all()

    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
        project_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get specific project.
    :param project_id: id of project to list
    :param db: db session
    :param current_user: user object
    :return: Specific project.
    :raise HTTPException: 404, when project not found
    """
    result = await db.execute(select(Project).options(selectinload(Project.recipes),selectinload(Project.documents),
                                                      selectinload(Project.participants).selectinload(ProjectParticipant.user)).where(Project.id == project_id))
    project = result.scalars().one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.get("/{project_id}/shopping-list")
async def get_raw_shopping_list(
        project_id: int,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Get shopping list for project.
    :param project_id: id of project
    :param db:
    :param current_user:
    :return: dict with shopping list, items_count adnd project_id
    """

    query = text("""
        SELECT r.title, r.ingredients 
        FROM recipes r
        JOIN project_recipes pr ON r.id = pr.recipe_id
        WHERE pr.project_id = :pid
    """)

    result = await db.execute(query, {"pid": project_id})
    rows = result.fetchall()

    shopping_list = [
        {"recipe_name": row[0], "ingredients": row[1]}
        for row in rows
    ]

    return {
        "project_id": project_id,
        "items_count": len(shopping_list),
        "data": shopping_list
    }


#---------------UPDATE
@router.post("/{project_id}/documents", response_model=DocumentResponse)
async def upload_document(
        project_id: int,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """

    :param project_id: id of project
    :param file: file object
    :param db: db session
    :param current_user:
    :return: new document object
    :raises HTTPException: 404, when project not found;
    400, when no space in this project
    :exception  optimizing error while calling optimize_image function
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.total_files_size > MAX_STORAGE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="No more space in this project(max 50 MB). Please delete old files."
        )

    content = await file.read()
    final_content = content
    final_filename = file.filename
    final_mime = file.content_type

    is_image = file.content_type.startswith("image/")
    if is_image:
        try:
            final_content, final_filename = optimize_image(content, file.filename)
            final_mime = "image/webp"
        except Exception as e:
            print(f"Optimizing error: {e}. Saving the original.")

    file_path = os.path.join(UPLOAD_DIR, f"{project_id}_{final_filename}")
    with open(file_path, "wb") as buffer:
        buffer.write(final_content)

    size = len(final_content)

    new_doc = Document(
        project_id=project_id,
        file_name=final_filename,
        s3_key=file_path,
        file_size=size,
        mime_type=final_mime,
        document_type=DocumentType.PLATE_UP if is_image else DocumentType.OTHER
    )
    db.add(new_doc)

    project.total_files_size += size

    await db.commit()
    await db.refresh(new_doc)

    return new_doc

@router.post("/{project_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_user_to_project(
        project_id: int,
        user_login: str = Form(...),
        role: str = Form(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Invites user to the project with specific role.
    Only Owner of the project can do this.
    :param project_id: id of project
    :param user_login: user_login form
    :param role: role form
    :param db: db session
    :param current_user: current user object
    :return: Success message
    :raises HTTPException: 400, when the role is incorrect or user already belongs to the project;
    403, when there is no permission
    404, when user not found
    """
    clean_role = role.lower()
    if clean_role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail=f"Incorrect role: {role}")

    project_query = await db.execute(select(Project).where(Project.id == project_id))
    project = project_query.scalars().one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nie istnieje.")

    auth_query = await db.execute(
        select(ProjectParticipant).where(
            ProjectParticipant.project_id == project_id,
            ProjectParticipant.user_id == current_user.id,
            ProjectParticipant.role == UserRole.OWNER
        )
    )
    is_owner = auth_query.scalars().one_or_none()

    if not is_owner:
        raise HTTPException(
            status_code=403,
            detail="No Permission. Only Owner can add team members."
        )

    invited_user_query = await db.execute(select(User).where(User.login == user_login))
    invited_user = invited_user_query.scalars().one_or_none()

    if not invited_user:
        raise HTTPException(status_code=404, detail=f"User '{user_login}' not found in the system")

    check_membership = await db.execute(
        select(ProjectParticipant).where(
            ProjectParticipant.project_id == project_id,
            ProjectParticipant.user_id == invited_user.id
        )
    )
    if check_membership.scalars().one_or_none():
        raise HTTPException(status_code=400, detail="User is already part of the project.")

    new_participant = ProjectParticipant(
        project_id=project_id,
        user_id=invited_user.id,
        role=UserRole(clean_role)
    )

    db.add(new_participant)
    await db.commit()

    return {
        "message": f"{user_login} joined the team as {clean_role}.",
        "project": project.name
    }

#---------------DELETE
@router.delete("/{project_id}/recipes/{recipe_id}")
async def remove_recipe_from_project(
        project_id: int,
        recipe_id: int,
        db: AsyncSession = Depends(get_db),
        _=Depends(check_project_owner)
):
    """
    Removes a recipe from the project.
    :param project_id: id of project
    :param recipe_id: id of recipe
    :param db: database session
    :param _: check if user is a project owner
    :return: Success message
    :raises HTTPException: 404, when the recipe or the project is not found
    """
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.recipes))
    )
    project = result.scalars().one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    recipe_to_remove = next((r for r in project.recipes if r.id == recipe_id), None)

    if not recipe_to_remove:
        raise HTTPException(status_code=404, detail="Recipe not found in this project's menu")

    project.recipes.remove(recipe_to_remove)
    await db.commit()
    return {"message": "Recipe deleted successfully"}


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleting project.
    :param project_id: id of project
    :param db: database session
    :param current_user: current user object
    :return: Success message
    :raises HTTPException: 404, when the project is not found; 403, when the current user is not the owner
    """
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project is not found")

    perm_query = select(ProjectParticipant).where(
        ProjectParticipant.project_id == project_id,
        ProjectParticipant.user_id == current_user.id,
        ProjectParticipant.role == "owner"
    )
    perm_result = await db.execute(perm_query)
    if not perm_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Only owner of the project can delete it.")

    doc_query = select(Document).where(Document.project_id == project_id)
    doc_result = await db.execute(doc_query)
    documents = doc_result.scalars().all()

    s3_client = boto3.client("s3", endpoint_url=settings.S3_ENDPOINT_URL)
    for doc in documents:
        try:
            s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=doc.s3_key)
        except Exception as e:
            print(f"Deleting from S3 error: {e}")

    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted successfully"}

@router.delete("/{project_id}/participants/{user_id}")
async def remove_participant(
    project_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove participant from the project.
    :param project_id: project id
    :param user_id: user id
    :param db: database session
    :param current_user: current user object
    :return: Success message
    :raises 403, when the current user is not the owner
    """
    owner_check = await db.execute(
        select(ProjectParticipant).where(
            ProjectParticipant.project_id == project_id,
            ProjectParticipant.user_id == current_user.id,
            ProjectParticipant.role == "OWNER"
        )
    )
    if not owner_check.scalars().first():
        raise HTTPException(status_code=403, detail="Only Owner can delete project members!")

    await db.execute(
        delete(ProjectParticipant).where(
            ProjectParticipant.project_id == project_id,
            ProjectParticipant.user_id == user_id
        )
    )
    await db.commit()
    return {"message": "Member successfully removed"}


#--------------------------------------------------

@router.get("/reports/brigade-stats")
async def get_brigade_stats(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Raw sql task to get the number of projects where each user is assigned with.
    :param db: database session
    :param current_user: current user object
    :return: stats dict
    :raises HTTPException: 403, when the current user is not the owner
    """
    if current_user.global_role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only Owner has access to the raports.")

    raw_sql = text("""
                   SELECT u.login,
                          u.global_role,
                          COUNT(pp.project_id) as assigned_projects
                   FROM users u
                            LEFT JOIN project_participants pp ON u.id = pp.user_id
                   GROUP BY u.login, u.global_role
                   ORDER BY assigned_projects DESC
                   """)

    result = await db.execute(raw_sql)

    stats = [
        {
            "login": row[0],
            "role": row[1].value if hasattr(row[1], 'value') else row[1],
            "projects_count": row[2]
        }
        for row in result.fetchall()
    ]

    return {"data": stats}


@router.get("/{project_id}/public", response_model=ProjectPublicResponse)
async def get_public_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """
    Public endpoint for clients and guests. It does not include JWT token.
    :return safe data
    :raise HTTPException: 404, when project not found
    """
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.recipes))
        .where(Project.id == project_id)
    )
    project = result.scalars().one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Menu not found.")

    return project

