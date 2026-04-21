from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from datetime import datetime
from typing import Optional, List
from app.schemas.recipe import RecipeResponse
from app.schemas.document import DocumentResponse
# Usunąłem UserResponse, żeby nie kolidował z listą uczestników

# 1. Schemat dla członka brygady (spłaszcza dane z relacji)
class ProjectMemberResponse(BaseModel):
    id: int      # ID Użytkownika
    login: str   # Login Użytkownika
    role: str    # Rola w TYM projekcie (Project Role)

    @model_validator(mode='before')
    @classmethod
    def flatten_user_data(cls, data):
        # Sprawdzamy, czy 'data' to obiekt bazy danych ProjectParticipant
        if hasattr(data, 'user') and data.user:
            return {
                "id": data.user.id,
                "login": data.user.login,
                # Pobieramy wartość tekstową z Enuma roli projektowej
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
    # 2. KLUCZOWA ZMIANA: Używamy ProjectMemberResponse zamiast UserResponse
    participants: List[ProjectMemberResponse] = []
    recipes_count: int
    model_config = ConfigDict(from_attributes=True)

class ProjectRecipeAdd(BaseModel):
    recipe_id: int

# Rebuild modeli, aby uwzględnić zagnieżdżone klasy
ProjectResponse.model_rebuild()
ProjectCreate.model_rebuild()