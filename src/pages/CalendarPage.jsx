import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Snackbar, Alert, useTheme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useGroups } from '../hooks/useGroups';
import { useEvents } from '../hooks/useEvents';
import { useNotifications } from '../hooks/useNotifications';
import { useRebAptSplyEvents } from '../hooks/useRebAptSplyEvents';
import { useDartIpoEvents } from '../hooks/useDartIpoEvents';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import CalendarView from '../components/landing/CalendarView';
import EventDialog from '../components/landing/EventDialog';
import EventDetailDialog from '../components/landing/EventDetailDialog';
import ExternalAptEventDialog from '../components/landing/ExternalAptEventDialog';
import ExternalIpoEventDialog from '../components/landing/ExternalIpoEventDialog';
import DayAgendaDialog from '../components/landing/DayAgendaDialog';

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

function CalendarPage() {
  const theme = useTheme();
  const isMobileCalendarUx = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { profile } = useUserProfile(user);

  const { groups, loading: groupsLoading, leaveGroup, deleteGroup, fetchGroupMembers, changeGroupAdmin, changeGroupPassword } = useGroups(user?.id);
  const [visibleGroupIds, setVisibleGroupIds] = useState([]);
  const [onlyMySchedules, setOnlyMySchedules] = useState(false);
  const [showAptSply, setShowAptSply] = useState(false);
  const [showIpo, setShowIpo] = useState(false);
  const [viewRange, setViewRange] = useState(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  });
  const [aptDetailOpen, setAptDetailOpen] = useState(false);
  const [selectedAptEvent, setSelectedAptEvent] = useState(null);
  const [ipoDetailOpen, setIpoDetailOpen] = useState(false);
  const [selectedIpoEvent, setSelectedIpoEvent] = useState(null);
  /** 모바일 사이드바 */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** 다이얼로그·시트 — selectedDate 는 dayEventsForSheet 보다 먼저 선언해야 함 */
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayAgendaOpen, setDayAgendaOpen] = useState(false);
  /** 스낵바 */
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const { events, createEvent, updateEvent, deleteEvent } = useEvents(user?.id, visibleGroupIds);
  const { events: aptSplyList, error: aptSplyError } = useRebAptSplyEvents(showAptSply, viewRange);
  const { events: ipoList, error: ipoError } = useDartIpoEvents(showIpo, viewRange);

  const calendarEvents = useMemo(() => {
    const list = [...events];
    if (showAptSply) list.push(...aptSplyList);
    if (showIpo) list.push(...ipoList);
    return list;
  }, [events, aptSplyList, showAptSply, ipoList, showIpo]);

  const dayEventsForSheet = useMemo(() => {
    if (!selectedDate) return [];
    return calendarEvents
      .filter((ev) => eventOccursOnDate(ev, selectedDate))
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }, [calendarEvents, selectedDate]);

  /** 당일 스케줄 브라우저 알림 */
  useNotifications(events);

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
    setVisibleGroupIds(groups.length > 0 ? groups.map((g) => g.id) : []);
  }, [user?.id, myGroupIdsKey]);

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

  /** 날짜 클릭 — 모바일: 하루 일정 시트, 데스크톱: 바로 새 일정 */
  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    if (isMobileCalendarUx) {
      setDayAgendaOpen(true);
    } else {
      setNewDialogOpen(true);
    }
  };

  /** 일정 상세 다이얼로그 열기 */
  const openEventDetail = (ev) => {
    if (ev._external === 'reb-apt' || ev._external === 'reb-odcloud') {
      setSelectedAptEvent(ev);
      setAptDetailOpen(true);
      return;
    }
    if (ev._external === 'ipo') {
      setSelectedIpoEvent(ev);
      setIpoDetailOpen(true);
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
    setDayAgendaOpen(false);
    setNewDialogOpen(true);
  };

  const handleDayAgendaPickEvent = (ev) => {
    setDayAgendaOpen(false);
    openEventDetail(ev);
  };

  const handleDatesSet = useCallback((info) => {
    setViewRange({ start: info.start, end: info.end });
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
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
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
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          onFetchGroupMembers={fetchGroupMembers}
          onLeaveGroup={leaveGroup}
          onDeleteGroup={deleteGroup}
          onChangeAdmin={changeGroupAdmin}
          onChangePassword={changeGroupPassword}
        />

        <CalendarView
          events={calendarEvents}
          groups={groups}
          visibleGroupIds={visibleGroupIds}
          onDateClick={handleDateClick}
          onEventClick={handleCalendarEventClick}
          onlyMySchedules={onlyMySchedules}
          currentUserId={user?.id ?? null}
          onDatesSet={handleDatesSet}
        />
      </Box>

      <DayAgendaDialog
        open={dayAgendaOpen}
        onClose={() => setDayAgendaOpen(false)}
        dateStr={selectedDate}
        dayEvents={dayEventsForSheet}
        groups={groups}
        onNewEvent={handleDayAgendaNewEvent}
        onEventPick={handleDayAgendaPickEvent}
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

export default CalendarPage;
