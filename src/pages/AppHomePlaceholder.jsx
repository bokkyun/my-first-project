import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** 메인(캘린더) 화면 재구성 전까지 로그인 직후 표시 */
function AppHomePlaceholder() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            메인 페이지 준비 중
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            로그인은 완료되었습니다. 홈 화면은 곧 다시 연결됩니다.
          </Typography>
          <Button variant="outlined" onClick={handleSignOut}>
            로그아웃
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default AppHomePlaceholder;
