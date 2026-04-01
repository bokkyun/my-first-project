import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  IconButton, InputAdornment, Alert, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, CalendarMonth, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

/** 아이디 유효성 검사: 영문, 숫자, 밑줄, 하이픈만 허용 */
const isValidUsername = (v) => /^[a-zA-Z0-9_-]{3,20}$/.test(v);

function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({ username: '', nickname: '', password: '', passwordConfirm: '' });
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

    if (!isValidUsername(form.username)) {
      setError('아이디는 3~20자의 영문, 숫자, _(밑줄), -(하이픈)만 사용 가능합니다.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(
      form.username,
      form.password,
      form.nickname || form.username,
    );
    setLoading(false);

    if (signUpError) {
      if (signUpError.message?.includes('already registered')) {
        setError('이미 사용 중인 아이디입니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
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
              회원가입이 완료되었습니다!{' '}
              <Link to="/login" style={{ color: '#1976d2', fontWeight: 600 }}>
                로그인하러 가기
              </Link>
            </Alert>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="아이디"
                  value={form.username}
                  onChange={handleChange('username')}
                  required
                  sx={{ mb: 1 }}
                  inputProps={{ maxLength: 20 }}
                  autoComplete="username"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  3~20자, 영문·숫자·_(밑줄)·-(하이픈) 사용 가능
                </Typography>
                <TextField
                  fullWidth
                  label="닉네임 (선택)"
                  value={form.nickname}
                  onChange={handleChange('nickname')}
                  sx={{ mb: 2 }}
                  inputProps={{ maxLength: 20 }}
                  helperText="비워두면 아이디가 닉네임으로 사용됩니다"
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
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    비밀번호를 잊으셨나요?{' '}
                    <Link
                      to="/reset-password"
                      style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}
                    >
                      비밀번호 재설정
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default SignupPage;
