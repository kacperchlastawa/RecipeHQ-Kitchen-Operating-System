import pytest
from pydantic import ValidationError
from app.schemas.recipe import RecipeCreate

def test_recipe_schema_valid():
    """Testuje, czy poprawne dane przechodzą walidację."""
    data = {
        "title": "Jajecznica",
        "cooking_time": 5,
        "difficulty": "Easy",
        "ingredients": ["jajka", "masło", "sól"],
        "kcal": 300
    }
    recipe = RecipeCreate(**data)
    assert recipe.title == "Jajecznica"
    assert len(recipe.ingredients) == 3

def test_recipe_schema_invalid_kcal():
    """Testuje, czy ujemne kalorie wyrzucą błąd."""
    data = {
        "title": "Magiczne Danie",
        "cooking_time": 10,
        "difficulty": "Easy",
        "ingredients": ["powietrze"],
        "kcal": -100  # To powinno wywołać błąd (gt=0)
    }
    with pytest.raises(ValidationError):
        RecipeCreate(**data)