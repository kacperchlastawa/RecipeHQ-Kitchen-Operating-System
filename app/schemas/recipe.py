from pydantic import BaseModel, Field
from typing import Optional, List

class RecipeBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, example="Spaghetti Carbonara")
    description: Optional[str] = Field(None, example="Tradycyjny włoski przepis na baziej jajek i guanciale.")
    cooking_time: int = Field(..., gt=0, description="Czas w minutach", example=25)
    difficulty: str = Field(..., example="Medium")  # Możemy tu później dodać Enum
    kcal: Optional[int] = Field(None, gt=0, example=650)

    # Składniki i alergeny przesyłamy jako listy stringów
    ingredients: List[str] = Field(..., example=["makaron spaghetti", "jajka", "guanciale", "pecorino"])
    allergens: Optional[List[str]] = Field(default_factory=list, example=["gluten", "jaja", "laktoza"])

# Schemat używany przy tworzeniu przepisu (POST)
class RecipeCreate(RecipeBase):
    pass

# Schemat używany przy aktualizacji (PATCH) - wszystkie pola opcjonalne
class RecipeUpdate(RecipeBase):
    title: Optional[str] = None
    cooking_time: Optional[int] = None
    ingredients: Optional[List[str]] = None
    difficulty: Optional[str] = None

# Schemat używany do zwracania danych z API (Response)
class RecipeResponse(RecipeBase):
    id: int
    owner_id: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True