from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate booking exists and belongs to user
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.guest_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only review your own bookings")

    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed bookings")

    # Check if already reviewed
    existing = db.query(Review).filter(Review.booking_id == data.booking_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already reviewed this booking")

    # Validate rating
    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review = Review(
        booking_id=data.booking_id,
        author_id=current_user.id,
        property_id=booking.property_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        booking_id=review.booking_id,
        author_id=review.author_id,
        property_id=review.property_id,
        rating=review.rating,
        comment=review.comment,
        author_name=current_user.name,
        created_at=review.created_at,
    )


@router.get("/property/{property_id}", response_model=list[ReviewResponse])
def get_property_reviews(property_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.property_id == property_id).all()
    return [
        ReviewResponse(
            id=r.id,
            booking_id=r.booking_id,
            author_id=r.author_id,
            property_id=r.property_id,
            rating=r.rating,
            comment=r.comment,
            author_name=r.author.name if r.author else None,
            created_at=r.created_at,
        )
        for r in reviews
    ]
