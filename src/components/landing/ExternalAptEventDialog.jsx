import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Paper, Button,
} from '@mui/material';
import { Close, OpenInNew } from '@mui/icons-material';
import { getRebAptDialogSections } from '../../utils/rebAptFieldLabels';

function formatKoDateRange(startsAt, endsAt, allDay) {
  if (!startsAt) return '';
  if (allDay) {
    const a = new Date(startsAt).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!endsAt || endsAt === startsAt) return a;
    const b = new Date(endsAt).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    return `${a} ~ ${b}`;
  }
  const a = new Date(startsAt).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  if (!endsAt) return a;
  const b = new Date(endsAt).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return `${a} ~ ${b}`;
}

function RowItem({ label, v, k, compact }) {
  return (
    <Box
      key={k}
      sx={{
        mb: compact ? 0.75 : 1.25,
        pl: 0.5,
        borderLeft: 2,
        borderColor: 'primary.light',
        borderRadius: 0.5,
      }}
    >
      <Typography component="div" variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
        {label}
        <Typography component="span" variant="caption" color="action.disabled" sx={{ fontWeight: 400, ml: 0.5, fontSize: '0.65rem' }}>
          ({k})
        </Typography>
      </Typography>
      <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {v}
      </Typography>
    </Box>
  );
}

/**
 * 청약홈 API 기반(읽기 전용) 일정 상세
 */
function ExternalAptEventDialog({ open, onClose, event }) {
  if (!event || !event._rebRaw) return null;
  const raw = event._rebRaw;
  const { summary } = getRebAptDialogSections(raw);
  const dateText = formatKoDateRange(event.starts_at, event.ends_at, event.is_all_day);

  const urlKeys = ['PBLANC_URL', 'HMPG_ADRES'];
  const pblancUrl = urlKeys.reduce((found, k) => {
    if (found) return found;
    const v = raw[k];
    return v && String(v).trim().startsWith('http') ? String(v).trim() : null;
  }, null);

  const summaryFiltered = summary.filter((row) => !urlKeys.includes(row.k));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ pr: 1 }}>{event.title || '아파트 청약'}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: { xs: '80vh', sm: 560 }, overflow: 'auto' }}>
        {dateText && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {dateText}
          </Typography>
        )}

        {summaryFiltered.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              주요 항목
            </Typography>
            <Paper variant="outlined" sx={{ mt: 0.5, p: 1.5, bgcolor: (t) => t.palette.mode === 'dark' ? 'action.hover' : 'grey.50' }}>
              {summaryFiltered.map((row) => (
                <RowItem key={row.k} k={row.k} label={row.label} v={row.v} compact />
              ))}
            </Paper>
          </Box>
        )}

        {pblancUrl && (
          <Button
            variant="contained"
            fullWidth
            href={pblancUrl}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNew />}
            sx={{ mt: 1, py: 1.2, fontWeight: 700 }}
          >
            모집공고보기
          </Button>
        )}

        {summaryFiltered.length === 0 && !pblancUrl && (
          <Typography variant="body2" color="text.secondary">표시할 항목이 없습니다.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExternalAptEventDialog;
