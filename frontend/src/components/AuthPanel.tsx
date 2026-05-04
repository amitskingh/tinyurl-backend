import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function AuthPanel() {
  const {
    firebaseConfigured,
    loading,
    firebaseUser,
    backendUser,
    syncError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  if (!firebaseConfigured) {
    return (
      <div className="rounded-xl border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
        Firebase Auth is not configured. Add{" "}
        <code className="rounded bg-black/30 px-1 font-mono text-xs">
          VITE_FIREBASE_API_KEY
        </code>
        ,{" "}
        <code className="rounded bg-black/30 px-1 font-mono text-xs">
          VITE_FIREBASE_AUTH_DOMAIN
        </code>
        ,{" "}
        <code className="rounded bg-black/30 px-1 font-mono text-xs">
          VITE_FIREBASE_PROJECT_ID
        </code>
        , and{" "}
        <code className="rounded bg-black/30 px-1 font-mono text-xs">
          VITE_FIREBASE_APP_ID
        </code>{" "}
        to <code className="font-mono text-xs">frontend/.env</code> (Firebase
        console → Project settings → Your apps).
      </div>
    );
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-slate-400">Checking session…</p>
    );
  }

  if (firebaseUser && backendUser) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">Signed in</p>
            <p className="font-medium text-white">{backendUser.email}</p>
            <p className="text-xs text-slate-500">User ID {backendUser.id}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
        {syncError ? (
          <p className="text-sm text-amber-200">{syncError}</p>
        ) : null}
      </div>
    );
  }

  if (firebaseUser && syncError) {
    return (
      <div className="space-y-2 rounded-2xl border border-red-900/80 bg-red-950/30 p-4 text-left">
        <p className="text-sm font-medium text-red-200">
          Firebase OK, but server sync failed
        </p>
        <p className="text-xs text-red-300/90">{syncError}</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-violet-400 underline hover:text-violet-300"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (firebaseUser && !backendUser && !syncError) {
    return (
      <p className="text-center text-sm text-slate-400">
        Linking your account with the API…
      </p>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      setPassword("");
    } catch (err) {
      setLocalErr(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setLocalErr(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalErr(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-white">Account</h2>
        <div className="flex rounded-lg border border-slate-700 p-0.5 text-xs">
          <button
            type="button"
            className={`rounded-md px-2 py-1 ${mode === "signin" ? "bg-slate-700 text-white" : "text-slate-400"}`}
            onClick={() => {
              setMode("signin");
              setLocalErr(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 ${mode === "signup" ? "bg-slate-700 text-white" : "text-slate-400"}`}
            onClick={() => {
              setMode("signup");
              setLocalErr(null);
            }}
          >
            Sign up
          </button>
        </div>
      </div>

      <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-1">
          <label htmlFor="auth-email" className="text-xs text-slate-400">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            disabled={busy}
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="auth-pass" className="text-xs text-slate-400">
            Password
          </label>
          <input
            id="auth-pass"
            type="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            disabled={busy}
            required
            minLength={mode === "signup" ? 6 : undefined}
          />
        </div>
        {localErr && (
          <p className="text-sm text-red-300" role="alert">
            {localErr}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900/80 px-2 text-slate-500">Or</span>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onGoogle()}
        className="w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        Continue with Google
      </button>
    </div>
  );
}
