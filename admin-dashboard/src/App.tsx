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
import Loader from './components/Loader';
import './styles/dashboard.css';

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
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
  return (
    <BrowserRouter>
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
