// Modules
import { useState } from "react";

// Lib
import { supabase } from "@/lib/supabase";

type AuthView = "sign_in" | "sign_up" | "forgot_password";

export default function LoginPage() {
  const [view, setView] = useState<AuthView>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (view === "sign_in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setError(error.message);
      } else if (view === "sign_up") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else setMessage("Check your email to confirm your account.");
      } else if (view === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setError(error.message);
        else setMessage("Password reset link sent — check your email.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 p-8 rounded-xl w-full max-w-md flex flex-col gap-6">
        {/* Title */}
        <h1 className="text-white text-2xl font-bold text-center">
          MTG Deck Analyzer
        </h1>

        {/* View heading */}
        <p className="text-slate-400 text-sm text-center">
          {view === "sign_in" && "Sign in to your account"}
          {view === "sign_up" && "Create an account"}
          {view === "forgot_password" && "Reset your password"}
        </p>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-800 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1971c2]"
          />
          {view !== "forgot_password" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="bg-slate-800 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1971c2]"
            />
          )}
        </div>

        {/* Error / success messages */}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {message && (
          <p className="text-green-400 text-sm text-center">{message}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#1971c2] hover:bg-[#1864ab] disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:cursor-pointer transition-colors"
        >
          {loading
            ? "Loading..."
            : view === "sign_in"
              ? "Sign In"
              : view === "sign_up"
                ? "Create Account"
                : "Send Reset Link"}
        </button>

        {/* View switcher */}
        <div className="flex flex-col gap-2 text-center text-sm">
          {view === "sign_in" && (
            <>
              <button
                onClick={() => setView("forgot_password")}
                className="text-slate-400 hover:text-white hover:cursor-pointer transition-colors"
              >
                Forgot your password?
              </button>
              <button
                onClick={() => setView("sign_up")}
                className="text-slate-400 hover:text-white hover:cursor-pointer transition-colors"
              >
                Don't have an account? Sign up
              </button>
            </>
          )}
          {(view === "sign_up" || view === "forgot_password") && (
            <button
              onClick={() => setView("sign_in")}
              className="text-slate-400 hover:text-white hover:cursor-pointer transition-colors"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
