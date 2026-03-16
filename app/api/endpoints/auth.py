from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import UserCreate,UserResponse,UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
router = APIRouter()

@router.post("/auth", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.login == user_in.login)
    result = await db.execute(query)
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="User with this login already exists")

    hashed_password = get_password_hash(user_in.password)
    new_user = User(login = user_in.login, hashed_password = hashed_password)

    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database error during registration")

    return new_user


@router.post("/login", response_model=Token)
async def login_user(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db)
):
    # UWAGA: OAuth2PasswordRequestForm zawsze używa pola .username
    query = select(User).where(User.login == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()

    # Weryfikacja hasła (używamy form_data.password)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.login})

    return {"access_token": access_token, "token_type": "bearer"}
@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Zwraca dane aktualnie zalogowanego kucharza.
    Wymaga poprawnego tokena JWT w nagłówku.
    """
    return current_user