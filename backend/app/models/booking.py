from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    num_guests = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    service_fee = Column(Float, default=0)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    guest = relationship("User", back_populates="bookings")
    property = relationship("Property", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)
