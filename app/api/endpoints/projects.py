from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import Project,ProjectParticipant,UserRole,Recipe,User
from app.schemas.project import ProjectCreate,ProjectResponse,ProjectRecipeAdd
from app.api.deps import get_current_user
from typing import List

router = APIRouter()


@router.post("/", response_model=ProjectResponse)
async def create_event(
        project_in: ProjectCreate,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    project_data = project_in.model_dump()

    if project_data.get("event_date"):
        project_data["event_date"] = project_data["event_date"].replace(tzinfo=None)

    # 1. Tworzymy obiekt projektu
    new_project = Project(
        **project_data,
        total_files_size=0
    )

    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    # 2. Dodajemy twórcę jako OWNERA
    participant = ProjectParticipant(
        user_id=current_user.id,
        project_id=new_project.id,
        role=UserRole.OWNER
    )
    db.add(participant)
    await db.commit()

    await db.refresh(new_project)
    return new_project


@router.post("/{project_id}/recipes")
async def add_recipe_to_project(
        project_id: int,
        data: ProjectRecipeAdd,
        db: AsyncSession = Depends(get_db),
        curret_user=Depends(get_current_user)
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
        await db.commit()
        return {"message": f"Recipe {recipe.title} successfully added to project {project.name}"}
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
        .options(selectinload(Project.recipes))
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
    result = await db.execute(select(Project).options(selectinload(Project.recipes)).where(Project.id == project_id))
    project = result.scalars().one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project
