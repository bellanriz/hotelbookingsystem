import { Link } from "react-router-dom";
import { HiStar, HiHeart, HiOutlineHeart } from "react-icons/hi";
import { Property } from "../types";

interface PropertyCardProps {
  property: Property;
  isFavorited?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export default function PropertyCard({ property, isFavorited = false, onToggleFavorite }: PropertyCardProps) {
  // Fallback image if no images uploaded
  const imageUrl = property.images.length > 0
    ? property.images[0]
    : "https://placehold.co/400x300?text=No+Image";

  return (
    <div className="group relative">
      {/* Favorite button (heart icon) */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault(); // Don't navigate when clicking heart
            onToggleFavorite(property.id);
          }}
          className="absolute top-3 right-3 z-10"
        >
          {isFavorited ? (
            <HiHeart size={26} className="text-rose-500" />
          ) : (
            <HiOutlineHeart size={26} className="text-white drop-shadow-md" />
          )}
        </button>
      )}

      {/* Clickable card links to property detail */}
      <Link to={`/property/${property.id}`}>
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-xl">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="mt-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-sm truncate">
              {property.location}, {property.country}
            </h3>
            {property.avg_rating && (
              <div className="flex items-center gap-1 text-sm">
                <HiStar className="text-yellow-500" />
                <span>{property.avg_rating}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 truncate">{property.title}</p>
          <p className="text-sm text-gray-500">
            {property.bedrooms} bed · {property.bathrooms} bath · {property.max_guests} guests
          </p>

          <p className="mt-1">
            <span className="font-semibold">${property.price_per_night}</span>
            <span className="text-sm text-gray-500"> / night</span>
          </p>
        </div>
      </Link>
    </div>
  );
}
