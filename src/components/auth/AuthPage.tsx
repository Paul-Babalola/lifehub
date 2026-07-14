import { useState } from "react";

interface Props {
  onSignIn: () => void;
  onEmailSignIn: (email: string, password: string) => Promise<unknown> | undefined;
  onEmailSignUp: (email: string, password: string, firstName: string, lastName: string) => Promise<unknown> | undefined;
  onResetPassword: (email: string) => Promise<unknown> | undefined;
}

type Mode = "signin" | "signup" | "reset";

export function AuthPage({ onSignIn, onEmailSignIn, onEmailSignUp, onResetPassword }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      if (!firstName.trim()) { setError("First name is required."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        const res = await onEmailSignIn(email, password);
        const r = res as { error?: { message: string } } | undefined;
        if (r?.error) setError(r.error.message);
      } else if (mode === "signup") {
        const res = await onEmailSignUp(email, password, firstName.trim(), lastName.trim());
        const r = res as { error?: { message: string } } | undefined;
        if (r?.error) setError(r.error.message);
        else setMessage("Check your email for a confirmation link.");
      } else {
        const res = await onResetPassword(email);
        const r = res as { error?: { message: string } } | undefined;
        if (r?.error) setError(r.error.message);
        else setMessage("Password reset email sent — check your inbox.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "linear-gradient(135deg, #eef0f8 0%, #f5f3ff 50%, #eef0f8 100%)" }}
    >
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #a5b4fc, transparent)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #c4b5fd, transparent)" }}
      />

      <div
        className="relative w-full max-w-sm rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center my-auto"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(99,102,241,0.12), 0 1px 2px rgba(0,0,0,0.04)",
          border: "1px solid rgba(255,255,255,0.9)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
          }}
        >
          <span className="text-2xl font-bold text-white tracking-tight">L</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">LifeHub</h1>
        <p className="text-sm text-gray-400 mb-6">
          {mode === "reset" ? "Reset your password" : "Sign in to sync across all your devices"}
        </p>

        {/* Tab switcher — hidden in reset mode */}
        {mode !== "reset" && (
          <div className="flex w-full mb-6 rounded-xl overflow-hidden border border-gray-100" style={{ background: "#f3f4f6" }}>
            <button
              className="flex-1 py-2 text-sm font-semibold transition-colors"
              style={mode === "signin" ? { background: "#fff", color: "#4f46e5", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#9ca3af" }}
              onClick={() => switchMode("signin")}
            >
              Sign In
            </button>
            <button
              className="flex-1 py-2 text-sm font-semibold transition-colors"
              style={mode === "signup" ? { background: "#fff", color: "#4f46e5", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#9ca3af" }}
              onClick={() => switchMode("signup")}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mb-4">
          {/* Name fields — sign up only */}
          {mode === "signup" && (
            <>
              <input
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200 outline-none focus:border-indigo-400 transition-colors"
                style={{ background: "#fafafa" }}
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200 outline-none focus:border-indigo-400 transition-colors"
                style={{ background: "#fafafa" }}
              />
            </>
          )}

          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200 outline-none focus:border-indigo-400 transition-colors"
            style={{ background: "#fafafa" }}
          />

          {/* Password fields — hidden in reset mode */}
          {mode !== "reset" && (
            <>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200 outline-none focus:border-indigo-400 transition-colors"
                style={{ background: "#fafafa" }}
              />
              {mode === "signup" && (
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200 outline-none focus:border-indigo-400 transition-colors"
                  style={{ background: "#fafafa" }}
                />
              )}
            </>
          )}

          {error && <p className="text-xs text-red-500 text-left">{error}</p>}
          {message && <p className="text-xs text-green-600 text-left">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
          >
            {submitting ? "…" : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Email"}
          </button>

          {/* Forgot password — sign in only */}
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => switchMode("reset")}
              className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors text-center mt-1"
            >
              Forgot password?
            </button>
          )}

          {/* Back link — reset mode */}
          {mode === "reset" && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center mt-1"
            >
              Back to sign in
            </button>
          )}
        </form>

        {/* Google — hidden in reset mode */}
        {mode !== "reset" && (
          <>
            <div className="flex items-center w-full gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold text-gray-700 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "#fff",
                border: "1.5px solid rgba(0,0,0,0.1)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </>
        )}

        <p className="mt-6 text-[11px] text-gray-300 leading-relaxed">
          Your data is end-to-end encrypted via Supabase.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}
