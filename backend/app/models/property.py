from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, ARRAY
from sqlalchemy.orm import relationship

from app.core.database import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    property_type = Column(String(50), nullable=False)  # apartment, house, villa, cabin, etc.
    location = Column(String(200), nullable=False)
    country = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    price_per_night = Column(Float, nullable=False)
    cleaning_fee = Column(Float, default=0)
    max_guests = Column(Integer, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    amenities = Column(Text, default="")  # comma-separated list
    images = Column(Text, default="")  # comma-separated URLs
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    host = relationship("User", back_populates="properties")
    bookings = relationship("Booking", back_populates="property", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="property", cascade="all, delete-orphan")
    favorited_by = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")
