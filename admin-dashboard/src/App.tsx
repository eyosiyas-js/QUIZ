import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Questions from './pages/Questions';
import QuizResults from './pages/QuizResults';
import Rewards from './pages/Rewards';
import LotteryWinners from './pages/LotteryWinners';
import Feedback from './pages/Feedback';
import Settings from './pages/Settings';
import FrontendCustomization from './pages/FrontendCustomization';
import { useState } from 'react';
import Loader from './components/Loader';
import './styles/dashboard.css';

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Header collapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <Outlet />
      </div>
    </div>
  );
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  const basename = window.location.pathname.startsWith('/admin') ? '/admin' : '/';
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/quiz-results" element={<QuizResults />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/lottery" element={<LotteryWinners />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/customize" element={<FrontendCustomization />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
