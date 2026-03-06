import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import './index.css';

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
          <Route path="/" element={<LoginPage />} />
          <Route path="/auth/success" element={<AuthSuccessPage />} />
          <Route path="/auth/error" element={<LoginPage error />} />
          <Route path="/dashboard" element={<Guard><DashboardPage /></Guard>} />
          <Route path="/settings" element={<Guard><SettingsPage /></Guard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}