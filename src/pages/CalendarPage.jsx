import { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { useEvents } from '../hooks/useEvents';
import { supabase } from '../lib/supabase';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import CalendarView from '../components/landing/CalendarView';
import EventDialog from '../components/landing/EventDialog';
import EventDetailDialog from '../components/landing/EventDetailDialog';

function CalendarPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  const { groups, loading: groupsLoading } = useGroups(user?.id);
  const [visibleGroupIds, setVisibleGroupIds] = useState([]);

  const { events, createEvent, updateEvent, deleteEvent } = useEvents(user?.id, visibleGroupIds);

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

  /** 프로필 로드 */
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

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
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  /** 이벤트 저장 */
  const handleSaveEvent = async (eventData, groupIds) => {
    const { error } = await createEvent(eventData, groupIds);
    if (error) {
      setSnack({ open: true, msg: '일정 저장 중 오류가 발생했습니다.', severity: 'error' });
    } else {
      setSnack({ open: true, msg: '일정이 저장되었습니다!', severity: 'success' });
    }
  };

  /** 이벤트 수정 */
  const handleUpdateEvent = async (eventData, groupIds) => {
    if (!selectedEvent) return;
    const { error } = await updateEvent(selectedEvent.id, eventData, groupIds);
    if (error) {
      setSnack({ open: true, msg: '일정 수정 중 오류가 발생했습니다.', severity: 'error' });
    } else {
      setSnack({ open: true, msg: '일정이 수정되었습니다!', severity: 'success' });
      setSelectedEvent(null);
    }
  };

  /** 이벤트 삭제 */
  const handleDeleteEvent = async (eventId) => {
    const { error } = await deleteEvent(eventId);
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
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <CalendarView
          events={events}
          groups={groups}
          visibleGroupIds={visibleGroupIds}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
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
      />

      {/* 일정 상세 다이얼로그 */}
      <EventDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onEdit={handleOpenEditDialog}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        groups={groups}
        currentUserId={user?.id}
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
