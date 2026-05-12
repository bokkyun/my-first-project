import { useState } from 'react';
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
  Chip,
} from '@mui/material';
import { Close, ChevronRight } from '@mui/icons-material';

const SUMMARY_TYPES = {
  ipo: { label: '공모주', color: '#1b5e20', match: (ev) => ev._external === 'ipo' },
  apt: { label: '아파트청약', color: '#0d47a1', match: (ev) => ev._external === 'reb-apt' || ev._external === 'reb-odcloud' },
  dart: { label: '실적발표', color: '#1565c0', match: (ev) => ev._external === 'dart-report' },
};

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
  return String(ev.title || '').replace(/^(📈|🏢|📊|📅|📋)\s*/u, '');
}

/**
 * 날짜 셀 탭 시: 새 일정 + 해당 날짜 일정 목록 (모바일 터치용)
 * 공모주·아파트청약·실적발표는 요약 표시, 클릭 시 서브 팝업으로 개별 나열
 */
function DayAgendaDialog({
  open,
  onClose,
  dateStr,
  dayEvents,
  groups,
  onNewEvent,
  onEventPick,
  newEventButtonLabel = '새 일정 추가',
}) {
  const [subType, setSubType] = useState(null);

  const colorFor = (ev) => {
    if (ev.color) return ev.color;
    const shared = (ev.event_visibility || []).map((v) => v.group_id);
    const g = groups.find((x) => shared.includes(x.id));
    return g?.color || '#1976d2';
  };

  const summaryBuckets = {};
  const normalEvents = [];

  for (const ev of dayEvents) {
    let matched = false;
    for (const [key, cfg] of Object.entries(SUMMARY_TYPES)) {
      if (cfg.match(ev)) {
        if (!summaryBuckets[key]) summaryBuckets[key] = [];
        summaryBuckets[key].push(ev);
        matched = true;
        break;
      }
    }
    if (!matched) normalEvents.push(ev);
  }

  const summaryItems = Object.entries(SUMMARY_TYPES)
    .filter(([key]) => summaryBuckets[key]?.length > 0)
    .map(([key, cfg]) => ({
      key,
      label: cfg.label,
      color: cfg.color,
      count: summaryBuckets[key].length,
      events: summaryBuckets[key],
    }));

  const hasAny = normalEvents.length > 0 || summaryItems.length > 0;

  const handleClose = () => {
    onClose();
    setTimeout(() => setSubType(null), 200);
  };

  const subInfo = subType ? SUMMARY_TYPES[subType] : null;
  const subEvents = subType ? (summaryBuckets[subType] || []) : [];

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Typography variant="h6" component="span" fontWeight={700}>
            {formatDayTitle(dateStr)}
          </Typography>
          <IconButton onClick={handleClose} aria-label="닫기" size="small">
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
            {newEventButtonLabel}
          </Button>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
            등록된 일정
          </Typography>
          {!hasAny ? (
            <Typography color="text.secondary" sx={{ py: 1.5 }}>
              표시된 일정이 없습니다.
            </Typography>
          ) : (
            <List disablePadding>
              {summaryItems.map((item) => (
                <ListItemButton
                  key={item.key}
                  onClick={() => setSubType(item.key)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.75,
                    border: '1px solid',
                    borderColor: 'divider',
                    alignItems: 'center',
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
                      bgcolor: item.color,
                      mr: 1.25,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText
                    primary={`${item.label} ${item.count}건`}
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem' }}
                  />
                  <Chip label={`${item.count}건`} size="small" sx={{ bgcolor: item.color, color: '#fff', fontWeight: 700, mr: 0.5 }} />
                  <ChevronRight sx={{ color: 'text.secondary', fontSize: 20 }} />
                </ListItemButton>
              ))}
              {normalEvents.map((ev) => (
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

      {/* 서브 팝업: 공모주/청약/실적발표 개별 목록 */}
      <Dialog
        open={!!subType}
        onClose={() => setSubType(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {subInfo && (
              <Chip label={subInfo.label} size="small" sx={{ bgcolor: subInfo.color, color: '#fff', fontWeight: 700 }} />
            )}
            <Typography variant="h6" component="span" fontWeight={700}>
              {subEvents.length}건
            </Typography>
          </Box>
          <IconButton onClick={() => setSubType(null)} aria-label="닫기" size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, pb: 2 }}>
          {subEvents.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 1.5 }}>항목이 없습니다.</Typography>
          ) : (
            <List disablePadding>
              {subEvents.map((ev) => (
                <ListItemButton
                  key={ev.id}
                  onClick={() => { setSubType(null); onEventPick(ev); }}
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
                      bgcolor: subInfo?.color || '#1976d2',
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
    </>
  );
}

export default DayAgendaDialog;
