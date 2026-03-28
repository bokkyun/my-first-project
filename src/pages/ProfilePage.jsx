import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  IconButton, Alert, CircularProgress, Divider, Switch,
  FormControlLabel, Avatar, List, ListItem, ListItemText,
  ListItemSecondaryAction, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, Logout, ExitToApp } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { supabase } from '../lib/supabase';
import Navbar from '../components/common/Navbar';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { groups, leaveGroup } = useGroups(user?.id);

  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', severity: 'success' });
  const [leaveConfirm, setLeaveConfirm] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setNickname(data.nickname || '');
        }
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nickname: nickname.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setMsg({ text: '저장 중 오류가 발생했습니다.', severity: 'error' });
    } else {
      setMsg({ text: '프로필이 저장되었습니다!', severity: 'success' });
      setProfile((prev) => ({ ...prev, nickname: nickname.trim() }));
    }
  };

  const handleLeaveGroup = async (groupId) => {
    await leaveGroup(groupId);
    setLeaveConfirm(null);
    setMsg({ text: '그룹에서 탈퇴했습니다.', severity: 'info' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const avatarLetter = profile?.nickname?.[0]?.toUpperCase() || '?';

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Navbar profile={profile} />
      <Container maxWidth="sm" sx={{ py: 4 }}>

        {/* 프로필 수정 */}
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate('/calendar')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>프로필 설정</Typography>
          </Box>

          {msg.text && (
            <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg({ text: '', severity: 'success' })}>
              {msg.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: '2rem', mb: 1 }}>
              {avatarLetter}
            </Avatar>
            <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
          </Box>

          <TextField
            fullWidth
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            inputProps={{ maxLength: 20 }}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveProfile}
            disabled={saving || !nickname.trim()}
            sx={{ borderRadius: 2, mb: 2 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : '저장'}
          </Button>
        </Paper>

        {/* 내 그룹 목록 */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>내 그룹</Typography>
          {groups.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              속한 그룹이 없습니다.
            </Typography>
          ) : (
            <List dense disablePadding>
              {groups.map((group) => (
                <ListItem key={group.id} disablePadding sx={{ py: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: group.color, mr: 1.5, flexShrink: 0 }} />
                  <ListItemText
                    primary={group.name}
                    secondary={group.myRole === 'admin' ? '관리자' : group.myRole === 'readonly' ? '읽기 전용' : '일반 멤버'}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label="탈퇴"
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => setLeaveConfirm(group)}
                      clickable
                      disabled={group.myRole === 'admin'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* 로그아웃 */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>계정</Typography>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={handleSignOut}
            sx={{ borderRadius: 2 }}
          >
            로그아웃
          </Button>
        </Paper>
      </Container>

      {/* 그룹 탈퇴 확인 다이얼로그 */}
      <Dialog open={Boolean(leaveConfirm)} onClose={() => setLeaveConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>그룹 탈퇴</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{leaveConfirm?.name}</strong> 그룹에서 탈퇴하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setLeaveConfirm(null)} variant="outlined" sx={{ borderRadius: 2 }}>취소</Button>
          <Button
            onClick={() => handleLeaveGroup(leaveConfirm.id)}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
          >
            탈퇴
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProfilePage;
