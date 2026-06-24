// ============================================================================
// Login.jsx — Authentication Portal (Dark Glassmorphism Design)
// ============================================================================
// Collects username and password, authenticates against POST /api/auth/login,
// and returns the full user profile object to the parent on success.
//
// Props contract:
//   onLoginSuccess  — Callback(userObject) fired on successful authentication
//   onSwitchToSignup — Callback() to toggle to the signup view
// ============================================================================
import React, { useState } from "react";

const BACKEND_URL = "http://localhost:8080/api";

export default function Login({ onLoginSuccess, onSwitchToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Invalid username or password.");
        setIsLoading(false);
        return;
      }

      const user = await res.json();
      onLoginSuccess(user);
    } catch (err) {
      console.error("Login network error:", err);
      setError("Unable to reach the server. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-3xl">✓</span>
            <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              TASKMASTER
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Sign in to access your workspace
          </p>
        </div>

        {/* Glassmorphism card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl shadow-black/20 p-8">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Welcome back</h2>

          {/* Error alert */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-[fadeIn_0.2s_ease-out]">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 text-slate-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 text-slate-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Toggle to signup */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToSignup}
              className="text-blue-400 hover:text-blue-300 font-semibold transition"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
