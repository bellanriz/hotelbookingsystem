import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiStar,
  HiOutlineLocationMarker,
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineMoon,
  HiOutlineHeart,
  HiHeart,
  HiArrowLeft,
} from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Property, Review } from "../types";

// ─── Amenity icon map ────────────────────────────────────────────────────────
const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  pool: "🏊",
  parking: "🚗",
  gym: "🏋️",
  kitchen: "🍳",
  tv: "📺",
  "air conditioning": "❄️",
  heating: "🔥",
  washer: "🫧",
  dryer: "🌀",
  balcony: "🌇",
  "pet friendly": "🐾",
  bbq: "🍖",
  fireplace: "🪵",
};

function amenityIcon(name: string) {
  return AMENITY_ICONS[name.toLowerCase()] ?? "✓";
}

// ─── Star rating display ─────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <HiStar
          key={n}
          size={16}
          className={n <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Property & reviews state
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProp, setLoadingProp] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Active gallery image
  const [activeImg, setActiveImg] = useState(0);

  // Booking form state
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [numGuests, setNumGuests] = useState(1);
  const [booking, setBooking] = useState(false);

  // ── Fetch property + reviews on mount ───────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoadingProp(true);

    Promise.all([
      api.get(`/properties/${id}`),
      api.get(`/reviews/property/${id}`),
    ])
      .then(([propRes, reviewRes]) => {
        setProperty(propRes.data);
        setReviews(reviewRes.data);
      })
      .catch(() => toast.error("Failed to load property."))
      .finally(() => setLoadingProp(false));
  }, [id]);

  // ── Price breakdown ──────────────────────────────────────────────────────
  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              86_400_000
          )
        )
      : 0;

  const subtotal = property ? nights * property.price_per_night : 0;
  const cleaningFee = property?.cleaning_fee ?? 0;
  const serviceFee = Math.round((subtotal + cleaningFee) * 0.12 * 100) / 100;
  const total = subtotal + cleaningFee + serviceFee;

  // ── Handle booking ───────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!user) {
      toast.error("Please log in to book.");
      navigate("/login");
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates.");
      return;
    }
    if (nights <= 0) {
      toast.error("Check-out must be after check-in.");
      return;
    }

    try {
      setBooking(true);
      await api.post("/bookings/", {
        property_id: Number(id),
        check_in: checkIn,
        check_out: checkOut,
        num_guests: numGuests,
      });
      toast.success("Booking confirmed! 🎉");
      navigate("/trips");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Booking failed. Please try again.";
      toast.error(message);
    } finally {
      setBooking(false);
    }
  };

  // ── Toggle favorite ──────────────────────────────────────────────────────
  const handleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to save favorites.");
      return;
    }
    try {
      if (isFavorited) {
        await api.delete(`/favorites/${id}`);
        setIsFavorited(false);
      } else {
        await api.post(`/favorites/${id}`);
        setIsFavorited(true);
      }
    } catch {
      toast.error("Could not update wishlist.");
    }
  };

  // ── Loading / error states ───────────────────────────────────────────────
  if (loadingProp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        Loading property…
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">Property not found.</p>
        <Link to="/" className="text-rose-500 hover:underline text-sm">
          Back to listings
        </Link>
      </div>
    );
  }

  const images =
    property.images.length > 0
      ? property.images
      : ["https://placehold.co/800x500?text=No+Image"];

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Back link ────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        <HiArrowLeft size={16} />
        Back
      </button>

      {/* ── Title row ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {property.avg_rating && (
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <HiStar className="text-yellow-400" />
                {property.avg_rating} · {property.review_count} review
                {property.review_count !== 1 && "s"}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HiOutlineLocationMarker />
              {property.location}, {property.country}
            </span>
          </div>
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-rose-500 transition shrink-0"
          aria-label={isFavorited ? "Remove from wishlist" : "Save to wishlist"}
        >
          {isFavorited ? (
            <HiHeart size={20} className="text-rose-500" />
          ) : (
            <HiOutlineHeart size={20} />
          )}
          {isFavorited ? "Saved" : "Save"}
        </button>
      </div>

      {/* ── Gallery ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="rounded-2xl overflow-hidden aspect-video bg-gray-100">
          <img
            src={images[activeImg]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition ${
                  i === activeImg ? "border-rose-500" : "border-transparent"
                }`}
              >
                <img
                  src={src}
                  alt={`Image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main content + Booking widget ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-10">

        {/* Left: details */}
        <div className="flex-1 space-y-8">

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <HiOutlineHome size={18} />
              {property.property_type}
            </span>
            <span className="flex items-center gap-1.5">
              <HiOutlineUserGroup size={18} />
              {property.max_guests} guests
            </span>
            <span className="flex items-center gap-1.5">
              <HiOutlineMoon size={18} />
              {property.bedrooms} bedroom{property.bedrooms !== 1 && "s"}
            </span>
            <span className="flex items-center gap-1.5">
              🚿 {property.bathrooms} bath{property.bathrooms !== 1 && "s"}
            </span>
          </div>

          <hr />

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">About this place</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          <hr />

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span className="text-lg">{amenityIcon(amenity)}</span>
                    <span className="capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr />

          {/* Reviews */}
          <div>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              Reviews
              {property.avg_rating && (
                <span className="flex items-center gap-1 text-base font-normal text-gray-500">
                  <HiStar className="text-yellow-400" />
                  {property.avg_rating} · {reviews.length} review
                  {reviews.length !== 1 && "s"}
                </span>
              )}
            </h2>

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-400 mt-2">No reviews yet.</p>
            ) : (
              <div className="space-y-5 mt-4">
                {reviews.map((review) => (
                  <div key={review.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {review.author_name ?? "Guest"}
                      </span>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking widget */}
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-24 bg-white border rounded-2xl shadow-lg p-6 space-y-5">

            {/* Price */}
            <div>
              <span className="text-2xl font-bold">${property.price_per_night}</span>
              <span className="text-gray-500 text-sm"> / night</span>
            </div>

            {/* Date pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Check-in
                </label>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Check-out
                </label>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            {/* Guest count */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Guests
              </label>
              <select
                value={numGuests}
                onChange={(e) => setNumGuests(Number(e.target.value))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {Array.from({ length: property.max_guests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} guest{n > 1 && "s"}
                  </option>
                ))}
              </select>
            </div>

            {/* Price breakdown — only when dates are selected */}
            {nights > 0 && (
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>
                    ${property.price_per_night} × {nights} night{nights !== 1 && "s"}
                  </span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {cleaningFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Cleaning fee</span>
                    <span>${cleaningFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Service fee (12%)</span>
                  <span>${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Book button */}
            <button
              onClick={handleBook}
              disabled={booking}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed
                         text-white font-semibold py-3 rounded-xl transition"
            >
              {booking ? "Booking…" : nights > 0 ? `Reserve · $${total.toFixed(2)}` : "Check availability"}
            </button>

            <p className="text-center text-xs text-gray-400">
              You won't be charged yet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
