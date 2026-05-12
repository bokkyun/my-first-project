import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Snackbar, Alert, useTheme, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useGroups } from '../hooks/useGroups';
import { useEvents } from '../hooks/useEvents';
import { useNotifications } from '../hooks/useNotifications';
import { useRebAptSplyEvents } from '../hooks/useRebAptSplyEvents';
import { useDartIpoEvents } from '../hooks/useDartIpoEvents';
import { useDartPeriodicReports } from '../hooks/useDartPeriodicReports';
import { useFredEconomicEvents } from '../hooks/useFredEconomicEvents';
import { useBokEconomicEvents } from '../hooks/useBokEconomicEvents';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import CalendarView from '../components/landing/CalendarView';
import EventDialog from '../components/landing/EventDialog';
import EventDetailDialog from '../components/landing/EventDetailDialog';
import ExternalAptEventDialog from '../components/landing/ExternalAptEventDialog';
import ExternalIpoEventDialog from '../components/landing/ExternalIpoEventDialog';
import ExternalFredEventDialog from '../components/landing/ExternalFredEventDialog';
import DayAgendaDialog from '../components/landing/DayAgendaDialog';
import MyEventSearchDialog from '../components/landing/MyEventSearchDialog';
import SubwayScheduleBar from '../components/common/SubwayScheduleBar';
import { eventPassesSidebarCalendarFilters } from '../utils/calendarEventFilters';

const SIDEBAR_DEFAULT_FILTERS_KEY = 'moneycal.sidebarDefaultFilters.v1';
const DEFAULT_SIDEBAR_FILTERS = {
  onlyMySchedules: false,
  showAptSply: true,
  showIpo: true,
  showDartPeriodic: true,
  showFred: true,
  showBok: true,
  showAllGroups: true,
};

function normalizeSidebarFilters(value) {
  return {
    ...DEFAULT_SIDEBAR_FILTERS,
    ...(value && typeof value === 'object' ? value : {}),
  };
}

function readSidebarDefaultFilters() {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_FILTERS;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_DEFAULT_FILTERS_KEY);
    return normalizeSidebarFilters(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_SIDEBAR_FILTERS;
  }
}

function writeSidebarDefaultFilters(value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SIDEBAR_DEFAULT_FILTERS_KEY, JSON.stringify(normalizeSidebarFilters(value)));
}

/** `dateStr` YYYY-MM-DD 가 로컬 달력 날짜와 겹치는지 */
function eventOccursOnDate(ev, dateStr) {
  if (!dateStr || !ev?.starts_at) return false;
  const start = new Date(ev.starts_at);
  const end = ev.ends_at ? new Date(ev.ends_at) : start;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return false;
  const [y, m, d] = parts;
  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
  return start <= dayEnd && end >= dayStart;
}

/**
 * 헤더에 표시된 기간(FullCalendar view.currentStart ~ currentEnd, end 제외)과 일정이 겹치는지.
 * 월 뷰에서는 해당 월만 표시하고 전·익월 패딩 칸 일정은 숨길 때 사용합니다.
 */
function eventOverlapsFocusedRange(ev, rangeStart, rangeEndExclusive) {
  if (!ev?.starts_at) return false;
  const start = new Date(ev.starts_at);
  const end = ev.ends_at ? new Date(ev.ends_at) : start;
  return start < rangeEndExclusive && end >= rangeStart;
}

function CalendarPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobileCalendarUx = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { profile } = useUserProfile(user);

  const { groups, leaveGroup, deleteGroup, fetchGroupMembers, changeGroupAdmin, changeGroupPassword } = useGroups(user?.id);
  const [sidebarDefaultFilters, setSidebarDefaultFilters] = useState(readSidebarDefaultFilters);
  const [visibleGroupIds, setVisibleGroupIds] = useState([]);
  const [onlyMySchedules, setOnlyMySchedules] = useState(() => readSidebarDefaultFilters().onlyMySchedules);
  const [showAptSply, setShowAptSply] = useState(() => readSidebarDefaultFilters().showAptSply);
  const [showIpo, setShowIpo] = useState(() => readSidebarDefaultFilters().showIpo);
  const [showDartPeriodic, setShowDartPeriodic] = useState(() => readSidebarDefaultFilters().showDartPeriodic);
  const [showFred, setShowFred] = useState(() => readSidebarDefaultFilters().showFred);
  const [showBok, setShowBok] = useState(() => readSidebarDefaultFilters().showBok);
  const [viewRange, setViewRange] = useState(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  });
  /** 그리드에 그릴 일정 범위 — FullCalendar 의 currentStart/currentEnd(표시 중인 달·주·일), end 는 배타 */
  const [focusedViewRange, setFocusedViewRange] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return {
      start: new Date(y, m, 1),
      end: new Date(y, m + 1, 1),
    };
  });
  const [aptDetailOpen, setAptDetailOpen] = useState(false);
  const [selectedAptEvent, setSelectedAptEvent] = useState(null);
  const [ipoDetailOpen, setIpoDetailOpen] = useState(false);
  const [selectedIpoEvent, setSelectedIpoEvent] = useState(null);
  const [fredDetailOpen, setFredDetailOpen] = useState(false);
  const [selectedFredEvent, setSelectedFredEvent] = useState(null);
  /** 모바일 사이드바 */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** 다이얼로그·시트 — selectedDate 는 dayEventsForSheet 보다 먼저 선언해야 함 */
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayAgendaOpen, setDayAgendaOpen] = useState(false);
  /** 내 일정 검색 팝업 */
  const [myEventSearchOpen, setMyEventSearchOpen] = useState(false);
  /** 스낵바 */
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const { events, createEvent, updateEvent, deleteEvent } = useEvents(user?.id, visibleGroupIds);
  const { events: aptSplyList, error: aptSplyError } = useRebAptSplyEvents(showAptSply, viewRange);
  const { events: ipoList, error: ipoError } = useDartIpoEvents(showIpo, viewRange);
  const { events: dartPeriodicList, error: dartPeriodicError } = useDartPeriodicReports(showDartPeriodic, viewRange);
  const {
    events: fredCalendarEvents,
    loading: fredLoading,
    error: fredError,
    syncFromFred,
  } = useFredEconomicEvents(showFred, viewRange, user?.id ?? null);
  const {
    events: bokCalendarEvents,
    loading: bokLoading,
    error: bokError,
  } = useBokEconomicEvents(showBok, viewRange);

  const calendarEvents = useMemo(() => {
    const list = [...events];
    if (showAptSply) list.push(...aptSplyList);
    if (showIpo) list.push(...ipoList);
    if (showDartPeriodic) list.push(...dartPeriodicList);
    if (showFred) list.push(...fredCalendarEvents);
    if (showBok) list.push(...bokCalendarEvents);
    return list;
  }, [events, aptSplyList, showAptSply, ipoList, showIpo, dartPeriodicList, showDartPeriodic, showFred, fredCalendarEvents, showBok, bokCalendarEvents]);

  /** 표시 중인 뷰 구간에 속하는 일정만(월 뷰에서는 해당 월만, 전·익월 칸 제외) + 공모주·청약·실적은 날짜별 요약 */
  const calendarEventsForGrid = useMemo(() => {
    const { start, end } = focusedViewRange;
    const filtered = calendarEvents.filter((ev) => eventOverlapsFocusedRange(ev, start, end));

    const summaryBuckets = {};
    const kept = [];

    for (const ev of filtered) {
      const ext = ev._external;
      let typeKey;
      if (ext === 'ipo') typeKey = 'ipo';
      else if (ext === 'dart-report') typeKey = 'dart';
      else if (ext === 'reb-apt' || ext === 'reb-odcloud') typeKey = 'apt';
      else { kept.push(ev); continue; }

      const d = new Date(ev.starts_at);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const key = `${typeKey}-${dateStr}`;
      if (!summaryBuckets[key]) summaryBuckets[key] = { type: typeKey, date: dateStr, events: [] };
      summaryBuckets[key].events.push(ev);
    }

    const COLOR_MAP = { ipo: '#1b5e20', dart: '#0d47a1', apt: '#0d47a1' };
    const LABEL_MAP = { ipo: '공모주', dart: '실적발표', apt: '아파트청약' };
    const EXT_MAP = { ipo: 'summary-ipo', dart: 'summary-dart', apt: 'summary-apt' };

    const summaries = Object.values(summaryBuckets).map(({ type, date, events: evts }) => ({
      id: `summary-${type}-${date}`,
      title: `${LABEL_MAP[type]} ${evts.length}건`,
      starts_at: `${date}T00:00:00`,
      ends_at: `${date}T23:59:59`,
      is_all_day: true,
      color: COLOR_MAP[type],
      _external: EXT_MAP[type],
      _isSummary: true,
      _summaryDate: date,
      _summaryCount: evts.length,
    }));

    return [...kept, ...summaries];
  }, [calendarEvents, focusedViewRange]);

  const dayEventsForSheet = useMemo(() => {
    if (!selectedDate) return [];
    const { start, end } = focusedViewRange;
    const filterOpts = {
      visibleGroupIds,
      onlyMySchedules,
      currentUserId: user?.id ?? null,
    };
    return calendarEvents
      .filter((ev) => eventPassesSidebarCalendarFilters(ev, filterOpts))
      .filter((ev) => eventOverlapsFocusedRange(ev, start, end))
      .filter((ev) => eventOccursOnDate(ev, selectedDate))
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }, [calendarEvents, selectedDate, focusedViewRange, visibleGroupIds, onlyMySchedules, user?.id]);

  /** 당일 스케줄 브라우저 알림 — 로그인 사용자만 */
  useNotifications(user?.id ? events : []);

  /** 그룹 배열 참조가 바뀌어도 ID 집합이 같으면 필터 선택을 유지하기 위한 키 */
  const myGroupIdsKey = [...groups].map((g) => g.id).sort().join(',');

  /**
   * 로그인 사용자·내 그룹 ID 집합이 바뀔 때 표시 그룹을 동기화합니다.
   * 예전에는 groups.length 만 봐서 계정 전환 후 이전 사용자의 그룹 UUID가 남아
   * 다른 사람 일정(그룹 공유)이 보일 수 있었습니다.
   * groupsLoading 은 deps 에 넣지 않습니다(로딩 종료마다 필터가 전체로 초기화되는 것 방지).
   */
  useEffect(() => {
    if (!user?.id) {
      setVisibleGroupIds([]);
      return;
    }
    setVisibleGroupIds(sidebarDefaultFilters.showAllGroups && groups.length > 0 ? groups.map((g) => g.id) : []);
  }, [user?.id, myGroupIdsKey, sidebarDefaultFilters.showAllGroups]);

  const handleSaveSidebarDefaultFilters = useCallback((nextFilters) => {
    const normalized = normalizeSidebarFilters(nextFilters);
    writeSidebarDefaultFilters(normalized);
    setSidebarDefaultFilters(normalized);
    setOnlyMySchedules(normalized.onlyMySchedules);
    setShowAptSply(normalized.showAptSply);
    setShowIpo(normalized.showIpo);
    setShowDartPeriodic(normalized.showDartPeriodic);
    setShowFred(normalized.showFred);
    setShowBok(normalized.showBok);
    setVisibleGroupIds(normalized.showAllGroups ? groups.map((g) => g.id) : []);
    setSnack({ open: true, msg: '메뉴 기본 체크 설정을 저장했습니다.', severity: 'success' });
  }, [groups]);

  /** 그룹 필터 토글 */
  const handleToggleGroup = (groupId) => {
    setVisibleGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleToggleAll = () => {
    if (visibleGroupIds.length === groups.length) {
      setVisibleGroupIds([]);
    } else {
      setVisibleGroupIds(groups.map((g) => g.id));
    }
  };

  /** 날짜 클릭 — 모바일·비로그인: 하루 일정 시트, 로그인 데스크톱: 바로 새 일정 */
  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    if (isMobileCalendarUx || !user?.id) {
      setDayAgendaOpen(true);
    } else {
      setNewDialogOpen(true);
    }
  };

  /** 일정 상세 다이얼로그 열기 */
  const openEventDetail = (ev) => {
    if (ev._isSummary) {
      setSelectedDate(ev._summaryDate);
      setDayAgendaOpen(true);
      return;
    }
    if (ev._external === 'reb-apt' || ev._external === 'reb-odcloud') {
      setSelectedAptEvent(ev);
      setAptDetailOpen(true);
      return;
    }
    if (ev._external === 'ipo' || ev._external === 'dart-report') {
      setSelectedIpoEvent(ev);
      setIpoDetailOpen(true);
      return;
    }
    if (ev._external === 'fred' || ev._external === 'bok') {
      setSelectedFredEvent(ev);
      setFredDetailOpen(true);
      return;
    }
    setSelectedEvent(ev);
    setDetailDialogOpen(true);
  };

  /**
   * 캘린더에서 이벤트 블록 클릭 — 모바일: 해당 날짜 시트(넓은 터치 영역),
   * 데스크톱: 기존처럼 바로 상세
   */
  const handleCalendarEventClick = (ev, clickedDateStr) => {
    if (isMobileCalendarUx) {
      let dateStr = clickedDateStr;
      if (!dateStr && ev.starts_at) {
        const d = new Date(ev.starts_at);
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      if (dateStr) {
        setSelectedDate(dateStr);
        setDayAgendaOpen(true);
      } else {
        openEventDetail(ev);
      }
      return;
    }
    openEventDetail(ev);
  };

  const handleDayAgendaNewEvent = () => {
    if (!user?.id) {
      setDayAgendaOpen(false);
      navigate('/login');
      return;
    }
    setDayAgendaOpen(false);
    setNewDialogOpen(true);
  };

  const handleDayAgendaPickEvent = (ev) => {
    setDayAgendaOpen(false);
    openEventDetail(ev);
  };

  const handleDatesSet = useCallback((info) => {
    setViewRange({ start: info.start, end: info.end });
    const vs = info.view;
    setFocusedViewRange({
      start: vs.currentStart,
      end: vs.currentEnd,
    });
  }, []);

  useEffect(() => {
    if (showAptSply && aptSplyError) {
      setSnack({ open: true, msg: `청약 API: ${aptSplyError}`, severity: 'error' });
    }
  }, [showAptSply, aptSplyError]);

  useEffect(() => {
    if (showIpo && ipoError) {
      setSnack({ open: true, msg: `공모(DART): ${ipoError}`, severity: 'error' });
    }
  }, [showIpo, ipoError]);

  useEffect(() => {
    if (showDartPeriodic && dartPeriodicError) {
      setSnack({ open: true, msg: `공시(DART): ${dartPeriodicError}`, severity: 'warning' });
    }
  }, [showDartPeriodic, dartPeriodicError]);

  useEffect(() => {
    if (showFred && fredError) {
      setSnack({ open: true, msg: `FRED 일정: ${fredError}`, severity: 'error' });
    }
  }, [showFred, fredError]);

  useEffect(() => {
    if (showBok && bokError) {
      setSnack({ open: true, msg: `한국은행 일정: ${bokError}`, severity: 'error' });
    }
  }, [showBok, bokError]);

  const handleFredSync = useCallback(async () => {
    if (!user?.id) {
      setSnack({ open: true, msg: '로그인 후 동기화할 수 있습니다.', severity: 'error' });
      return;
    }
    const { error } = await syncFromFred();
    if (error) {
      setSnack({
        open: true,
        msg: `FRED 동기화 실패: ${error.message || String(error)}`,
        severity: 'error',
      });
    } else {
      setSnack({ open: true, msg: '거시지표 일정을 동기화했습니다.', severity: 'success' });
    }
  }, [user?.id, syncFromFred]);

  /** 이벤트 저장 */
  const handleSaveEvent = async (eventData, groupIds, targetUserId = null) => {
    const { error } = await createEvent(eventData, groupIds, targetUserId);
    if (error) {
      const detail = error.message ? ` (${String(error.message).slice(0, 120)}${String(error.message).length > 120 ? '…' : ''})` : '';
      setSnack({ open: true, msg: `일정 저장 중 오류가 발생했습니다.${detail}`, severity: 'error' });
    } else {
      setSnack({ open: true, msg: '일정이 저장되었습니다!', severity: 'success' });
    }
  };

  /** 관리자 그룹 ID 목록 */
  const adminGroupIds = groups.filter((g) => g.myRole === 'admin').map((g) => g.id);

  /** 이벤트에 대한 관리자 여부 확인 */
  const isAdminOfEvent = (event) => {
    if (!event) return false;
    const isOwner = event.creator_id === user?.id;
    if (isOwner) return false;
    return (event.event_visibility || []).some((v) => adminGroupIds.includes(v.group_id));
  };

  /** 이벤트 수정 */
  const handleUpdateEvent = async (eventData, groupIds) => {
    if (!selectedEvent) return;
    const { error } = await updateEvent(selectedEvent.id, eventData, groupIds, isAdminOfEvent(selectedEvent));
    if (error) {
      const detail = error.message ? ` (${String(error.message).slice(0, 120)}${String(error.message).length > 120 ? '…' : ''})` : '';
      setSnack({ open: true, msg: `일정 수정 중 오류가 발생했습니다.${detail}`, severity: 'error' });
    } else {
      setSnack({ open: true, msg: '일정이 수정되었습니다!', severity: 'success' });
      setSelectedEvent(null);
    }
  };

  /** 이벤트 삭제 */
  const handleDeleteEvent = async (eventId) => {
    const targetEvent = events.find((e) => e.id === eventId);
    const { error } = await deleteEvent(eventId, isAdminOfEvent(targetEvent));
    if (error) {
      setSnack({ open: true, msg: '일정 삭제 중 오류가 발생했습니다.', severity: 'error' });
    } else {
      setSnack({ open: true, msg: '일정이 삭제되었습니다.', severity: 'success' });
    }
  };

  /** 수정 다이얼로그 열기 */
  const handleOpenEditDialog = (event) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      /** 하단 SubwayScheduleBar(고정)에 가리지 않도록 */
      pb: { xs: 8, md: 7 },
    }}>
      <Navbar profile={profile} onMenuClick={() => setSidebarOpen(true)} />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          groups={groups}
          visibleGroupIds={visibleGroupIds}
          onToggleGroup={handleToggleGroup}
          onToggleAll={handleToggleAll}
          onlyMySchedules={onlyMySchedules}
          onOnlyMySchedulesChange={setOnlyMySchedules}
          showAptSply={showAptSply}
          onShowAptSplyChange={setShowAptSply}
          showIpo={showIpo}
          onShowIpoChange={setShowIpo}
          showDartPeriodic={showDartPeriodic}
          onShowDartPeriodicChange={setShowDartPeriodic}
          showFred={showFred}
          onShowFredChange={setShowFred}
          showBok={showBok}
          onShowBokChange={setShowBok}
          defaultFilters={sidebarDefaultFilters}
          onDefaultFiltersSave={handleSaveSidebarDefaultFilters}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          onFetchGroupMembers={fetchGroupMembers}
          onLeaveGroup={leaveGroup}
          onDeleteGroup={deleteGroup}
          onChangeAdmin={changeGroupAdmin}
          onChangePassword={changeGroupPassword}
          isGuest={!user}
        />

        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box
            sx={{
              px: { xs: 0.75, md: 0.5 },
              pt: { xs: 1, md: 0.75 },
              pb: 0.5,
              bgcolor: 'background.default',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
          {user?.id && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<SearchIcon />}
            onClick={() => setMyEventSearchOpen(true)}
            aria-label="일정 검색"
          >
            일정검색
          </Button>
          )}
          {user?.id && (
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => void handleFredSync()}
              disabled={fredLoading || bokLoading}
              aria-label="FRED 거시지표 동기화"
            >
              {fredLoading ? '동기화 중…' : '거시지표 동기화'}
            </Button>
          )}
        </Box>
          <CalendarView
            events={calendarEventsForGrid}
            groups={groups}
            visibleGroupIds={visibleGroupIds}
            onDateClick={handleDateClick}
            onEventClick={handleCalendarEventClick}
            onlyMySchedules={onlyMySchedules}
            currentUserId={user?.id ?? null}
            onDatesSet={handleDatesSet}
          />
        </Box>
      </Box>

      <DayAgendaDialog
        open={dayAgendaOpen}
        onClose={() => setDayAgendaOpen(false)}
        dateStr={selectedDate}
        dayEvents={dayEventsForSheet}
        groups={groups}
        onNewEvent={handleDayAgendaNewEvent}
        onEventPick={handleDayAgendaPickEvent}
        newEventButtonLabel={user?.id ? '새 일정 추가' : '로그인하고 일정 추가'}
      />

      <MyEventSearchDialog
        open={myEventSearchOpen}
        onClose={() => setMyEventSearchOpen(false)}
        events={events}
        userId={user?.id ?? null}
        onPickEvent={openEventDetail}
      />

      {/* 새 일정 다이얼로그 */}
      <EventDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onSave={handleSaveEvent}
        groups={groups}
        defaultDate={selectedDate}
        editEvent={null}
        adminGroups={adminGroupIds.map((id) => groups.find((g) => g.id === id)).filter(Boolean)}
        onFetchMembers={fetchGroupMembers}
      />

      {/* 일정 상세 다이얼로그 */}
      <ExternalAptEventDialog
        open={aptDetailOpen}
        onClose={() => { setAptDetailOpen(false); setSelectedAptEvent(null); }}
        event={selectedAptEvent}
      />

      <ExternalIpoEventDialog
        open={ipoDetailOpen}
        onClose={() => { setIpoDetailOpen(false); setSelectedIpoEvent(null); }}
        event={selectedIpoEvent}
      />

      <ExternalFredEventDialog
        open={fredDetailOpen}
        onClose={() => { setFredDetailOpen(false); setSelectedFredEvent(null); }}
        event={selectedFredEvent}
      />

      <EventDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onEdit={handleOpenEditDialog}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        groups={groups}
        currentUserId={user?.id}
        adminGroupIds={adminGroupIds}
        onShowMessage={(msg, severity) => setSnack({
          open: true,
          msg,
          severity: severity === 'success' ? 'success' : 'error',
        })}
      />

      {/* 일정 수정 다이얼로그 */}
      <EventDialog
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setSelectedEvent(null); }}
        onSave={handleUpdateEvent}
        groups={groups}
        defaultDate={null}
        editEvent={selectedEvent}
      />

      {/* 스낵바 */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>

      <SubwayScheduleBar />
    </Box>
  );
}

export default CalendarPage;
