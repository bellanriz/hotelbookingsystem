import { useState, useEffect } from "react";
import { HiSearch } from "react-icons/hi";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Property } from "../types";
import PropertyCard from "../components/PropertyCard";

export default function HomePage() {
  const { user } = useAuth();

  // State: list of properties, loading indicator, error message, search input
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);

  // Fetch all properties when the page loads
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async (location = "") => {
    try {
      setLoading(true);
      const params = location ? `?location=${location}` : "";
      const res = await api.get(`/properties${params}`);
      setProperties(res.data);
    } catch (err) {
      setError("Failed to load properties. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Run search when user submits
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties(search);
  };

  const handleToggleFavorite = async (propertyId: number) => {
    if (!user) {
      alert("Please log in to save favorites");
      return;
    }

    try {
      if (favorites.includes(propertyId)) {
        await api.delete(`/favorites/${propertyId}`);
        setFavorites((prev) => prev.filter((id) => id !== propertyId));
      } else {
        await api.post(`/favorites/${propertyId}`);
        setFavorites((prev) => [...prev, propertyId]);
      }
    } catch (err) {
      // Already favorited or other error — silently ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-10 max-w-xl mx-auto">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by location..."
          className="flex-1 border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        <button
          type="submit"
          className="bg-rose-500 text-white px-5 py-3 rounded-full hover:bg-rose-600 transition flex items-center gap-2"
        >
          <HiSearch size={18} />
          Search
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="text-center text-gray-400 py-20">Loading properties...</div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center text-red-500 py-20">{error}</div>
      )}

      {/* Empty state */}
      {!loading && !error && properties.length === 0 && (
        <div className="text-center text-gray-400 py-20">
          No properties found. Try a different location.
        </div>
      )}

      {/* Properties grid */}
      {!loading && !error && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorited={favorites.includes(property.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
