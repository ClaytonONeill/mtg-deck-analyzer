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
    <div className="min-h-screen bg-base-300 flex items-center justify-center px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-content/5">
        <div className="card-body p-8 gap-6">
          {/* Brand/Title */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-primary italic">
              MTG <span className="text-base-content">DECK ANALYZER</span>
            </h1>
            <p className="text-xs uppercase tracking-widest font-bold opacity-40">
              {view === "sign_in" && "Welcome Back"}
              {view === "sign_up" && "Create Operative"}
              {view === "forgot_password" && "Initiate Recovery"}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="alert alert-error text-xs py-2 rounded-md animate-in fade-in slide-in-from-top-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="alert alert-success text-xs py-2 rounded-md animate-in fade-in slide-in-from-top-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{message}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="form-control gap-4">
            <div className="space-y-1">
              <label className="label-text-alt font-bold opacity-50 px-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="planeswalker@bolas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full bg-base-200 focus:input-primary transition-all"
              />
            </div>

            {view !== "forgot_password" && (
              <div className="space-y-1">
                <label className="label-text-alt font-bold opacity-50 px-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="input input-bordered w-full bg-base-200 focus:input-primary transition-all"
                />
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="card-actions mt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary btn-block shadow-lg shadow-primary/20"
            >
              {loading && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              {view === "sign_in" && "Sign In"}
              {view === "sign_up" && "Create Account"}
              {view === "forgot_password" && "Send Reset Link"}
            </button>
          </div>

          {/* View Switcher */}
          <div className="divider opacity-5 text-[10px] uppercase font-bold tracking-widest">
            or
          </div>

          <div className="flex flex-col gap-3 text-center">
            {view === "sign_in" && (
              <>
                <button
                  onClick={() => setView("sign_up")}
                  className="text-xs font-bold opacity-50 hover:opacity-100 hover:text-primary transition-all"
                >
                  Don't have an account?{" "}
                  <span className="underline">Sign up</span>
                </button>
                <button
                  onClick={() => setView("forgot_password")}
                  className="text-[10px] uppercase tracking-tighter opacity-30 hover:opacity-100 transition-all"
                >
                  Forgot password?
                </button>
              </>
            )}
            {(view === "sign_up" || view === "forgot_password") && (
              <button
                onClick={() => setView("sign_in")}
                className="text-xs font-bold opacity-50 hover:opacity-100 hover:text-primary transition-all"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
