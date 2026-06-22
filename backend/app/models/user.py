from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    GUEST = "guest"
    HOST = "host"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.GUEST, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    properties = relationship("Property", back_populates="host", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="guest", cascade="all, delete-orphan")
    reviews_written = relationship("Review", foreign_keys="Review.author_id", back_populates="author")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
