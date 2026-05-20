import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem,
  Avatar, Tooltip, Divider, ListItemIcon, Badge, useMediaQuery, useTheme,
  Button, CircularProgress,
} from '@mui/material';
import {
  CalendarMonth, GroupAdd, PersonAdd,
  Logout, Settings, Notifications, Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getAuthDisplayName, getDisplayEmail, getAvatarLetter } from '../../utils/profileDisplay';

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
  const { user, signOut, loading, signInWithGoogle } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const goHome = () => navigate('/');

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    navigate('/');
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) navigate('/login');
  };

  const displayName = profile?.nickname || getAuthDisplayName(user);
  const displayEmail = getDisplayEmail(profile, user);
  const avatarLetter = getAvatarLetter(profile, user);

  if (loading) {
    return (
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && onMenuClick && (
            <IconButton onClick={onMenuClick} edge="start" sx={{ mr: 0.5 }} disabled>
              <MenuIcon />
            </IconButton>
          )}
          <CalendarMonth sx={{ color: 'primary.main', mr: 0.5 }} />
          <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexShrink: 0 }}>
            MoneyCal
          </Typography>
          <Box sx={{ flex: 1 }} />
          <CircularProgress size={22} sx={{ color: 'primary.main' }} />
        </Toolbar>
      </AppBar>
    );
  }

  if (!user) {
    return (
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          {isMobile && onMenuClick && (
            <IconButton onClick={onMenuClick} edge="start" sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <CalendarMonth sx={{ color: 'primary.main', mr: 0.5 }} />
          <Typography
            variant="h6"
            fontWeight={700}
            color="primary.main"
            sx={{ cursor: 'pointer', flexShrink: 0 }}
            onClick={goHome}
          >
            MoneyCal
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Button component={Link} to="/intro" color="inherit" size="small" sx={{ fontWeight: 600, textTransform: 'none' }}>
            소개
          </Button>
          <Button component={Link} to="/consult" color="inherit" size="small" sx={{ fontWeight: 600, textTransform: 'none' }}>
            상담
          </Button>
          <Button component={Link} to="/login" variant="outlined" size="small" sx={{ borderRadius: 2 }}>
            로그인
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            sx={{
              borderRadius: 2,
              borderColor: '#dadce0',
              color: 'text.primary',
              textTransform: 'none',
              '&:hover': { borderColor: '#bbb', bgcolor: '#f8f8f8' },
            }}
            startIcon={
              googleLoading ? <CircularProgress size={16} /> : (
                <Box
                  component="img"
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt=""
                  sx={{ width: 16, height: 16 }}
                />
              )
            }
          >
            google로 로그인하기
          </Button>
          <Button component={Link} to="/signup" variant="contained" size="small" sx={{ borderRadius: 2 }}>
            회원가입
          </Button>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
      <Toolbar sx={{ gap: 1 }}>
        {isMobile && onMenuClick && (
          <IconButton onClick={onMenuClick} edge="start" sx={{ mr: 0.5 }}>
            <MenuIcon />
          </IconButton>
        )}

        <CalendarMonth sx={{ color: 'primary.main', mr: 0.5 }} />
        <Typography
          variant="h6"
          fontWeight={700}
          color="primary.main"
          sx={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={goHome}
        >
          MoneyCal
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Button
          component={Link}
          to="/consult"
          size="small"
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            color: 'text.primary',
            display: 'inline-flex',
          }}
        >
          상담
        </Button>

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
            <Typography variant="subtitle2" fontWeight={600}>{displayName || '프로필'}</Typography>
            <Typography variant="caption" color="text.secondary">{displayEmail}</Typography>
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
