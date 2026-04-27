import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Divider, Chip, Paper, Button,
} from '@mui/material';
import { Close, InfoOutlined, OpenInNew } from '@mui/icons-material';

const LABELS = {
  corp_name: '기업명',
  flr_nm: '제출인',
  report_nm: '보고서명',
  rcept_dt: '접수일(공시제출일)',
  rcept_no: '접수번호',
  stock_code: '종목코드',
  corp_cls: '시장 구분',
  corp_code: '고유번호',
  rm: '비고',
};

/**
 * Open DART 공시(공모주 관련) 읽기 전용 상세
 */
function ExternalIpoEventDialog({ open, onClose, event }) {
  if (!event || !event._dartRaw) return null;
  const raw = event._dartRaw;

  const rows = Object.entries(LABELS)
    .map(([k, label]) => {
      const v = raw[k];
      if (v == null || String(v).trim() === '') return null;
      return { k, label, v: String(v) };
    })
    .filter(Boolean);

  const rceptNo = raw.rcept_no != null && String(raw.rcept_no).trim() !== ''
    ? String(raw.rcept_no).trim()
    : null;
  const dartViewerUrl = rceptNo
    ? `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${encodeURIComponent(rceptNo)}`
    : null;

  const formatRange = () => {
    if (!event.starts_at) return '';
    if (event.is_all_day) {
      const a = new Date(event.starts_at).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      return a;
    }
    return new Date(event.starts_at).toLocaleString('ko-KR');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ pr: 1 }}>{event.title?.replace(/^📈\s*/, '') || raw.corp_name || '공시'}</Typography>
          <Chip size="small" label="금융감독원 Open DART" color="success" variant="outlined" sx={{ mt: 0.5 }} />
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: { xs: '80vh', sm: 560 }, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, color: 'text.secondary' }}>
          <InfoOutlined fontSize="small" />
          <Typography variant="caption">편집·삭제는 캘린더 일정과 별도입니다(전자공시 공개 데이터).</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{formatRange()}</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>공시 정보</Typography>
        <Paper variant="outlined" sx={{ mt: 0.5, p: 1.5, bgcolor: (t) => (t.palette.mode === 'dark' ? 'action.hover' : 'grey.50') }}>
          {rows.map(({ k, label, v }) => (
            <Box key={k} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</Typography>
            </Box>
          ))}
        </Paper>
        {dartViewerUrl && (
          <Box sx={{ mt: 2 }}>
            <Button
              component="a"
              href={dartViewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              color="success"
              fullWidth
              startIcon={<OpenInNew />}
            >
              전자공시에서 보기
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExternalIpoEventDialog;
