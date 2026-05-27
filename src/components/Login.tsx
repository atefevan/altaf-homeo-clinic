import React, { useState } from "react";
import { useApp } from "../AppContext";
import { db } from "../db";
import { Lock, User, ShieldAlert, KeyRound } from "lucide-react";

export function Login() {
  const { loginUser, showToast, themeMode } = useApp();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both username and password");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await db.authenticateUser(username.trim(), password);
      if (res.success && res.user) {
        loginUser(res.user);
        showToast("Logged in successfully!", "success");
      } else {
        setErrorMsg(res.error || "Invalid username or password");
      }
    } catch {
      setErrorMsg("Authentication process failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${themeMode === "dark" ? "bg-[#0f172a] text-slate-100" : "bg-[#f4f7f9] text-slate-800"}`} id="login-screen-view">
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl border transition-all duration-300 ${themeMode === "dark" ? "bg-[#1e293b] border-slate-700/80" : "bg-white border-slate-200/85"}`} id="login-container">
        
        <div className="flex flex-col items-center mb-8" id="login-header">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 shadow-sm" id="login-logo-holder">
            <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" id="login-svg-logo">
              <path d="M12.5 2C12.5 2 19 7 19 13C19 16.86 15.86 20 12 20C8.14 20 5 16.86 5 13C5 7 12.5 2 12.5 2Z" fill="currentColor" />
              <path d="M12.5 4.5C15 8 14.5 13 10.5 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" id="login-svg-path" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-center" id="login-title">
            Altaf Homeo Clinic & Pharmacy
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 text-center" id="login-subtitle">
            Clinical Intake & Management Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" id="login-form-element">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/15 rounded-lg" id="login-error-badge">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div id="username-field-container">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" id="username-label">
              Username
            </label>
            <div className="relative" id="username-input-wrapper">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className={`w-full text-xs pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:border-emerald-500 bg-transparent transition-colors duration-200 ${themeMode === "dark" ? "border-slate-700 text-slate-100 placeholder:text-slate-600" : "border-slate-200 text-slate-800"}`}
                id="username-input"
              />
            </div>
          </div>

          <div id="password-field-container">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" id="password-label">
              Password
            </label>
            <div className="relative" id="password-input-wrapper">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full text-xs pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:border-emerald-500 bg-transparent transition-colors duration-200 ${themeMode === "dark" ? "border-slate-700 text-slate-100 placeholder:text-slate-600" : "border-slate-200 text-slate-800"}`}
                id="password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:outline-none disabled:opacity-50 transition-all duration-200 shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
            id="login-submit-button"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>{loading ? "Authenticating Master Key..." : "Sign In to Clinic"}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200/40 text-center" id="login-footer">
          <p className="text-[10px] text-slate-400 font-medium" id="login-note-text">
            For setup instructions or Supabase schema details, consult <strong>/login_schema.sql</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
