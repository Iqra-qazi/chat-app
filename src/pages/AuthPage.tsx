import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, MessageCircle, Sparkles } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { authApi, getApiError } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useToast } from "../hooks/useToast";

type AuthMode = "login" | "register";

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/chat" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (mode === "register" && name.trim().length < 2) {
      toast("Your name needs at least 2 characters.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast("Enter a valid email address.", "error");
      return;
    }
    if (password.length < 6) {
      toast("Your password must be at least 6 characters.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const result = mode === "login"
        ? await authApi.login(cleanEmail, password)
        : await authApi.register(name.trim(), cleanEmail, password);
      setAuth(result.token, result.user);
      toast(mode === "login" ? "Welcome back. It’s good to see you." : "Your account is ready. Welcome to Gather.", "success");
      navigate("/chat", { replace: true });
    } catch (error) {
      toast(getApiError(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-brand"><span className="brand-mark"><MessageCircle size={19} fill="currentColor" /></span><span className="brand-name">gather<span>.</span></span></div>
        <button className="auth-theme-toggle icon-button" aria-label="Toggle color theme" onClick={toggleTheme}>{theme === "light" ? "◐" : "☼"}</button>
        <div className="story-content">
          <div className="story-kicker"><span /> THE SPACE BETWEEN HELLOS</div>
          <h1>Make room<br />for <em>more</em><br />meaningful.</h1>
          <p>Less noise. More of the people and moments that make your day feel a little brighter.</p>
          <div className="story-note"><span className="note-icon"><Sparkles size={16} /></span><span>Good conversations have a way<br />of making anywhere feel like home.</span></div>
        </div>
        <div className="story-decoration story-decoration-one" />
        <div className="story-decoration story-decoration-two" />
        <div className="story-footer"><span>© 2025 Gather</span><span>Made for the people who matter.</span></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><span className="brand-mark"><MessageCircle size={17} fill="currentColor" /></span><span className="brand-name">gather<span>.</span></span></div>
          <div className="auth-heading">
            <span className="auth-welcome-icon"><LockKeyhole size={17} /></span>
            <p className="eyebrow">{mode === "login" ? "YOUR PEOPLE ARE HERE" : "A GOOD THING STARTS HERE"}</p>
            <h2>{mode === "login" ? "Welcome back." : "Come on in."}</h2>
            <p>{mode === "login" ? "Pick up right where the good conversations left off." : "Create an account and get a little closer."}</p>
          </div>

          <div className="auth-tabs" role="tablist">
            <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Sign in</button>
            <button role="tab" aria-selected={mode === "register"} className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={(event) => void submit(event)}>
            {mode === "register" && (
              <label className="form-label">Your name
                <input autoComplete="name" placeholder="How should we call you?" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={60} required />
              </label>
            )}
            <label className="form-label">Email address
              <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="form-label">Password
              <span className="password-input">
                <input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </label>
            {mode === "login" && <div className="auth-helper"><span><span className="helper-check">✓</span> A calmer corner of your day</span><span>Private by design</span></div>}
            <button className="primary-button auth-submit" disabled={submitting}>
              {submitting ? <span className="button-spinner" /> : <>{mode === "login" ? "Sign in to Gather" : "Create your account"} <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "login" ? "New around here? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Make yourself at home" : "Sign in instead"}</button>
          </p>
          <p className="auth-terms">By continuing, you agree to keep this a kind place for everyone.</p>
        </div>
        <div className="auth-bottom"><span>Take your time. We’re here.</span><span className="auth-bottom-sun">✳</span></div>
      </section>
    </main>
  );
}
