import {
  Box, Container, Typography, Button, Grid, Paper, Avatar,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  CalendarMonth, Group, NotificationsActive, ShareOutlined,
  AdminPanelSettings, LocalCafe,
  ShowChart, Apartment, DirectionsTransit, ArrowForward,
} from '@mui/icons-material';
import PublicFooter from '../components/common/PublicFooter';
import AdBanner from '../components/common/AdBanner';

const FEATURES = [
  {
    icon: <ShowChart sx={{ fontSize: 40, color: '#1565c0' }} />,
    title: '공모주 공시 일정',
    desc: '로그인 후 캘린더에서 표시를 켜면 Open DART(금융위 전자공시) 기준 공시·제출 일정을 월별로 겹쳐 봅니다. VITE_DART_CRTFC_KEY가 빌드에 포함되어야 하며, 정적 배포(GitHub Pages 등)에서는 CORS 대비 프록시가 필요할 수 있습니다.',
  },
  {
    icon: <Apartment sx={{ fontSize: 40, color: '#546e7a' }} />,
    title: '아파트 분양·청약',
    desc: '로그인 후 캘린더에서 표시를 켜면 국토교통부 등 공공데이터 무순위·청약 분양 일정을 겹쳐 봅니다. VITE_DATA_GO_KR_SERVICE_KEY 등 필요한 변수가 빌드·배포 환경에 설정되어야 합니다.',
  },
  {
    icon: <Group sx={{ fontSize: 40, color: '#9c27b0' }} />,
    title: '팀·그룹 스케줄',
    desc: '팀·가족·모임별 그룹을 만들거나 초대 코드로 참여해 일정을 색깔별로 나누어 공유합니다.',
  },
  {
    icon: <CalendarMonth sx={{ fontSize: 40, color: '#1976d2' }} />,
    title: '통합 캘린더',
    desc: '월·주 단위 보기와 드래그로 빠르게 일정을 관리합니다. 내 일정·그룹 일정을 같은 화면에서 다룹니다.',
  },
  {
    icon: <AdminPanelSettings sx={{ fontSize: 40, color: '#388e3c' }} />,
    title: '그룹 관리자',
    desc: '관리자는 멤버 일정을 대신 등록·정리하여 팀 운영 부담을 줄여 줍니다.',
  },
  {
    icon: <NotificationsActive sx={{ fontSize: 40, color: '#f57c00' }} />,
    title: '브라우저 알림',
    desc: '오늘 일정 안내 알림 등으로 놓치기 쉬운 약속을 미리 챙길 수 있습니다.',
  },
  {
    icon: <ShareOutlined sx={{ fontSize: 40, color: '#0288d1' }} />,
    title: '여러 그룹 동시 보기',
    desc: '여러 모임에 소속되어 있어도 필터로 표시 그룹을 골라 볼 수 있습니다.',
  },
  {
    icon: <DirectionsTransit sx={{ fontSize: 40, color: '#512da8' }} />,
    title: '출퇴근 지하철 안내',
    desc: '설정하면 서울 지하철 노선별 다음 도착 예정 시간을 하단 바로 확인할 수 있습니다(선택).',
  },
  {
    icon: <LocalCafe sx={{ fontSize: 40, color: '#5d4037' }} />,
    title: '커피 주문 모임',
    desc: '그룹 일정을 커피 이벤트로 열면 멤버가 메뉴를 고르고 음료별 집계·명단을 웹에서 정리합니다.',
  },
];

const STEPS = [
  { step: '01', title: '가입', desc: '이메일·비밀번호로 회원 가입합니다. (지원되는 경우 SNS 로그인도 가능합니다.)' },
  { step: '02', title: '팀 스케줄 시작', desc: '새 그룹을 만들거나 초대 코드로 참여해 일정 공유 단위부터 잡습니다.' },
  { step: '03', title: '청약·외부 일정 선택', desc: '캘린더 화면에서 공모주·아파트 청약 등 참고 표시를 켜거나 끕니다.' },
  { step: '04', title: '통합 활용', desc: '투자·부동산 일정과 팀 일정을 한 타임라인에서 보고 알림까지 연결합니다.' },
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
              <Typography variant="h6" fontWeight={700} color="primary.main">MoneyCal</Typography>
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
            공모주·청약부터<br />팀 스케줄까지 한번에
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 4, opacity: 0.9, fontWeight: 400, fontSize: { xs: '1rem', md: '1.2rem' } }}
          >
            MoneyCal로 공모 공시·무순위 청약 일정을 확인하고,<br />팀·모임 일정까지 한 캘린더에서 관리하세요.
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
            <Button
              component={Link}
              to="/calendar"
              variant="outlined"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.85)',
                borderRadius: 3,
                px: 4,
                fontWeight: 700,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              캘린더 바로가기
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
            투자·청약 일정과 그룹 협업에 맞춘 MoneyCal 기능을 살펴보세요.
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

      {/* 광고 배너 1 - 주요 기능 아래 */}
      <Box sx={{ bgcolor: 'white', py: 1 }}>
        <Container maxWidth="md">
          <AdBanner
            slot={import.meta.env.VITE_AD_SLOT_HORIZONTAL}
            sx={{ my: 1 }}
          />
        </Container>
      </Box>

      {/* 사용 방법 */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 1 }}>
            이렇게 사용하세요
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
            다음 단계로 청약·팀 일정 활용을 바로 시작할 수 있습니다.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {STEPS.map((s) => (
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

      {/* 광고 배너 2 - 사용방법 아래 */}
      <Box sx={{ bgcolor: 'white', py: 1 }}>
        <Container maxWidth="md">
          <AdBanner
            slot={import.meta.env.VITE_AD_SLOT_HORIZONTAL}
            sx={{ my: 1 }}
          />
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
            무료로 가입하고 공모·청약 일정과 팀 스케줄을 함께 관리해 보세요.
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
