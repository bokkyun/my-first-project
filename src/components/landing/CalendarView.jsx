import { useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { isCoffeeEvent } from '../../utils/eventCoffee';

/**
 * FullCalendar 기반 메인 캘린더 뷰
 *
 * Props:
 * @param {Array} events - 표시할 이벤트 배열 [Required]
 * @param {Array} groups - 내 그룹 목록 (색상 참조용) [Required]
 * @param {string[]} visibleGroupIds - 표시할 그룹 ID [Required]
 * @param {function} onDateClick - 날짜 클릭 핸들러 (dateStr) => void [Required]
 * @param {function} onEventClick - 이벤트 클릭 핸들러 (event) => void [Required]
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
      .filter((ev) => {
        if (ev._external === 'reb-apt' || ev._external === 'reb-odcloud' || ev._external === 'ipo') {
          if (onlyMySchedules) return false;
          return true;
        }
        /** 내 비공개 일정은 항상 표시, 공개 일정은 체크된 그룹만 */
        const sharedGroupIds = (ev.event_visibility || []).map((v) => v.group_id);
        let visible = true;
        if (sharedGroupIds.length === 0) {
          visible = true;
        } else {
          visible = sharedGroupIds.some((gid) => visibleGroupIds.includes(gid));
        }
        if (!visible) return false;
        if (onlyMySchedules && currentUserId && ev.creator_id !== currentUserId) return false;
        return true;
      })
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
    <Box sx={{ flex: 1, p: { xs: 1, md: 2 }, overflow: 'hidden', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderRadius: 2, p: { xs: 1, md: 2 }, boxShadow: 1, height: '100%' }}>
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
          eventClick={(info) => onEventClick(info.event.extendedProps)}
          datesSet={onDatesSet || undefined}
          eventContent={(arg) => {
            const ex = arg.event.extendedProps;
            const nickname = ex.creatorNickname;
            const isIpo = ex._external === 'ipo';
            const displayTitle = String(arg.event.title || '').replace(/^(📈|🏢)\s*/u, '');
            const ipoMobileTitleSx = isMobile && isIpo ? {
              fontWeight: 800,
              fontSize: '0.8125rem',
              lineHeight: 1.25,
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            } : {
              fontWeight: 600,
              fontSize: '0.75rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            };
            const showNickname = nickname && !(isMobile && isIpo);
            return (
              <Box sx={{ px: 0.5, overflow: 'hidden', width: '100%', lineHeight: 1.2 }}>
                <Box sx={ipoMobileTitleSx}>
                  {displayTitle}
                </Box>
                {showNickname && (
                  <Box sx={{
                    fontSize: '0.65rem',
                    opacity: 0.9,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {nickname}
                  </Box>
                )}
              </Box>
            );
          }}
          height="calc(100vh - 140px)"
          dayMaxEvents={isMobile ? 2 : 3}
          moreLinkText={(n) => `+${n}`}
          eventDisplay="block"
        />
      </Box>
    </Box>
  );
}

export default CalendarView;
