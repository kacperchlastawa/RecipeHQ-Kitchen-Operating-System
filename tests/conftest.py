import pytest
import pytest_asyncio
from httpx import AsyncClient,ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.main import app
from app.db.session import get_db
from app.db.models import Base
from app.core.config import settings
import asyncio

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_temp.db"
engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
AsyncSessionTesting = async_sessionmaker(engine_test, expire_on_commit=False, class_=AsyncSession)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    """
    Tworzy strukturę tabel przed pierwszym testem i usuwa ją po ostatnim.
    Base.metadata zawiera definicje wszystkich Twoich tabel (np. 'users').
    """
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    """
    Dostarcza świeżą, odizolowaną sesję bazy danych do każdego testu.
    Po każdym teście robi rollback, więc testy nie wpływają na siebie nawzajem.
    """
    async with AsyncSessionTesting() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    """
    To jest Twój 'symulator przeglądarki'.
    Używa dependency_overrides, aby podmienić bazę w aplikacji na testową.
    """

    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db

    async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()