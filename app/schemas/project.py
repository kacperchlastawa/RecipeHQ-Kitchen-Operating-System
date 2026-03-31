from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional, List
from app.schemas.recipe import RecipeResponse
from app.schemas.document import DocumentResponse


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    documents: List[DocumentResponse] = []


class ProjectCreate(ProjectBase):
    @field_validator('event_date')
    @classmethod
    def event_date_must_not_be_in_past(cls, v: Optional[datetime]):
        if v and v < datetime.now():
            raise ValueError('Data eventu nie może być z przeszłości')
        return v


class ProjectResponse(ProjectBase):
    id: int
    total_files_size: int
    recipes: List[RecipeResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProjectRecipeAdd(BaseModel):
    recipe_id: int


ProjectResponse.model_rebuild()
ProjectCreate.model_rebuild()