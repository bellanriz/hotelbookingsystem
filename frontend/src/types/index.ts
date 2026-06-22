// These match your backend Pydantic schemas exactly.
// TypeScript uses these to catch errors at compile time.

export interface User {
  id: number;
  name: string;
  email: string;
  role: "guest" | "host";
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface Property {
  id: number;
  host_id: number;
  title: string;
  description: string;
  property_type: string;
  location: string;
  country: string;
  latitude?: number;
  longitude?: number;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  avg_rating?: number;
  review_count: number;
  created_at: string;
}

export interface Booking {
  id: number;
  guest_id: number;
  property_id: number;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_price: number;
  service_fee: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  property_title?: string;
  guest_name?: string;
  created_at: string;
}

export interface Review {
  id: number;
  booking_id: number;
  author_id: number;
  property_id: number;
  rating: number;
  comment: string;
  author_name?: string;
  created_at: string;
}
