import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService, session, UNAUTHORIZED_EVENT, type Store, type StoreUser } from "@/api";

interface AuthState {
  status: "loading" | "signed-in" | "signed-out";
  user: StoreUser | null;
  store: Store | null;
  requestOtp: (phone: string) => Promise<string>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthState["status"]>(session.get() ? "loading" : "signed-out");
  const [user, setUser] = useState<StoreUser | null>(null);
  const [store, setStore] = useState<Store | null>(null);

  const clear = useCallback(() => {
    session.clear();
    setUser(null);
    setStore(null);
    setStatus("signed-out");
    queryClient.clear();
  }, [queryClient]);

  // Restore an existing session on load.
  useEffect(() => {
    if (!session.get()) return;
    authService
      .me()
      .then((r) => {
        setUser(r.user);
        setStore(r.store);
        setStatus("signed-in");
      })
      .catch(clear);
  }, [clear]);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clear);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clear);
  }, [clear]);

  const requestOtp = useCallback(async (phone: string) => {
    const r = await authService.requestOtp(phone);
    return r.message;
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const r = await authService.verifyOtp(phone, otp);
    session.set(`${r.api_key}:${r.api_secret}`);
    setUser(r.user);
    setStore(r.store);
    setStatus("signed-in");
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout().catch(() => undefined);
    clear();
  }, [clear]);

  const value = useMemo(
    () => ({ status, user, store, requestOtp, verifyOtp, signOut }),
    [status, user, store, requestOtp, verifyOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
