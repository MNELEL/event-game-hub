import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BrandingProvider } from "@/hooks/useBranding";
import { useBackgroundMusicLoader } from "@/hooks/useBackgroundMusicLoader";
import { useThemeLoader } from "@/hooks/useThemeLoader";
import { OfflineBanner } from "@/components/OfflineBanner";
import Index from "./pages/Index";
const Admin = lazy(() => import("./pages/Admin"));
const GameHost = lazy(() => import("./pages/GameHost"));
const PlayerJoin = lazy(() => import("./pages/PlayerJoin"));
const Login = lazy(() => import("./pages/Login"));
const Install = lazy(() => import("./pages/Install"));
const OfflineGame = lazy(() => import("./pages/OfflineGame"));
const About = lazy(() => import("./pages/About"));
const BrandingPreview = lazy(() => import("./pages/BrandingPreview"));
const YemotSetup = lazy(() => import("./pages/YemotSetup"));
const IvrGuide = lazy(() => import("./pages/IvrGuide"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

function JoinRedirect() {
  const [params] = useSearchParams();
  const code = params.get("code") || "";
  return <Navigate to={`/play?code=${code}`} replace />;
}

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const AppRoutes = () => {
  useBackgroundMusicLoader();
  useThemeLoader();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/host" element={<ProtectedRoute><GameHost /></ProtectedRoute>} />
        <Route path="/play" element={<PlayerJoin />} />
        <Route path="/join" element={<JoinRedirect />} />
        <Route path="/install" element={<Install />} />
        <Route path="/offline" element={<OfflineGame />} />
        <Route path="/about" element={<About />} />
        <Route path="/branding-preview" element={<ProtectedRoute><BrandingPreview /></ProtectedRoute>} />
        <Route path="/yemot-setup" element={<ProtectedRoute><YemotSetup /></ProtectedRoute>} />
        <Route path="/ivr-guide" element={<ProtectedRoute><IvrGuide /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <BrandingProvider>
            <AppRoutes />
          </BrandingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
