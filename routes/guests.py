from flask import Blueprint, request, jsonify
from database import db
from models import Guest

guests_bp = Blueprint("guests", __name__)


@guests_bp.route("/guests", methods=["POST"])
def create_guest():
    data = request.get_json()

    if not data or not all(k in data for k in ("name", "email", "phone")):
        return jsonify({"error": "name, email, and phone are required"}), 400

    if Guest.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "A guest with this email already exists"}), 409

    guest = Guest(name=data["name"], email=data["email"], phone=data["phone"])
    db.session.add(guest)
    db.session.commit()

    return jsonify(guest.to_dict()), 201


@guests_bp.route("/guests", methods=["GET"])
def get_guests():
    guests = Guest.query.all()
    return jsonify([g.to_dict() for g in guests])


@guests_bp.route("/guests/<int:guest_id>", methods=["GET"])
def get_guest(guest_id):
    guest = Guest.query.get_or_404(guest_id, description="Guest not found")
    return jsonify(guest.to_dict())


@guests_bp.route("/guests/<int:guest_id>", methods=["PUT"])
def update_guest(guest_id):
    guest = Guest.query.get_or_404(guest_id, description="Guest not found")
    data = request.get_json()

    if "name" in data:
        guest.name = data["name"]
    if "email" in data:
        guest.email = data["email"]
    if "phone" in data:
        guest.phone = data["phone"]

    db.session.commit()
    return jsonify(guest.to_dict())


@guests_bp.route("/guests/<int:guest_id>", methods=["DELETE"])
def delete_guest(guest_id):
    guest = Guest.query.get_or_404(guest_id, description="Guest not found")
    db.session.delete(guest)
    db.session.commit()
    return jsonify({"message": "Guest deleted successfully"})
