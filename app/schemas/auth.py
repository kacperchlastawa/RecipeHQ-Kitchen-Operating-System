from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional
from app.db.models import UserRole


class UserCreate(BaseModel):
    login: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)
    repeat_password: str = Field(min_length=8)

    global_role: UserRole = Field(default=UserRole.COOK)

    @model_validator(mode='after')
    def check_passwords_match(self):
        if self.password != self.repeat_password:
            raise ValueError("Passwords don't match")
        return self


class UserResponse(BaseModel):
    id: int
    login: str
    global_role: UserRole

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    login: str
    password: str = Field(min_length=8)


class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class TokenData(BaseModel):
    username: Optional[str] = None