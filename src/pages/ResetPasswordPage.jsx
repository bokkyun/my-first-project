import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  IconButton, InputAdornment, Alert, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, CalendarMonth, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, setIsRecoveryMode } = useAuth();

  const [form, setForm] = useState({ password: '', passwordConfirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(form.password);
    setLoading(false);

    if (updateError) {
      setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } else {
      setIsRecoveryMode(false);
      setSuccess(true);
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
            <CalendarMonth sx={{ fontSize: 36, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              새 비밀번호 설정
            </Typography>
          </Box>

          {success ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                비밀번호가 변경되었습니다
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                새 비밀번호로 로그인해주세요.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/login')} fullWidth sx={{ borderRadius: 2 }}>
                로그인하러 가기
              </Button>
            </Box>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="새 비밀번호"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  required
                  helperText="6자 이상 입력해주세요"
                  sx={{ mb: 2 }}
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
                  value={form.passwordConfirm}
                  onChange={handleChange('passwordConfirm')}
                  required
                  sx={{ mb: 3 }}
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
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default ResetPasswordPage;
