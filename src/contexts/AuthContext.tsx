import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService, currentStore, session, UNAUTHORIZED_EVENT, type StoreUser } from "@/api";

interface AuthState {
  status: "loading" | "signed-in" | "signed-out";
  user: StoreUser | null;
  requestOtp: (phone: string) => Promise<string>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthState["status"]>(session.active() ? "loading" : "signed-out");
  const [user, setUser] = useState<StoreUser | null>(null);

  const clear = useCallback(() => {
    session.clear();
    currentStore.id = "";
    setUser(null);
    setStatus("signed-out");
    queryClient.clear();
  }, [queryClient]);

  const signedIn = useCallback((u: StoreUser) => {
    currentStore.id = u.store;
    setUser(u);
    setStatus("signed-in");
  }, []);

  // Restore an existing session on load.
  useEffect(() => {
    if (!session.active()) return;
    authService.me().then(signedIn).catch(clear);
  }, [signedIn, clear]);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clear);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clear);
  }, [clear]);

  const requestOtp = useCallback(async (phone: string) => (await authService.requestOtp(phone)).message, []);
  const verifyOtp = useCallback(async (phone: string, otp: string) => signedIn(await authService.verifyOtp(phone, otp)), [signedIn]);
  const signInWithPassword = useCallback(async (email: string, password: string) => signedIn(await authService.login(email, password)), [signedIn]);

  const signOut = useCallback(async () => {
    await authService.logout().catch(() => undefined);
    clear();
  }, [clear]);

  const value = useMemo(
    () => ({ status, user, requestOtp, verifyOtp, signInWithPassword, signOut }),
    [status, user, requestOtp, verifyOtp, signInWithPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
