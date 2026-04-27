import { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, Typography,
  IconButton, Paper, Chip, CircularProgress, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  isSeoulSubwayConfigured,
  getWeekdayType,
  timeStrToMinutes,
  getCurrentMinutes,
  searchStationByName,
  fetchNextTrainTime,
} from '../../utils/seoulSubwayOpenApi';

const STORAGE_KEY = 'subway_routes';

const EMPTY_ROUTE = {
  id: '',
  label: '출근',
  departureStation: '',
  departureFrCode: '',
  transferStation: '',
  transferFrCode: '',
  direction: '1',
  activeHourStart: 7,
  activeHourEnd: 10,
};

function formatMinutesLeft(arriveMin, nowMin) {
  const diff = arriveMin - nowMin;
  if (diff < 0) return null;
  if (diff === 0) return '지금';
  if (diff < 60) return `${diff}분 후`;
  return `${Math.floor(diff / 60)}시간 ${diff % 60}분 후`;
}

function SettingsModal({ routes, onSave, onClose }) {
  const [editRoutes, setEditRoutes] = useState(
    routes.length ? routes : [{ ...EMPTY_ROUTE, id: `${Date.now()}` }],
  );
  const [searchResults, setSearchResults] = useState({});
  const [searchQuery, setSearchQuery] = useState({});

  const updateRoute = (id, field, value) => {
    setEditRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSearch = async (id, query, field) => {
    setSearchQuery((prev) => ({ ...prev, [`${id}_${field}`]: query }));
    if (query.length < 1) return;
    const results = await searchStationByName(query);
    setSearchResults((prev) => ({ ...prev, [`${id}_${field}`]: results }));
  };

  const selectStation = (id, field, frCodeField, station) => {
    updateRoute(id, field, station.STATION_NM);
    updateRoute(id, frCodeField, station.FR_CODE);
    setSearchResults((prev) => ({ ...prev, [`${id}_${field}`]: [] }));
    setSearchQuery((prev) => ({ ...prev, [`${id}_${field}`]: '' }));
  };

  const addRoute = () => {
    setEditRoutes((prev) => [...prev, { ...EMPTY_ROUTE, id: `${Date.now()}` }]);
  };

  const removeRoute = (id) => {
    setEditRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose} PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6" fontWeight={700}>지하철 노선 등록</Typography>
        <IconButton onClick={onClose} size="small" aria-label="닫기"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh' }}>
        {editRoutes.map((route) => (
          <Paper key={route.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>구분</InputLabel>
                <Select
                  label="구분"
                  value={route.label}
                  onChange={(e) => updateRoute(route.id, 'label', e.target.value)}
                >
                  <MenuItem value="출근">출근</MenuItem>
                  <MenuItem value="퇴근">퇴근</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
              </FormControl>
              <Button size="small" color="error" onClick={() => removeRoute(route.id)}>삭제</Button>
            </Box>

            {[
              { label: '출발역', field: 'departureStation', frField: 'departureFrCode' },
              { label: '환승역 (선택)', field: 'transferStation', frField: 'transferFrCode' },
            ].map(({ label, field, frField }) => (
              <Box key={field} sx={{ mb: 1.5, position: 'relative' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>{label}</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="역 이름 검색"
                    value={route[field] || searchQuery[`${route.id}_${field}`] || ''}
                    onChange={(e) => {
                      updateRoute(route.id, field, e.target.value);
                      updateRoute(route.id, frField, '');
                      handleSearch(route.id, e.target.value, field);
                    }}
                  />
                  {route[frField] ? (
                    <Chip label="선택됨" size="small" color="success" variant="outlined" />
                  ) : null}
                </Box>
                {searchResults[`${route.id}_${field}`]?.length > 0 && (
                  <Paper
                    variant="outlined"
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      mt: 0.5,
                      maxHeight: 160,
                      overflow: 'auto',
                    }}
                  >
                    {searchResults[`${route.id}_${field}`].map((s, i) => (
                      <Box
                        key={`${s.FR_CODE}-${i}`}
                        onClick={() => selectStation(route.id, field, frField, s)}
                        sx={{
                          px: 1.5,
                          py: 1,
                          cursor: 'pointer',
                          fontSize: 13,
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {s.STATION_NM} ({s.LINE_NUM}) — {s.FR_CODE}
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>방향</InputLabel>
                <Select
                  label="방향"
                  value={route.direction}
                  onChange={(e) => updateRoute(route.id, 'direction', e.target.value)}
                >
                  <MenuItem value="1">상행</MenuItem>
                  <MenuItem value="2">하행</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="number"
                label="표시 시작(시)"
                inputProps={{ min: 0, max: 23 }}
                value={route.activeHourStart}
                onChange={(e) => updateRoute(route.id, 'activeHourStart', parseInt(e.target.value, 10) || 0)}
                sx={{ width: 120 }}
              />
              <TextField
                size="small"
                type="number"
                label="표시 종료(시)"
                inputProps={{ min: 0, max: 23 }}
                value={route.activeHourEnd}
                onChange={(e) => updateRoute(route.id, 'activeHourEnd', parseInt(e.target.value, 10) || 0)}
                sx={{ width: 120 }}
              />
            </Box>
          </Paper>
        ))}

        <Button fullWidth variant="outlined" onClick={addRoute} sx={{ borderStyle: 'dashed', py: 1 }}>
          + 노선 추가
        </Button>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={() => onSave(editRoutes)}>저장</Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * 캘린더 하단 고정: 서울시 지하철 도착 예정(시간표 API)
 * `.env` 에 VITE_SEOUL_SUBWAY_API_KEY 필요
 */
export default function SubwayScheduleBar() {
  const theme = useTheme();
  const [routes, setRoutes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [nextTrains, setNextTrains] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  const configured = isSeoulSubwayConfigured();

  const loadTrains = useCallback(async () => {
    const hour = new Date().getHours();
    const active = routes.filter(
      (r) => r.departureFrCode && hour >= r.activeHourStart && hour < r.activeHourEnd,
    );
    if (!active.length || !configured) {
      setNextTrains({});
      return;
    }
    setLoading(true);
    const weekdayType = getWeekdayType();
    const results = {};
    await Promise.all(
      active.map(async (route) => {
        const time = await fetchNextTrainTime(route.departureFrCode, route.direction, weekdayType);
        results[route.id] = time;
      }),
    );
    setNextTrains(results);
    setLoading(false);
  }, [routes, configured]);

  useEffect(() => {
    loadTrains();
    const interval = setInterval(loadTrains, 60_000);
    return () => clearInterval(interval);
  }, [loadTrains]);

  const handleSave = (newRoutes) => {
    setRoutes(newRoutes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoutes));
    setShowSettings(false);
  };

  if (!configured) {
    return null;
  }

  const currentHour = new Date().getHours();
  const activeRoutes = routes.filter(
    (r) => r.departureFrCode && currentHour >= r.activeHourStart && currentHour < r.activeHourEnd,
  );
  const nowMin = getCurrentMinutes();

  const barSx = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: theme.zIndex.appBar - 1,
    borderTop: 1,
    borderColor: 'divider',
    bgcolor: 'background.paper',
    px: 2,
    py: 0.75,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    flexWrap: 'wrap',
    minHeight: 48,
  };

  if (!routes.length) {
    return (
      <>
        <Box sx={barSx}>
          <Typography variant="body2" color="text.secondary">지하철 출퇴근 시간표를 등록해 보세요</Typography>
          <Button size="small" variant="contained" onClick={() => setShowSettings(true)}>노선 등록</Button>
        </Box>
        {showSettings && (
          <SettingsModal routes={routes} onSave={handleSave} onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <Box sx={barSx}>
        <Typography component="span" sx={{ fontSize: 18 }} aria-hidden>🚇</Typography>
        {activeRoutes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            현재 시간대에 표시할 노선이 없습니다
          </Typography>
        ) : (
          activeRoutes.map((route) => {
            const time = nextTrains[route.id];
            const minutesLeft = time ? formatMinutesLeft(timeStrToMinutes(time), nowMin) : null;
            const urgent = time && timeStrToMinutes(time) - nowMin <= 5;
            return (
              <Chip
                key={route.id}
                size="small"
                sx={{
                  height: 'auto',
                  py: 0.5,
                  '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'left' },
                }}
                label={(
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.25 }}>
                    <Typography variant="caption" fontWeight={700}>{route.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {route.departureStation}
                      {route.transferStation ? ` → ${route.transferStation}` : ''}
                    </Typography>
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CircularProgress size={12} />
                        <Typography variant="caption">로딩…</Typography>
                      </Box>
                    ) : time ? (
                      <Typography variant="caption" fontWeight={600} color={urgent ? 'error' : 'primary'}>
                        {time}
                        {minutesLeft ? ` (${minutesLeft})` : ''}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled">막차 지남</Typography>
                    )}
                  </Box>
                )}
              />
            );
          })
        )}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <IconButton size="small" onClick={loadTrains} aria-label="새로고침" title="새로고침">
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button size="small" variant="outlined" onClick={() => setShowSettings(true)}>설정</Button>
        </Box>
      </Box>
      {showSettings && (
        <SettingsModal routes={routes} onSave={handleSave} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
