import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  Alert, CircularProgress,
} from '@mui/material';
import { CalendarMonth, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

/** 아이디 유효성 검사 (로그인과 동일) */
const isValidUsername = (v) => /^[a-zA-Z0-9_-]{3,20}$/.test(v);

function ResetPasswordPage() {
  const { resetPasswordForEmail } = useAuth();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!isValidUsername(username.trim())) {
      setError('아이디는 3~20자의 영문, 숫자, _(밑줄), -(하이픈)만 사용 가능합니다.');
      return;
    }

    setLoading(true);
    const { error: resetError } = await resetPasswordForEmail(username.trim());
    setLoading(false);

    if (resetError) {
      setError('비밀번호 재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setSuccess(true);
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
              비밀번호 재설정
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              가입 시 사용한 아이디를 입력하면 재설정 안내 메일을 보냅니다.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              메일함을 확인해 주세요. 링크를 누른 뒤 새 비밀번호를 설정할 수 있습니다.
            </Alert>
          )}

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
              disabled={success}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || success}
              sx={{ borderRadius: 2, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '재설정 메일 보내기'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            <Link to="/login" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}>
              로그인으로
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default ResetPasswordPage;
