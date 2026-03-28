import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  IconButton, InputAdornment, Alert, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, CalendarMonth, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({ email: '', nickname: '', password: '', passwordConfirm: '' });
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
    const { error: signUpError } = await signUp(form.email, form.password, form.nickname);
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } else {
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate('/login')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1, textAlign: 'center', pr: 5 }}>
              <CalendarMonth sx={{ fontSize: 36, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700} color="primary.main">
                TeamSync 회원가입
              </Typography>
            </Box>
          </Box>

          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              회원가입이 완료되었습니다! 이메일을 확인하여 계정을 인증해주세요.
              <br />
              <Link to="/login" style={{ color: '#1976d2', fontWeight: 600 }}>로그인 페이지로 이동</Link>
            </Alert>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="닉네임"
                  value={form.nickname}
                  onChange={handleChange('nickname')}
                  required
                  sx={{ mb: 2 }}
                  inputProps={{ maxLength: 20 }}
                />
                <TextField
                  fullWidth
                  label="비밀번호"
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
                  label="비밀번호 확인"
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : '회원가입'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default SignupPage;
