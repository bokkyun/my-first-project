import { Box, Typography } from '@mui/material';

const AI_GRADIENT = 'linear-gradient(135deg, #7c4dff 0%, #00bcd4 55%, #00e676 100%)';

/**
 * moneycalAI 브랜드 타이틀 — "AI"만 강조 색(그라데이션)
 *
 * @param {string} variant - MUI Typography variant [Optional]
 * @param {number|string} fontSize - 직접 크기 지정 [Optional]
 */
function MoneyCalAiTitle({ variant = 'h5', fontSize, component = 'div', sx, ...rest }) {
  return (
    <Typography
      variant={variant}
      component={component}
      fontWeight={800}
      letterSpacing="-0.02em"
      sx={{
        lineHeight: 1.15,
        ...(fontSize != null ? { fontSize } : {}),
        ...sx,
      }}
      {...rest}
    >
      <Box component="span" sx={{ color: 'text.primary' }}>
        moneycal
      </Box>
      <Box
        component="span"
        sx={{
          background: AI_GRADIENT,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 900,
        }}
      >
        AI
      </Box>
    </Typography>
  );
}

export default MoneyCalAiTitle;
export { AI_GRADIENT };
