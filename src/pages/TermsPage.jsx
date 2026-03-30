import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { CalendarMonth } from '@mui/icons-material';
import PublicFooter from '../components/common/PublicFooter';

const SECTIONS = [
  {
    title: '제1조 (목적)',
    content: `이 약관은 TeamSync(이하 "서비스")가 제공하는 공유 스케줄 관리 서비스의 이용과 관련하여 서비스와 이용자의 권리, 의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: '제2조 (정의)',
    content: `① "서비스"란 TeamSync가 운영하는 공유 스케줄 관리 웹 서비스를 의미합니다.
② "이용자"란 이 약관에 따라 서비스가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
③ "회원"이란 서비스에 개인정보를 제공하여 회원 등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
④ "그룹"이란 회원이 생성하거나 가입한 일정 공유 단위로, 그룹 내에서 일정을 공유할 수 있습니다.
⑤ "콘텐츠"란 회원이 서비스에 등록한 일정, 메모, 그룹 정보 등의 모든 데이터를 말합니다.`,
  },
  {
    title: '제3조 (약관의 게시와 개정)',
    content: `① 서비스는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 내 또는 연결 화면을 통하여 게시합니다.
② 서비스는 약관의 규제에 관한 법률, 전자거래기본법, 전자서명법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
③ 서비스가 약관을 개정할 경우에는 적용일자 및 개정 사유를 명시하여 현행 약관과 함께 서비스 초기 화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
④ 이 약관에서 정하지 아니한 사항과 이 약관의 해석에 관하여는 관련 법령 또는 관례에 따릅니다.`,
  },
  {
    title: '제4조 (회원 가입)',
    content: `① 이용자는 서비스가 정한 가입 양식에 따라 회원 정보를 기입한 후 이 약관에 동의한다는 의사 표시를 함으로써 회원 가입을 신청합니다.
② 서비스는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중에서 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
  1. 가입 신청자가 이 약관에 의하여 이전에 회원 자격을 상실한 적이 있는 경우
  2. 등록 내용에 허위, 기재 누락, 오기가 있는 경우
  3. 기타 회원으로 등록하는 것이 서비스 운영에 현저히 지장이 있다고 판단되는 경우
③ 회원 가입 계약의 성립 시기는 서비스의 승낙이 회원에게 도달한 시점으로 합니다.`,
  },
  {
    title: '제5조 (서비스의 제공 및 변경)',
    content: `① 서비스는 다음과 같은 업무를 수행합니다.
  1. 개인 일정 등록, 수정, 삭제 및 조회
  2. 그룹 생성, 가입, 관리
  3. 그룹 내 일정 공유
  4. 일정 알림 서비스
  5. 기타 서비스가 정하는 업무

② 서비스는 서비스의 내용을 변경할 수 있으며, 이 경우에는 변경된 서비스의 내용 및 제공일자를 공지합니다.
③ 서비스는 무료로 제공되며, 서비스의 변경·중단에 따른 별도의 보상은 없습니다.`,
  },
  {
    title: '제6조 (회원의 의무)',
    content: `① 이용자는 다음 행위를 하여서는 안 됩니다.
  1. 신청 또는 변경 시 허위 내용의 등록
  2. 타인의 정보 도용
  3. 서비스에 게시된 정보의 변경
  4. 서비스가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시
  5. 서비스 기타 제3자의 저작권 등 지식재산권에 대한 침해
  6. 서비스 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위
  7. 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위
  8. 기타 불법적이거나 부당한 행위`,
  },
  {
    title: '제7조 (콘텐츠 관련 책임)',
    content: `① 회원이 서비스에 등록한 콘텐츠에 대한 모든 권리와 책임은 이를 게시한 회원에게 있습니다.
② 서비스는 회원이 등록한 콘텐츠가 다음 각 호에 해당한다고 판단되는 경우 사전 통지 없이 삭제할 수 있습니다.
  1. 다른 회원 또는 제3자를 비방하거나 명예를 손상시키는 내용
  2. 공서양속에 위반되는 내용의 정보, 문장, 도형 등의 유포
  3. 범죄적 행위에 결부된다고 인정되는 내용
  4. 서비스의 저작권, 제3자의 저작권 등 기타 권리를 침해하는 내용
  5. 기타 관계 법령에 위배된다고 판단되는 경우`,
  },
  {
    title: '제8조 (개인정보 보호)',
    content: `서비스는 이용자의 개인정보 수집 시 서비스 제공을 위한 최소한의 개인정보를 수집합니다. 서비스는 회원가입 시 구매 계약 이행에 필요한 정보를 미리 수집하지 않습니다. 제공된 개인정보는 당해 이용자의 동의 없이 목적 외로 이용되거나 제3자에게 제공될 수 없으며, 이에 대한 모든 책임은 서비스가 집니다. 자세한 내용은 개인정보처리방침을 참고해주세요.`,
  },
  {
    title: '제9조 (서비스의 중단)',
    content: `① 서비스는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
② 서비스는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상하지 아니합니다. 단, 서비스에 고의 또는 중대한 과실이 있는 경우에는 그러하지 아니합니다.`,
  },
  {
    title: '제10조 (준거법 및 재판관할)',
    content: `① 서비스와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.
② 서비스와 이용자 간에 제기된 전자상거래 소송에는 한국법을 적용합니다.

부칙
이 약관은 2026년 3월 30일부터 시행됩니다.`,
  },
];

function TermsPage() {
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
            <Typography variant="h6" fontWeight={700} color="primary.main">TeamSync</Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 }, flex: 1 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: '1px solid', borderColor: 'grey.100' }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>이용약관</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            시행일: 2026년 3월 30일
          </Typography>

          {SECTIONS.map((s, i) => (
            <Box key={i}>
              {i > 0 && <Divider sx={{ my: 4 }} />}
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: 'primary.main' }}>
                {s.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 2, whiteSpace: 'pre-line' }}
              >
                {s.content}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Container>

      <PublicFooter />
    </Box>
  );
}

export default TermsPage;
