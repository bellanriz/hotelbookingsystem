from flask import Blueprint, request, jsonify
from database import db
from models import Room

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.route("/rooms", methods=["POST"])
def create_room():
    data = request.get_json()

    required = ("room_number", "room_type", "price_per_night", "capacity")
    if not data or not all(k in data for k in required):
        return jsonify({"error": "room_number, room_type, price_per_night, and capacity are required"}), 400

    if data["room_type"] not in ("single", "double", "suite"):
        return jsonify({"error": "room_type must be single, double, or suite"}), 400

    if Room.query.filter_by(room_number=data["room_number"]).first():
        return jsonify({"error": "Room number already exists"}), 409

    room = Room(
        room_number=data["room_number"],
        room_type=data["room_type"],
        price_per_night=data["price_per_night"],
        capacity=data["capacity"],
    )
    db.session.add(room)
    db.session.commit()

    return jsonify(room.to_dict()), 201


@rooms_bp.route("/rooms", methods=["GET"])
def get_rooms():
    room_type = request.args.get("type")
    available_only = request.args.get("available")

    query = Room.query
    if room_type:
        query = query.filter_by(room_type=room_type)
    if available_only == "true":
        query = query.filter_by(is_available=True)

    rooms = query.all()
    return jsonify([r.to_dict() for r in rooms])


@rooms_bp.route("/rooms/<int:room_id>", methods=["GET"])
def get_room(room_id):
    room = Room.query.get_or_404(room_id, description="Room not found")
    return jsonify(room.to_dict())


@rooms_bp.route("/rooms/<int:room_id>", methods=["PUT"])
def update_room(room_id):
    room = Room.query.get_or_404(room_id, description="Room not found")
    data = request.get_json()

    if "room_type" in data:
        if data["room_type"] not in ("single", "double", "suite"):
            return jsonify({"error": "room_type must be single, double, or suite"}), 400
        room.room_type = data["room_type"]
    if "price_per_night" in data:
        room.price_per_night = data["price_per_night"]
    if "capacity" in data:
        room.capacity = data["capacity"]
    if "is_available" in data:
        room.is_available = data["is_available"]

    db.session.commit()
    return jsonify(room.to_dict())


@rooms_bp.route("/rooms/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    room = Room.query.get_or_404(room_id, description="Room not found")
    db.session.delete(room)
    db.session.commit()
    return jsonify({"message": "Room deleted successfully"})
