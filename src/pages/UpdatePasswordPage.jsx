import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  IconButton, InputAdornment, Alert, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, CalendarMonth, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError('비밀번호를 변경하지 못했습니다. 링크가 만료되었으면 다시 요청해 주세요.');
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/calendar', { replace: true }), 1500);
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button component={Link} to="/login" startIcon={<ArrowBack />} sx={{ minWidth: 0, px: 1 }}>
              돌아가기
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <CalendarMonth sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              새 비밀번호 설정
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              이메일 링크로 들어온 경우 또는 로그인한 상태에서 비밀번호를 변경할 수 있습니다.
            </Typography>
          </Box>

          {done && (
            <Alert severity="success" sx={{ mb: 2 }}>
              비밀번호가 변경되었습니다. 잠시 후 이동합니다…
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!done && (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="새 비밀번호"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="6자 이상"
                sx={{ mb: 2 }}
                autoComplete="new-password"
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
              <TextField
                fullWidth
                label="새 비밀번호 확인"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                sx={{ mb: 3 }}
                autoComplete="new-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ borderRadius: 2, py: 1.2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '비밀번호 변경'}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default UpdatePasswordPage;
