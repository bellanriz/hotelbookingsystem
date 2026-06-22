import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiOutlineGlobeAlt, HiOutlineUserCircle, HiOutlineMenu } from "react-icons/hi";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-rose-500 text-2xl font-bold">
          StayScape
        </Link>

        {/* Search bar placeholder */}
        <div className="hidden md:flex items-center border rounded-full px-4 py-2 shadow-sm hover:shadow-md transition cursor-pointer">
          <span className="text-sm font-medium px-3 border-r">Anywhere</span>
          <span className="text-sm font-medium px-3 border-r">Any week</span>
          <span className="text-sm text-gray-500 px-3">Add guests</span>
          <div className="bg-rose-500 text-white p-2 rounded-full ml-2">
            <HiOutlineGlobeAlt size={14} />
          </div>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          {user?.role === "host" && (
            <Link to="/host/properties" className="text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded-full">
              My Listings
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 border rounded-full px-3 py-2 shadow-sm hover:shadow-md transition cursor-pointer">
              <HiOutlineMenu size={18} />
              <div className="relative group">
                <HiOutlineUserCircle size={28} className="text-gray-600" />
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-xl shadow-lg py-2 hidden group-hover:block">
                  <Link to="/trips" className="block px-4 py-2 text-sm hover:bg-gray-100">
                    My Trips
                  </Link>
                  <Link to="/favorites" className="block px-4 py-2 text-sm hover:bg-gray-100">
                    Wishlist
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium hover:bg-gray-100 px-4 py-2 rounded-full">
                Log in
              </Link>
              <Link to="/register" className="text-sm font-medium bg-rose-500 text-white px-4 py-2 rounded-full hover:bg-rose-600">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
