import { Box, Container, Typography, Link as MuiLink, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { CalendarMonth } from '@mui/icons-material';

/**
 * 공개 페이지 공통 푸터
 */
function PublicFooter() {
  return (
    <Box
      component="footer"
      sx={{ bgcolor: '#1a1a2e', color: 'grey.400', mt: 'auto', pt: 5, pb: 4 }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            gap: 4,
            mb: 4,
          }}
        >
          {/* 브랜드 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarMonth sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700} color="white">
                TeamSync
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ maxWidth: 260, lineHeight: 1.8 }}>
              팀과 함께하는 스마트한 일정 관리.<br />
              그룹 스케줄을 한눈에 공유하세요.
            </Typography>
          </Box>

          {/* 링크 */}
          <Box sx={{ display: 'flex', gap: { xs: 4, md: 8 } }}>
            <Box>
              <Typography variant="subtitle2" color="white" fontWeight={700} sx={{ mb: 1.5 }}>
                서비스
              </Typography>
              {[
                { label: '서비스 소개', to: '/about' },
                { label: '로그인', to: '/login' },
                { label: '회원가입', to: '/signup' },
              ].map((item) => (
                <Box key={item.to} sx={{ mb: 0.8 }}>
                  <MuiLink
                    component={Link}
                    to={item.to}
                    underline="hover"
                    sx={{ color: 'grey.400', fontSize: '0.875rem' }}
                  >
                    {item.label}
                  </MuiLink>
                </Box>
              ))}
            </Box>

            <Box>
              <Typography variant="subtitle2" color="white" fontWeight={700} sx={{ mb: 1.5 }}>
                정책
              </Typography>
              {[
                { label: '개인정보처리방침', to: '/privacy' },
                { label: '이용약관', to: '/terms' },
              ].map((item) => (
                <Box key={item.to} sx={{ mb: 0.8 }}>
                  <MuiLink
                    component={Link}
                    to={item.to}
                    underline="hover"
                    sx={{ color: 'grey.400', fontSize: '0.875rem' }}
                  >
                    {item.label}
                  </MuiLink>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'grey.800', mb: 3 }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
          }}
        >
          <Typography variant="caption">
            © {new Date().getFullYear()} TeamSync. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <MuiLink
              component={Link}
              to="/privacy"
              underline="hover"
              sx={{ color: 'grey.500', fontSize: '0.75rem' }}
            >
              개인정보처리방침
            </MuiLink>
            <MuiLink
              component={Link}
              to="/terms"
              underline="hover"
              sx={{ color: 'grey.500', fontSize: '0.75rem' }}
            >
              이용약관
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default PublicFooter;
