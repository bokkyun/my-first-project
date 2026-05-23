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
import {
  buySignalMarketChipStyle,
  buySignalMarketLabel,
  isCryptoBuySignalMarket,
  isKrBuySignalMarket,
} from '../../constants/buySignalMarkets';

const SUMMARY_TYPES = {
  ipo:    { label: '공모주',     color: '#1b5e20', match: (ev) => ev._external === 'ipo' },
  apt:    { label: '아파트청약', color: '#0d47a1', match: (ev) => ev._external === 'reb-apt' || ev._external === 'reb-odcloud' },
  dart:   { label: '실적발표',   color: '#1565c0', match: (ev) => ev._external === 'dart-report' },
  signal: {
    label: '매수신호',
    color: '#e65100',
    match: (ev) => ev._external === 'signal' && isKrBuySignalMarket(ev._signalRow?.market),
  },
  crypto: {
    label: '코인',
    color: '#f7931a',
    match: (ev) => ev._external === 'signal' && isCryptoBuySignalMarket(ev._signalRow?.market),
  },
};

const SIGNAL_CATEGORIES = [
  { key: '추세',   label: '추세지표',   color: '#1976d2' },
  { key: '모멘텀', label: '모멘텀지표', color: '#2e7d32' },
  { key: '볼린저', label: '볼린저밴드', color: '#6a1b9a' },
];

function formatDayTitle(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('ko-KR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
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

function SummaryListItem({ color, label, count, onClick }) {
  return (
    <ListItemButton
      onClick={onClick}
      sx={{ borderRadius: 1, mb: 0.75, border: '1px solid', borderColor: 'divider', alignItems: 'center', pl: 1, py: 1.25 }}
    >
      <Box sx={{ width: 4, alignSelf: 'stretch', minHeight: 40, borderRadius: 1, bgcolor: color, mr: 1.25, flexShrink: 0 }} />
      <ListItemText
        primary={`${label} ${count}건`}
        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem' }}
      />
      <Chip label={`${count}건`} size="small" sx={{ bgcolor: color, color: '#fff', fontWeight: 700, mr: 0.5 }} />
      <ChevronRight sx={{ color: 'text.secondary', fontSize: 20 }} />
    </ListItemButton>
  );
}

/**
 * 날짜 셀 탭 시: 새 일정 + 해당 날짜 일정 목록 (모바일 터치용)
 * 공모주·아파트청약·실적발표·매수신호는 요약 표시
 * 매수신호는 추세지표/모멘텀지표/볼린저밴드 3단계로 펼쳐짐
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
  const [signalCategory, setSignalCategory] = useState(null);

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
    setTimeout(() => { setSubType(null); setSignalCategory(null); }, 200);
  };

  const handleSubClose = () => {
    setSubType(null);
    setSignalCategory(null);
  };

  const subInfo = subType ? SUMMARY_TYPES[subType] : null;
  const subEvents = subType ? (summaryBuckets[subType] || []) : [];

  // 매수신호 카테고리별 분류
  const signalByCategory = {};
  for (const ev of subEvents) {
    const cat = ev._signalRow?.signal_category || '기타';
    if (!signalByCategory[cat]) signalByCategory[cat] = [];
    signalByCategory[cat].push(ev);
  }

  // 선택된 카테고리 정보
  const activeCatInfo = SIGNAL_CATEGORIES.find((c) => c.key === signalCategory);
  const categoryEvents = signalCategory ? (signalByCategory[signalCategory] || []) : [];

  return (
    <>
      {/* ── 레벨 1: 날짜별 일정 목록 ── */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Typography variant="h6" component="span" fontWeight={700}>
            {formatDayTitle(dateStr)}
          </Typography>
          <IconButton onClick={handleClose} aria-label="닫기" size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, pb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>일정등록</Typography>
          <Button fullWidth variant="contained" size="medium" onClick={onNewEvent} sx={{ mb: 2, py: 1.1 }}>
            {newEventButtonLabel}
          </Button>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>등록된 일정</Typography>
          {!hasAny ? (
            <Typography color="text.secondary" sx={{ py: 1.5 }}>표시된 일정이 없습니다.</Typography>
          ) : (
            <List disablePadding>
              {summaryItems.map((item) => (
                <SummaryListItem
                  key={item.key}
                  color={item.color}
                  label={item.label}
                  count={item.count}
                  onClick={() => setSubType(item.key)}
                />
              ))}
              {normalEvents.map((ev) => (
                <ListItemButton
                  key={ev.id}
                  onClick={() => onEventPick(ev)}
                  sx={{ borderRadius: 1, mb: 0.75, border: '1px solid', borderColor: 'divider', alignItems: 'flex-start', pl: 1, py: 1.25 }}
                >
                  <Box sx={{ width: 4, alignSelf: 'stretch', minHeight: 40, borderRadius: 1, bgcolor: colorFor(ev), mr: 1.25, flexShrink: 0 }} />
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

      {/* ── 레벨 2: 공모주/청약/실적 개별 목록 OR 매수신호 카테고리 목록 ── */}
      <Dialog open={!!subType} onClose={handleSubClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {/* 컬러 헤더 */}
        <Box sx={{ bgcolor: subInfo?.color || '#455a64', px: 2.5, pt: 2, pb: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: 0.5 }}>
              {subInfo?.label}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
              {subEvents.length}건
            </Typography>
          </Box>
          <IconButton onClick={handleSubClose} size="small" aria-label="닫기"
            sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 1.5, pb: 2, px: 1.5 }}>
          {subType === 'signal' || subType === 'crypto' ? (
            /* 매수신호·코인: 카테고리별 요약 */
            <List disablePadding>
              {SIGNAL_CATEGORIES.filter((c) => signalByCategory[c.key]?.length > 0).map((c) => (
                <SummaryListItem
                  key={c.key}
                  color={c.color}
                  label={c.label}
                  count={signalByCategory[c.key].length}
                  onClick={() => setSignalCategory(c.key)}
                />
              ))}
            </List>
          ) : (
            subEvents.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 1.5, px: 1 }}>항목이 없습니다.</Typography>
            ) : (
              <List disablePadding>
                {subEvents.map((ev) => (
                  <ListItemButton
                    key={ev.id}
                    onClick={() => { handleSubClose(); onEventPick(ev); }}
                    sx={{ borderRadius: 1.5, mb: 0.5, alignItems: 'flex-start', pl: 1.25, py: 1.25,
                      '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <Box sx={{ width: 3, alignSelf: 'stretch', minHeight: 36, borderRadius: 2, bgcolor: subInfo?.color || '#1976d2', mr: 1.5, flexShrink: 0 }} />
                    <ListItemText
                      primary={displayTitle(ev)}
                      secondary={formatEventSubtitle(ev)}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                      secondaryTypographyProps={{ fontSize: '0.78rem', color: 'text.secondary' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* ── 레벨 3: 매수신호 카테고리 내 개별 종목 ── */}
      <Dialog open={!!signalCategory} onClose={() => setSignalCategory(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {/* 컬러 헤더 */}
        <Box sx={{ bgcolor: activeCatInfo?.color || '#e65100', px: 2.5, pt: 2, pb: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: 0.5 }}>
              {activeCatInfo?.label}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
              {categoryEvents.length}건
            </Typography>
          </Box>
          <IconButton onClick={() => setSignalCategory(null)} size="small" aria-label="닫기"
            sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 1.5, pb: 2, px: 1.5 }}>
          {categoryEvents.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 1.5, px: 1 }}>항목이 없습니다.</Typography>
          ) : (
            <List disablePadding>
              {categoryEvents.map((ev) => {
                const row = ev._signalRow;
                const marketLabel = buySignalMarketLabel(row?.market);
                const marketStyle = buySignalMarketChipStyle(row?.market);
                const indicators = Array.isArray(ev._signalIndicatorLabels) && ev._signalIndicatorLabels.length > 0
                  ? ev._signalIndicatorLabels
                  : [row?.signal_name || row?.signal_type].filter(Boolean);
                return (
                  <ListItemButton
                    key={ev.id}
                    onClick={() => { setSignalCategory(null); handleSubClose(); onEventPick(ev); }}
                    sx={{ borderRadius: 1.5, mb: 0.5, alignItems: 'flex-start', pl: 1.25, pr: 1, py: 1.25,
                      '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <Box sx={{ width: 3, alignSelf: 'stretch', minHeight: 36, borderRadius: 2, bgcolor: activeCatInfo?.color || '#e65100', mr: 1.5, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} fontSize="0.9rem" noWrap>
                        {row?.name || row?.code || displayTitle(ev)}
                      </Typography>
                      {indicators.map((line, i) => (
                        <Typography key={`${i}-${line}`} variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                          {line}
                        </Typography>
                      ))}
                    </Box>
                    {row?.market && (
                      <Chip label={marketLabel} size="small"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 700,
                          ...marketStyle, flexShrink: 0 }} />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DayAgendaDialog;
