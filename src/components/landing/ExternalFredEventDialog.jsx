import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Divider, Button,
} from '@mui/material';
import { Close, OpenInNew } from '@mui/icons-material';

/**
 * FRED 거시지표 일정 읽기 전용 상세
 */
function ExternalFredEventDialog({ open, onClose, event }) {
  const row = event?._fredRow;
  if (!row) return null;

  const formatRange = () => {
    if (!event.starts_at) return '';
    if (event.is_all_day) {
      return new Date(event.starts_at).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    }
    return new Date(event.starts_at).toLocaleString('ko-KR');
  };

  const isFredSource = !row.source_url;
  const seriesUrl = isFredSource && row.series_id
    ? `https://fred.stlouisfed.org/series/${encodeURIComponent(row.series_id)}`
    : null;
  const releaseUrl = isFredSource && row.release_id
    ? `https://fred.stlouisfed.org/release?rid=${encodeURIComponent(row.release_id)}`
    : null;
  const sourceUrl = row.source_url || seriesUrl;
  const hasActualValue = row.actual_value != null && String(row.actual_value).trim() !== '';
  const isReleased = hasActualValue || row.status === 'released';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ pr: 1 }}>{row.title}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: { xs: '80vh', sm: 520 }, overflow: 'auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{formatRange()}</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>지표·발표</Typography>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{isFredSource ? 'FRED series_id' : '자료 출처'}</Typography>
            <Typography variant="body2">{isFredSource ? (row.series_id || '—') : (row.source_name || row.series_id || '—')}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>예정·발표일 (릴리스 기준)</Typography>
            <Typography variant="body2">{row.release_date || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>상태</Typography>
            <Typography variant="body2">
              {isFredSource
                ? (hasActualValue ? '발표 후 FRED 값 반영됨' : '발표 전/대기')
                : (isReleased ? '발표 후 공식 자료 확인 가능' : '발표 전/대기')}
            </Typography>
          </Box>
          {row.observation_date && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>관측치 기준일</Typography>
              <Typography variant="body2">{row.observation_date}</Typography>
            </Box>
          )}
          {hasActualValue && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>값 (FRED)</Typography>
              <Typography variant="body2" fontWeight={600}>{row.actual_value}</Typography>
            </Box>
          )}
          {row.previous_value != null && String(row.previous_value).trim() !== '' && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>이전 관측 (동기화 시점)</Typography>
              <Typography variant="body2">{row.previous_value}</Typography>
            </Box>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, lineHeight: 1.5 }}>
          {isFredSource
            ? '발표 전에는 릴리스 일정만 표시하고, 발표 후에는 FRED 시계열에서 최신 관측치를 채웁니다. 공식 수치·개정은 아래 FRED 자료 URL에서 확인하세요.'
            : '발표 일정은 공식 공표일정을 기준으로 표시합니다. 실제 수치·개정은 아래 공식 자료에서 확인하세요.'}
        </Typography>
        {(sourceUrl || releaseUrl) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {sourceUrl && (
              <Button
                component="a"
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNew />}
                variant="outlined"
                size="small"
              >
                {row.source_label || 'FRED 시리즈 자료'}
              </Button>
            )}
            {releaseUrl && (
              <Button
                component="a"
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNew />}
                variant="outlined"
                size="small"
              >
                FRED 발표 캘린더
              </Button>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExternalFredEventDialog;
