import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  IconButton, InputAdornment, Alert, Divider, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, CalendarMonth } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(username, password);
    setLoading(false);
    if (signInError) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } else {
      navigate('/calendar');
    }
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
    }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {/* 로고 */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <CalendarMonth sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700} color="primary.main">
              TeamSync
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              공유 스케줄 관리 서비스
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              sx={{ mb: 2 }}
              autoComplete="username"
              inputProps={{ maxLength: 20 }}
            />
            <TextField
              fullWidth
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 1.5, borderRadius: 2, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '로그인'}
            </Button>
            <Box sx={{ textAlign: 'right', mb: 1 }}>
              <Link
                to="/reset-password"
                style={{ fontSize: '0.875rem', color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}
              >
                비밀번호를 잊으셨나요?
              </Link>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              계정이 없으신가요?{' '}
              <Link to="/signup" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}>
                회원가입
              </Link>
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.disabled">
              <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>개인정보처리방침</Link>
              {' · '}
              <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>이용약관</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
