from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    property_id: int
    check_in: date
    check_out: date
    num_guests: int


class BookingResponse(BaseModel):
    id: int
    guest_id: int
    property_id: int
    check_in: date
    check_out: date
    num_guests: int
    total_price: float
    service_fee: float
    status: BookingStatus
    created_at: datetime
    property_title: Optional[str] = None
    guest_name: Optional[str] = None

    class Config:
        from_attributes = True
