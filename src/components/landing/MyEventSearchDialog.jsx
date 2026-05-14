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

/** 제목·장소·메모 외에 공모·청약·시그널 등 원시 필드 일부를 합쳐 검색에 사용 */
function buildEventSearchBlob(ev) {
  const chunks = [ev.title, ev.location, ev.memo];
  const dart = ev._dartRaw;
  if (dart && typeof dart === 'object') {
    chunks.push(dart.report_nm, dart.corp_name, dart.flr_nm, dart.stock_code, dart.rcept_no);
  }
  const reb = ev._rebRaw;
  if (reb && typeof reb === 'object') {
    chunks.push(
      reb.HSMP_NM,
      reb.HOUSE_NM,
      reb.PBLANC_NM,
      reb.CTPRVN_NM,
      reb.SIGNGU_NM,
      reb.BIZ_NM,
      reb.SPLY_BIZ_NM,
      reb.SUBSCRPT_CLAS_NM,
      reb.aptNm,
      reb.houseNm,
      reb.pblancNm,
    );
  }
  const fred = ev._fredRow;
  if (fred && typeof fred === 'object') {
    chunks.push(fred.series_id, fred.title);
  }
  const sig = ev._signalRow;
  if (sig && typeof sig === 'object') {
    chunks.push(sig.code, sig.name, sig.signal_type, sig.signal_name, sig.market);
  }
  if (Array.isArray(ev._signalMergedRows)) {
    for (const r of ev._signalMergedRows) {
      if (r && typeof r === 'object') {
        chunks.push(r.signal_type, r.signal_name);
      }
    }
  }
  return chunks.filter(Boolean).join(' ').toLowerCase();
}

/**
 * 캘린더에 올라온 일정 전부(내 일정·그룹 공유·청약·공모·거시지표·매수시그널 등)를 검색.
 * `events`는 CalendarPage 의 `calendarEvents`와 같이 그리드에 합쳐지기 직전 목록을 넘깁니다.
 * 사이드바 규칙(`eventPassesSidebarCalendarFilters`)은 달력과 동일하게 적용합니다.
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
      .filter((ev) => buildEventSearchBlob(ev).includes(trimmed))
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
          내 일정·그룹 공유 일정뿐 아니라, 사이드바에서 켜 둔 청약·공모주·실적·거시지표·매수 시그널 등도 검색합니다. 다른 그룹에만 공유된 타인 일정은 목록에 포함되지 않습니다. 검색 대상 데이터는 현재 캘린더가 불러온 기간 안에 한정됩니다.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="제목·기업명·지역·종목코드 등 검색"
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
                        {ev._external === 'reb-apt' || ev._external === 'reb-odcloud' ? ' · 청약' : null}
                        {ev._external === 'ipo' ? ' · 공모' : null}
                        {ev._external === 'dart-report' ? ' · 공시' : null}
                        {ev._external === 'fred' || ev._external === 'bok' ? ' · 거시' : null}
                        {ev._external === 'signal' ? ' · 시그널' : null}
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
