import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineCash,
  HiOutlineOfficeBuilding,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Booking } from "../types";

// ─── Re-use same status badge style as TripsPage ─────────────────────────────
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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nightCount(checkIn: string, checkOut: string) {
  return Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
type Filter = "all" | Booking["status"];
const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HostBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (!authLoading && user && user.role !== "host") navigate("/");
  }, [user, authLoading, navigate]);

  // ── Fetch incoming bookings ────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "host") return;
    api
      .get("/bookings/hosting")
      .then((res) => setBookings(res.data))
      .catch(() => toast.error("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Cancel a booking on behalf of host ────────────────────────────────
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

  // ── Derived data ───────────────────────────────────────────────────────
  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    const order = { confirmed: 0, pending: 1, completed: 2, cancelled: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return new Date(a.check_in).getTime() - new Date(b.check_in).getTime();
  });

  // Summary counts
  const counts = bookings.reduce(
    (acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        Loading bookings…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incoming Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {bookings.length} total booking{bookings.length !== 1 && "s"}
          </p>
        </div>
        <Link
          to="/host/properties"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 border rounded-full px-4 py-2 hover:bg-gray-50 transition"
        >
          My listings
        </Link>
      </div>

      {/* Summary stat pills */}
      {bookings.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {(["confirmed", "pending", "completed", "cancelled"] as Booking["status"][]).map(
            (s) =>
              counts[s] ? (
                <div key={s} className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[s]}`}>
                  {counts[s]} {s}
                </div>
              ) : null
          )}
        </div>
      )}

      {/* Filter tabs */}
      {bookings.length > 0 && (
        <div className="flex gap-1 mb-6 border-b">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
                filter === f.value
                  ? "border-rose-500 text-rose-500"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {f.label}
              {f.value !== "all" && counts[f.value]
                ? ` (${counts[f.value]})`
                : f.value === "all"
                ? ` (${bookings.length})`
                : ""}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <HiOutlineOfficeBuilding size={48} className="text-gray-300" />
          <p className="text-gray-500 font-medium">No bookings yet</p>
          <p className="text-sm text-gray-400">
            When guests book your properties, they'll appear here.
          </p>
          <Link
            to="/host/properties"
            className="mt-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition"
          >
            View my listings
          </Link>
        </div>
      )}

      {/* No results for filter */}
      {bookings.length > 0 && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <HiOutlineExclamationCircle size={36} className="text-gray-300" />
          <p className="text-gray-400 text-sm">No {filter} bookings.</p>
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
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  {/* Property link */}
                  <Link
                    to={`/property/${booking.property_id}`}
                    className="text-base font-semibold text-gray-900 hover:text-rose-500 transition truncate block"
                  >
                    {booking.property_title ?? `Property #${booking.property_id}`}
                  </Link>
                  {/* Guest name */}
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <HiOutlineUserGroup className="shrink-0" />
                    Guest: <span className="font-medium text-gray-700">{booking.guest_name ?? "—"}</span>
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              {/* Details */}
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
                    {booking.num_guests} guest{booking.num_guests !== 1 && "s"} · {nights} night{nights !== 1 && "s"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiOutlineCash className="shrink-0 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    ${booking.total_price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Booked on + cancel */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-gray-400">
                  Booked {fmtDate(booking.created_at)}
                </span>
                {canCancel && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="text-sm font-medium text-gray-500 hover:text-red-500 underline underline-offset-2 disabled:opacity-50 transition"
                  >
                    {cancellingId === booking.id ? "Cancelling…" : "Cancel booking"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
