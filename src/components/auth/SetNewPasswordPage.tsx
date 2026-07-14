import { useState } from "react";

interface Props {
  onSave: (password: string) => Promise<unknown> | undefined;
}

export function SetNewPasswordPage({ onSave }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      const res = await onSave(password);
      const r = res as { error?: { message: string } } | undefined;
      if (r?.error) setError(r.error.message);
      else setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "linear-gradient(135deg, #eef0f8 0%, #f5f3ff 50%, #eef0f8 100%)" }}
    >
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #a5b4fc, transparent)" }}
      />
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(99,102,241,0.12), 0 1px 2px rgba(0,0,0,0.04)",
          border: "1px solid rgba(255,255,255,0.9)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}
        >
          <span className="text-2xl font-bold text-white tracking-tight">L</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Set new password</h1>
        <p className="text-sm text-gray-400 mb-6">Choose a strong password for your account.</p>

        {success ? (
          <div className="w-full text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-semibold text-gray-800">Password updated!</p>
            <p className="text-xs text-gray-400 mt-1">You're now signed in. Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <input
              type="password"
              required
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200 outline-none focus:border-indigo-400 transition-colors"
              style={{ background: "#fafafa" }}
              autoFocus
            />
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200 outline-none focus:border-indigo-400 transition-colors"
              style={{ background: "#fafafa" }}
            />
            {error && <p className="text-xs text-red-500 text-left">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              {submitting ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
