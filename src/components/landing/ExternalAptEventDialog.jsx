import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Divider, Paper,
} from '@mui/material';
import { Close, InfoOutlined } from '@mui/icons-material';
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
  const { summary, rest } = getRebAptDialogSections(raw);
  const dateText = formatKoDateRange(event.starts_at, event.ends_at, event.is_all_day);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ pr: 1 }}>{event.title || '아파트 청약'}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: { xs: '80vh', sm: 560 }, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, color: 'text.secondary' }}>
          <InfoOutlined fontSize="small" />
          <Typography variant="caption">편집·삭제는 캘린더 일정과 별도입니다.</Typography>
        </Box>
        {dateText && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {dateText}
          </Typography>
        )}

        {summary.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              주요 항목
            </Typography>
            <Paper variant="outlined" sx={{ mt: 0.5, p: 1.5, bgcolor: (t) => t.palette.mode === 'dark' ? 'action.hover' : 'grey.50' }}>
              {summary.map((row) => (
                <RowItem key={row.k} k={row.k} label={row.label} v={row.v} compact />
              ))}
            </Paper>
          </Box>
        )}

        {rest.length > 0 && (
          <Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              전체 항목
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              한글 라벨은 앱에서 매핑한 것이며, 괄호 안은 API 원본 키입니다. 미매핑 키는 영문 그대로 보일 수 있습니다.
            </Typography>
            {rest.map((row) => (
              <RowItem key={row.k} k={row.k} label={row.label} v={row.v} />
            ))}
          </Box>
        )}

        {summary.length === 0 && rest.length === 0 && (
          <Typography variant="body2" color="text.secondary">표시할 항목이 없습니다.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExternalAptEventDialog;
