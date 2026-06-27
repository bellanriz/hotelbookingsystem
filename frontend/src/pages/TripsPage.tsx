import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineCash,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Booking } from "../types";

// ─── Status badge ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<Booking["status"], string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100  text-green-700",
  cancelled: "bg-gray-100   text-gray-500",
  completed: "bg-blue-100   text-blue-700",
};

function StatusBadge({ status }: { status: Booking["status"] }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// ─── Format date ─────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Night count ─────────────────────────────────────────────────────────────
function nightCount(checkIn: string, checkOut: string) {
  const diff =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000;
  return Math.round(diff);
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function TripsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch bookings
  useEffect(() => {
    if (!user) return;
    api
      .get("/bookings/")
      .then((res) => setBookings(res.data))
      .catch(() => toast.error("Failed to load trips."))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Cancel booking ─────────────────────────────────────────────────────
  const handleCancel = async (bookingId: number) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      setCancellingId(bookingId);
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.data : b))
      );
      toast.success("Booking cancelled.");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Could not cancel booking.";
      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  };

  // ── Sorted: active first, then by check-in date ────────────────────────
  const sorted = [...bookings].sort((a, b) => {
    const order = { confirmed: 0, pending: 1, completed: 2, cancelled: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return new Date(a.check_in).getTime() - new Date(b.check_in).getTime();
  });

  // ── Render ─────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        Loading your trips…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Trips</h1>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <HiOutlineExclamationCircle size={48} className="text-gray-300" />
          <p className="text-gray-500 font-medium">No trips yet</p>
          <p className="text-sm text-gray-400">
            When you book a place, it'll show up here.
          </p>
          <Link
            to="/"
            className="mt-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition"
          >
            Explore stays
          </Link>
        </div>
      )}

      {/* Booking cards */}
      <div className="space-y-4">
        {sorted.map((booking) => {
          const nights = nightCount(booking.check_in, booking.check_out);
          const canCancel =
            booking.status === "confirmed" || booking.status === "pending";

          return (
            <div
              key={booking.id}
              className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
            >
              {/* Top row: title + status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <Link
                    to={`/property/${booking.property_id}`}
                    className="text-base font-semibold text-gray-900 hover:text-rose-500 transition line-clamp-1"
                  >
                    {booking.property_title ?? `Property #${booking.property_id}`}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Booked on {fmtDate(booking.created_at)}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              {/* Details row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <HiOutlineCalendar className="shrink-0 text-gray-400" />
                  <span>
                    {fmtDate(booking.check_in)} → {fmtDate(booking.check_out)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiOutlineUserGroup className="shrink-0 text-gray-400" />
                  <span>
                    {booking.num_guests} guest{booking.num_guests !== 1 && "s"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiOutlineCash className="shrink-0 text-gray-400" />
                  <span>
                    ${booking.total_price.toFixed(2)}
                    <span className="text-gray-400 ml-1">
                      · {nights} night{nights !== 1 && "s"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              {canCancel && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="text-sm font-medium text-gray-500 hover:text-red-500 underline underline-offset-2 disabled:opacity-50 transition"
                  >
                    {cancellingId === booking.id ? "Cancelling…" : "Cancel booking"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
