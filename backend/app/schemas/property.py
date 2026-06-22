from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PropertyCreate(BaseModel):
    title: str
    description: str
    property_type: str
    location: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: float
    cleaning_fee: float = 0
    max_guests: int
    bedrooms: int
    bathrooms: int
    amenities: list[str] = []
    images: list[str] = []


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: Optional[float] = None
    cleaning_fee: Optional[float] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    amenities: Optional[list[str]] = None
    images: Optional[list[str]] = None


class PropertyResponse(BaseModel):
    id: int
    host_id: int
    title: str
    description: str
    property_type: str
    location: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: float
    cleaning_fee: float
    max_guests: int
    bedrooms: int
    bathrooms: int
    amenities: list[str]
    images: list[str]
    avg_rating: Optional[float] = None
    review_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
