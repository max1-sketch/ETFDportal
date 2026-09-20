import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

// Page imports
import Home from './pages/Home';
import Portal from './pages/Portal';
import MyAppeals from './pages/MyAppeals';
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDesktopApp } from '@/hooks/useDesktopApp';
import DesktopSplashScreen from '@/components/desktop/DesktopSplashScreen';
import DesktopNotifications from '@/components/desktop/DesktopNotifications';
import { useSeasonalTheme } from '@/hooks/useSeasonalTheme';
import SeasonalEffects from '@/components/SeasonalEffects';
import IpBanCheck from '@/components/IpBanCheck';
import MaintenanceGuard from '@/components/site/MaintenanceGuard';

// Global fallback initialization for standalone local execution
if (!globalThis.__B44_DB__) {
  globalThis.__B44_DB__ = {
    auth: {
      isAuthenticated: async () => false,
      me: async () => null,
      loginWithProvider: (provider, redirect) => {
        console.log(`[Mock Auth] Logging in with ${provider}, redirecting to ${redirect}`);
      },
      loginViaEmailPassword: async () => {},
      register: async () => {},
      verifyOtp: async () => ({ access_token: 'mock-token' }),
      resendOtp: async () => {},
      setToken: () => {},
    },
    entities: new Proxy({}, {
      get: () => ({
        filter: async () => [],
        get: async () => null,
        create: async (data) => ({ id: 'mock-id', ...data }),
        update: async (id, data) => ({ id, ...data }),
        delete: async () => ({}),
      }),
    }),
    functions: {
      invoke: async (name, payload) => {
        console.log(`[Mock Function] Executed ${name}:`, payload);
        return { success: true };
      },
    },
    integrations: {
      Core: {
        UploadFile: async () => ({ file_url: '' }),
      },
    },
  };
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const isDesktopApp = useDesktopApp();
  const season = useSeasonalTheme();

  const isLoading = isLoadingPublicSettings || isLoadingAuth;
  const showSplash = isDesktopApp || new URLSearchParams(window.location.search).has('splash');

  let content;
  if (isLoading) {
    content = (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  } else if (authError?.type === 'user_not_registered') {
    content = <UserNotRegisteredError />;
  } else if (authError?.type === 'auth_required') {
    navigateToLogin();
    content = null;
  } else {
    content = (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Home />} />
        <Route path="/portal" element={<Portal />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/my-appeals" element={<MyAppeals />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  return (
    <IpBanCheck>
      <MaintenanceGuard>
        <SeasonalEffects season={season} />
        {showSplash && <DesktopSplashScreen ready={!isLoading && !authError} />}
        <DesktopNotifications isDesktopApp={isDesktopApp} />
        {content}
      </MaintenanceGuard>
    </IpBanCheck>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;