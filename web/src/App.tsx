import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useEffect } from 'react';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import SettingsLayout from './pages/settings/SettingsLayout';
import GeneralSettingsPage from './pages/settings/GeneralSettingsPage';
import GameAccountsSettingsPage from './pages/settings/GameAccountsSettingsPage';
import DisplaySettingsPage, { loadDisplayPrefs, applyDisplayPrefs } from './pages/settings/DisplaySettingsPage';
import PluralConnectionPage from './pages/settings/PluralConnectionPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import TermsPage from './pages/legal/TermsPage';
import LicencePage from './pages/legal/LicencePage';
import NotFound from './pages/NotFound';

import './index.css';

// Apply saved display preferences before first render
applyDisplayPrefs(loadDisplayPrefs());

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Authentication */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/auth/success" element={<AuthSuccessPage />} />
          <Route path="/auth/error" element={<LoginPage error />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Guard><DashboardPage /></Guard>} />

          {/* Settings with sidebar layout */}
          <Route path="/settings" element={<Guard><SettingsLayout /></Guard>}>
            <Route index element={<Navigate to="/settings/general" replace />} />
            <Route path="general" element={<GeneralSettingsPage />} />
            <Route path="game-accounts" element={<GameAccountsSettingsPage />} />
            <Route path="display" element={<DisplaySettingsPage />} />
            <Route path="plural-connection" element={<PluralConnectionPage />} />
            {/* Catch-all for unmatched /settings/* routes */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Contact & Legal Pages */}
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/licence" element={<LicencePage />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}