import { useState } from 'react';
import {
  Box, Typography, Checkbox, FormControlLabel, Divider,
  List, ListItem, Chip, Tooltip, IconButton, Button, Drawer, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Circle, InfoOutlined, Settings } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import GroupInfoDialog from '../landing/GroupInfoDialog';
import AdBanner from './AdBanner';

const SIDEBAR_WIDTH = 220;
const DEFAULT_FILTER_SETTINGS = {
  onlyMySchedules: false,
  showAptSply: true,
  showIpo: true,
  showDartPeriodic: true,
  showFred: true,
  showBok: true,
  showBuySignals: true,
  signalTypeFilters: {
    MACD_GOLDEN_CROSS: true,
    MA_GOLDEN_CROSS: true,
    PRICE_ABOVE_MA20: true,
    MA_ALIGNMENT: true,
    RSI_OVERSOLD_EXIT: true,
    RSI_50_CROSS: true,
    STOCH_GOLDEN_CROSS: true,
    CCI_MINUS100_CROSS: true,
    BOLL_LOWER_BOUNCE: true,
    BOLL_SQUEEZE_BREAKOUT: true,
    BOLL_MIDLINE_RECOVERY: true,
  },
  showAllGroups: true,
};

/**
 * 좌측 사이드바 - 그룹 필터 체크박스
 * 모바일: Drawer, 데스크톱: 고정 사이드바
 *
 * Props:
 * @param {Array} groups - 내 그룹 목록 [Required]
 * @param {string[]} visibleGroupIds - 표시할 그룹 ID 배열 [Required]
 * @param {function} onToggleGroup - 그룹 토글 핸들러 (groupId: string) => void [Required]
 * @param {function} onToggleAll - 전체 토글 핸들러 () => void [Required]
 * @param {boolean} onlyMySchedules - 내가 등록한 일정만 보기 [Optional]
 * @param {function} onOnlyMySchedulesChange - (boolean) => void [Optional]
 * @param {boolean} mobileOpen - 모바일 드로어 열림 여부 [Optional]
 * @param {function} onMobileClose - 모바일 드로어 닫기 핸들러 [Optional]
 * @param {function} onFetchGroupMembers - (groupId) => Promise<{data, error}> [Required]
 * @param {function} onLeaveGroup - (groupId) => Promise<void> [Required]
 * @param {function} onDeleteGroup - (groupId) => Promise<void> [Required]
 * @param {function} onChangeAdmin - (groupId, newAdminUserId) => Promise<{data, error}> [Optional]
 * @param {function} onChangePassword - (groupId, newPassword) => Promise<{data, error}> [Optional]
 * @param {boolean} showAptSply - 아파트 청약(분양) 일정 [Optional]
 * @param {function} onShowAptSplyChange - (boolean) => void [Optional]
 * @param {boolean} showIpo - 공모주 일정 [Optional]
 * @param {function} onShowIpoChange - (boolean) => void [Optional]
 * @param {boolean} showDartPeriodic - 국내기업 실적발표일(DART) [Optional]
 * @param {function} onShowDartPeriodicChange - (boolean) => void [Optional]
 * @param {boolean} showFred - 미국 거시지표(FRED) [Optional]
 * @param {function} onShowFredChange - (boolean) => void [Optional]
 * @param {boolean} showBok - 한국은행 경제통계 일정 [Optional]
 * @param {function} onShowBokChange - (boolean) => void [Optional]
 * @param {object} defaultFilters - 처음 열 때 적용할 기본 체크 설정 [Optional]
 * @param {function} onDefaultFiltersSave - 기본 체크 설정 저장 핸들러 [Optional]
 *
 * Example usage:
 * <Sidebar groups={groups} visibleGroupIds={ids} onToggleGroup={fn} onToggleAll={fn} mobileOpen={open} onMobileClose={fn} onFetchGroupMembers={fn} onLeaveGroup={fn} onDeleteGroup={fn} onChangeAdmin={fn} onChangePassword={fn} />
 */
function Sidebar({
  groups,
  visibleGroupIds,
  onToggleGroup,
  onToggleAll,
  onlyMySchedules = false,
  onOnlyMySchedulesChange,
  showAptSply = false,
  onShowAptSplyChange,
  showIpo = true,
  onShowIpoChange,
  showDartPeriodic = false,
  onShowDartPeriodicChange,
  showFred = true,
  onShowFredChange,
  showBok = true,
  onShowBokChange,
  showBuySignals = true,
  onShowBuySignalsChange,
  signalTypeFilters = DEFAULT_FILTER_SETTINGS.signalTypeFilters,
  onSignalTypeFiltersChange,
  defaultFilters = DEFAULT_FILTER_SETTINGS,
  onDefaultFiltersSave,
  mobileOpen = false,
  onMobileClose,
  onFetchGroupMembers,
  onLeaveGroup,
  onDeleteGroup,
  onChangeAdmin,
  onChangePassword,
  isGuest = false,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [infoGroup, setInfoGroup] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(defaultFilters);
  const [signalSettingsOpen, setSignalSettingsOpen] = useState(false);
  const [signalSettingsDraft, setSignalSettingsDraft] = useState(signalTypeFilters);

  const allChecked = groups.length > 0 && visibleGroupIds.length === groups.length;
  const someChecked = visibleGroupIds.length > 0 && visibleGroupIds.length < groups.length;

  const openSettings = () => {
    setSettingsDraft({ ...DEFAULT_FILTER_SETTINGS, ...defaultFilters });
    setSettingsOpen(true);
  };

  const openSignalSettings = () => {
    setSignalSettingsDraft({
      ...DEFAULT_FILTER_SETTINGS.signalTypeFilters,
      ...signalTypeFilters,
    });
    setSignalSettingsOpen(true);
  };

  const updateSettingsDraft = (key, checked) => {
    setSettingsDraft((prev) => ({ ...prev, [key]: checked }));
  };

  const saveSettings = () => {
    if (onDefaultFiltersSave) onDefaultFiltersSave(settingsDraft);
    setSettingsOpen(false);
  };

  const resetSettings = () => {
    setSettingsDraft(DEFAULT_FILTER_SETTINGS);
  };

  /** 상단: 외부 일정 토글 — 내 일정만은 「새 그룹 생성」과 「내 그룹」·「전체」 사이 */
  const topFilterCheckboxes = (
    <>
      {onShowAptSplyChange && (
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <FormControlLabel
            sx={{ alignItems: 'center', m: 0 }}
            control={(
              <Checkbox
                checked={showAptSply}
                onChange={(e) => onShowAptSplyChange(e.target.checked)}
                size="small"
                sx={{ py: 0.25 }}
              />
            )}
            label={(
              <Typography variant="body2" fontWeight={600}>아파트 청약·분양</Typography>
            )}
          />
        </ListItem>
      )}
      {onShowIpoChange && (
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <FormControlLabel
            sx={{ alignItems: 'center', m: 0 }}
            control={(
              <Checkbox
                checked={showIpo}
                onChange={(e) => onShowIpoChange(e.target.checked)}
                size="small"
                sx={{ py: 0.25 }}
              />
            )}
            label={(
              <Typography variant="body2" fontWeight={600}>공모주(공시 제출)</Typography>
            )}
          />
        </ListItem>
      )}
      {onShowDartPeriodicChange && (
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <FormControlLabel
            sx={{ alignItems: 'center', m: 0 }}
            control={(
              <Checkbox
                checked={showDartPeriodic}
                onChange={(e) => onShowDartPeriodicChange(e.target.checked)}
                size="small"
                sx={{ py: 0.25 }}
              />
            )}
            label={(
              <Typography variant="body2" fontWeight={600}>국내기업 실적발표일</Typography>
            )}
          />
        </ListItem>
      )}
      {onShowFredChange && (
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <FormControlLabel
            sx={{ alignItems: 'flex-start', m: 0 }}
            control={(
              <Checkbox
                checked={showFred}
                onChange={(e) => onShowFredChange(e.target.checked)}
                size="small"
                sx={{ py: 0.25, alignSelf: 'flex-start', mt: 0.125 }}
              />
            )}
            label={(
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.28 }}>미국 거시지표</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.12, mt: 0.1 }}>
                  NFP·CPI·M2 등...
                </Typography>
              </Box>
            )}
          />
        </ListItem>
      )}
      {onShowBokChange && (
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <FormControlLabel
            sx={{ alignItems: 'flex-start', m: 0 }}
            control={(
              <Checkbox
                checked={showBok}
                onChange={(e) => onShowBokChange(e.target.checked)}
                size="small"
                sx={{ py: 0.25, alignSelf: 'flex-start', mt: 0.125 }}
              />
            )}
            label={(
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.28 }}>한국은행 경제통계</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.12, mt: 0.1 }}>
                  GDP·M2·가계대출 등...
                </Typography>
              </Box>
            )}
          />
        </ListItem>
      )}
      {onShowBuySignalsChange && (
        <ListItem
          disablePadding
          sx={{ mb: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <FormControlLabel
            sx={{ alignItems: 'center', m: 0, flex: 1, minWidth: 0 }}
            control={(
              <Checkbox
                checked={showBuySignals}
                onChange={(e) => onShowBuySignalsChange(e.target.checked)}
                size="small"
                sx={{ py: 0.25 }}
              />
            )}
            label={(
              <Typography variant="body2" fontWeight={600}>매수시그널종목</Typography>
            )}
          />
          <Tooltip title="매수 시그널 항목 설정">
            <span>
              <IconButton
                size="small"
                onClick={openSignalSettings}
                aria-label="매수 시그널 설정"
                sx={{ ml: 0.5 }}
              >
                <Settings sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
        </ListItem>
      )}
    </>
  );

  const content = (
    <Box sx={{ width: SIDEBAR_WIDTH, px: 2, py: 1.5, overflowY: 'auto', height: '100%', bgcolor: 'white' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
          메뉴
        </Typography>
        {onDefaultFiltersSave && (
          <Tooltip title="처음 열 때 기본 체크 설정">
            <IconButton size="small" onClick={openSettings} aria-label="메뉴 기본 체크 설정">
              <Settings sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <List dense disablePadding sx={{ mb: 0.75 }}>
        {topFilterCheckboxes}
      </List>

      <Divider sx={{ mb: 1 }} />

      {isGuest ? (
        <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, lineHeight: 1.5 }}>
            로그인하면 내 일정·팀 일정·알림·그룹 공유를 쓸 수 있어요. 비회원도 위 체크로 공모·청약·한국은행 등 참고 일정을 볼 수 있습니다.
          </Typography>
          <Button component={Link} to="/login" variant="contained" size="small" fullWidth sx={{ mb: 1, textTransform: 'none' }}>
            로그인
          </Button>
          <Button component={Link} to="/signup" variant="outlined" size="small" fullWidth sx={{ textTransform: 'none' }}>
            회원가입
          </Button>
        </Box>
      ) : (
        <>
          <Tooltip title="그룹 만들기 페이지로 이동">
            <Button
              variant="text"
              color="inherit"
              fullWidth
              endIcon={<Add aria-hidden />}
              onClick={() => { navigate('/groups/create'); if (onMobileClose) onMobileClose(); }}
              sx={{
                justifyContent: 'space-between',
                px: 1,
                py: 0.5,
                mb: 0.75,
                fontWeight: 600,
                textTransform: 'none',
                color: 'text.primary',
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              새로운 그룹 생성하기
            </Button>
          </Tooltip>

          {onOnlyMySchedulesChange && (
            <List dense disablePadding sx={{ mb: 0.75 }}>
              <ListItem disablePadding sx={{ mb: 0.25 }}>
                <FormControlLabel
                  sx={{ alignItems: 'flex-start', m: 0 }}
                  control={(
                    <Checkbox
                      checked={onlyMySchedules}
                      onChange={(e) => onOnlyMySchedulesChange(e.target.checked)}
                      size="small"
                      sx={{ py: 0.25, alignSelf: 'flex-start', mt: 0.125 }}
                    />
                  )}
                  label={(
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.28 }}>내 일정만</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.12, mt: 0.1 }}>
                        내가 등록한 일정만 표시
                      </Typography>
                    </Box>
                  )}
                />
              </ListItem>
            </List>
          )}

          <>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 0.5 }}>
              내 그룹
            </Typography>
            <List dense disablePadding sx={{ mt: 0.25 }}>
              {groups.length > 0 && (
                <>
                  <ListItem disablePadding sx={{ mb: 0.25 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked}
                          onChange={onToggleAll}
                          size="small"
                          sx={{ py: 0.25 }}
                        />
                      }
                      label={<Typography variant="body2" fontWeight={600}>전체</Typography>}
                    />
                  </ListItem>
                  {groups.map((group) => (
                    <ListItem key={group.id} disablePadding sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        sx={{ flex: 1, mr: 0, minWidth: 0 }}
                        control={
                          <Checkbox
                            checked={visibleGroupIds.includes(group.id)}
                            onChange={() => onToggleGroup(group.id)}
                            size="small"
                            sx={{ py: 0.25, color: group.color, '&.Mui-checked': { color: group.color } }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                            <Circle sx={{ fontSize: 10, color: group.color, flexShrink: 0 }} />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                              {group.name}
                            </Typography>
                          </Box>
                        }
                      />
                      <Tooltip title="멤버 보기 / 탈퇴">
                        <IconButton
                          size="small"
                          onClick={() => setInfoGroup(group)}
                          sx={{ flexShrink: 0, opacity: 0.5, '&:hover': { opacity: 1 } }}
                        >
                          <InfoOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                  ))}
                </>
              )}
            </List>
            {groups.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.disabled">
                  아직 속한 그룹이 없어요
                </Typography>
                <Box mt={1}>
                  <Chip
                    label="그룹 가입하기"
                    size="small"
                    onClick={() => { navigate('/groups/join'); if (onMobileClose) onMobileClose(); }}
                    clickable
                  />
                </Box>
              </Box>
            )}
          </>

          <Divider sx={{ my: 1.5 }} />

          <Chip
            label="+ 그룹 가입"
            size="small"
            variant="outlined"
            onClick={() => { navigate('/groups/join'); if (onMobileClose) onMobileClose(); }}
            clickable
            sx={{ width: '100%' }}
          />
        </>
      )}

      {/* 광고 배너 */}
      <AdBanner
        slot={import.meta.env.VITE_AD_SLOT_SIDEBAR}
        format="rectangle"
        sx={{ mt: 2 }}
      />
    </Box>
  );

  const dialog = (
    <>
      <GroupInfoDialog
        open={Boolean(infoGroup)}
        onClose={() => setInfoGroup(null)}
        group={infoGroup}
        onFetchMembers={onFetchGroupMembers}
        onLeave={onLeaveGroup}
        onDelete={onDeleteGroup}
        onChangeAdmin={onChangeAdmin}
        onChangePassword={onChangePassword}
      />
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700}>처음 열 때 기본 체크</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, lineHeight: 1.45 }}>
            저장하면 다음 방문부터 이 체크 상태로 시작합니다. 불필요한 항목은 체크 해제 후 저장해 두면 매번 그 상태로 열립니다.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <List dense disablePadding>
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.showBuySignals} onChange={(e) => updateSettingsDraft('showBuySignals', e.target.checked)} size="small" />}
                label={<Typography variant="body2">매수시그널종목</Typography>}
              />
            </ListItem>
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.showAptSply} onChange={(e) => updateSettingsDraft('showAptSply', e.target.checked)} size="small" />}
                label={<Typography variant="body2">아파트 청약·분양</Typography>}
              />
            </ListItem>
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.showIpo} onChange={(e) => updateSettingsDraft('showIpo', e.target.checked)} size="small" />}
                label={<Typography variant="body2">공모주(공시 제출)</Typography>}
              />
            </ListItem>
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.showDartPeriodic} onChange={(e) => updateSettingsDraft('showDartPeriodic', e.target.checked)} size="small" />}
                label={<Typography variant="body2">국내기업 실적발표일</Typography>}
              />
            </ListItem>
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.showFred} onChange={(e) => updateSettingsDraft('showFred', e.target.checked)} size="small" />}
                label={<Typography variant="body2">미국 거시지표</Typography>}
              />
            </ListItem>
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.showBok} onChange={(e) => updateSettingsDraft('showBok', e.target.checked)} size="small" />}
                label={<Typography variant="body2">한국은행 경제통계</Typography>}
              />
            </ListItem>
            <Divider sx={{ my: 1 }} />
            {!isGuest && (
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.onlyMySchedules} onChange={(e) => updateSettingsDraft('onlyMySchedules', e.target.checked)} size="small" />}
                label={<Typography variant="body2">내 일정만</Typography>}
              />
            </ListItem>
            )}
            {!isGuest && (
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.showAllGroups} onChange={(e) => updateSettingsDraft('showAllGroups', e.target.checked)} size="small" />}
                label={(
                  <Box>
                    <Typography variant="body2">내 그룹 전체</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      처음 열 때 모든 그룹 일정을 체크합니다.
                    </Typography>
                  </Box>
                )}
              />
            </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={resetSettings} color="inherit" size="small">기본값</Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setSettingsOpen(false)} color="inherit" size="small">취소</Button>
          <Button onClick={saveSettings} variant="contained" size="small">저장</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={signalSettingsOpen}
        onClose={() => setSignalSettingsOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700}>매수 시그널 설정</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>1. 추세지표</Typography>
          <List dense disablePadding sx={{ mb: 1 }}>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.MACD_GOLDEN_CROSS} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, MACD_GOLDEN_CROSS: e.target.checked }))} size="small" />} label={<Typography variant="body2">1) MACD골든크로스</Typography>} /></ListItem>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.MA_GOLDEN_CROSS} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, MA_GOLDEN_CROSS: e.target.checked }))} size="small" />} label={<Typography variant="body2">2) 단기 이평선골든크로스</Typography>} /></ListItem>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.PRICE_ABOVE_MA20} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, PRICE_ABOVE_MA20: e.target.checked }))} size="small" />} label={<Typography variant="body2">3) 주가 이평선돌파</Typography>} /></ListItem>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.MA_ALIGNMENT} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, MA_ALIGNMENT: e.target.checked }))} size="small" />} label={<Typography variant="body2">4) 정배열진입</Typography>} /></ListItem>
          </List>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>2. 모멘텀지표</Typography>
          <List dense disablePadding sx={{ mb: 1 }}>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.RSI_OVERSOLD_EXIT} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, RSI_OVERSOLD_EXIT: e.target.checked }))} size="small" />} label={<Typography variant="body2">1) RSI과매도 이탈</Typography>} /></ListItem>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.RSI_50_CROSS} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, RSI_50_CROSS: e.target.checked }))} size="small" />} label={<Typography variant="body2">2) RSI 50선 돌파</Typography>} /></ListItem>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.STOCH_GOLDEN_CROSS} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, STOCH_GOLDEN_CROSS: e.target.checked }))} size="small" />} label={<Typography variant="body2">3) 스토캐스틱 골든크로스</Typography>} /></ListItem>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.CCI_MINUS100_CROSS} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, CCI_MINUS100_CROSS: e.target.checked }))} size="small" />} label={<Typography variant="body2">4) CCI -100선 돌파</Typography>} /></ListItem>
          </List>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>3. 볼리저밴드</Typography>
          <List dense disablePadding>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.BOLL_LOWER_BOUNCE} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, BOLL_LOWER_BOUNCE: e.target.checked }))} size="small" />} label={<Typography variant="body2">1) 하단 밴드 반등</Typography>} /></ListItem>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.BOLL_SQUEEZE_BREAKOUT} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, BOLL_SQUEEZE_BREAKOUT: e.target.checked }))} size="small" />} label={<Typography variant="body2">2) 밴드폭 수축 후 돌파</Typography>} /></ListItem>
            <ListItem disablePadding><FormControlLabel control={<Checkbox checked={!!signalSettingsDraft.BOLL_MIDLINE_RECOVERY} onChange={(e) => setSignalSettingsDraft((p) => ({ ...p, BOLL_MIDLINE_RECOVERY: e.target.checked }))} size="small" />} label={<Typography variant="body2">3) 중심선 회복</Typography>} /></ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            onClick={() => setSignalSettingsDraft({ ...DEFAULT_FILTER_SETTINGS.signalTypeFilters })}
            color="inherit"
            size="small"
          >
            전체선택
          </Button>
          <Button
            onClick={() => setSignalSettingsDraft(Object.fromEntries(Object.keys(DEFAULT_FILTER_SETTINGS.signalTypeFilters).map((k) => [k, false])))}
            color="inherit"
            size="small"
          >
            전체해제
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setSignalSettingsOpen(false)} color="inherit" size="small">취소</Button>
          <Button
            onClick={() => {
              if (onSignalTypeFiltersChange) onSignalTypeFiltersChange(signalSettingsDraft);
              setSignalSettingsOpen(false);
            }}
            variant="contained"
            size="small"
          >
            적용
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}
        >
          {content}
        </Drawer>
        {dialog}
      </>
    );
  }

  return (
    <>
      <Box sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        overflowY: 'auto',
        bgcolor: 'white',
      }}>
        {content}
      </Box>
      {dialog}
    </>
  );
}

export default Sidebar;
