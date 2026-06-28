import { useState, useEffect, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineHome,
  HiOutlineEye,
  HiStar,
  HiX,
} from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Property } from "../types";

// ─── Property type options ────────────────────────────────────────────────────
const PROPERTY_TYPES = ["apartment", "house", "villa", "cabin", "condo", "studio", "loft", "other"];

// ─── Common amenity presets ───────────────────────────────────────────────────
const AMENITY_PRESETS = [
  "WiFi", "Pool", "Parking", "Gym", "Kitchen", "TV",
  "Air Conditioning", "Heating", "Washer", "Dryer",
  "Balcony", "Pet Friendly", "BBQ", "Fireplace",
];

// ─── Blank form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: "",
  description: "",
  property_type: "apartment",
  location: "",
  country: "",
  price_per_night: "",
  cleaning_fee: "0",
  max_guests: "1",
  bedrooms: "1",
  bathrooms: "1",
  amenities: [] as string[],
  images: "",          // newline-separated URLs
};

type FormState = typeof EMPTY_FORM;

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HostDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Form panel
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (!authLoading && user && user.role !== "host") navigate("/");
  }, [user, authLoading, navigate]);

  // ── Fetch host's properties ────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "host") return;
    api
      .get("/properties/")
      .then((res) => {
        // Filter to only this host's listings
        const mine = (res.data as Property[]).filter((p) => p.host_id === user.id);
        setProperties(mine);
      })
      .catch(() => toast.error("Failed to load listings."))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Open form for new listing ──────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  // ── Open form pre-filled for edit ─────────────────────────────────────
  const openEdit = (p: Property) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      property_type: p.property_type,
      location: p.location,
      country: p.country,
      price_per_night: String(p.price_per_night),
      cleaning_fee: String(p.cleaning_fee),
      max_guests: String(p.max_guests),
      bedrooms: String(p.bedrooms),
      bathrooms: String(p.bathrooms),
      amenities: [...p.amenities],
      images: p.images.join("\n"),
    });
    setShowForm(true);
  };

  // ── Toggle amenity checkbox ────────────────────────────────────────────
  const toggleAmenity = (name: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(name)
        ? prev.amenities.filter((a) => a !== name)
        : [...prev.amenities, name],
    }));
  };

  // ── Submit create or update ────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.location || !form.country || !form.price_per_night) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      property_type: form.property_type,
      location: form.location.trim(),
      country: form.country.trim(),
      price_per_night: parseFloat(form.price_per_night),
      cleaning_fee: parseFloat(form.cleaning_fee) || 0,
      max_guests: parseInt(form.max_guests),
      bedrooms: parseInt(form.bedrooms),
      bathrooms: parseInt(form.bathrooms),
      amenities: form.amenities,
      images: form.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      setSaving(true);
      if (editingId) {
        const res = await api.put(`/properties/${editingId}`, payload);
        setProperties((prev) =>
          prev.map((p) => (p.id === editingId ? res.data : p))
        );
        toast.success("Listing updated.");
      } else {
        const res = await api.post("/properties/", payload);
        setProperties((prev) => [res.data, ...prev]);
        toast.success("Listing created!");
      }
      setShowForm(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Something went wrong.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete listing ─────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      await api.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast.success("Listing deleted.");
    } catch {
      toast.error("Could not delete listing.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        Loading your listings…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {properties.length} property{properties.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/host/bookings"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 border rounded-full px-4 py-2 hover:bg-gray-50 transition"
          >
            Incoming bookings
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
          >
            <HiOutlinePlus size={16} />
            New listing
          </button>
        </div>
      </div>

      {/* Empty state */}
      {properties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <HiOutlineHome size={48} className="text-gray-300" />
          <p className="text-gray-500 font-medium">No listings yet</p>
          <p className="text-sm text-gray-400">Create your first property to start hosting.</p>
          <button
            onClick={openCreate}
            className="mt-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition"
          >
            Create listing
          </button>
        </div>
      )}

      {/* Listings table */}
      {properties.length > 0 && (
        <div className="space-y-4">
          {properties.map((p) => {
            const image = p.images[0] ?? "https://placehold.co/120x80?text=No+Image";
            return (
              <div
                key={p.id}
                className="bg-white border rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition"
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-28 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <img src={image} alt={p.title} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {p.location}, {p.country} · {p.property_type}
                      </p>
                    </div>
                    {p.avg_rating && (
                      <div className="flex items-center gap-1 text-sm shrink-0">
                        <HiStar className="text-yellow-400" />
                        <span>{p.avg_rating}</span>
                        <span className="text-gray-400">({p.review_count})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">${p.price_per_night}/night</span>
                    <span>{p.bedrooms} bed · {p.bathrooms} bath · {p.max_guests} guests</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0 justify-center">
                  <Link
                    to={`/property/${p.id}`}
                    title="View listing"
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                  >
                    <HiOutlineEye size={18} />
                  </Link>
                  <button
                    onClick={() => openEdit(p)}
                    title="Edit listing"
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                  >
                    <HiOutlinePencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    title="Delete listing"
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 disabled:opacity-50 transition"
                  >
                    <HiOutlineTrash size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Slide-in form panel ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setShowForm(false)}
          />

          {/* Panel */}
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit listing" : "New listing"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <HiX size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Cozy beachfront apartment"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell guests about your place…"
                  rows={4}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />
              </div>

              {/* Property type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.property_type}
                  onChange={(e) => setForm({ ...form, property_type: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location + Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City / Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Bali"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="Indonesia"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price / night ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price_per_night}
                    onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
                    placeholder="120"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cleaning fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cleaning_fee}
                    onChange={(e) => setForm({ ...form, cleaning_fee: e.target.value })}
                    placeholder="0"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_guests}
                    onChange={(e) => setForm({ ...form, max_guests: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_PRESETS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        form.amenities.includes(a)
                          ? "bg-rose-500 border-rose-500 text-white"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URLs
                  <span className="text-gray-400 font-normal ml-1">(one per line)</span>
                </label>
                <textarea
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                  placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
                  rows={3}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none font-mono"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed
                             text-white font-semibold py-3 rounded-xl transition"
                >
                  {saving
                    ? editingId ? "Saving…" : "Creating…"
                    : editingId ? "Save changes" : "Create listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
