const API_BASE = "http://localhost:5000/api";

// ============ NAVIGATION ============
function showSection(section) {
    document.getElementById("rooms-section").style.display = "none";
    document.getElementById("guests-section").style.display = "none";
    document.getElementById("bookings-section").style.display = "none";
    document.getElementById(`${section}-section`).style.display = "block";

    // Refresh data when switching tabs
    if (section === "rooms") loadRooms();
    if (section === "guests") loadGuests();
    if (section === "bookings") loadBookings();
}

// ============ ROOMS ============
async function loadRooms() {
    // GET request — fetches all rooms from the backend
    const response = await fetch(`${API_BASE}/rooms`);
    const rooms = await response.json();

    const list = document.getElementById("rooms-list");
    list.innerHTML = rooms.map(room => `
        <div class="card">
            <strong>Room ${room.room_number}</strong> — ${room.room_type}
            <br>$${room.price_per_night}/night | Capacity: ${room.capacity}
            <br>Status: ${room.is_available ? "Available" : "Occupied"}
            <button onclick="deleteRoom(${room.id})">Delete</button>
        </div>
    `).join("");
}

document.getElementById("room-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent page reload

    // POST request — sends JSON data to create a new room
    const response = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            room_number: document.getElementById("room-number").value,
            room_type: document.getElementById("room-type").value,
            price_per_night: parseFloat(document.getElementById("room-price").value),
            capacity: parseInt(document.getElementById("room-capacity").value),
        }),
    });

    if (response.ok) {
        e.target.reset(); // clear the form
        loadRooms();      // refresh the list
    } else {
        const error = await response.json();
        alert(error.error);
    }
});

async function deleteRoom(id) {
    // DELETE request — removes a room by ID
    await fetch(`${API_BASE}/rooms/${id}`, { method: "DELETE" });
    loadRooms();
}

// ============ GUESTS ============
async function loadGuests() {
    const response = await fetch(`${API_BASE}/guests`);
    const guests = await response.json();

    const list = document.getElementById("guests-list");
    list.innerHTML = guests.map(guest => `
        <div class="card">
            <strong>${guest.name}</strong>
            <br>${guest.email} | ${guest.phone}
            <button onclick="deleteGuest(${guest.id})">Delete</button>
        </div>
    `).join("");
}

document.getElementById("guest-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const response = await fetch(`${API_BASE}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: document.getElementById("guest-name").value,
            email: document.getElementById("guest-email").value,
            phone: document.getElementById("guest-phone").value,
        }),
    });

    if (response.ok) {
        e.target.reset();
        loadGuests();
    } else {
        const error = await response.json();
        alert(error.error);
    }
});

async function deleteGuest(id) {
    await fetch(`${API_BASE}/guests/${id}`, { method: "DELETE" });
    loadGuests();
}

// ============ BOOKINGS ============
async function loadBookings() {
    const response = await fetch(`${API_BASE}/bookings`);
    const bookings = await response.json();

    const list = document.getElementById("bookings-list");
    list.innerHTML = bookings.map(booking => `
        <div class="card">
            <strong>Booking #${booking.id}</strong>
            <br>Guest: ${booking.guest_name} | Room: ${booking.room_number}
            <br>${booking.check_in} → ${booking.check_out}
            <br>Total: $${booking.total_price} | Status: ${booking.status}
            ${booking.status === "confirmed" ? `
                <button onclick="cancelBooking(${booking.id})">Cancel</button>
                <button onclick="completeBooking(${booking.id})">Complete</button>
            ` : ""}
        </div>
    `).join("");

    // Also load dropdowns for the booking form
    loadBookingDropdowns();
}

async function loadBookingDropdowns() {
    // Populate guest dropdown
    const guestsRes = await fetch(`${API_BASE}/guests`);
    const guests = await guestsRes.json();
    document.getElementById("booking-guest").innerHTML =
        '<option value="">Select Guest</option>' +
        guests.map(g => `<option value="${g.id}">${g.name}</option>`).join("");

    // Populate room dropdown (available rooms only)
    const roomsRes = await fetch(`${API_BASE}/rooms?available=true`);
    const rooms = await roomsRes.json();
    document.getElementById("booking-room").innerHTML =
        '<option value="">Select Room</option>' +
        rooms.map(r => `<option value="${r.id}">Room ${r.room_number} (${r.room_type})</option>`).join("");
}

document.getElementById("booking-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            guest_id: parseInt(document.getElementById("booking-guest").value),
            room_id: parseInt(document.getElementById("booking-room").value),
            check_in: document.getElementById("booking-checkin").value,
            check_out: document.getElementById("booking-checkout").value,
        }),
    });

    if (response.ok) {
        e.target.reset();
        loadBookings();
    } else {
        const error = await response.json();
        alert(error.error);
    }
});

async function cancelBooking(id) {
    await fetch(`${API_BASE}/bookings/${id}/cancel`, { method: "POST" });
    loadBookings();
}

async function completeBooking(id) {
    await fetch(`${API_BASE}/bookings/${id}/complete`, { method: "POST" });
    loadBookings();
}

// ============ INIT ============
// Load rooms on page load
loadRooms();
