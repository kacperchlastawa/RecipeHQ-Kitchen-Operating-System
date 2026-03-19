from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class RecipeBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255,json_schema_extra={"example":"Spaghetti Carbonara"})
    description: Optional[str] = Field(None, json_schema_extra={"example":"Tradycyjny włoski przepis na bazie jajek i guanciale."})
    cooking_time: int = Field(..., gt=0, json_schema_extra={"example":25})
    difficulty: str = Field(..., json_schema_extra={"example":"Medium"})  # Dodać enum później
    kcal: Optional[int] = Field(None, gt=0,json_schema_extra= {"example":650})

    # Składniki i alergeny jako listy stringów
    ingredients: List[str] = Field(...,json_schema_extra={"example":["makaron spaghetti", "jajka", "guanciale", "pecorino"]})
    allergens: Optional[List[str]] = Field(default_factory=list, json_schema_extra={"example":["gluten", "jaja", "laktoza"]})

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(RecipeBase):
    title: Optional[str] = None
    cooking_time: Optional[int] = None
    ingredients: Optional[List[str]] = None
    difficulty: Optional[str] = None

class RecipeResponse(RecipeBase):
    id: int
    owner_id: int
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)