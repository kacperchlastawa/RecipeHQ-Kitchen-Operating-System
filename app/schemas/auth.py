from pydantic import BaseModel, ConfigDict
from pydantic import Field, model_validator
from typing import Optional
class UserCreate(BaseModel):
        login: str = Field(min_length=3, max_length=50)
        password: str = Field(min_length=8)
        repeat_password: str = Field(min_length=8)
        @model_validator(mode='after')
        def check_passwords_match(self):
            if self.password != self.repeat_password:
                raise ValueError("Passwords don't match")
            return self

class UserResponse(BaseModel):
        id:int
        login: str
        model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
        login: str
        password: str = Field(min_length=8)
class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'

class TokenData(BaseModel):
    username: Optional[str] = None