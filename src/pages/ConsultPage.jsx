import { useState } from 'react';
import {
  Box, Paper, TextField, IconButton, Typography, Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Navbar from '../components/common/Navbar';
import PublicFooter from '../components/common/PublicFooter';
import MoneyCalAiTitle, { AI_GRADIENT } from '../components/common/MoneyCalAiTitle';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';

/**
 * AI 상담 화면 (UI 골격 — 응답 API 연동 전)
 */
function ConsultPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.id);
  const [input, setInput] = useState('');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Navbar profile={profile} />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 720,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: 2.5,
            py: 2,
            mb: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(145deg, #ffffff 0%, #f3f6ff 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: AI_GRADIENT,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <AutoAwesomeIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <MoneyCalAiTitle variant="h5" fontSize={{ xs: '1.35rem', sm: '1.5rem' }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                투자·청약·일정에 대해 질문해 보세요.
              </Typography>
            </Box>
            <Chip
              label="베타"
              size="small"
              sx={{
                fontWeight: 700,
                background: AI_GRADIENT,
                color: '#fff',
                border: 'none',
              }}
            />
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 320,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              flex: 1,
              p: 2.5,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.7 }}>
              <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle', mr: 0.5 }}>
                <MoneyCalAiTitle variant="h6" fontSize="1rem" />
              </Box>
              가 곧 답변을 도와드립니다.
              <br />
              아래에 궁금한 내용을 입력해 주세요.
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              size="small"
              placeholder="예: 이번 주 공모주 일정이 뭐가 있나요?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
            <IconButton
              color="primary"
              disabled={!input.trim()}
              aria-label="메시지 보내기"
              sx={{
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Box>

      <PublicFooter />
    </Box>
  );
}

export default ConsultPage;
