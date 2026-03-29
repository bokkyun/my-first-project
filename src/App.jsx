import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CalendarPage from './pages/CalendarPage';
import GroupCreatePage from './pages/GroupCreatePage';
import GroupJoinPage from './pages/GroupJoinPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

/**
 * 인증이 필요한 라우트 보호 컴포넌트
 * @param {object} children - 보호할 컴포넌트 [Required]
 * @param {object} user - 현재 유저 [Required]
 * @param {boolean} loading - 로딩 상태 [Required]
 */
function ProtectedRoute({ children, user, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const { user, loading, isRecoveryMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isRecoveryMode) {
      navigate('/reset-password');
    }
  }, [isRecoveryMode, navigate]);

  return (
    <Routes>
      <Route path="/login" element={user && !isRecoveryMode ? <Navigate to="/calendar" replace /> : <LoginPage />} />
      <Route path="/signup" element={user && !isRecoveryMode ? <Navigate to="/calendar" replace /> : <SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/create"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <GroupCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/join"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <GroupJoinPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user && !isRecoveryMode ? '/calendar' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
