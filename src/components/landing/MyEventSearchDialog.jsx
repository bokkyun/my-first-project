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
import { eventPassesSidebarCalendarFilters } from '../../utils/calendarEventFilters';

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
 * 내 일정 + 달력에 보이는 그룹 공유 일정을 제목·장소·메모로 검색.
 * `events`는 이미 내 그룹 공유만 포함하도록 조회된 목록이며, 여기서는 달력과 동일한 사이드바 규칙으로 한 번 더 거릅니다.
 */
export default function MyEventSearchDialog({
  open,
  onClose,
  events,
  userId,
  visibleGroupIds = [],
  onlyMySchedules = false,
  onPickEvent,
}) {
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const filterOpts = useMemo(() => ({
    visibleGroupIds,
    onlyMySchedules,
    currentUserId: userId,
  }), [visibleGroupIds, onlyMySchedules, userId]);

  const results = useMemo(() => {
    if (!userId) return [];
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return [];
    return events
      .filter((ev) => eventPassesSidebarCalendarFilters(ev, filterOpts))
      .filter((ev) => {
        const blob = `${ev.title ?? ''} ${ev.location ?? ''} ${ev.memo ?? ''}`.toLowerCase();
        return blob.includes(trimmed);
      })
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }, [events, userId, q, filterOpts]);

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
          내가 등록한 일정과, 내 그룹에 공유되어 달력에 표시되는 일정을 검색합니다. 다른 그룹에만 공유된 타인 일정은 나오지 않습니다. 제목·장소·메모에서 일부 일치하면 표시됩니다.
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
                        {ev.creator_id && ev.creator_id !== userId ? (
                          ` · 공유${ev.creatorNickname ? ` · ${ev.creatorNickname}` : ''}`
                        ) : null}
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
