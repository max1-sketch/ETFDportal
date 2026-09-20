import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { base44 } from "@/api/base44Client";

// Helper to save authenticated user into local storage and memory
const saveGoogleAuthUser = (token) => {
  let email = "google_user@gmail.com";
  let name = "Google User";

  // Try decoding basic user info from Google JWT if returned
  try {
    const base64Url = token.split('.')[1];
    if (base64Url) {
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const parsed = JSON.parse(jsonPayload);
      if (parsed.email) email = parsed.email;
      if (parsed.name) name = parsed.name;
    }
  } catch (e) {
    // Fallback to default mock user if standard access_token string
  }

  const authUser = {
    id: "google_" + Date.now(),
    email: email,
    name: name,
    provider: "google",
    token: token,
    authenticated: true
  };

  localStorage.setItem("mock_user", JSON.stringify(authUser));
  
  // Sync runtime base44 mock
  if (globalThis.__B44_DB__) {
    globalThis.__B44_DB__.auth.me = async () => authUser;
    globalThis.__B44_DB__.auth.isAuthenticated = async () => true;
  }

  return authUser;
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const returnTo = safeReturnTo();

  // Handle Google OAuth Callback (#access_token=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token") || hash.includes("id_token"))) {
      setSocialLoading(true);
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token") || params.get("id_token");

      if (accessToken) {
        // 1. Save user state
        saveGoogleAuthUser(accessToken);

        // 2. Clear token hash from browser address bar cleanly
        window.history.replaceState(null, "", window.location.pathname);

        // 3. Smooth transition to home or target page
        setTimeout(() => {
          window.location.href = returnTo !== "/login" ? returnTo : "/";
        }, 300);
      }
    }
  }, [returnTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (base44?.auth?.loginViaEmailPassword) {
        await base44.auth.loginViaEmailPassword(email, password);
      } else {
        localStorage.setItem("mock_user", JSON.stringify({ id: "user_123", email, provider: "email" }));
      }
      window.location.href = returnTo !== "/login" ? returnTo : "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setSocialLoading(true);
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (GOOGLE_CLIENT_ID) {
      // Send user to Google OAuth screen
      const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile&prompt=select_account`;
      window.location.href = googleOAuthUrl;
    } else {
      // Fallback for local testing without Client ID
      saveGoogleAuthUser("mock_token");
      setTimeout(() => {
        window.location.href = returnTo !== "/login" ? returnTo : "/";
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Backdrop loading overlay during OAuth processing */}
      {socialLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
          <p className="text-sm font-medium text-slate-300">Logging you in with Google...</p>
        </div>
      )}

      {/* Background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px]">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30">
              <Waves className="h-6 w-6 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display font-semibold text-white tracking-tight text-lg leading-tight text-left">
              Escape Tsunami
              <span className="block text-[10px] font-normal text-cyan-300/80 tracking-[0.18em] uppercase">For Developers</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 mb-4">
            <ShieldCheck className="h-3.5 w-3.5" /> Member Portal
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Log in to your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-cyan-950/40 p-7">
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full h-11 rounded-lg bg-white text-black text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-neutral-100 transition-colors"
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-950/80 px-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                OR
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Log in <ArrowRight className="w-4 h-4 ml-1.5" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}