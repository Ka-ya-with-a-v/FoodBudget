import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext";
import "./login.css"; // reuse the same styles for consistency

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth(); // make sure your AuthContext exposes signUp
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!displayName.trim()) {
      setError("Please enter your display name.");
      setLoading(false);
      return;
    }
    const okEmail = /\S+@\S+\.\S+/.test(email);
    if (!okEmail) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (pwd.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (pwd !== pwd2) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Trim and normalize values before sending
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedDisplayName = displayName.trim();
      
      const result = await signUp(normalizedEmail, pwd, normalizedDisplayName);
      if (result.success) {
        // Decide where to go next. Often /profile or /login.
        navigate("/profile");
      } else {
        setError(result.error || "Failed to create account.");
      }
    } catch (err) {
      setError(err.message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="auth">
        <div className="authBox">
          <h1 className="title">
            Create <span>Account</span>
          </h1>
          <p className="subtitle">Join us and start planning smarter meals.</p>

          <section className="card">
            <form className="form" onSubmit={onSubmit} noValidate>
              <div className="field">
                <label className="label" htmlFor="name">Display Name</label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="pwd">Password</label>
                <input
                  id="pwd"
                  type="password"
                  className="input"
                  placeholder="Create a password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="pwd2">Confirm Password</label>
                <input
                  id="pwd2"
                  type="password"
                  className="input"
                  placeholder="Repeat your password"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <div className="error">{error}</div>}

              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>

              <div className="divider"><span>or</span></div>

              <p className="foot">
                Already have an account?{" "}
                <Link className="link" to="/login">Sign in</Link>
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
