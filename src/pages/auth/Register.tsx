import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { registerUser } from "../../services/auth/authService";
import "../../styles/auth.css";
const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser(name, email, password);

      alert("Registrasi berhasil! Silakan verifikasi email kamu.");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registrasi gagal.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <aside className="auth-showcase">
          <Link to="/login" className="auth-brand">
            chapri<span>.</span>
          </Link>

          <div className="auth-showcase-content">
            <span className="auth-kicker">
              START SOMETHING GREAT
            </span>

            <h1>
              Better plans.
              <br />
              <span>Better progress.</span>
            </h1>

            <p>
              Create your workspace, organize your priorities,
              and bring your team closer to getting things done.
            </p>

            <div className="auth-showcase-note">
              <div className="auth-note-icon">
                <UserRound size={19} />
              </div>
              <div>
                <strong>A fresh start begins here.</strong>
                <span>Build better habits with Chapri.</span>
              </div>
            </div>
          </div>

          <div className="auth-showcase-footer">
            <span>© 2026 Chapri</span>
            <span>Work better, together.</span>
          </div>
        </aside>

        <section className="auth-form-side">
          <div className="auth-form-wrapper">
            <div className="auth-mobile-brand">
              chapri<span>.</span>
            </div>

            <div className="auth-heading">
              <span className="auth-kicker">GET STARTED</span>
              <h2>Create your account</h2>
              <p>
                Join Chapri and start organizing your work with ease.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="auth-field">
                <label htmlFor="register-name">Full name</label>

                <div className="auth-input-wrap">
                  <UserRound size={18} className="auth-input-icon" />
                  <input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">Email address</label>

                <div className="auth-input-wrap">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="register-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-password">Password</label>

                <div className="auth-input-wrap">
                  <LockKeyhole size={18} className="auth-input-icon" />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                <span>
                  {loading ? "Creating account..." : "Create account"}
                </span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="auth-switch">
              Already have an account?
              <Link to="/login">Sign in</Link>
            </div>

            <p className="auth-legal">
              By creating an account, you agree to use Chapri responsibly.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
};

export default Register;