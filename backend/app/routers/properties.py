from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.review import Review
from app.schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse

router = APIRouter(prefix="/properties", tags=["Properties"])


def _property_to_response(prop: Property, db: Session) -> PropertyResponse:
    """Convert a Property model to response with computed fields."""
    stats = db.query(
        func.avg(Review.rating), func.count(Review.id)
    ).filter(Review.property_id == prop.id).first()

    return PropertyResponse(
        id=prop.id,
        host_id=prop.host_id,
        title=prop.title,
        description=prop.description,
        property_type=prop.property_type,
        location=prop.location,
        country=prop.country,
        latitude=prop.latitude,
        longitude=prop.longitude,
        price_per_night=prop.price_per_night,
        cleaning_fee=prop.cleaning_fee,
        max_guests=prop.max_guests,
        bedrooms=prop.bedrooms,
        bathrooms=prop.bathrooms,
        amenities=prop.amenities.split(",") if prop.amenities else [],
        images=prop.images.split(",") if prop.images else [],
        avg_rating=round(stats[0], 2) if stats[0] else None,
        review_count=stats[1],
        created_at=prop.created_at,
    )


@router.get("/", response_model=list[PropertyResponse])
def list_properties(
    location: Optional[str] = None,
    country: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    guests: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Property)

    if location:
        query = query.filter(Property.location.ilike(f"%{location}%"))
    if country:
        query = query.filter(Property.country.ilike(f"%{country}%"))
    if property_type:
        query = query.filter(Property.property_type == property_type)
    if min_price is not None:
        query = query.filter(Property.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Property.price_per_night <= max_price)
    if guests is not None:
        query = query.filter(Property.max_guests >= guests)

    properties = query.offset(skip).limit(limit).all()
    return [_property_to_response(p, db) for p in properties]


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return _property_to_response(prop, db)


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    data: PropertyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only hosts can create listings
    if current_user.role != UserRole.HOST:
        raise HTTPException(status_code=403, detail="Only hosts can create properties")

    prop = Property(
        host_id=current_user.id,
        title=data.title,
        description=data.description,
        property_type=data.property_type,
        location=data.location,
        country=data.country,
        latitude=data.latitude,
        longitude=data.longitude,
        price_per_night=data.price_per_night,
        cleaning_fee=data.cleaning_fee,
        max_guests=data.max_guests,
        bedrooms=data.bedrooms,
        bathrooms=data.bathrooms,
        amenities=",".join(data.amenities),
        images=",".join(data.images),
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return _property_to_response(prop, db)


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your property")

    update_data = data.model_dump(exclude_unset=True)
    if "amenities" in update_data:
        update_data["amenities"] = ",".join(update_data["amenities"])
    if "images" in update_data:
        update_data["images"] = ",".join(update_data["images"])

    for key, value in update_data.items():
        setattr(prop, key, value)

    db.commit()
    db.refresh(prop)
    return _property_to_response(prop, db)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your property")

    db.delete(prop)
    db.commit()
