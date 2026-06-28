import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import TripsPage from "./pages/TripsPage";
import FavoritesPage from "./pages/FavoritesPage";
import HostDashboardPage from "./pages/HostDashboardPage";
import HostBookingsPage from "./pages/HostBookingsPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global toast notifications */}
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/host/properties" element={<HostDashboardPage />} />
          <Route path="/host/bookings" element={<HostBookingsPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
