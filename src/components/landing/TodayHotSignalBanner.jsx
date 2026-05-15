import {
  Box,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

function formatKoreanDate(ymd) {
  if (!ymd || typeof ymd !== 'string') return '오늘';
  const [, month, day] = ymd.split('-');
  if (!month || !day) return '오늘';
  return `${Number(month)}월 ${Number(day)}일`;
}

function signalPreview(signals) {
  const names = (signals || []).map((signal) => signal.name || signal.type).filter(Boolean);
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} 외 ${names.length - 2}개`;
}

function TodayHotSignalBanner({ stocks, date }) {
  if (!Array.isArray(stocks) || stocks.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'warning.light',
        bgcolor: '#fff8e1',
        borderRadius: 2,
        px: { xs: 1.25, md: 1.5 },
        py: { xs: 1, md: 1.1 },
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 1,
        flexDirection: { xs: 'column', md: 'row' },
      }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <TrendingUpIcon color="warning" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={800} color="warning.dark">
            {formatKoreanDate(date)} 매수 시그널 3개 이상
          </Typography>
        </Box>

        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          minWidth: 0,
        }}
        >
          {stocks.map((stock) => (
            <Chip
              key={stock.code || stock.name}
              size="small"
              color="warning"
              variant="outlined"
              label={`${stock.name}${stock.market ? ` · ${stock.market}` : ''} ${stock.signalCount}개`}
              title={signalPreview(stock.signals)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.72)',
                fontWeight: 700,
                maxWidth: { xs: '100%', sm: 260 },
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          ))}
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 0.75, lineHeight: 1.35 }}
      >
        {stocks.slice(0, 3).map((stock) => `${stock.name}: ${signalPreview(stock.signals)}`).join(' / ')}
      </Typography>
    </Paper>
  );
}

export default TodayHotSignalBanner;
