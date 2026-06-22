from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    booking_id: int
    rating: float  # 1-5
    comment: str


class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    author_id: int
    property_id: int
    rating: float
    comment: str
    author_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
