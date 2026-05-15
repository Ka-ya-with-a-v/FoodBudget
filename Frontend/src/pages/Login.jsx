import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

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

    try {
      const result = await signIn(email, pwd);
      if (result.success) {
        navigate("/profile");
      } else {
        setError(result.error || "Failed to sign in. Please check your credentials.");
      }
    } catch (err) {
      setError(err.message || "An error occurred during sign in.");
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
            Welcome <span>Back</span>
          </h1>
          <p className="subtitle">Sign in to plan smarter and save more.</p>

          <section className="card">
            <form className="form" onSubmit={onSubmit} noValidate>
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
                  placeholder="••••••••"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  autoComplete="current-password"
                  minLength={6}
                />
              </div>

              {/* Removed Remember me block */}

              {error && <div className="error">{error}</div>}

              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="divider"><span>or</span></div>

              <p className="foot">
                Don’t have an account?{" "}
                <Link className="link" to="/signup">Create one</Link> {/* <-- points to /signup */}
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
