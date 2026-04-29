import { useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { isCoffeeEvent } from '../../utils/eventCoffee';
import { eventPassesSidebarCalendarFilters } from '../../utils/calendarEventFilters';

/** 공모주(ipo) 칸: 5자 초과 시 앞 5자 + .. (달력 칸 2줄 넘지 않도록) */
function truncateIpoCalendarTitle(title) {
  const s = String(title ?? '').trim();
  if (!s) return s;
  if (s.length <= 5) return s;
  return `${s.slice(0, 5)}..`;
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
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ko"
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
          datesSet={onDatesSet || undefined}
          eventContent={(arg) => {
            const ex = arg.event.extendedProps;
            const nickname = ex.creatorNickname;
            const isIpo = ex._external === 'ipo';
            const displayTitle = String(arg.event.title || '').replace(/^(📈|🏢)\s*/u, '');
            /** 공모주: 제목은 JS에서 5자+.. 처리 · 한 줄 고정으로 칸 높이 유지 */
            const ipoTitleSx = isIpo
              ? {
                fontWeight: 700,
                fontSize: isMobile ? '0.6875rem' : '0.7rem',
                lineHeight: 1.35,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
              }
              : null;
            /** 데스크톱: 등록 일정 글씨 크게·칸 안에 좌우 맞춤 줄바꿈 · 모바일: 한 줄 말줄임 */
            const titleSx = ipoTitleSx
              || (isMobile
                ? {
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
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
            const showNickname = nickname && !isIpo;
            const titleText = isIpo ? truncateIpoCalendarTitle(displayTitle) : displayTitle;
            return (
              <Box sx={{
                pl: 0.125,
                pr: 0.125,
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
