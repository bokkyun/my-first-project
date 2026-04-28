import { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function formatEventDateLine(ev) {
  if (!ev?.starts_at) return '';
  const d = new Date(ev.starts_at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (ev.is_all_day) return `${y}-${m}-${day} (종일)`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

/**
 * 내가 등록한 일정만 제목·장소·메모 부분 일치 검색 — 결과는 이 다이얼로그 목록
 */
export default function MyEventSearchDialog({
  open,
  onClose,
  events,
  userId,
  onPickEvent,
}) {
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const results = useMemo(() => {
    if (!userId) return [];
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return [];
    return events
      .filter((ev) => {
        if (ev.creator_id !== userId) return false;
        const blob = `${ev.title ?? ''} ${ev.location ?? ''} ${ev.memo ?? ''}`.toLowerCase();
        return blob.includes(trimmed);
      })
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }, [events, userId, q]);

  const handlePick = (ev) => {
    onPickEvent(ev);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="my-event-search-title">
      <DialogTitle id="my-event-search-title">
        일정 검색
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          내가 등록한 일정만 검색됩니다. 제목·장소·메모에서 일부 일치하면 표시됩니다.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="제목·장소·메모 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" aria-hidden />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />
        {!q.trim() ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            검색어를 입력하면 목록이 표시됩니다.
          </Typography>
        ) : results.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            일치하는 일정이 없습니다.
          </Typography>
        ) : (
          <List dense disablePadding sx={{ maxHeight: { xs: '50vh', sm: 360 }, overflow: 'auto' }}>
            {results.map((ev) => (
              <ListItemButton key={ev.id} onClick={() => handlePick(ev)} alignItems="flex-start">
                <ListItemText
                  primary={ev.title || '(제목 없음)'}
                  secondary={
                    <Box component="span" sx={{ display: 'block' }}>
                      <Typography component="span" variant="caption" color="text.secondary" display="block">
                        {formatEventDateLine(ev)}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
