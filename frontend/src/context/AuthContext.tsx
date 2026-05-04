import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "../lib/firebase";
import { apiFetch } from "../lib/api";

export type BackendUser = {
  id: number;
  email: string;
  name: string;
};

type AuthContextValue = {
  firebaseConfigured: boolean;
  loading: boolean;
  firebaseUser: User | null;
  backendUser: BackendUser | null;
  syncError: string | null;
  getIdToken: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncWithBackend(idToken: string): Promise<BackendUser> {
  const res = await apiFetch("/api/v1/auth/sync", {
    method: "POST",
    token: idToken,
  });
  const json = (await res.json()) as {
    status?: string;
    message?: string;
    data?: { user: BackendUser };
  };
  if (!res.ok || json.status !== "success" || !json.data?.user) {
    throw new Error(json.message || "Could not sync account with server");
  }
  return json.data.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseConfigured = isFirebaseConfigured();
  const [loading, setLoading] = useState(firebaseConfigured);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setSyncError(null);

      if (!user) {
        setBackendUser(null);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const bu = await syncWithBackend(token);
        setBackendUser(bu);
      } catch (e) {
        setBackendUser(null);
        setSyncError(e instanceof Error ? e.message : "Sync failed");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const getIdToken = useCallback(async () => {
    const auth = getFirebaseAuth();
    const u = auth?.currentUser;
    if (!u) return null;
    return u.getIdToken();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase Auth not configured");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase Auth not configured");
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase Auth not configured");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    setBackendUser(null);
    setSyncError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseConfigured,
      loading,
      firebaseUser,
      backendUser,
      syncError,
      getIdToken,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      logout,
    }),
    [
      firebaseConfigured,
      loading,
      firebaseUser,
      backendUser,
      syncError,
      getIdToken,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
