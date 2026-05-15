import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TodayHotSignalBanner from '../components/landing/TodayHotSignalBanner';
import { useTodayHotSignalStocks } from '../hooks/useTodayHotSignalStocks';

function PromoSignalsPage() {
  const appHomeHref = import.meta.env.BASE_URL || '/';
  const {
    stocks,
    date,
    loading,
    error,
  } = useTodayHotSignalStocks({ minSignalCount: 3, limit: 6 });

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        bgcolor: '#0f172a',
        p: { xs: 1, sm: 1.25 },
        boxSizing: 'border-box',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          minHeight: 96,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'transparent',
        }}
      >
        {loading && stocks.length === 0 ? (
          <Box sx={{
            minHeight: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: 'white',
          }}
          >
            <CircularProgress size={18} color="inherit" />
            <Typography variant="body2" fontWeight={700}>오늘 매수 시그널 확인 중</Typography>
          </Box>
        ) : stocks.length > 0 ? (
          <Box sx={{
            '& > .MuiPaper-root': {
              bgcolor: '#fff8e1',
              borderColor: 'rgba(251, 191, 36, 0.9)',
            },
          }}
          >
            <TodayHotSignalBanner stocks={stocks} date={date} />
          </Box>
        ) : (
          <Box sx={{
            minHeight: 96,
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 3,
            px: 2,
            py: 1.5,
            bgcolor: 'rgba(15, 23, 42, 0.92)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800}>
                오늘 매수 시그널 3개 이상 종목
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.78 }}>
                {error ? '시그널 정보를 잠시 불러오지 못했습니다.' : '현재 조건에 맞는 종목이 없습니다.'}
              </Typography>
            </Box>
            <Button
              href={appHomeHref}
              target="_blank"
              rel="noreferrer"
              size="small"
              variant="contained"
              color="warning"
              endIcon={<OpenInNewIcon fontSize="small" />}
              sx={{ flexShrink: 0, fontWeight: 800, borderRadius: 999 }}
            >
              달력 보기
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default PromoSignalsPage;
