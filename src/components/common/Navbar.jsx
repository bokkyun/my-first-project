import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem,
  Avatar, Tooltip, Divider, ListItemIcon, Badge, useMediaQuery, useTheme,
} from '@mui/material';
import {
  CalendarMonth, GroupAdd, PersonAdd,
  Logout, Settings, Notifications, Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

/**
 * 전체 상단 네비게이션 바
 *
 * Props:
 * @param {object} profile - 현재 유저 프로필 [Optional]
 * @param {function} onMenuClick - 모바일 사이드바 토글 핸들러 [Optional]
 *
 * Example usage:
 * <Navbar profile={profile} onMenuClick={fn} />
 */
function Navbar({ profile, onMenuClick }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    navigate('/login');
  };

  const avatarLetter = profile?.nickname?.[0]?.toUpperCase() || '?';

  return (
    <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
      <Toolbar sx={{ gap: 1 }}>
        {/* 모바일 햄버거 버튼 */}
        {isMobile && onMenuClick && (
          <IconButton onClick={onMenuClick} edge="start" sx={{ mr: 0.5 }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* 로고 */}
        <CalendarMonth sx={{ color: 'primary.main', mr: 0.5 }} />
        <Typography
          variant="h6"
          fontWeight={700}
          color="primary.main"
          sx={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/calendar')}
        >
          TeamSync
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* 우측 아이콘 */}
        <Tooltip title="알림">
          <IconButton>
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="로그아웃">
          <IconButton onClick={handleSignOut} sx={{ color: 'error.main' }}>
            <Logout />
          </IconButton>
        </Tooltip>

        <Tooltip title="프로필">
          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
              {avatarLetter}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { minWidth: 180, borderRadius: 2, mt: 1 } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>{profile?.nickname}</Typography>
            <Typography variant="caption" color="text.secondary">{profile?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); navigate('/groups/create'); }}>
            <ListItemIcon><GroupAdd fontSize="small" /></ListItemIcon>
            그룹 생성
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/groups/join'); }}>
            <ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon>
            그룹 가입
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            프로필 설정
          </MenuItem>
          <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
            <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
            로그아웃
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
