import {
  Box, Typography, Checkbox, FormControlLabel, Divider,
  List, ListItem, Chip, Tooltip, IconButton,
} from '@mui/material';
import { Add, Circle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * 좌측 사이드바 - 그룹 필터 체크박스
 *
 * Props:
 * @param {Array} groups - 내 그룹 목록 [Required]
 * @param {string[]} visibleGroupIds - 표시할 그룹 ID 배열 [Required]
 * @param {function} onToggleGroup - 그룹 토글 핸들러 (groupId: string) => void [Required]
 * @param {function} onToggleAll - 전체 토글 핸들러 () => void [Required]
 *
 * Example usage:
 * <Sidebar groups={groups} visibleGroupIds={visibleGroupIds} onToggleGroup={fn} onToggleAll={fn} />
 */
function Sidebar({ groups, visibleGroupIds, onToggleGroup, onToggleAll }) {
  const navigate = useNavigate();
  const allChecked = groups.length > 0 && visibleGroupIds.length === groups.length;
  const someChecked = visibleGroupIds.length > 0 && visibleGroupIds.length < groups.length;

  return (
    <Box sx={{
      width: 220,
      flexShrink: 0,
      borderRight: '1px solid',
      borderColor: 'divider',
      p: 2,
      overflowY: 'auto',
      bgcolor: 'white',
    }}>
      {/* 내 그룹 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
          내 그룹
        </Typography>
        <Tooltip title="그룹 생성">
          <IconButton size="small" onClick={() => navigate('/groups/create')}>
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
              onClick={() => navigate('/groups/join')}
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
            <ListItem key={group.id} disablePadding>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visibleGroupIds.includes(group.id)}
                    onChange={() => onToggleGroup(group.id)}
                    size="small"
                    sx={{ py: 0.5, color: group.color, '&.Mui-checked': { color: group.color } }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Circle sx={{ fontSize: 10, color: group.color }} />
                    <Typography variant="body2" noWrap sx={{ maxWidth: 130 }}>
                      {group.name}
                    </Typography>
                  </Box>
                }
              />
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
        onClick={() => navigate('/groups/join')}
        clickable
        sx={{ width: '100%' }}
      />
    </Box>
  );
}

export default Sidebar;
