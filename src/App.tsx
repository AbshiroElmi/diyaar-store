import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { BellRing, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import LoginPage from "@/pages/Login";
import { hideSplash, isNative, setStatusBarTheme } from "@/lib/native";
import { useMediaQuery } from "@/hooks/use-media";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Orders = lazy(() => import("@/pages/Orders"));
const Products = lazy(() => import("@/pages/Products"));
const Categories = lazy(() => import("@/pages/Categories"));
const Earnings = lazy(() => import("@/pages/Earnings"));
const Reports = lazy(() => import("@/pages/Reports"));
const Reviews = lazy(() => import("@/pages/Reviews"));
const Promotions = lazy(() => import("@/pages/Promotions"));
const StoreProfile = lazy(() => import("@/pages/StoreProfile"));
const Hours = lazy(() => import("@/pages/Hours"));
const Team = lazy(() => import("@/pages/Team"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Support = lazy(() => import("@/pages/Support"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
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
 * Toasts: on phones a small floating pill (like iOS notifications) with room
 * below the notch; on larger screens the regular card toasts.
 */
function AppToaster() {
  const phone = useMediaQuery("(max-width: 767px)") || isNative;
  if (!phone) return <Toaster position="top-center" richColors closeButton />;
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
            "!left-0 !right-0 mx-auto !w-fit max-w-[calc(100vw-32px)] flex items-center gap-2.5 rounded-full bg-white/95 py-2.5 pl-3.5 pr-4 font-sans shadow-[0_10px_30px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/5 backdrop-blur-xl dark:bg-[#2c2c2e]/95 dark:ring-white/10",
          content: "min-w-0",
          title: "text-[14px] font-semibold leading-tight text-[#1c1c1e] dark:text-white",
          description: "mt-0.5 text-[12px] leading-tight text-black/55 dark:text-white/60",
          icon: "flex h-[18px] w-[18px] shrink-0 items-center justify-center",
          actionButton: "ml-1 shrink-0 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white",
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

function DesktopRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="store" element={<StoreProfile />} />
        <Route path="hours" element={<Hours />} />
        <Route path="team" element={<Team />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="support" element={<Support />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function ProtectedRoutes() {
  const { status } = useAuth();
  // Phones and the native app get the mobile UI; tablets and desktops get the web layout.
  const phone = useMediaQuery("(max-width: 767px)") || isNative;
  if (status === "loading") return <FullScreenLoader />;
  if (status === "signed-out") return <Navigate to="/login" replace />;
  return phone ? <MobileApp /> : <DesktopRoutes />;
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
