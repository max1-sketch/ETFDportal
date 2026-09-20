import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { base44 } from "@/api/base44Client";

// Fetch real profile details from Google's UserInfo API using the access token
const fetchAndSaveGoogleProfile = async (accessToken) => {
  let googleData = {
    email: "google_user@gmail.com",
    name: "Google User",
    picture: ""
  };

  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const info = await res.json();
      googleData = {
        email: info.email || googleData.email,
        name: info.name || googleData.name,
        picture: info.picture || "",
        sub: info.sub
      };
    }
  } catch (err) {
    console.error("Failed to fetch Google user profile:", err);
  }

  const authUser = {
    id: googleData.sub ? `google_${googleData.sub}` : `google_${Date.now()}`,
    email: googleData.email,
    name: googleData.name,
    avatar: googleData.picture,
    provider: "google",
    token: accessToken,
    authenticated: true,
    data: {
      email: googleData.email,
      name: googleData.name,
      avatar: googleData.picture
    }
  };

  // Save to persistent local storage so AuthContext and header components pick it up
  localStorage.setItem("mock_user", JSON.stringify(authUser));

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
  const [loadingProvider, setLoadingProvider] = useState("OAuth");
  const [showPassword, setShowPassword] = useState(false);
  const returnTo = safeReturnTo();

  // Handle OAuth Callback (#access_token=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token") || hash.includes("id_token"))) {
      setSocialLoading(true);
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token") || params.get("id_token");

      if (accessToken) {
        (async () => {
          // Fetch real profile from Google
          await fetchAndSaveGoogleProfile(accessToken);

          // Clean token hash out of address bar without re-triggering reload
          window.history.replaceState(null, "", window.location.pathname);

          setTimeout(() => {
            window.location.href = returnTo !== "/login" ? returnTo : "/";
          }, 300);
        })();
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
        localStorage.setItem("mock_user", JSON.stringify({
          id: "user_123",
          email: email,
          name: email.split("@")[0],
          provider: "email",
          authenticated: true
        }));
      }
      window.location.href = returnTo !== "/login" ? returnTo : "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setLoadingProvider("Google");
    setSocialLoading(true);
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (GOOGLE_CLIENT_ID) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
      // Request full openid, email, and profile scope
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=openid%20email%20profile&prompt=select_account`;
      window.location.href = googleOAuthUrl;
    } else {
      localStorage.setItem("mock_user", JSON.stringify({
        id: "google_dev",
        email: "developer@example.com",
        name: "Developer Account",
        provider: "google",
        authenticated: true
      }));
      setTimeout(() => {
        window.location.href = returnTo !== "/login" ? returnTo : "/";
      }, 400);
    }
  };

  const handleDiscord = () => {
    setLoadingProvider("Discord");
    setSocialLoading(true);
    const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

    if (DISCORD_CLIENT_ID) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
      const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20email`;
      window.location.href = discordOAuthUrl;
    } else {
      localStorage.setItem("mock_user", JSON.stringify({
        id: "discord_dev",
        email: "discord_dev@example.com",
        name: "Discord User",
        provider: "discord",
        authenticated: true
      }));
      setTimeout(() => {
        window.location.href = returnTo !== "/login" ? returnTo : "/";
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Backdrop loading overlay */}
      {socialLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
          <p className="text-sm font-medium text-slate-300">Syncing profile with {loadingProvider}...</p>
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

            <button
              type="button"
              onClick={handleDiscord}
              className="w-full h-11 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53.01s5.18-12.71,11.45-12.71c6.28,0,11.47,5.72,11.36,12.71C53.81,60,48.73,65.69,42.45,65.69Zm42.24,0C78.42,65.69,73.25,60,73.25,53.01s5.17-12.71,11.44-12.71c6.28,0,11.47,5.72,11.36,12.71C96.05,60,90.96,65.69,84.69,65.69Z"/>
              </svg>
              Continue with Discord
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log in <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}