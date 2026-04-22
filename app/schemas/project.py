from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from datetime import datetime
from typing import Optional, List
from app.schemas.recipe import RecipeResponse
from app.schemas.document import DocumentResponse

class ProjectMemberResponse(BaseModel):
    id: int
    login: str
    role: str

    @model_validator(mode='before')
    @classmethod
    def flatten_user_data(cls, data):
        if hasattr(data, 'user') and data.user:
            return {
                "id": data.user.id,
                "login": data.user.login,
                "role": data.role.value if hasattr(data.role, 'value') else str(data.role)
            }
        return data

    model_config = ConfigDict(from_attributes=True)

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
    participants: List[ProjectMemberResponse] = []
    recipes_count: int
    model_config = ConfigDict(from_attributes=True)

class ProjectRecipeAdd(BaseModel):
    recipe_id: int

class RecipePublicResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ProjectPublicResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    recipes: List[RecipePublicResponse] = []
    model_config = ConfigDict(from_attributes=True)

ProjectPublicResponse.model_rebuild()
ProjectResponse.model_rebuild()
ProjectCreate.model_rebuild()