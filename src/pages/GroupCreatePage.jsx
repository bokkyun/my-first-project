import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  FormControlLabel, Switch, IconButton, Alert, CircularProgress,
  Tooltip,
} from '@mui/material';
import { ArrowBack, Circle } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import Navbar from '../components/common/Navbar';
import { supabase } from '../lib/supabase';

const GROUP_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#d32f2f',
  '#7b1fa2', '#0288d1', '#00796b', '#c2185b',
  '#5d4037', '#455a64', '#e65100', '#1a237e',
];

function GroupCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createGroup } = useGroups(user?.id);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#1976d2',
    isSearchable: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useState(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('그룹 이름을 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    const { error: createError } = await createGroup(form);
    setLoading(false);
    if (createError) {
      setError('그룹 생성 중 오류가 발생했습니다.');
    } else {
      navigate('/calendar');
    }
  };

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
            <Typography variant="h6" fontWeight={700}>새 그룹 만들기</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="그룹 이름"
              value={form.name}
              onChange={handleChange('name')}
              required
              inputProps={{ maxLength: 20 }}
              helperText={`${form.name.length}/20자`}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="그룹 설명 (선택)"
              value={form.description}
              onChange={handleChange('description')}
              multiline
              rows={2}
              inputProps={{ maxLength: 100 }}
              helperText={`${form.description.length}/100자`}
              sx={{ mb: 3 }}
            />

            {/* 색상 선택 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={500} gutterBottom>그룹 대표 색상</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {GROUP_COLORS.map((c) => (
                  <Tooltip key={c} title={c}>
                    <Box
                      onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                      sx={{
                        width: 36, height: 36, borderRadius: '50%', bgcolor: c,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: form.color === c ? '3px solid #333' : '2px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {form.color === c && <Circle sx={{ color: 'white', fontSize: 12 }} />}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: form.color }} />
                <Typography variant="caption" color="text.secondary">선택된 색상: {form.color}</Typography>
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.isSearchable}
                  onChange={(e) => setForm((prev) => ({ ...prev, isSearchable: e.target.checked }))}
                />
              }
              label="검색 공개 허용"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/calendar')}
                sx={{ flex: 1, borderRadius: 2 }}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !form.name.trim()}
                sx={{ flex: 1, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : '그룹 생성'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default GroupCreatePage;
