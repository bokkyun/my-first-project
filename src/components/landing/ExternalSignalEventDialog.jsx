import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Close, TrendingUp, Speed, BarChart } from '@mui/icons-material';

const CATEGORY_CONFIG = {
  추세:   { color: '#1565c0', bg: '#e3f2fd', icon: TrendingUp, label: '추세지표' },
  모멘텀: { color: '#2e7d32', bg: '#e8f5e9', icon: Speed,     label: '모멘텀지표' },
  볼린저: { color: '#6a1b9a', bg: '#f3e5f5', icon: BarChart,  label: '볼린저밴드' },
};

const SIGNAL_DESC = {
  MACD_GOLDEN_CROSS:     'MACD선이 시그널선을 상향 돌파 — 매수 모멘텀 발생',
  MA_GOLDEN_CROSS:       '5일 이동평균이 20일선을 상향 돌파 — 단기 추세 전환',
  PRICE_ABOVE_MA20:      '주가가 20일 이동평균선 위로 올라섬 — 중기 추세 회복',
  MA_ALIGNMENT:          '단기·중기·장기 이동평균 정배열 성립 — 강한 상승 추세',
  RSI_OVERSOLD_EXIT:     'RSI가 과매도 구간(30 이하)에서 회복 — 반등 신호',
  RSI_50_CROSS:          'RSI가 중립선(50)을 상향 돌파 — 상승 추세 진입',
  STOCH_GOLDEN_CROSS:    '스토캐스틱 %K선이 %D선 상향 돌파 — 매수 신호',
  CCI_MINUS100_CROSS:    'CCI가 -100선 상향 돌파 — 과매도 탈출 반등',
  BOLL_LOWER_BOUNCE:     '볼린저 하단 밴드에서 주가 반등 — 지지선 확인',
  BOLL_SQUEEZE_BREAKOUT: '밴드 수축 후 상단 돌파 — 강한 추세 시작 예고',
  BOLL_MIDLINE_RECOVERY: '볼린저 중심선(20일 MA) 회복 — 추세 정상화',
};

function formatDate(startsAt) {
  if (!startsAt) return '-';
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return startsAt;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

/**
 * 외부 시그널(추세/모멘텀/볼린저) 읽기 전용 상세 다이얼로그
 */
function ExternalSignalEventDialog({ open, onClose, event }) {
  const row = event?._signalRow;
  if (!row) return null;

  const mergedRows = Array.isArray(event?._signalMergedRows) && event._signalMergedRows.length > 0
    ? event._signalMergedRows
    : [row];

  const cfg = CATEGORY_CONFIG[row.signal_category] || {
    color: '#455a64', bg: '#eceff1', icon: BarChart, label: '시그널',
  };
  const CategoryIcon = cfg.icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* 컬러 헤더 */}
      <Box sx={{ bgcolor: cfg.color, px: 2.5, pt: 2.5, pb: 2, position: 'relative' }}>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="닫기"
          sx={{ position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}
        >
          <Close fontSize="small" />
        </IconButton>

        {/* 카테고리 뱃지 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', p: 0.5, display: 'flex' }}>
            <CategoryIcon sx={{ color: '#fff', fontSize: 16 }} />
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: 0.5 }}>
            {cfg.label}
          </Typography>
        </Box>

        {/* 종목명 */}
        <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2, mb: 0.5, pr: 3 }}>
          {row.name || row.code}
        </Typography>

        {/* 신호명 — 병합 시 여러 줄 */}
        {mergedRows.length > 1 ? (
          <Box component="ul" sx={{ m: 0, pl: 2.25, color: 'rgba(255,255,255,0.9)' }}>
            {mergedRows.map((r) => (
              <Typography
                key={r.signal_type || `${r.code}-${r.signal_name}`}
                component="li"
                variant="body2"
                sx={{ fontWeight: 500, mb: 0.35, display: 'list-item' }}
              >
                {r.signal_name || r.signal_type}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            {row.signal_name || row.signal_type}
          </Typography>
        )}
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {mergedRows.map((r, idx) => {
          const descOne = SIGNAL_DESC[r.signal_type] || '';
          if (!descOne) return null;
          return (
            <Box
              key={r.signal_type || String(idx)}
              sx={{
                px: 2.5,
                py: 2,
                bgcolor: cfg.bg,
                ...(idx > 0 ? { borderTop: '1px solid', borderColor: 'divider' } : {}),
              }}
            >
              {mergedRows.length > 1 && (
                <Typography variant="caption" display="block" sx={{ color: cfg.color, fontWeight: 700, mb: 0.75 }}>
                  {r.signal_name || r.signal_type}
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: cfg.color, fontWeight: 500, lineHeight: 1.6 }}>
                {descOne}
              </Typography>
            </Box>
          );
        })}

        <Divider />

        {/* 종목 정보 */}
        <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <InfoRow label="종목코드" value={row.code || '-'} />
          <InfoRow label="시장" value={
            <Chip
              label={row.market || '시장미상'}
              size="small"
              sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600,
                bgcolor: row.market === 'KOSPI' ? '#e3f2fd' : '#f3e5f5',
                color: row.market === 'KOSPI' ? '#1565c0' : '#6a1b9a' }}
            />
          } />
          <InfoRow label="발생일" value={formatDate(event?.starts_at)} />
        </Box>

        <Divider />

        {/* 면책 안내 */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.5 }}>
            자동 스캐너가 감지한 기술적 지표 신호입니다. 투자 판단의 참고 자료로만 활용하세요.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right' }}>
          {value}
        </Typography>
      ) : value}
    </Box>
  );
}

export default ExternalSignalEventDialog;
