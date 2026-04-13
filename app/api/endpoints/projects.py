from fastapi import APIRouter, Depends, HTTPException, status, UploadFile,File,Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import shutil
import os
from PIL import Image
import io
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import Project,ProjectParticipant,UserRole,Recipe,User,DocumentType,Document
from app.schemas.project import ProjectCreate,ProjectResponse,ProjectRecipeAdd
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_user, check_project_owner
from typing import List


router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def optimize_image(file_content: bytes, filename: str):
    """Pomocnicza funkcja do konwersji na WebP i resize'u"""
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

@router.post("/", response_model=ProjectResponse)
async def create_event(
        project_in: ProjectCreate,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    project_data = project_in.model_dump()

    if current_user.global_role != UserRole.OWNER:
        raise HTTPException(status_code=403,
                            derail = "Only Chef or Owner can create new project")

    if project_data.get("event_date"):
        project_data["event_date"] = project_data["event_date"].replace(tzinfo=None)

    # 1. Tworzymy obiekt projektu
    new_project = Project(
        **project_data,
        total_files_size=0
    )

    db.add(new_project)
    await db.commit()

    # 2. Dodajemy twórcę jako OWNERA
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
            selectinload(Project.documents)
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


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 100
):
    """Pobiera listę projektów kucharza RAZEM z przepisami (naprawia błąd 500)."""

    query = (
        select(Project)
        .join(ProjectParticipant)
        .where(ProjectParticipant.user_id == current_user.id)
        .options(selectinload(Project.recipes),selectinload(Project.documents))
        .offset(skip)
        .limit(limit)
        .distinct()
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
    result = await db.execute(select(Project).options(selectinload(Project.recipes),selectinload(Project.documents)).where(Project.id == project_id))
    project = result.scalars().one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.delete("/{project_id}/recipes/{recipe_id}")
async def remove_recipe_from_project(
        project_id: int,
        recipe_id: int,
        db: AsyncSession = Depends(get_db),
        _=Depends(check_project_owner)
):
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
    return {"message": "Danie usunięte z menu"}


@router.post("/{project_id}/documents", response_model=DocumentResponse)
async def upload_document(
        project_id: int,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

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
            print(f"Błąd optymalizacji: {e}. Zapisuję oryginał.")

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


@router.get("/{project_id}/shopping-list")
async def get_raw_shopping_list(
        project_id: int,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):

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


@router.post("/{project_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_user_to_project(
        project_id: int,
        user_login: str = Form(...),
        role: str = Form(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Zaprasza użytkownika do projektu z określoną rolą.
    Tylko OWNER projektu może zapraszać innych.
    """
    clean_role = role.lower()
    if clean_role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail=f"Nieprawidlowa rola: {role}")
    # 1. Sprawdź, czy projekt istnieje
    project_query = await db.execute(select(Project).where(Project.id == project_id))
    project = project_query.scalars().one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nie istnieje.")

    # 2. Sprawdź, czy current_user jest OWNEREM tego projektu
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
            detail="Brak uprawnień. Tylko Szef Kuchni (Owner) może dodawać członków zespołu."
        )

    # 3. Znajdź użytkownika, którego zapraszamy (po loginie)
    invited_user_query = await db.execute(select(User).where(User.login == user_login))
    invited_user = invited_user_query.scalars().one_or_none()

    if not invited_user:
        raise HTTPException(status_code=404, detail=f"Użytkownik '{user_login}' nie został znaleziony w systemie.")

    # 4. Sprawdź, czy użytkownik nie jest już w projekcie
    check_membership = await db.execute(
        select(ProjectParticipant).where(
            ProjectParticipant.project_id == project_id,
            ProjectParticipant.user_id == invited_user.id
        )
    )
    if check_membership.scalars().one_or_none():
        raise HTTPException(status_code=400, detail="Ten użytkownik jest już członkiem tego projektu.")

    # 5. Dodaj nowego uczestnika
    new_participant = ProjectParticipant(
        project_id=project_id,
        user_id=invited_user.id,
        role=UserRole(clean_role)
    )

    db.add(new_participant)
    await db.commit()

    return {
        "message": f"Sukces! {user_login} dołączył do zespołu jako {role.value}.",
        "project": project.name
    }

