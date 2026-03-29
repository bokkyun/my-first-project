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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      if (signInError.message?.includes('Email not confirmed')) {
        setError('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
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
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 1 }}
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
            <Box sx={{ textAlign: 'right', mb: 2 }}>
              <Link to="/forgot-password" style={{ color: '#1976d2', fontSize: '0.85rem', textDecoration: 'none' }}>
                비밀번호를 잊으셨나요?
              </Link>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2, borderRadius: 2, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '로그인'}
            </Button>
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
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
