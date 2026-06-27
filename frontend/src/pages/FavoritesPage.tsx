import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineHeart } from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Property } from "../types";
import PropertyCard from "../components/PropertyCard";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch favorited properties
  useEffect(() => {
    if (!user) return;
    api
      .get("/favorites/")
      .then((res) => setProperties(res.data))
      .catch(() => toast.error("Failed to load wishlist."))
      .finally(() => setLoading(false));
  }, [user]);

  // Remove from wishlist — updates list in place without re-fetching
  const handleRemove = async (propertyId: number) => {
    try {
      await api.delete(`/favorites/${propertyId}`);
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      toast.success("Removed from wishlist.");
    } catch {
      toast.error("Could not remove from wishlist.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        Loading your wishlist…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wishlist</h1>

      {/* Empty state */}
      {properties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <HiOutlineHeart size={48} className="text-gray-300" />
          <p className="text-gray-500 font-medium">No saved places yet</p>
          <p className="text-sm text-gray-400">
            Tap the heart on any listing to save it here.
          </p>
          <Link
            to="/"
            className="mt-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition"
          >
            Explore stays
          </Link>
        </div>
      )}

      {/* Property grid — reuses PropertyCard with remove handler */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorited={true}
              onToggleFavorite={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
