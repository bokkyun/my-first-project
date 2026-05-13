import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import { Close } from '@mui/icons-material';

function categoryColor(category) {
  if (category === '추세') return 'primary';
  if (category === '모멘텀') return 'success';
  if (category === '볼린저') return 'secondary';
  return 'default';
}

function formatAt(startsAt) {
  if (!startsAt) return '-';
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return startsAt;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 외부 시그널(추세/모멘텀/볼린저) 읽기 전용 상세 다이얼로그
 */
function ExternalSignalEventDialog({ open, onClose, event }) {
  const row = event?._signalRow;
  if (!row) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, pb: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontWeight={700} sx={{ pr: 1 }}>
            {row.name || row.code} - {row.signal_name || row.signal_type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatAt(event?.starts_at)} (16:00 신호 캘린더)
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="닫기">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.25}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={row.signal_category || '시그널'} color={categoryColor(row.signal_category)} size="small" />
            <Chip label={row.market || '시장미상'} variant="outlined" size="small" />
          </Box>
          <Typography variant="body2"><strong>종목코드:</strong> {row.code || '-'}</Typography>
          <Typography variant="body2"><strong>종목명:</strong> {row.name || '-'}</Typography>
          <Typography variant="body2"><strong>신호유형:</strong> {row.signal_type || '-'}</Typography>
          <Typography variant="body2"><strong>신호명:</strong> {row.signal_name || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">
            이 항목은 자동 스캐너가 저장한 기술적 지표 신호입니다. 사용자 일정 수정/삭제 대상은 아닙니다.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default ExternalSignalEventDialog;
