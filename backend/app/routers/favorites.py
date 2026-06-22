from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.property import Property
from app.models.favorite import Favorite
from app.schemas.property import PropertyResponse
from app.routers.properties import _property_to_response

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.post("/{property_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.property_id == property_id,
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Already in favorites")

    fav = Favorite(user_id=current_user.id, property_id=property_id)
    db.add(fav)
    db.commit()

    return {"message": "Added to favorites"}


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.property_id == property_id,
    ).first()

    if not fav:
        raise HTTPException(status_code=404, detail="Not in favorites")

    db.delete(fav)
    db.commit()


@router.get("/", response_model=list[PropertyResponse])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favorites = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    property_ids = [f.property_id for f in favorites]
    properties = db.query(Property).filter(Property.id.in_(property_ids)).all()

    return [_property_to_response(p, db) for p in properties]
