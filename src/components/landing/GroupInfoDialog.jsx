import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, List, ListItem, Avatar, Chip,
  Button, CircularProgress, Divider,
} from '@mui/material';
import { Circle } from '@mui/icons-material';

/**
 * 그룹 정보 다이얼로그 - 멤버 목록 확인 및 그룹 탈퇴
 *
 * Props:
 * @param {boolean} open - 다이얼로그 열림 여부 [Required]
 * @param {function} onClose - 닫기 핸들러 () => void [Required]
 * @param {object|null} group - 그룹 정보 객체 { id, name, color, description, myRole } [Required]
 * @param {function} onFetchMembers - (groupId) => Promise<{data, error}> [Required]
 * @param {function} onLeave - (groupId) => Promise<void> [Required]
 *
 * Example usage:
 * <GroupInfoDialog open={open} onClose={fn} group={group} onFetchMembers={fn} onLeave={fn} />
 */
function GroupInfoDialog({ open, onClose, group, onFetchMembers, onLeave }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!open || !group) return;
    setLoading(true);
    setMembers([]);
    setConfirmLeave(false);
    onFetchMembers(group.id).then(({ data, error }) => {
      if (!error && data) setMembers(data);
      setLoading(false);
    });
  }, [open, group]);

  const handleLeave = async () => {
    setLeaving(true);
    await onLeave(group.id);
    setLeaving(false);
    setConfirmLeave(false);
    onClose();
  };

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

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {!confirmLeave ? (
          <>
            <Button
              variant='outlined'
              color='error'
              size='small'
              disabled={group.myRole === 'admin'}
              onClick={() => setConfirmLeave(true)}
              sx={{ borderRadius: 2 }}
            >
              그룹 탈퇴
            </Button>
            {group.myRole === 'admin' && (
              <Typography variant='caption' color='text.disabled' sx={{ flex: 1 }}>
                관리자는 탈퇴 불가
              </Typography>
            )}
            <Box sx={{ flex: group.myRole === 'admin' ? 0 : 1 }} />
            <Button onClick={onClose} variant='outlined' sx={{ borderRadius: 2 }}>
              닫기
            </Button>
          </>
        ) : (
          <>
            <Typography variant='body2' color='error.main' sx={{ flex: 1 }}>
              정말 탈퇴하시겠습니까?
            </Typography>
            <Button
              onClick={() => setConfirmLeave(false)}
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
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default GroupInfoDialog;
