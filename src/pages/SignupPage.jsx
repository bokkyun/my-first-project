import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  IconButton, InputAdornment, Alert, CircularProgress, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, CalendarMonth, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

/** 이메일 유효성 검사 */
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function SignupPage() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const [form, setForm] = useState({ email: '', nickname: '', password: '', passwordConfirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailSignup, setShowEmailSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (googleError) {
      setError(googleError.message || '구글 로그인에 실패했습니다. Supabase·Google 리다이렉트 URL을 확인해 주세요.');
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(form.email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
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
      form.email,
      form.password,
      form.nickname,
    );
    setLoading(false);

    if (signUpError) {
      if (signUpError.message?.includes('already registered')) {
        setError('이미 사용 중인 이메일입니다.');
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
                MoneyCal 회원가입
              </Typography>
            </Box>
          </Box>

          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              가입 확인 이메일을 발송했습니다. 이메일을 확인하여 인증을 완료해주세요.{' '}
              <Link to="/login" style={{ color: '#1976d2', fontWeight: 600 }}>
                로그인하러 가기
              </Link>
            </Alert>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleGoogleSignup}
                disabled={loading || googleLoading}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  py: 1.2,
                  borderColor: '#dadce0',
                  color: 'text.primary',
                  '&:hover': { borderColor: '#bbb', backgroundColor: '#f8f8f8' },
                }}
                startIcon={
                  googleLoading ? <CircularProgress size={20} /> : (
                    <Box
                      component="img"
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt=""
                      sx={{ width: 20, height: 20 }}
                    />
                  )
                }
              >
                Google로 시작하기
              </Button>

              <Box sx={{ textAlign: 'center', mb: showEmailSignup ? 2 : 0 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setShowEmailSignup(true)}
                  disabled={loading || googleLoading || showEmailSignup}
                  sx={{ fontSize: '0.8rem', fontWeight: 600 }}
                >
                  이메일로 회원가입
                </Button>
              </Box>

              {showEmailSignup && (
                <>
                  <Divider sx={{ mb: 2 }}>이메일 가입</Divider>

                  <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      label="이메일"
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      required
                      sx={{ mb: 2 }}
                      autoComplete="email"
                    />
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
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default SignupPage;
