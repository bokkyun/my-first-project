import { Box, Container, Typography, Button, Grid, Paper, Avatar } from '@mui/material';
import { Link } from 'react-router-dom';
import {
  CalendarMonth, Group, NotificationsActive, ShareOutlined,
  AdminPanelSettings, CheckCircleOutline,
} from '@mui/icons-material';
import PublicFooter from '../components/common/PublicFooter';

const FEATURES = [
  {
    icon: <CalendarMonth sx={{ fontSize: 40, color: '#1976d2' }} />,
    title: '스마트 캘린더',
    desc: '직관적인 월별·주별 캘린더로 내 일정을 한눈에 확인하고 빠르게 등록할 수 있습니다.',
  },
  {
    icon: <Group sx={{ fontSize: 40, color: '#9c27b0' }} />,
    title: '그룹 일정 공유',
    desc: '팀·가족·모임 단위로 그룹을 만들고 일정을 공유하여 함께 계획을 맞추세요.',
  },
  {
    icon: <AdminPanelSettings sx={{ fontSize: 40, color: '#388e3c' }} />,
    title: '그룹 관리자 기능',
    desc: '그룹 관리자는 멤버의 일정을 대신 등록하고 관리할 수 있어 팀 운영이 편리합니다.',
  },
  {
    icon: <NotificationsActive sx={{ fontSize: 40, color: '#f57c00' }} />,
    title: '일정 알림',
    desc: '오늘 예정된 일정을 브라우저 알림으로 제때 안내받아 중요한 약속을 놓치지 마세요.',
  },
  {
    icon: <ShareOutlined sx={{ fontSize: 40, color: '#0288d1' }} />,
    title: '다중 그룹 지원',
    desc: '여러 그룹에 동시에 소속되어 각 그룹의 일정을 색상별로 구분해 관리할 수 있습니다.',
  },
  {
    icon: <CheckCircleOutline sx={{ fontSize: 40, color: '#c2185b' }} />,
    title: '반복 일정',
    desc: '매일·매주·매월·매년 반복되는 일정을 한 번만 등록하면 자동으로 표시됩니다.',
  },
];

const STEPS = [
  { step: '01', title: '회원가입', desc: '아이디와 비밀번호로 간편하게 가입하세요.' },
  { step: '02', title: '그룹 생성 또는 가입', desc: '새 그룹을 만들거나 초대 코드로 기존 그룹에 참여하세요.' },
  { step: '03', title: '일정 등록', desc: '캘린더에서 날짜를 클릭해 내 일정 또는 그룹 일정을 등록하세요.' },
  { step: '04', title: '함께 공유', desc: '그룹원 모두가 실시간으로 일정을 확인하고 관리합니다.' },
];

function LandingPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* 헤더 */}
      <Box
        component="header"
        sx={{
          position: 'sticky', top: 0, zIndex: 100,
          bgcolor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonth sx={{ color: 'primary.main', fontSize: 30 }} />
              <Typography variant="h6" fontWeight={700} color="primary.main">TeamSync</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button component={Link} to="/login" variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                로그인
              </Button>
              <Button component={Link} to="/signup" variant="contained" size="small" sx={{ borderRadius: 2 }}>
                시작하기
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 히어로 */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2, lineHeight: 1.3 }}
          >
            팀과 함께하는<br />스마트한 일정 관리
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 4, opacity: 0.9, fontWeight: 400, fontSize: { xs: '1rem', md: '1.2rem' } }}
          >
            TeamSync로 그룹 스케줄을 공유하고<br />중요한 약속을 절대 놓치지 마세요.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white', color: 'primary.main',
                fontWeight: 700, borderRadius: 3, px: 4,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              무료로 시작하기
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              size="large"
              sx={{ color: 'white', borderColor: 'white', borderRadius: 3, px: 4, '&:hover': { borderColor: 'grey.300' } }}
            >
              로그인
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 주요 기능 */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 1 }}>
            주요 기능
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
            TeamSync가 제공하는 다양한 기능을 경험해보세요.
          </Typography>
          <Grid container spacing={3}>
            {FEATURES.map((f) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3, borderRadius: 3, height: '100%',
                    border: '1px solid', borderColor: 'grey.100',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
                  }}
                >
                  <Box sx={{ mb: 2 }}>{f.icon}</Box>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{f.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 사용 방법 */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 1 }}>
            이렇게 사용하세요
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
            4단계만으로 팀 일정 공유를 시작할 수 있습니다.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {STEPS.map((s, i) => (
              <Box key={s.step} sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main', width: 48, height: 48,
                    fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
                  }}
                >
                  {s.step}
                </Avatar>
                <Box sx={{ pt: 0.5 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{s.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            지금 바로 시작하세요
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            무료로 가입하고 팀과 함께 스마트하게 일정을 관리하세요.
          </Typography>
          <Button
            component={Link}
            to="/signup"
            variant="contained"
            size="large"
            sx={{ borderRadius: 3, px: 5, py: 1.5, fontWeight: 700 }}
          >
            무료 회원가입
          </Button>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
}

export default LandingPage;
