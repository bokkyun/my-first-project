import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  Alert, CircularProgress, IconButton,
} from '@mui/material';
import { CalendarMonth, ArrowBack, MarkEmailRead } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      setError('이메일 발송에 실패했습니다. 이메일 주소를 확인해주세요.');
    } else {
      setSent(true);
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
                비밀번호 재설정
              </Typography>
            </Box>
          </Box>

          {sent ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <MarkEmailRead sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                이메일을 확인해주세요
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/login')} fullWidth sx={{ borderRadius: 2 }}>
                로그인으로 돌아가기
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                  autoComplete="email"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ borderRadius: 2, py: 1.2 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : '재설정 링크 발송'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default ForgotPasswordPage;
