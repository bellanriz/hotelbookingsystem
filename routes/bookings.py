from flask import Blueprint, request, jsonify
from database import db
from models import Booking, Room, Guest
from datetime import datetime

bookings_bp = Blueprint("bookings", __name__)


@bookings_bp.route("/bookings", methods=["POST"])
def create_booking():
    data = request.get_json()

    required = ("guest_id", "room_id", "check_in", "check_out")
    if not data or not all(k in data for k in required):
        return jsonify({"error": "guest_id, room_id, check_in, and check_out are required"}), 400

    # Validate guest exists
    guest = Guest.query.get(data["guest_id"])
    if not guest:
        return jsonify({"error": "Guest not found"}), 404

    # Validate room exists and is available
    room = Room.query.get(data["room_id"])
    if not room:
        return jsonify({"error": "Room not found"}), 404
    if not room.is_available:
        return jsonify({"error": "Room is not available"}), 400

    # Parse dates
    try:
        check_in = datetime.strptime(data["check_in"], "%Y-%m-%d").date()
        check_out = datetime.strptime(data["check_out"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Dates must be in YYYY-MM-DD format"}), 400

    if check_out <= check_in:
        return jsonify({"error": "check_out must be after check_in"}), 400

    # Check for overlapping bookings
    overlapping = Booking.query.filter(
        Booking.room_id == room.id,
        Booking.status != "cancelled",
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    ).first()

    if overlapping:
        return jsonify({"error": "Room is already booked for the selected dates"}), 409

    # Calculate total price
    num_nights = (check_out - check_in).days
    total_price = num_nights * room.price_per_night

    booking = Booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=check_in,
        check_out=check_out,
        total_price=total_price,
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify(booking.to_dict()), 201


@bookings_bp.route("/bookings", methods=["GET"])
def get_bookings():
    status = request.args.get("status")
    query = Booking.query
    if status:
        query = query.filter_by(status=status)

    bookings = query.all()
    return jsonify([b.to_dict() for b in bookings])


@bookings_bp.route("/bookings/<int:booking_id>", methods=["GET"])
def get_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id, description="Booking not found")
    return jsonify(booking.to_dict())


@bookings_bp.route("/bookings/<int:booking_id>/cancel", methods=["POST"])
def cancel_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id, description="Booking not found")

    if booking.status == "cancelled":
        return jsonify({"error": "Booking is already cancelled"}), 400

    booking.status = "cancelled"
    db.session.commit()

    return jsonify(booking.to_dict())


@bookings_bp.route("/bookings/<int:booking_id>/complete", methods=["POST"])
def complete_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id, description="Booking not found")

    if booking.status != "confirmed":
        return jsonify({"error": "Only confirmed bookings can be completed"}), 400

    booking.status = "completed"
    db.session.commit()

    return jsonify(booking.to_dict())
