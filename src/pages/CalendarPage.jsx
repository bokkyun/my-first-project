import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
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

function CalendarPage() {
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

  const { events, createEvent, updateEvent, deleteEvent } = useEvents(user?.id, visibleGroupIds);
  const { events: aptSplyList, error: aptSplyError } = useRebAptSplyEvents(showAptSply, viewRange);
  const { events: ipoList, error: ipoError } = useDartIpoEvents(showIpo, viewRange);

  const calendarEvents = useMemo(() => {
    const list = [...events];
    if (showAptSply) list.push(...aptSplyList);
    if (showIpo) list.push(...ipoList);
    return list;
  }, [events, aptSplyList, showAptSply, ipoList, showIpo]);

  /** 당일 스케줄 브라우저 알림 */
  useNotifications(events);

  /** 모바일 사이드바 */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /** 다이얼로그 상태 */
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  /** 스낵바 */
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  /** 그룹 로드 완료 시 전체 체크 */
  useEffect(() => {
    if (!groupsLoading && groups.length > 0) {
      setVisibleGroupIds(groups.map((g) => g.id));
    }
  }, [groupsLoading, groups.length]);

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

  /** 날짜 클릭 */
  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setNewDialogOpen(true);
  };

  /** 이벤트 클릭 */
  const handleEventClick = (ev) => {
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
          onEventClick={handleEventClick}
          onlyMySchedules={onlyMySchedules}
          currentUserId={user?.id ?? null}
          onDatesSet={handleDatesSet}
        />
      </Box>

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
