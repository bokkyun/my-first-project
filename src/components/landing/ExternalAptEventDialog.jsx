import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Divider, Chip,
} from '@mui/material';
import { Close, Apartment, InfoOutlined } from '@mui/icons-material';

/**
 * 청약홈 API 기반(읽기 전용) 일정 상세
 */
function ExternalAptEventDialog({ open, onClose, event }) {
  if (!event || !event._rebRaw) return null;
  const raw = event._rebRaw;

  const lines = Object.entries(raw)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => ({ k, v: String(v) }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pb: 1 }}>
        <Apartment color="primary" sx={{ mt: 0.3 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ pr: 1 }}>{event.title?.replace(/^🏢\s*/, '') || '아파트 청약'}</Typography>
          <Chip size="small" label="한국부동산원·청약홈 API" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, color: 'text.secondary' }}>
          <InfoOutlined fontSize="small" />
          <Typography variant="caption">편집·삭제는 캘린더 일정과 별도입니다(외부 공공 데이터).</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {event.starts_at && new Date(event.starts_at).toLocaleString('ko-KR')}
          {event.ends_at && ` ~ ${new Date(event.ends_at).toLocaleString('ko-KR')}`}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>원본 항목</Typography>
        <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 360, overflow: 'auto' }}>
          {lines.map(({ k, v }) => (
            <li key={k} style={{ marginBottom: 6 }}>
              <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{k}</Typography>
              <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{v}</Typography>
            </li>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default ExternalAptEventDialog;
