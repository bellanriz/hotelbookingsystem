import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guest" | "host">("guest");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password, role);
      toast.success("Account created! Welcome to StayScape.");
      navigate("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="text-rose-500 text-3xl font-bold">
            StayScape
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-800">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Join StayScape and start exploring
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Full name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent
                         placeholder-gray-400 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent
                         placeholder-gray-400 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent
                         placeholder-gray-400 transition"
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to…
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("guest")}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition
                  ${role === "guest"
                    ? "border-rose-500 bg-rose-50 text-rose-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
              >
                🏖️ Book a stay
              </button>
              <button
                type="button"
                onClick={() => setRole("host")}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition
                  ${role === "host"
                    ? "border-rose-500 bg-rose-50 text-rose-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
              >
                🏠 List my property
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed
                       text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* Log in link */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-rose-500 font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
