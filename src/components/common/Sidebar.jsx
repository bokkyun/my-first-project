import { useState } from 'react';
import {
  Box, Typography, Checkbox, FormControlLabel, Divider,
  List, ListItem, Chip, Tooltip, IconButton, Button, Drawer, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Circle, InfoOutlined, Settings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GroupInfoDialog from '../landing/GroupInfoDialog';
import AdBanner from './AdBanner';

const SIDEBAR_WIDTH = 220;
const DEFAULT_FILTER_SETTINGS = {
  onlyMySchedules: false,
  showAptSply: false,
  showIpo: true,
  showDartPeriodic: false,
  showFred: true,
  showBok: true,
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
 * @param {boolean} showDartPeriodic - 국내기업 분기·사업보고서·잠정실적 발표일(DART) [Optional]
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
  defaultFilters = DEFAULT_FILTER_SETTINGS,
  onDefaultFiltersSave,
  mobileOpen = false,
  onMobileClose,
  onFetchGroupMembers,
  onLeaveGroup,
  onDeleteGroup,
  onChangeAdmin,
  onChangePassword,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [infoGroup, setInfoGroup] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(defaultFilters);

  const allChecked = groups.length > 0 && visibleGroupIds.length === groups.length;
  const someChecked = visibleGroupIds.length > 0 && visibleGroupIds.length < groups.length;

  const openSettings = () => {
    setSettingsDraft({ ...DEFAULT_FILTER_SETTINGS, ...defaultFilters });
    setSettingsOpen(true);
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

  /** 상단: 내 일정만 → 아파트 청약·분양 → 공모주 */
  const topFilterCheckboxes = (
    <>
      {onOnlyMySchedulesChange && (
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <FormControlLabel
            sx={{ alignItems: 'flex-start', m: 0 }}
            control={(
              <Checkbox
                checked={onlyMySchedules}
                onChange={(e) => onOnlyMySchedulesChange(e.target.checked)}
                size="small"
                sx={{ py: 0.5 }}
              />
            )}
            label={(
              <Box>
                <Typography variant="body2" fontWeight={600}>내 일정만</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                  내가 등록한 일정만 표시
                </Typography>
              </Box>
            )}
          />
        </ListItem>
      )}
      {onShowAptSplyChange && (
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <FormControlLabel
            sx={{ alignItems: 'center', m: 0 }}
            control={(
              <Checkbox
                checked={showAptSply}
                onChange={(e) => onShowAptSplyChange(e.target.checked)}
                size="small"
                sx={{ py: 0.5 }}
              />
            )}
            label={(
              <Typography variant="body2" fontWeight={600}>아파트 청약·분양</Typography>
            )}
          />
        </ListItem>
      )}
      {onShowIpoChange && (
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <FormControlLabel
            sx={{ alignItems: 'center', m: 0 }}
            control={(
              <Checkbox
                checked={showIpo}
                onChange={(e) => onShowIpoChange(e.target.checked)}
                size="small"
                sx={{ py: 0.5 }}
              />
            )}
            label={(
              <Typography variant="body2" fontWeight={600}>공모주(공시 제출)</Typography>
            )}
          />
        </ListItem>
      )}
      {onShowDartPeriodicChange && (
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <FormControlLabel
            sx={{ alignItems: 'flex-start', m: 0 }}
            control={(
              <Checkbox
                checked={showDartPeriodic}
                onChange={(e) => onShowDartPeriodicChange(e.target.checked)}
                size="small"
                sx={{ py: 0.5 }}
              />
            )}
            label={(
              <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.35 }}>
                국내기업 분기, 사업보고서, 잠정실적 발표일
              </Typography>
            )}
          />
        </ListItem>
      )}
      {onShowFredChange && (
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <FormControlLabel
            sx={{ alignItems: 'flex-start', m: 0 }}
            control={(
              <Checkbox
                checked={showFred}
                onChange={(e) => onShowFredChange(e.target.checked)}
                size="small"
                sx={{ py: 0.5 }}
              />
            )}
            label={(
              <Box>
                <Typography variant="body2" fontWeight={600}>미국 거시지표</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                  NFP·CPI·M2 등...
                </Typography>
              </Box>
            )}
          />
        </ListItem>
      )}
      {onShowBokChange && (
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <FormControlLabel
            sx={{ alignItems: 'flex-start', m: 0 }}
            control={(
              <Checkbox
                checked={showBok}
                onChange={(e) => onShowBokChange(e.target.checked)}
                size="small"
                sx={{ py: 0.5 }}
              />
            )}
            label={(
              <Box>
                <Typography variant="body2" fontWeight={600}>한국은행 경제통계</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                  GDP·M2·가계대출 등...
                </Typography>
              </Box>
            )}
          />
        </ListItem>
      )}
    </>
  );

  const content = (
    <Box sx={{ width: SIDEBAR_WIDTH, p: 2, overflowY: 'auto', height: '100%', bgcolor: 'white' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
      <List dense disablePadding sx={{ mb: 1 }}>
        {topFilterCheckboxes}
      </List>

      <Divider sx={{ mb: 1.5 }} />

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
            py: 0.75,
            mb: 1.5,
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

      {groups.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
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
      ) : (
        <>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 0.75 }}>
            내 그룹
          </Typography>
          <List dense disablePadding sx={{ mt: 0.5 }}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={onToggleAll}
                  size="small"
                  sx={{ py: 0.5 }}
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
                    sx={{ py: 0.5, color: group.color, '&.Mui-checked': { color: group.color } }}
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
          </List>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      {/* 그룹 가입 링크 */}
      <Chip
        label="+ 그룹 가입"
        size="small"
        variant="outlined"
        onClick={() => { navigate('/groups/join'); if (onMobileClose) onMobileClose(); }}
        clickable
        sx={{ width: '100%' }}
      />

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
          <Typography variant="caption" color="text.secondary">
            저장하면 다음 방문부터 이 체크 상태로 시작합니다.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <List dense disablePadding>
            <ListItem disablePadding>
              <FormControlLabel
                control={<Checkbox checked={settingsDraft.onlyMySchedules} onChange={(e) => updateSettingsDraft('onlyMySchedules', e.target.checked)} size="small" />}
                label={<Typography variant="body2">내 일정만</Typography>}
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
                label={<Typography variant="body2">국내기업 분기, 사업보고서, 잠정실적 발표일</Typography>}
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
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={resetSettings} color="inherit" size="small">기본값</Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setSettingsOpen(false)} color="inherit" size="small">취소</Button>
          <Button onClick={saveSettings} variant="contained" size="small">저장</Button>
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
