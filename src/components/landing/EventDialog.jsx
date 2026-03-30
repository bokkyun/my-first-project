import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControlLabel, Switch, Box, Typography,
  FormGroup, Checkbox, Select, MenuItem, FormControl, InputLabel,
  IconButton, CircularProgress, useMediaQuery, useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#d32f2f',
  '#7b1fa2', '#0288d1', '#00796b', '#c2185b',
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: '반복 없음' },
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
  { value: 'yearly', label: '매년' },
];

/**
 * 일정 등록/수정 다이얼로그
 *
 * Props:
 * @param {boolean} open - 열림 여부 [Required]
 * @param {function} onClose - 닫기 핸들러 [Required]
 * @param {function} onSave - 저장 핸들러 (eventData, groupIds, targetUserId) => void [Required]
 * @param {Array} groups - 내 그룹 목록 [Required]
 * @param {string|null} defaultDate - 기본 날짜 (YYYY-MM-DD) [Optional]
 * @param {object|null} editEvent - 수정할 이벤트 데이터 [Optional]
 * @param {Array} adminGroups - 관리자인 그룹 목록 [Optional, 기본값: []]
 * @param {function} onFetchMembers - 멤버 조회 함수 async (groupId) => {data} [Optional]
 *
 * Example usage:
 * <EventDialog open={open} onClose={fn} onSave={fn} groups={groups} defaultDate="2026-03-28" />
 */
function EventDialog({ open, onClose, onSave, groups, defaultDate, editEvent, adminGroups = [], onFetchMembers = null }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const toDatetimeLocal = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
    return dt.toISOString().slice(0, 16);
  };

  const initForm = () => ({
    title: '',
    is_all_day: false,
    starts_at: defaultDate ? `${defaultDate}T09:00` : '',
    ends_at: defaultDate ? `${defaultDate}T10:00` : '',
    location: '',
    memo: '',
    url: '',
    color: '#1976d2',
    recurrence_type: 'none',
  });

  const [form, setForm] = useState(initForm());
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (editEvent) {
      setForm({
        title: editEvent.title || '',
        is_all_day: editEvent.is_all_day || false,
        starts_at: toDatetimeLocal(editEvent.starts_at),
        ends_at: toDatetimeLocal(editEvent.ends_at),
        location: editEvent.location || '',
        memo: editEvent.memo || '',
        url: editEvent.url || '',
        color: editEvent.color || '#1976d2',
        recurrence_type: editEvent.recurrence_type || 'none',
      });
      setSelectedGroups((editEvent.event_visibility || []).map((v) => v.group_id));
    } else {
      setForm(initForm());
      setSelectedGroups([]);
      setTargetUserId('');
    }
  }, [editEvent, defaultDate, open]);

  /** 관리자 그룹 멤버 로드 */
  useEffect(() => {
    if (!open || editEvent || adminGroups.length === 0 || !onFetchMembers) {
      setGroupMembers([]);
      return;
    }
    setMembersLoading(true);
    Promise.all(adminGroups.map((g) => onFetchMembers(g.id)))
      .then((results) => {
        const all = results.flatMap((r) => r.data || []);
        const unique = Array.from(new Map(all.map((m) => [m.id, m])).values());
        setGroupMembers(unique);
      })
      .finally(() => setMembersLoading(false));
  }, [open, editEvent, adminGroups.map((g) => g.id).join(',')]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleToggleGroup = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      is_all_day: form.is_all_day,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at || form.starts_at).toISOString(),
      location: form.location || null,
      memo: form.memo || null,
      url: form.url || null,
      color: form.color,
      recurrence_type: form.recurrence_type,
    };
    await onSave(payload, selectedGroups, targetUserId || null);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography fontWeight={700}>{editEvent ? '일정 수정' : '새 일정 등록'}</Typography>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          fullWidth
          label="제목"
          value={form.title}
          onChange={handleChange('title')}
          required
          inputProps={{ maxLength: 50 }}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.is_all_day}
              onChange={(e) => setForm((prev) => ({ ...prev, is_all_day: e.target.checked }))}
            />
          }
          label="전일 일정"
          sx={{ mb: 1 }}
        />

        {!form.is_all_day && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
            <TextField
              label="시작 일시"
              type="datetime-local"
              value={form.starts_at}
              onChange={handleChange('starts_at')}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="종료 일시"
              type="datetime-local"
              value={form.ends_at}
              onChange={handleChange('ends_at')}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )}

        {form.is_all_day && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
            <TextField
              label="시작일"
              type="date"
              value={form.starts_at.slice(0, 10)}
              onChange={(e) => setForm((prev) => ({ ...prev, starts_at: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="종료일"
              type="date"
              value={form.ends_at.slice(0, 10)}
              onChange={(e) => setForm((prev) => ({ ...prev, ends_at: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>반복</InputLabel>
          <Select value={form.recurrence_type} onChange={handleChange('recurrence_type')} label="반복">
            {RECURRENCE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="장소"
          value={form.location}
          onChange={handleChange('location')}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="메모"
          value={form.memo}
          onChange={handleChange('memo')}
          multiline
          rows={2}
          inputProps={{ maxLength: 500 }}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="URL 링크"
          value={form.url}
          onChange={handleChange('url')}
          sx={{ mb: 2 }}
          type="url"
        />

        {/* 색상 선택 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>일정 색상</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <Box
                key={c}
                onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                sx={{
                  width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                  border: form.color === c ? '3px solid #333' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* 등록 대상 선택 (관리자만 표시) */}
        {!editEvent && adminGroups.length > 0 && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>등록 대상</InputLabel>
            <Select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              label='등록 대상'
              disabled={membersLoading}
            >
              <MenuItem value=''>본인 (나)</MenuItem>
              {membersLoading ? (
                <MenuItem disabled value='__loading'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} />
                    <Typography variant='body2'>불러오는 중...</Typography>
                  </Box>
                </MenuItem>
              ) : (
                groupMembers.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nickname || m.email || m.id}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}

        {/* 공개 그룹 선택 */}
        {groups.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>공개 그룹 선택</Typography>
            <FormGroup row>
              {groups.map((group) => (
                <FormControlLabel
                  key={group.id}
                  control={
                    <Checkbox
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => handleToggleGroup(group.id)}
                      size="small"
                      sx={{ color: group.color, '&.Mui-checked': { color: group.color } }}
                    />
                  }
                  label={<Typography variant="body2">{group.name}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>취소</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!form.title.trim() || saving}
          sx={{ borderRadius: 2 }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : (editEvent ? '수정' : '저장')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EventDialog;
