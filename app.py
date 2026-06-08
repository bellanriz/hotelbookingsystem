from flask import Flask
from database import init_db
from routes.rooms import rooms_bp
from routes.guests import guests_bp
from routes.bookings import bookings_bp


def create_app():
    app = Flask(__name__)

    # Initialize database
    init_db(app)

    # Register blueprints
    app.register_blueprint(rooms_bp, url_prefix="/api")
    app.register_blueprint(guests_bp, url_prefix="/api")
    app.register_blueprint(bookings_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return {
            "name": "Hotel Booking System API",
            "version": "1.0.0",
            "endpoints": {
                "rooms": "/api/rooms",
                "guests": "/api/guests",
                "bookings": "/api/bookings",
            },
        }

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
