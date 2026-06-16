import { Box, Container, Paper, Typography, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ReceiptUploader from '../components/ReceiptUploader';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../hooks/useAuth';

function ExpensesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile(user);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar profile={profile} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>영수증 등록</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            영수증·카드 승인 문자·주문 캡처를 업로드하면 AI가 금액·가맹점·카테고리를 추출합니다.
          </Typography>
          <ReceiptUploader />
        </Paper>
      </Container>
    </Box>
  );
}

export default ExpensesPage;
