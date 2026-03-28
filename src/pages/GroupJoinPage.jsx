import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  IconButton, Alert, CircularProgress, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Chip,
} from '@mui/material';
import { ArrowBack, Search, Circle } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { supabase } from '../lib/supabase';
import Navbar from '../components/common/Navbar';

function GroupJoinPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups: myGroups, joinGroup } = useGroups(user?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [message, setMessage] = useState({ text: '', severity: 'info' });
  const [profile, setProfile] = useState(null);

  useState(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setMessage({ text: '', severity: 'info' });
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(count)')
      .ilike('name', `%${searchQuery.trim()}%`)
      .eq('is_searchable', true)
      .limit(20);
    setSearching(false);
    if (error) {
      setMessage({ text: '검색 중 오류가 발생했습니다.', severity: 'error' });
    } else {
      setSearchResults(data || []);
      if (!data?.length) setMessage({ text: '검색 결과가 없습니다.', severity: 'info' });
    }
  };

  const handleJoin = async (groupId) => {
    setJoiningId(groupId);
    const { error } = await joinGroup(groupId);
    setJoiningId(null);
    if (error) {
      setMessage({ text: '이미 가입된 그룹이거나 오류가 발생했습니다.', severity: 'error' });
    } else {
      setMessage({ text: '그룹에 가입되었습니다!', severity: 'success' });
      setSearchResults((prev) => prev.filter((g) => g.id !== groupId));
    }
  };

  const isAlreadyJoined = (groupId) => myGroups.some((g) => g.id === groupId);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Navbar profile={profile} />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          {/* 헤더 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate('/calendar')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>그룹 가입</Typography>
          </Box>

          {/* 검색 */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="그룹 이름으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={searching}
              sx={{ minWidth: 80, borderRadius: 2 }}
            >
              {searching ? <CircularProgress size={20} color="inherit" /> : <Search />}
            </Button>
          </Box>

          {message.text && (
            <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>
          )}

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <List>
              {searchResults.map((group) => {
                const joined = isAlreadyJoined(group.id);
                const memberCount = group.group_members?.[0]?.count ?? 0;
                return (
                  <ListItem
                    key={group.id}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 1, px: 2 }}
                    secondaryAction={
                      <Button
                        variant={joined ? 'outlined' : 'contained'}
                        size="small"
                        disabled={joined || joiningId === group.id}
                        onClick={() => !joined && handleJoin(group.id)}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        {joiningId === group.id
                          ? <CircularProgress size={16} color="inherit" />
                          : joined ? '가입됨' : '가입하기'
                        }
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: group.color, width: 36, height: 36 }}>
                        <Circle sx={{ fontSize: 14, color: 'white' }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>{group.name}</Typography>
                          <Chip label={`${memberCount}명`} size="small" variant="outlined" />
                        </Box>
                      }
                      secondary={group.description || '설명 없음'}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              그룹이 없으신가요?
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/groups/create')} sx={{ borderRadius: 2 }}>
              새 그룹 만들기
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default GroupJoinPage;
