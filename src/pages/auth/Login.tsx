import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { loginUser } from "../../services/auth/authService";
import "../../styles/auth.css";
const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate("/dashboard");
    } catch {
      setError("Email atau password salah.");
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
              YOUR SPACE TO GET THINGS DONE
            </span>

            <h1>
              Make room
              <br />
              for <span>great work.</span>
            </h1>

            <p>
              Bring your tasks, projects, and team together.
              Stay organized and make meaningful progress every day.
            </p>

            <div className="auth-showcase-note">
              <div className="auth-note-icon">
                <LockKeyhole size={19} />
              </div>
              <div>
                <strong>Your workspace, your way.</strong>
                <span>Everything you need, in one place.</span>
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
              <span className="auth-kicker">WELCOME BACK</span>
              <h2>Sign in to Chapri</h2>
              <p>
                Enter your account details to continue to your workspace.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-field">
                <label htmlFor="login-email">Email address</label>

                <div className="auth-input-wrap">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="login-email"
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
                <div className="auth-label-row">
                  <label htmlFor="login-password">Password</label>
                </div>

                <div className="auth-input-wrap">
                  <LockKeyhole size={18} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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
                <span>{loading ? "Signing in..." : "Sign in"}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="auth-switch">
              Don't have an account?
              <Link to="/register">Create an account</Link>
            </div>

            <p className="auth-legal">
              By continuing, you agree to use Chapri responsibly.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
};

export default Login;