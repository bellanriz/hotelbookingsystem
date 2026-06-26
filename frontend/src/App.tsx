import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

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
          {/* Placeholder routes — pages to be built */}
          <Route path="/register" element={<div className="p-10 text-center text-gray-400">Register page coming soon</div>} />
          <Route path="/trips" element={<div className="p-10 text-center text-gray-400">My Trips coming soon</div>} />
          <Route path="/favorites" element={<div className="p-10 text-center text-gray-400">Wishlist coming soon</div>} />
          <Route path="/host/properties" element={<div className="p-10 text-center text-gray-400">Host Dashboard coming soon</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
