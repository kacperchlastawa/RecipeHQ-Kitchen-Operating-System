from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.login == user_in.login)
    result = await db.execute(query)
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Użytkownik z tym loginem już istnieje"
        )

    hashed_password = get_password_hash(user_in.password)

    new_user = User(
        login=user_in.login,
        hashed_password=hashed_password,
        global_role=user_in.global_role
    )

    db.add(new_user)

    try:
        await db.commit()
        await db.refresh(new_user)
    except Exception as e:
        await db.rollback()
        print(f"Błąd bazy danych: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Błąd bazy danych podczas rejestracji"
        )

    return new_user


@router.post("/login", response_model=Token)
async def login_user(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.login == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy login lub hasło",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.login})

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):

    return current_user