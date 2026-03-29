import { useState } from 'react';
import {
  Box, Typography, Checkbox, FormControlLabel, Divider,
  List, ListItem, Chip, Tooltip, IconButton, Drawer, useMediaQuery, useTheme,
} from '@mui/material';
import { Add, Circle, InfoOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GroupInfoDialog from '../landing/GroupInfoDialog';

const SIDEBAR_WIDTH = 220;

/**
 * 좌측 사이드바 - 그룹 필터 체크박스
 * 모바일: Drawer, 데스크톱: 고정 사이드바
 *
 * Props:
 * @param {Array} groups - 내 그룹 목록 [Required]
 * @param {string[]} visibleGroupIds - 표시할 그룹 ID 배열 [Required]
 * @param {function} onToggleGroup - 그룹 토글 핸들러 (groupId: string) => void [Required]
 * @param {function} onToggleAll - 전체 토글 핸들러 () => void [Required]
 * @param {boolean} mobileOpen - 모바일 드로어 열림 여부 [Optional]
 * @param {function} onMobileClose - 모바일 드로어 닫기 핸들러 [Optional]
 * @param {function} onFetchGroupMembers - (groupId) => Promise<{data, error}> [Required]
 * @param {function} onLeaveGroup - (groupId) => Promise<void> [Required]
 *
 * Example usage:
 * <Sidebar groups={groups} visibleGroupIds={ids} onToggleGroup={fn} onToggleAll={fn} mobileOpen={open} onMobileClose={fn} onFetchGroupMembers={fn} onLeaveGroup={fn} />
 */
function Sidebar({ groups, visibleGroupIds, onToggleGroup, onToggleAll, mobileOpen = false, onMobileClose, onFetchGroupMembers, onLeaveGroup }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [infoGroup, setInfoGroup] = useState(null);

  const allChecked = groups.length > 0 && visibleGroupIds.length === groups.length;
  const someChecked = visibleGroupIds.length > 0 && visibleGroupIds.length < groups.length;

  const content = (
    <Box sx={{ width: SIDEBAR_WIDTH, p: 2, overflowY: 'auto', height: '100%', bgcolor: 'white' }}>
      {/* 내 그룹 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
          내 그룹
        </Typography>
        <Tooltip title="그룹 생성">
          <IconButton size="small" onClick={() => { navigate('/groups/create'); if (onMobileClose) onMobileClose(); }}>
            <Add fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

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
        <List dense disablePadding>
          {/* 전체 체크박스 */}
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
          <Divider sx={{ mb: 0.5 }} />
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
    </Box>
  );

  const dialog = (
    <GroupInfoDialog
      open={Boolean(infoGroup)}
      onClose={() => setInfoGroup(null)}
      group={infoGroup}
      onFetchMembers={onFetchGroupMembers}
      onLeave={onLeaveGroup}
    />
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
