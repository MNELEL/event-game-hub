import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { OfflineBanner } from "@/components/OfflineBanner";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import GameHost from "./pages/GameHost";
import PlayerJoin from "./pages/PlayerJoin";
import Login from "./pages/Login";
import Install from "./pages/Install";
import OfflineGame from "./pages/OfflineGame";
import NotFound from "./pages/NotFound";

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

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="/host" element={<GameHost />} />
    <Route path="/play" element={<PlayerJoin />} />
    <Route path="/join" element={<JoinRedirect />} />
    <Route path="/install" element={<Install />} />
    <Route path="/offline" element={<OfflineGame />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
