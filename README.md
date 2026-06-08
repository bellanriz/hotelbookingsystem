# Hotel Booking System

A RESTful hotel booking system built with Python and Flask.

## Features

- **Room Management** — Add, update, list, and delete hotel rooms
- **Guest Management** — Register and manage guest information
- **Booking System** — Create, cancel, and complete bookings with date validation and overlap detection
- **Price Calculation** — Automatic total price based on number of nights

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

The server starts at `http://localhost:5000`.

## API Endpoints

### Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rooms | Create a room |
| GET | /api/rooms | List rooms (filter: `?type=single&available=true`) |
| GET | /api/rooms/:id | Get room details |
| PUT | /api/rooms/:id | Update a room |
| DELETE | /api/rooms/:id | Delete a room |

### Guests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/guests | Register a guest |
| GET | /api/guests | List all guests |
| GET | /api/guests/:id | Get guest details |
| PUT | /api/guests/:id | Update guest info |
| DELETE | /api/guests/:id | Delete a guest |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bookings | Create a booking |
| GET | /api/bookings | List bookings (filter: `?status=confirmed`) |
| GET | /api/bookings/:id | Get booking details |
| POST | /api/bookings/:id/cancel | Cancel a booking |
| POST | /api/bookings/:id/complete | Mark booking as completed |

## Example Usage

### Create a room
```bash
curl -X POST http://localhost:5000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"room_number": "101", "room_type": "single", "price_per_night": 99.99, "capacity": 1}'
```

### Register a guest
```bash
curl -X POST http://localhost:5000/api/guests \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "+1234567890"}'
```

### Create a booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"guest_id": 1, "room_id": 1, "check_in": "2026-07-01", "check_out": "2026-07-05"}'
```

## Room Types

- `single` — Single bed, 1 guest
- `double` — Double bed, 2 guests
- `suite` — Luxury suite, up to 4 guests
