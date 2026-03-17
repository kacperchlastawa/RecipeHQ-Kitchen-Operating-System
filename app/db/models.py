from sqlalchemy import String, BigInteger, ForeignKey, Enum as SqlEnum, Text,JSON, Column,Integer
from sqlalchemy.orm import DeclarativeBase, Mapped,mapped_column, relationship
from typing import List, Optional
from enum import Enum

class Base(DeclarativeBase):
    pass

class UserRole(str, Enum):
    OWNER = "owner"
    PARTICIPANT = "participant"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(50), unique = True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))

    project_memberships: Mapped[List["ProjectParticipant"]] = relationship(back_populates="user")
    recipes: Mapped[List["Recipe"]] = relationship("Recipe", back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.login}>"

class Project(Base):
    __tablename__ = "projects"

    id : Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    total_files_size: Mapped[int] = mapped_column(BigInteger, default=0)

    participants: Mapped[List["ProjectParticipant"]] = relationship(back_populates="project",cascade="all, delete-orphan")
    documents: Mapped[List["Document"]] = relationship(back_populates="project",cascade="all, delete-orphan")
    def __repr__(self):
        return f"<Project {self.name}>"

class ProjectParticipant(Base):
    __tablename__ = "project_participants"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))

    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole),
        default=UserRole.PARTICIPANT,
        nullable=False
    )
    user: Mapped[User] = relationship(back_populates="project_memberships")
    project: Mapped[Project] = relationship(back_populates="participants")

    def __repr__(self):
        return f"<Participant {self.user_id} in {self.project_id} as {self.role}>"

class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    file_name: Mapped[str] = mapped_column(String(255))
    s3_key: Mapped[str] = mapped_column(String(512), unique=True)
    file_size: Mapped[int] = mapped_column(BigInteger)

    project: Mapped[Project] = relationship(back_populates="documents")
    def __repr__(self):
        return f"<Document {self.file_name}>"

class Recipe(Base):
    __tablename__ = "recipes"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    cooking_time: Mapped[int] = mapped_column()
    difficulty: Mapped[str] = mapped_column(String(20))
    kcal: Mapped[Optional[int]] = mapped_column()

    ingredients: Mapped[dict] = mapped_column(JSON)
    allergens: Mapped[Optional[dict]] = mapped_column(JSON)
    image_url: Mapped[Optional[str]] = mapped_column(String(512))

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    owner: Mapped["User"] = relationship(back_populates="recipes")

    def __repr__(self):
        return f"<Recipe {self.title}>"