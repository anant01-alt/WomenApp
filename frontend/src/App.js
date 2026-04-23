import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SOSPage from './pages/SOSPage';
import MapPage from './pages/MapPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import ContactsPage from './pages/ContactsPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import Sidebar from './components/common/Sidebar';
import MobileNav from './components/common/MobileNav';
import LoadingScreen from './components/common/LoadingScreen';
import EmergencyBanner from './components/sos/EmergencyBanner';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppLayout = ({ children }) => (
  <div className="page-wrapper">
    <Sidebar />
    <main className="main-content">
      <EmergencyBanner />
      {children}
    </main>
    <MobileNav />
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Private */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/sos" element={
          <PrivateRoute>
            <AppLayout><SOSPage /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/map" element={
          <PrivateRoute>
            <AppLayout><MapPage /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/chat" element={
          <PrivateRoute>
            <AppLayout><ChatPage /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/contacts" element={
          <PrivateRoute>
            <AppLayout><ContactsPage /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/history" element={
          <PrivateRoute>
            <AppLayout><HistoryPage /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <AppLayout><ProfilePage /></AppLayout>
          </PrivateRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <PrivateRoute adminOnly>
            <AppLayout><AdminPage /></AppLayout>
          </PrivateRoute>
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
