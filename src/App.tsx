import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { BellRing, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/Login";
import { hideSplash, setStatusBarTheme } from "@/lib/native";

const MobileApp = lazy(() => import("@/mobile/MobileApp"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
});

function FullScreenLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

/**
 * Toasts: a small floating pill (like iOS notifications) with room below the notch.
 */
function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gap={8}
      visibleToasts={3}
      duration={2600}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 14px)", left: "16px", right: "16px" }}
      icons={{
        success: <CheckCircle2 className="h-[18px] w-[18px] text-[#34c759]" strokeWidth={2.5} />,
        error: <XCircle className="h-[18px] w-[18px] text-[#ff3b30]" strokeWidth={2.5} />,
        warning: <BellRing className="h-[18px] w-[18px] text-[#ff9500]" strokeWidth={2.5} />,
        info: <Info className="h-[18px] w-[18px] text-[#007aff]" strokeWidth={2.5} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "w-full flex items-center gap-3 rounded-xl bg-white/95 px-4 py-3.5 font-sans shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)] ring-1 ring-black/5 backdrop-blur-xl dark:bg-[#2c2c2e]/95 dark:ring-white/10",
          content: "min-w-0",
          title: "text-[14px] font-semibold leading-tight text-[#1c1c1e] dark:text-white",
          description: "mt-0.5 text-[12px] leading-tight text-black/55 dark:text-white/60",
          icon: "flex h-[18px] w-[18px] shrink-0 items-center justify-center",
          actionButton: "ml-auto shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white",
        },
      }}
    />
  );
}

/** Keeps native chrome (splash, status bar) in sync with the app. */
function NativeBridge() {
  const { status } = useAuth();
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (status !== "loading") hideSplash();
  }, [status]);
  useEffect(() => {
    setStatusBarTheme(resolvedTheme === "dark");
  }, [resolvedTheme]);
  return null;
}

function ProtectedRoutes() {
  const { status } = useAuth();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "signed-out") return <Navigate to="/login" replace />;
  return <MobileApp />;
}

function PublicOnly() {
  const { status } = useAuth();
  if (status === "signed-in") return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <AuthProvider>
              <NativeBridge />
              <Suspense fallback={<FullScreenLoader />}>
                <Routes>
                  <Route path="/login" element={<PublicOnly />} />
                  <Route path="/*" element={<ProtectedRoutes />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
          <AppToaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
