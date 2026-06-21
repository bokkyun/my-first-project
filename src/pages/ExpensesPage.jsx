import { useMemo } from 'react';
import {
  Box, Container, Paper, Typography, IconButton, List, ListItem,
  ListItemText, Button, Divider, Alert,
} from '@mui/material';
import { ArrowBack, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ReceiptUploader from '../components/ReceiptUploader';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';

function ExpensesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile(user);

  const wideRange = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    return {
      start: new Date(y - 1, 0, 1),
      end: new Date(y + 1, 11, 31, 23, 59, 59, 999),
    };
  }, []);

  const { expenses, error, refreshExpenses, deleteExpense } = useExpenses(
    user?.id ?? null,
    wideRange,
    Boolean(user?.id),
  );

  const sortedExpenses = useMemo(
    () => [...(expenses || [])].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [expenses],
  );

  const handleDelete = async (expenseId) => {
    if (!window.confirm('이 영수증(지출) 기록을 삭제할까요?')) return;
    const { error: err } = await deleteExpense(expenseId);
    if (err) window.alert(`삭제 실패: ${err.message || err}`);
  };

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
          <ReceiptUploader onSaved={() => refreshExpenses()} />

          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>등록된 지출</Typography>
          {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
          {sortedExpenses.length === 0 ? (
            <Typography variant="body2" color="text.secondary">등록된 지출이 없습니다.</Typography>
          ) : (
            <List disablePadding>
              {sortedExpenses.map((row) => (
                <ListItem
                  key={row.id}
                  secondaryAction={(
                    <Button
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(row.id)}
                    >
                      삭제
                    </Button>
                  )}
                  sx={{ px: 0, alignItems: 'flex-start' }}
                >
                  <ListItemText
                    primary={`${String(row.date).slice(0, 10)} · ${row.merchant || '지출'}`}
                    secondary={`${Number(row.amount || 0).toLocaleString()}원 · ${row.category || '기타'}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default ExpensesPage;
