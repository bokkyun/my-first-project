import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import { Close } from '@mui/icons-material';

function formatDayTitle(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('ko-KR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatEventSubtitle(ev) {
  if (ev.is_all_day) return '종일';
  const s = new Date(ev.starts_at);
  const e = ev.ends_at ? new Date(ev.ends_at) : s;
  const opt = { hour: '2-digit', minute: '2-digit' };
  return `${s.toLocaleTimeString('ko-KR', opt)} ~ ${e.toLocaleTimeString('ko-KR', opt)}`;
}

function displayTitle(ev) {
  return String(ev.title || '').replace(/^(📈|🏢|📊|📅)\s*/u, '');
}

/**
 * 날짜 셀 탭 시: 새 일정 + 해당 날짜 일정 목록 (모바일 터치용)
 */
function DayAgendaDialog({
  open,
  onClose,
  dateStr,
  dayEvents,
  groups,
  onNewEvent,
  onEventPick,
}) {
  const colorFor = (ev) => {
    if (ev.color) return ev.color;
    const shared = (ev.event_visibility || []).map((v) => v.group_id);
    const g = groups.find((x) => shared.includes(x.id));
    return g?.color || '#1976d2';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6" component="span" fontWeight={700}>
          {formatDayTitle(dateStr)}
        </Typography>
        <IconButton onClick={onClose} aria-label="닫기" size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          일정등록
        </Typography>
        <Button
          fullWidth
          variant="contained"
          size="medium"
          onClick={onNewEvent}
          sx={{ mb: 2, py: 1.1 }}
        >
          새 일정 추가
        </Button>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
          등록된 일정
        </Typography>
        {dayEvents.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 1.5 }}>
            표시된 일정이 없습니다.
          </Typography>
        ) : (
          <List disablePadding>
            {dayEvents.map((ev) => (
              <ListItemButton
                key={ev.id}
                onClick={() => onEventPick(ev)}
                sx={{
                  borderRadius: 1,
                  mb: 0.75,
                  border: '1px solid',
                  borderColor: 'divider',
                  alignItems: 'flex-start',
                  pl: 1,
                  py: 1.25,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    alignSelf: 'stretch',
                    minHeight: 40,
                    borderRadius: 1,
                    bgcolor: colorFor(ev),
                    mr: 1.25,
                    flexShrink: 0,
                  }}
                />
                <ListItemText
                  primary={displayTitle(ev)}
                  secondary={formatEventSubtitle(ev)}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                  secondaryTypographyProps={{ fontSize: '0.8rem' }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DayAgendaDialog;
