import { Box, Typography } from '@mui/material';

const EMPTY_PROFIT = { domestic: 0, overseas: 0 };

function formatSignedAmount(value) {
  const n = Number(value) || 0;
  if (n === 0) return null;
  return `${n > 0 ? '+' : ''}${n.toLocaleString()}`;
}

function profitColor(value, theme) {
  const n = Number(value) || 0;
  if (n > 0) return theme.palette.success.main;
  if (n < 0) return theme.palette.error.main;
  return theme.palette.text.secondary;
}

/**
 * 캘린더 날짜 셀 — 일자 + 국내/해외 실현손익
 * @param {string} dayNumber
 * @param {{ domestic: number, overseas: number }} [stockProfit]
 * @param {boolean} [isToday]
 */
export default function DayCellProfit({
  dayNumber,
  stockProfit = EMPTY_PROFIT,
  isToday = false,
}) {
  const domestic = Number(stockProfit.domestic) || 0;
  const overseas = Number(stockProfit.overseas) || 0;
  const total = domestic + overseas;

  return (
    <Box sx={{ lineHeight: 1.15, minWidth: 0 }}>
      <Typography
        component="span"
        variant="body2"
        sx={{
          fontWeight: isToday ? 700 : 500,
          color: isToday ? 'primary.main' : 'text.primary',
        }}
      >
        {dayNumber}
      </Typography>
      {total !== 0 && (
        <Box sx={{ mt: 0.25, minWidth: 0 }}>
          {domestic !== 0 && (
            <Typography
              variant="caption"
              sx={(theme) => ({
                display: 'block',
                fontSize: '0.62rem',
                fontWeight: 600,
                color: profitColor(domestic, theme),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              })}
            >
              국 {formatSignedAmount(domestic)}
            </Typography>
          )}
          {overseas !== 0 && (
            <Typography
              variant="caption"
              sx={(theme) => ({
                display: 'block',
                fontSize: '0.62rem',
                fontWeight: 600,
                color: profitColor(overseas, theme),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              })}
            >
              해 {formatSignedAmount(overseas)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export { EMPTY_PROFIT };
