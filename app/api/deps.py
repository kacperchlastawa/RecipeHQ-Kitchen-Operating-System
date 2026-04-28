from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.db.models import User,ProjectParticipant,UserRole
from app.db.session import get_db
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/login")

async def get_current_user(db:AsyncSession = Depends(get_db),token : str = Depends(oauth2_scheme) ) -> User:
    """
    Validates the access token and retrieves the current user from the database.
    :param db: The asynchronous database session
    :param token: The OAuth2 Bearer token provided in the request header
    :return: The User object
    :raises HTTPException: If the token is invalid, expired, or the user does not exist
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    query = select(User).where(User.login == token_data.username)
    result = await db.execute(query)
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

async def check_project_owner(
        project_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Checks if the current user owns the project

    :param project_id: id of the project to be checked
    :param db: The asynchronous database session
    :param current_user: The User object of the person making the request
    :return: instance confirming the ownership relation
    :raises HTTPException: if the user does not own the project or is not part of the project
    """
    result = await db.execute(
        select(ProjectParticipant).where(ProjectParticipant.project_id == project_id,
                                         ProjectParticipant.user_id == current_user.id, ProjectParticipant.role == UserRole.OWNER)
        )
    participant = result.scalars().one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="Only the owner can access this resource")

    return participant
