import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, List, ListItem, Avatar, Chip,
  Button, CircularProgress, Divider, MenuItem, Select, FormControl, InputLabel,
  TextField, InputAdornment, IconButton, Alert,
} from '@mui/material';
import { Circle, AdminPanelSettings, Lock, Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * 그룹 정보 다이얼로그 - 멤버 목록 확인 및 그룹 탈퇴
 *
 * Props:
 * @param {boolean} open - 다이얼로그 열림 여부 [Required]
 * @param {function} onClose - 닫기 핸들러 () => void [Required]
 * @param {object|null} group - 그룹 정보 객체 { id, name, color, description, myRole } [Required]
 * @param {function} onFetchMembers - (groupId) => Promise<{data, error}> [Required]
 * @param {function} onLeave - (groupId) => Promise<void> [Required]
 * @param {function} onDelete - (groupId) => Promise<void> [Required]
 * @param {function} onChangeAdmin - (groupId, newAdminUserId) => Promise<{data, error}> [Optional]
 * @param {function} onChangePassword - (groupId, newPassword) => Promise<{data, error}> [Optional]
 *
 * Example usage:
 * <GroupInfoDialog open={open} onClose={fn} group={group} onFetchMembers={fn} onLeave={fn} onDelete={fn} onChangeAdmin={fn} onChangePassword={fn} />
 */
function GroupInfoDialog({ open, onClose, group, onFetchMembers, onLeave, onDelete, onChangeAdmin, onChangePassword }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changeAdminOpen, setChangeAdminOpen] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [changingAdmin, setChangingAdmin] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!open || !group) return;
    setLoading(true);
    setMembers([]);
    setConfirmLeave(false);
    setConfirmDelete(false);
    setLeaveError('');
    setDeleteError('');
    setChangeAdminOpen(false);
    setNewAdminId('');
    setChangePwOpen(false);
    setNewPw('');
    setShowNewPw(false);
    onFetchMembers(group.id).then(({ data, error }) => {
      if (!error && data) setMembers(data);
      setLoading(false);
    });
  }, [open, group]);

  const handleLeave = async () => {
    setLeaveError('');
    setLeaving(true);
    const result = await onLeave(group.id);
    setLeaving(false);
    if (result?.error) {
      const msg = result.error.message || String(result.error);
      setLeaveError(
        msg.includes('permission') || msg.includes('policy') || msg.includes('RLS')
          ? '권한이 없어 탈퇴할 수 없습니다. Supabase에서 group_members 삭제 정책을 확인해 주세요.'
          : `탈퇴에 실패했습니다: ${msg}`,
      );
      return;
    }
    setConfirmLeave(false);
    onClose();
  };

  const handleDelete = async () => {
    setDeleteError('');
    setDeleting(true);
    const result = await onDelete(group.id);
    setDeleting(false);
    if (result?.error) {
      const msg = result.error.message || String(result.error);
      setDeleteError(
        msg.includes('permission') || msg.includes('policy') || msg.includes('RLS')
          ? '권한이 없어 삭제할 수 없습니다. Supabase RLS 정책을 확인해 주세요.'
          : `삭제에 실패했습니다: ${msg}`,
      );
      return;
    }
    setConfirmDelete(false);
    onClose();
  };

  const handleChangeAdmin = async () => {
    if (!newAdminId) return;
    setChangingAdmin(true);
    const { error } = await onChangeAdmin(group.id, newAdminId);
    setChangingAdmin(false);
    if (!error) {
      setChangeAdminOpen(false);
      onClose();
    }
  };

  const handleChangePassword = async () => {
    if (!newPw.trim()) return;
    setChangingPw(true);
    const { error } = await onChangePassword(group.id, newPw.trim());
    setChangingPw(false);
    if (!error) {
      setChangePwOpen(false);
      setNewPw('');
      onClose();
    }
  };

  const nonAdminMembers = members.filter((m) => m.role !== 'admin');

  const roleLabel = (role) => {
    if (role === 'admin') return '관리자';
    if (role === 'readonly') return '읽기 전용';
    return '일반 멤버';
  };

  if (!group) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 3, minWidth: 320, maxWidth: 400 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Circle sx={{ color: group.color, fontSize: 16 }} />
          <Typography variant="h6" fontWeight={700}>{group.name}</Typography>
        </Box>
        {group.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {group.description}
          </Typography>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
          멤버 {!loading && `(${members.length}명)`}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense disablePadding>
            {members.map((member) => (
              <ListItem key={member.id} disablePadding sx={{ py: 0.75 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem',
                    mr: 1.5,
                    bgcolor: group.color,
                    flexShrink: 0,
                  }}
                >
                  {member.nickname?.[0]?.toUpperCase() || '?'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {member.nickname || member.email || '알 수 없음'}
                  </Typography>
                </Box>
                <Chip
                  label={roleLabel(member.role)}
                  size="small"
                  color={member.role === 'admin' ? 'primary' : 'default'}
                  variant={member.role === 'admin' ? 'filled' : 'outlined'}
                  sx={{ ml: 1, flexShrink: 0 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <Divider sx={{ mt: 1 }} />

      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        {!confirmLeave && !confirmDelete && !changeAdminOpen && !changePwOpen && (
          <>
            {group.myRole === 'admin' ? (
              <>
                {onChangeAdmin && nonAdminMembers.length > 0 && (
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<AdminPanelSettings />}
                    onClick={() => { setChangeAdminOpen(true); setNewAdminId(''); }}
                    sx={{ borderRadius: 2 }}
                  >
                    관리자 변경
                  </Button>
                )}
                {onChangePassword && (
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<Lock />}
                    onClick={() => { setChangePwOpen(true); setNewPw(''); setShowNewPw(false); }}
                    sx={{ borderRadius: 2 }}
                  >
                    비밀번호 변경
                  </Button>
                )}
                {!loading && members.length === 1 && (
                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    onClick={() => { setLeaveError(''); setConfirmLeave(true); }}
                    sx={{ borderRadius: 2 }}
                  >
                    그룹 탈퇴
                  </Button>
                )}
                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  onClick={() => setConfirmDelete(true)}
                  sx={{ borderRadius: 2 }}
                >
                  그룹 삭제
                </Button>
                {!loading && nonAdminMembers.length > 0 && (
                  <Typography
                    component='div'
                    variant='caption'
                    color='text.secondary'
                    sx={{ width: '100%', flexBasis: '100%', lineHeight: 1.4 }}
                  >
                    멤버가 있는 동안 관리자는 나갈 수 없습니다. 먼저「관리자 변경」으로 다른 멤버에게 넘긴 뒤, 일반 멤버처럼「그룹 탈퇴」를 이용해 주세요.
                  </Typography>
                )}
              </>
            ) : (
              <Button
                variant='outlined'
                color='error'
                size='small'
                onClick={() => setConfirmLeave(true)}
                sx={{ borderRadius: 2 }}
              >
                그룹 탈퇴
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button onClick={onClose} variant='outlined' sx={{ borderRadius: 2 }}>
              닫기
            </Button>
          </>
        )}

        {confirmLeave && (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {leaveError ? (
              <Alert severity='error' onClose={() => setLeaveError('')}>
                {leaveError}
              </Alert>
            ) : null}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
              <Typography variant='body2' color='error.main' sx={{ flex: 1, minWidth: 200 }}>
                정말 탈퇴하시겠습니까?
              </Typography>
              <Button
                onClick={() => { setConfirmLeave(false); setLeaveError(''); }}
                variant='outlined'
                sx={{ borderRadius: 2 }}
              >
                취소
              </Button>
              <Button
                onClick={handleLeave}
                variant='contained'
                color='error'
                disabled={leaving}
                sx={{ borderRadius: 2 }}
              >
                {leaving ? <CircularProgress size={16} color='inherit' /> : '탈퇴'}
              </Button>
            </Box>
          </Box>
        )}

        {confirmDelete && (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {deleteError ? (
              <Alert severity='error' onClose={() => setDeleteError('')}>
                {deleteError}
              </Alert>
            ) : null}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
              <Typography variant='body2' color='error.main' sx={{ flex: 1, minWidth: 200 }}>
                그룹을 삭제하면 복구할 수 없습니다.
              </Typography>
              <Button
                onClick={() => { setConfirmDelete(false); setDeleteError(''); }}
                variant='outlined'
                sx={{ borderRadius: 2 }}
              >
                취소
              </Button>
              <Button
                onClick={handleDelete}
                variant='contained'
                color='error'
                disabled={deleting}
                sx={{ borderRadius: 2 }}
              >
                {deleting ? <CircularProgress size={16} color='inherit' /> : '삭제'}
              </Button>
            </Box>
          </Box>
        )}

        {changeAdminOpen && (
          <Box sx={{ width: '100%' }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              새 관리자를 선택하면 현재 관리자 권한이 이전됩니다.
            </Typography>
            <FormControl fullWidth size='small' sx={{ mb: 1.5 }}>
              <InputLabel>새 관리자 선택</InputLabel>
              <Select
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                label='새 관리자 선택'
              >
                {nonAdminMembers.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nickname || m.email || '알 수 없음'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={() => setChangeAdminOpen(false)} variant='outlined' size='small' sx={{ borderRadius: 2 }}>
                취소
              </Button>
              <Button
                onClick={handleChangeAdmin}
                variant='contained'
                size='small'
                disabled={!newAdminId || changingAdmin}
                sx={{ borderRadius: 2 }}
              >
                {changingAdmin ? <CircularProgress size={16} color='inherit' /> : '변경'}
              </Button>
            </Box>
          </Box>
        )}

        {changePwOpen && (
          <Box sx={{ width: '100%' }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
              새 비밀번호를 입력하세요. 변경 후 가입 시 새 비밀번호가 적용됩니다.
            </Typography>
            <TextField
              fullWidth
              size='small'
              label='새 비밀번호'
              type={showNewPw ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              slotProps={{
                htmlInput: { maxLength: 30 },
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton onClick={() => setShowNewPw((v) => !v)} edge='end' size='small'>
                        {showNewPw ? <VisibilityOff fontSize='small' /> : <Visibility fontSize='small' />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 1.5 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={() => setChangePwOpen(false)} variant='outlined' size='small' sx={{ borderRadius: 2 }}>
                취소
              </Button>
              <Button
                onClick={handleChangePassword}
                variant='contained'
                size='small'
                disabled={!newPw.trim() || changingPw}
                sx={{ borderRadius: 2 }}
              >
                {changingPw ? <CircularProgress size={16} color='inherit' /> : '변경'}
              </Button>
            </Box>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default GroupInfoDialog;
