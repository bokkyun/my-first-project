import {
  useRef, useCallback, useLayoutEffect, useState,
} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { isCoffeeEvent } from '../../utils/eventCoffee';
import { eventPassesSidebarCalendarFilters } from '../../utils/calendarEventFilters';

/** 공모주(ipo) 등 데스크톱 월간 칸: 4글자 초과 시 앞 4글자 + … (모바일은 칸 너비 CSS 말줄임 사용) */
function truncateIpoCalendarTitle(title) {
  const s = String(title ?? '').trim();
  if (!s) return s;
  const chars = [...s];
  if (chars.length <= 4) return s;
  return `${chars.slice(0, 4).join('')}…`;
}

/**
 * FullCalendar 기반 메인 캘린더 뷰
 *
 * Props:
 * @param {Array} events - 표시할 이벤트 배열 [Required]
 * @param {Array} groups - 내 그룹 목록 (색상 참조용) [Required]
 * @param {string[]} visibleGroupIds - 표시할 그룹 ID [Required]
 * @param {function} onDateClick - 날짜 클릭 핸들러 (dateStr) => void [Required]
 * @param {function} onEventClick - 이벤트 클릭 (event, clickedDateStr?) => void [Required] — 모바일에서 날짜 칸 기준 시트용
 * @param {boolean} onlyMySchedules - true면 내가 등록한 일정만 표시 [Optional]
 * @param {string|null} currentUserId - 현재 로그인 유저 ID (onlyMySchedules 시 필요) [Optional]
 * @param {function} onDatesSet - (info) => void (보이는 날짜 범위, 외부 API 범위용) [Optional]
 *
 * Example usage:
 * <CalendarView events={events} groups={groups} visibleGroupIds={ids} onDateClick={fn} onEventClick={fn} />
 */
function CalendarView({
  events,
  groups,
  visibleGroupIds,
  onDateClick,
  onEventClick,
  onlyMySchedules = false,
  currentUserId = null,
  onDatesSet = null,
}) {
  const calendarRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  /** 모바일 월간: 좌우 스와이프(가로 스크롤)용 — datesSet 마다 재계산 */
  const [monthSwipeKey, setMonthSwipeKey] = useState('');
  const [activeViewType, setActiveViewType] = useState('dayGridMonth');

  /**
   * 모바일 월간만 일~토 순(일요일 첫 칸). 기본 가로 스크롤을 한 칸 밀어 월~금이 보이게 함.
   * 데스크톱은 로케일 기본 요일 시작 유지.
   */
  const monthWeekdaySwipe = isMobile && activeViewType === 'dayGridMonth';

  useLayoutEffect(() => {
    if (!monthWeekdaySwipe) return undefined;

    const api = calendarRef.current?.getApi?.();
    const root = api?.getEl?.();
    if (!root) return undefined;

    const harness = root.querySelector('.fc-view-harness');
    const scrollGrid = root.querySelector('.fc-dayGridMonth-view .fc-scrollgrid');
    if (!harness || !scrollGrid) return undefined;

    const apply = () => {
      requestAnimationFrame(() => {
        const w = harness.clientWidth;
        if (w <= 0) return;
        scrollGrid.style.minWidth = `${(w * 7) / 5}px`;
        const colW = w / 5;
        harness.scrollLeft = colW;
      });
    };

    apply();
    const ro = new ResizeObserver(() => {
      apply();
    });
    ro.observe(harness);

    return () => {
      ro.disconnect();
      scrollGrid.style.minWidth = '';
      harness.scrollLeft = 0;
    };
  }, [monthWeekdaySwipe, monthSwipeKey]);

  /** 이벤트를 FullCalendar 포맷으로 변환 */
  const fcEvents = useCallback(() => {
    return events
      .filter((ev) => eventPassesSidebarCalendarFilters(ev, {
        visibleGroupIds,
        onlyMySchedules,
        currentUserId,
      }))
      .map((ev) => {
        /** 그룹 색상 찾기 */
        const sharedGroupIds = (ev.event_visibility || []).map((v) => v.group_id);
        const group = groups.find((g) => sharedGroupIds.includes(g.id));
        const color = ev.color || group?.color || '#1976d2';

        return {
          id: ev.id,
          title: isCoffeeEvent(ev) ? `☕ ${ev.title}` : ev.title,
          start: ev.starts_at,
          end: ev.ends_at,
          allDay: ev.is_all_day,
          backgroundColor: color,
          borderColor: color,
          extendedProps: { ...ev, creatorNickname: ev.creatorNickname || null },
        };
      });
  }, [events, groups, visibleGroupIds, onlyMySchedules, currentUserId]);

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        px: { xs: 0.5, sm: 0.75, md: 0.5 },
        py: { xs: 0.75, md: 1 },
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: { xs: 2, md: 1 },
          px: { xs: 0.25, sm: 0.5, md: 0.5 },
          py: { xs: 0.75, md: 1 },
          boxShadow: 1,
          height: '100%',
          minWidth: 0,
          '& .fc-daygrid-event': { px: '0 !important', mx: '0 !important' },
          '& .fc-event-main': { px: '1px !important' },
          '& .fc-h-event': { px: '0 !important' },
          ...(monthWeekdaySwipe
            ? {
              '& .fc .fc-view-harness': {
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                touchAction: 'pan-x pan-y',
              },
            }
            : {}),
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ko"
          {...(isMobile ? { firstDay: 0 } : {})}
          headerToolbar={isMobile ? {
            left: 'prev,next',
            center: 'title',
            right: 'today',
          } : {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          footerToolbar={isMobile ? {
            center: 'dayGridMonth,timeGridWeek,timeGridDay',
          } : false}
          buttonText={{
            today: '오늘',
            month: '월',
            week: '주',
            day: '일',
          }}
          events={fcEvents()}
          dateClick={(info) => onDateClick(info.dateStr)}
          eventClick={(info) => {
            const cell = info.el?.closest?.('[data-date]');
            const clickedDateStr = cell?.getAttribute?.('data-date') || null;
            onEventClick(info.event.extendedProps, clickedDateStr);
          }}
          datesSet={(info) => {
            setActiveViewType(info.view.type);
            if (info.view.type === 'dayGridMonth') {
              setMonthSwipeKey(`${info.view.currentStart?.toISOString?.() ?? ''}-${info.view.currentEnd?.toISOString?.() ?? ''}`);
            }
            onDatesSet?.(info);
          }}
          eventContent={(arg) => {
            const ex = arg.event.extendedProps;
            const nickname = ex.creatorNickname;
            const isIpo = ex._external === 'ipo' || ex._external === 'summary-ipo';
            const isDartReport = ex._external === 'dart-report' || ex._external === 'summary-dart';
            const isAptSummary = ex._external === 'summary-apt';
            const isSummary = !!ex._isSummary;

            const compactCalendarTitle = isIpo || isDartReport || isAptSummary;
            const displayTitle = String(arg.event.title || '').replace(/^(📈|🏢|📊|📅|📋)\s*/u, '');
            /** 모바일: 칸 너비에 맞춰 한 줄 + 말줄임(…). 데스크톱 외부일정 압축은 기존 고정 글자수 유지 */
            const compactTitleSx = compactCalendarTitle
              ? {
                fontWeight: 700,
                fontSize: isMobile ? '0.72rem' : '0.65rem',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
              }
              : null;
            /** 데스크톱: 등록 일정 글씨 크게·칸 안에 좌우 맞춤 줄바꿈 · 모바일: 한 줄 말줄임 */
            const titleSx = compactTitleSx
              || (isMobile || isSummary
                ? {
                  fontWeight: 600,
                  fontSize: isSummary ? (isMobile ? '0.72rem' : '0.8rem') : '0.78rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                }
                : {
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  lineHeight: 1.35,
                  whiteSpace: 'normal',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                });
            const showNickname = nickname && !isIpo && !isDartReport && !isSummary;
            const titleText = compactCalendarTitle && !isMobile
              ? truncateIpoCalendarTitle(displayTitle)
              : displayTitle;
            return (
              <Box sx={{
                px: 0,
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                lineHeight: 1.2,
                boxSizing: 'border-box',
              }}
              >
                <Box sx={titleSx}>
                  {titleText}
                </Box>
                {showNickname && (
                  <Box sx={{
                    fontSize: isMobile ? '0.65rem' : '0.75rem',
                    opacity: 0.9,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    minWidth: 0,
                  }}
                  >
                    {nickname}
                  </Box>
                )}
              </Box>
            );
          }}
          height="calc(100vh - 140px)"
          /**
           * 모바일: 일수 제한·+N 링크 없음 → 날짜 칸(또는 블록) 탭 한 번에 DayAgendaDialog 로 통일
           * 데스크톱: 칸 높이 제한 유지(+N 또는 팝오버 가능)
           */
          dayMaxEvents={isMobile ? false : 5}
          moreLinkText={(n) => `+${n}`}
          moreLinkClick={(info) => {
            /** 혹시 +N 이 보일 때(+링크 숨김 실패 등) 같은 날짜 시트로 연결 */
            if (!isMobile) return undefined;
            if (info?.jsEvent?.preventDefault) info.jsEvent.preventDefault();
            const raw = info.date;
            const d = raw instanceof Date ? raw : (raw != null ? new Date(raw) : null);
            if (!d || Number.isNaN(d.getTime())) return 'none';
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            onDateClick(dateStr);
            return 'none';
          }}
          eventDisplay="block"
        />
      </Box>
    </Box>
  );
}

export default CalendarView;
