from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.schemas.recipe import RecipeResponse
from enum import Enum
from app.schemas.document import DocumentResponse

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    documents: List[DocumentResponse] = []

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    total_files_size: int
    model_config = ConfigDict(from_attributes=True)
    recipes: List[RecipeResponse] = []


class ProjectRecipeAdd(BaseModel):
    recipe_id: int


ProjectResponse.model_rebuild()
ProjectCreate.model_rebuild()