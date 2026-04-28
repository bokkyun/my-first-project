import {
  Box, Container, Typography, Paper, Grid,
  Divider, Chip, Link as MuiLink,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  CalendarMonth, EmailOutlined, BuildOutlined,
  LightbulbOutlined, PeopleOutlined, SecurityOutlined,
} from '@mui/icons-material';
import PublicFooter from '../components/common/PublicFooter';

const VALUES = [
  {
    icon: <PeopleOutlined sx={{ fontSize: 36, color: '#1976d2' }} />,
    title: '투자 일정과 팀 일정',
    desc: '공모 공시 등 참고 목적 표시와 팀·모임 단위 공유 일정을 한 타임라인에서 다루도록 설계했습니다.',
  },
  {
    icon: <LightbulbOutlined sx={{ fontSize: 36, color: '#f57c00' }} />,
    title: '직관적인 경험',
    desc: '복잡한 기능보다 누구나 쉽게 사용할 수 있는 직관적인 UI/UX를 최우선으로 생각합니다.',
  },
  {
    icon: <SecurityOutlined sx={{ fontSize: 36, color: '#388e3c' }} />,
    title: '안전한 데이터',
    desc: '회원의 일정 데이터와 개인정보는 암호화되어 안전하게 보호됩니다.',
  },
];

const TECH_STACK = [
  'React', 'Vite', 'MUI (Material UI)', 'Supabase',
  'React Router', 'FullCalendar',
];

function AboutPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>

      {/* 헤더 */}
      <Box sx={{ bgcolor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', py: 1.5 }}>
        <Container maxWidth="lg">
          <Box
            component={Link}
            to="/"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
          >
            <CalendarMonth sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} color="primary.main">MoneyCal</Typography>
          </Box>
        </Container>
      </Box>

      {/* 히어로 */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
          color: 'white',
          py: { xs: 6, md: 9 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={800} sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            서비스 소개
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, fontSize: { xs: '1rem', md: '1.1rem' } }}>
            MoneyCal은 공모 공시 등 공모주 일정 참고 표시와<br />
            무순위·청약 분양 일정 참고 표시를 캘린더에 제공하고, 동시에 팀 스케줄까지 묶어 보여 주는 무료 웹 서비스입니다.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>

        {/* 서비스 소개 */}
        <Paper
          elevation={0}
          sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'grey.100' }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>MoneyCal이란?</Typography>
          <Typography variant="body1" color="text.secondary" lineHeight={2}>
            MoneyCal은 같은 캘린더 안에서 금융·부동산 공개 정보에 기반한 <strong>공모주 관련 안내 공시</strong> 및
            <strong> 무순위·청약 분양</strong> 일정을 선택하여 함께 볼 수 있게 하며, 따로 작성한
            내 일정·<strong>팀·그룹 단위 공유 일정</strong>(가족, 모임, 업무 모임 등)과도 겹쳐 확인할 수 있는 웹 서비스입니다.
            선택한 기능은 사용자가 켜고 끌 수 있습니다.
            <br /><br />
            그룹을 만들거나 초대 코드로 참여하면 멤버가 등록한 일정을 색으로 구분해 볼 수 있고,
            그룹 관리자는 멤버 일정을 대신 입력하거나 관리하여 팀 운영을 돕습니다. 브라우저 알림으로
            당일 일정 안내를 받을 수 있으며, (선택) 출퇴근 노선에 맞춰 지하철 도착 예정 정보를 확인할 수도 있습니다.
            <br /><br />
            모임 장소가 카페인 일정이라면 <strong>커피 주문 모임</strong> 형태로 만들어 참가자가 메뉴를 고르고
            집계·명단을 웹 한곳에서 볼 수 있습니다.
          </Typography>
        </Paper>

        {/* 핵심 가치 */}
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>핵심 가치</Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {VALUES.map((v) => (
            <Grid key={v.title} size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3, borderRadius: 3, height: '100%',
                  border: '1px solid', borderColor: 'grey.100',
                }}
              >
                <Box sx={{ mb: 1.5 }}>{v.icon}</Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{v.title}</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{v.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* 기술 스택 */}
        <Paper
          elevation={0}
          sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'grey.100' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <BuildOutlined sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700}>기술 스택</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            MoneyCal은 최신 웹 기술을 기반으로 빠르고 안정적인 화면을 제공합니다.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {TECH_STACK.map((tech) => (
              <Chip key={tech} label={tech} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        </Paper>

        {/* 문의하기 */}
        <Paper
          elevation={0}
          sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'grey.100' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <EmailOutlined sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700}>문의하기</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
            서비스 이용 중 불편한 점, 개선 제안, 개인정보 관련 문의 등 어떤 내용이든 편하게 연락주세요.
            최대한 빠르게 답변 드리겠습니다.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EmailOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">이메일</Typography>
                <Box>
                  <MuiLink href="mailto:bchoi4284@gmail.com" underline="hover" sx={{ fontSize: '0.9rem' }}>
                    bchoi4284@gmail.com
                  </MuiLink>
                </Box>
              </Box>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            * 개인정보 관련 문의는{' '}
            <MuiLink component={Link} to="/privacy" underline="hover">개인정보처리방침</MuiLink>을 먼저 확인해주세요.
          </Typography>
        </Paper>
      </Container>

      <PublicFooter />
    </Box>
  );
}

export default AboutPage;
