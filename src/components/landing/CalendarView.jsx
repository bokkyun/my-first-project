import {
  useRef, useCallback, useLayoutEffect, useEffect, useState,
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

/** 두 터치 포인트 사이의 거리 계산 */
function getPinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
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
  /** 월간 뷰: 5일 스와이프 레이아웃 재측정용 — datesSet 마다 갱신 */
  const [monthSwipeKey, setMonthSwipeKey] = useState('');
  const [activeViewType, setActiveViewType] = useState('dayGridMonth');
  /**
   * false: 기본 5일 뷰 (월~금, 스와이프로 일/토 확인)
   * true: 7일 전체 뷰 (일~토 한 화면에 표시) — 두 손가락 핀치로 전환
   */
  const [isWeekExpanded, setIsWeekExpanded] = useState(false);

  /**
   * 월간(dayGridMonth)에서만: 일~토 순, 가로 폭을 7/5로 넓혀 5칸(뷰포트)만 보이게 하고
   * 스와이프·가로 스크롤로 일·토 구간 확인. (PC·태블릿 포함 — 좁은 화면 전용이면 PC에서 안 보이던 문제 방지)
   * isWeekExpanded=true 시 7칸을 뷰포트에 맞춰 전체 표시.
   */
  const monthWeekdaySwipeLayout = activeViewType === 'dayGridMonth';

  /**
   * 핀치 제스처: React 합성 이벤트는 FullCalendar 내부 핸들러에 가로막힐 수 있어
   * FC 루트 DOM에 직접 native 이벤트 리스너를 부착한다.
   * 오므리기(핀치인, ratio < -0.15) → 7일 전체 뷰
   * 벌리기(핀치아웃, ratio > 0.15) → 5일 뷰 복귀
   */
  useEffect(() => {
    if (!isMobile || activeViewType !== 'dayGridMonth') return undefined;

    const api = calendarRef.current?.getApi?.();
    const root = api?.getEl?.();
    if (!root) return undefined;

    let pStart = null;
    let pLast = null;

    const onStart = (e) => {
      if (e.touches.length === 2) {
        pStart = getPinchDist(e.touches);
        pLast = pStart;
      } else {
        pStart = null;
        pLast = null;
      }
    };

    const onMove = (e) => {
      if (e.touches.length === 2 && pStart !== null) {
        pLast = getPinchDist(e.touches);
      }
    };

    const onEnd = () => {
      if (pStart !== null && pLast !== null && pStart > 30) {
        const ratio = (pLast - pStart) / pStart;
        if (ratio < -0.15) {
          setIsWeekExpanded(true);
        } else if (ratio > 0.15) {
          setIsWeekExpanded(false);
        }
      }
      pStart = null;
      pLast = null;
    };

    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: true });
    root.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      root.removeEventListener('touchstart', onStart);
      root.removeEventListener('touchmove', onMove);
      root.removeEventListener('touchend', onEnd);
    };
  }, [isMobile, activeViewType]);

  useLayoutEffect(() => {
    if (!monthWeekdaySwipeLayout) return undefined;

    const api = calendarRef.current?.getApi?.();
    const root = api?.getEl?.();
    if (!root) return undefined;

    const harness = root.querySelector('.fc-view-harness');
    const monthView = root.querySelector('.fc-dayGridMonth-view');
    const scrollGrid = root.querySelector('.fc-dayGridMonth-view .fc-scrollgrid');
    if (!harness || !monthView || !scrollGrid) return undefined;

    const clearCellMinWidths = () => {
      monthView.querySelectorAll('.fc-col-header-cell, .fc-daygrid-day').forEach((cell) => {
        cell.style.minWidth = '';
      });
      monthView.querySelectorAll('table.fc-scrollgrid-sync-table').forEach((t) => {
        t.style.minWidth = '';
      });
      scrollGrid.style.minWidth = '';
      monthView.style.minWidth = '';
    };

    /**
     * 테이블만 넓혀도 FC가 100%로 줄이는 경우가 있어, 각 요일 칸(th/td)에 최소 너비를 줘
     * 7×cellMinPx 만큼 총 너비를 강제한다.
     * 5일 뷰: cellMin = refW/5 → 7칸 합계 1.4×refW → 가로 스크롤
     * 7일 뷰: cellMin = refW/7 → 7칸 합계 = refW → 스크롤 없음
     */
    const applyColumnMinWidths = (cellMinPx) => {
      if (cellMinPx <= 0) return;
      monthView.querySelectorAll('.fc-col-header-cell, .fc-daygrid-day').forEach((cell) => {
        cell.style.minWidth = `${cellMinPx}px`;
      });
      const totalMin = `${(cellMinPx * 7).toFixed(2)}px`;
      scrollGrid.style.minWidth = totalMin;
      monthView.style.minWidth = totalMin;
      monthView.querySelectorAll('table.fc-scrollgrid-sync-table').forEach((t) => {
        t.style.minWidth = totalMin;
      });
    };

    /**
     * 가로 스크롤이 실제로 일어나는 요소. FC 내부 구조 변경에 대비해
     * 1) view-harness(우리가 overflow-x를 준 노드) 2) overflow 스크롤러 3) 그 외 넓은 노드 순으로 고른다.
     */
    const findHorizontalScrollHost = () => {
      if (harness.scrollWidth - harness.clientWidth > 6) return harness;

      let bestOverflow = null;
      let bestOverflowDelta = 0;
      let bestAny = null;
      let bestAnyDelta = 0;
      monthView.querySelectorAll('*').forEach((el) => {
        const delta = el.scrollWidth - el.clientWidth;
        if (delta <= 6) return;
        if (delta > bestAnyDelta) {
          const t = el.tagName;
          if (!['TD', 'TH', 'TR', 'TABLE', 'TBODY', 'THEAD', 'TFOOT', 'COL', 'COLGROUP'].includes(t)) {
            bestAnyDelta = delta;
            bestAny = el;
          }
        }
        const { overflowX } = getComputedStyle(el);
        if (overflowX === 'auto' || overflowX === 'scroll') {
          if (delta > bestOverflowDelta) {
            bestOverflowDelta = delta;
            bestOverflow = el;
          }
        }
      });
      if (bestOverflow) return bestOverflow;
      if (bestAny) return bestAny;
      if (harness.scrollWidth - harness.clientWidth > 6) return harness;
      return null;
    };

    const colWidth = (host) => host.clientWidth / 5;

    const snapXs = (host) => {
      const c = colWidth(host);
      const max = Math.max(0, host.scrollWidth - host.clientWidth);
      return [0, c, Math.min(2 * c, max)];
    };

    const snapToNearest = (host, smooth) => {
      const snaps = snapXs(host);
      const x = host.scrollLeft;
      const nearest = snaps.reduce(
        (best, s) => (Math.abs(x - s) < Math.abs(x - best) ? s : best),
        snaps[1],
      );
      if (Math.abs(x - nearest) > 3) {
        host.scrollTo({ left: nearest, behavior: smooth ? 'smooth' : 'auto' });
      }
    };

    let scrollHost = null;
    let attachedHost = null;

    const detachScrollListeners = () => {
      if (!attachedHost) return;
      attachedHost.removeEventListener('scrollend', onScrollEnd);
      attachedHost.removeEventListener('scroll', scheduleIdleSnap);
      attachedHost.removeEventListener('touchend', scheduleIdleSnap);
      attachedHost = null;
    };

    const bindScrollHost = () => {
      scrollHost = findHorizontalScrollHost();
      return !!scrollHost;
    };

    let idleSnapTimer;
    const scheduleIdleSnap = () => {
      if (!scrollHost) return;
      clearTimeout(idleSnapTimer);
      idleSnapTimer = setTimeout(() => snapToNearest(scrollHost, true), 160);
    };

    const onScrollEnd = () => {
      if (!scrollHost) return;
      clearTimeout(idleSnapTimer);
      snapToNearest(scrollHost, true);
    };

    const attachScrollListeners = () => {
      detachScrollListeners();
      if (!scrollHost) return;
      scrollHost.addEventListener('scrollend', onScrollEnd);
      scrollHost.addEventListener('scroll', scheduleIdleSnap, { passive: true });
      scrollHost.addEventListener('touchend', scheduleIdleSnap, { passive: true });
      attachedHost = scrollHost;
    };

    /** resetToWeekdays: 달 이동 직후 가운데(월~금)에서 시작 */
    const applyLayout = (resetToWeekdays) => {
      requestAnimationFrame(() => {
        const refW = monthView.clientWidth || harness.clientWidth;
        if (refW <= 0) return;

        if (isWeekExpanded) {
          /**
           * 7일 전체 뷰: 각 칸 = refW/7 → 7칸 합계 = refW (스크롤 없음)
           * clearCellMinWidths() 대신 명시적 크기 설정 — FC 자체 리사이즈 방지
           */
          applyColumnMinWidths(refW / 7);
          detachScrollListeners();
        } else {
          /** 5일 뷰: 각 칸 = refW/5 → 7칸 합계 1.4×refW → 가로 스크롤 */
          applyColumnMinWidths(refW / 5);
          /** FC가 레이아웃을 한 프레임 늦게 잡는 경우가 있어 rAF로 몇 번 재시도 */
          const attachAfterMeasure = (attempt) => {
            requestAnimationFrame(() => {
              if (!bindScrollHost() && attempt < 10) {
                attachAfterMeasure(attempt + 1);
                return;
              }
              if (!scrollHost) return;
              if (resetToWeekdays) {
                scrollHost.scrollLeft = colWidth(scrollHost);
              } else {
                snapToNearest(scrollHost, false);
              }
              attachScrollListeners();
            });
          };
          attachAfterMeasure(0);
        }
      });
    };

    applyLayout(true);

    const ro = new ResizeObserver(() => {
      applyLayout(false);
    });
    ro.observe(monthView);

    return () => {
      ro.disconnect();
      clearTimeout(idleSnapTimer);
      detachScrollListeners();
      clearCellMinWidths();
      if (scrollHost) scrollHost.scrollLeft = 0;
    };
  }, [monthWeekdaySwipeLayout, monthSwipeKey, isWeekExpanded]);

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
          /** 5일 뷰: 가로 스크롤 허용 / 7일 뷰: 기본 overflow(스크롤 없음) */
          ...(monthWeekdaySwipeLayout && !isWeekExpanded
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
          {...(activeViewType === 'dayGridMonth' ? { firstDay: 0 } : {})}
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
            const newViewType = info.view.type;
            setActiveViewType(newViewType);
            /** 월 뷰 벗어나면 7일 확장 뷰 초기화 */
            if (newViewType !== 'dayGridMonth' && isWeekExpanded) {
              setIsWeekExpanded(false);
            }
            if (newViewType === 'dayGridMonth') {
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

            /**
             * 외부 일정(공모주 등) 압축 표시
             * 7일 뷰(좁은 칸): 더 작은 폰트
             */
            const compactTitleSx = compactCalendarTitle
              ? {
                fontWeight: 700,
                fontSize: (isMobile && isWeekExpanded) ? '0.60rem' : (isMobile ? '0.72rem' : '0.65rem'),
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
              }
              : null;

            /**
             * 모바일 5일 뷰 (기본, 넓은 칸): 0.80rem — 칸이 넓어 더 많은 글자 표시
             * 모바일 7일 뷰 (핀치 확장, 좁은 칸): 0.65rem — 압축 표시
             * 데스크톱: 4줄까지 표시
             */
            const titleSx = compactTitleSx || (
              isMobile && isWeekExpanded
                ? {
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                }
                : isMobile || isSummary
                ? {
                  fontWeight: 600,
                  fontSize: isSummary ? (isMobile ? '0.72rem' : '0.8rem') : '0.80rem',
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
                }
            );

            /** 7일 확장 뷰에서는 닉네임 숨김 (칸이 좁아 공간 부족) */
            const showNickname = nickname && !isIpo && !isDartReport && !isSummary && !(isMobile && isWeekExpanded);
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
           * 월간 칸에 표시할 일정 개수 제한을 두지 않음.
           * (이전 데스크톱 전용 5건 제한은 매수 시그널·청약 요약 등이 +N 뒤로 밀려 잘 안 보이는 원인이 됨)
           */
          dayMaxEvents={false}
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
