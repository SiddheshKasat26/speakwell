"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Create profile row for new user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").insert({
            id: user.id,
            username: email.split("@")[0],  // use email prefix as username
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      // Redirect to home on success
      router.push("/");

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Logo */}
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          SpeakWell
        </h1>
        <p className="text-gray-500 text-center mb-8">
          AI-powered English speaking coach
        </p>

        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
              ${mode === "signin"
                ? "bg-white shadow text-gray-800"
                : "text-gray-500"
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
              ${mode === "signup"
                ? "bg-white shadow text-gray-800"
                : "text-gray-500"
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5
                text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5
                text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all
              ${loading || !email || !password
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading
              ? "Please wait..."
              : mode === "signin" ? "Sign In" : "Create Account"
            }
          </button>
        </div>
      </div>
    </main>
  );
}