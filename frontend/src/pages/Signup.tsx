import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password needs to be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup(username, password, email || undefined);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 pb-24 pt-16">
      <h1 className="font-display text-3xl text-parchment">Join Kindred</h1>
      <p className="mt-2 text-sm text-muted">Create an account to start rating and get personalized picks.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-muted">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-sm text-parchment focus:border-gold"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-sm text-parchment focus:border-gold"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-sm text-parchment focus:border-gold"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 border border-gold py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-gold hover:underline">Log in</Link>
      </p>
    </div>
  );
}
