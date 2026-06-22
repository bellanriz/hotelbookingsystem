from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.property import Property
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate, BookingResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])

SERVICE_FEE_RATE = 0.12  # 12% service fee


def _booking_to_response(booking: Booking) -> BookingResponse:
    return BookingResponse(
        id=booking.id,
        guest_id=booking.guest_id,
        property_id=booking.property_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        num_guests=booking.num_guests,
        total_price=booking.total_price,
        service_fee=booking.service_fee,
        status=booking.status,
        created_at=booking.created_at,
        property_title=booking.property.title if booking.property else None,
        guest_name=booking.guest.name if booking.guest else None,
    )


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate property exists
    prop = db.query(Property).filter(Property.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Can't book your own property
    if prop.host_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book your own property")

    # Validate dates
    if data.check_out <= data.check_in:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")

    # Validate guest count
    if data.num_guests > prop.max_guests:
        raise HTTPException(
            status_code=400,
            detail=f"Property supports max {prop.max_guests} guests",
        )

    # Check for overlapping bookings
    overlapping = db.query(Booking).filter(
        Booking.property_id == data.property_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.check_in < data.check_out,
        Booking.check_out > data.check_in,
    ).first()

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Property is already booked for these dates",
        )

    # Calculate pricing
    num_nights = (data.check_out - data.check_in).days
    subtotal = num_nights * prop.price_per_night + prop.cleaning_fee
    service_fee = round(subtotal * SERVICE_FEE_RATE, 2)
    total_price = round(subtotal + service_fee, 2)

    booking = Booking(
        guest_id=current_user.id,
        property_id=data.property_id,
        check_in=data.check_in,
        check_out=data.check_out,
        num_guests=data.num_guests,
        total_price=total_price,
        service_fee=service_fee,
        status=BookingStatus.CONFIRMED,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return _booking_to_response(booking)


@router.get("/", response_model=list[BookingResponse])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List bookings for the current user (as guest)."""
    bookings = db.query(Booking).filter(Booking.guest_id == current_user.id).all()
    return [_booking_to_response(b) for b in bookings]


@router.get("/hosting", response_model=list[BookingResponse])
def list_host_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List bookings for properties owned by the current user (as host)."""
    bookings = (
        db.query(Booking)
        .join(Property)
        .filter(Property.host_id == current_user.id)
        .all()
    )
    return [_booking_to_response(b) for b in bookings]


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Only guest or host can cancel
    is_guest = booking.guest_id == current_user.id
    is_host = booking.property.host_id == current_user.id
    if not is_guest and not is_host:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)

    return _booking_to_response(booking)
