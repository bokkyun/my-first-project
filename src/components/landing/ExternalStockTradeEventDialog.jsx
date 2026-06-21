import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Typography, Box, Chip, Button,
} from '@mui/material';
import { Close, Delete } from '@mui/icons-material';

function formatAmount(value, suffix = '원') {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `${n.toLocaleString()}${suffix}`;
}

/**
 * @param {{ open: boolean, onClose: () => void, event: object|null, onDelete?: (tradeId: string) => Promise<void>|void }} props
 */
function ExternalStockTradeEventDialog({ open, onClose, event, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const row = event?._stockTradeRow;
  if (!row) return null;

  const isBuy = row.trade_type === 'buy';
  const marketLabel = row.market_type === 'domestic' ? '국내' : '해외';
  const currency = String(row.currency || 'KRW').toUpperCase();

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    const ok = window.confirm('이 체결(매매일지) 기록을 삭제할까요?');
    if (!ok) return;
    setDeleting(true);
    try {
      await onDelete(row.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6" fontWeight={700}>체결 상세</Typography>
        <IconButton onClick={onClose} aria-label="닫기" size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>체결일</Typography>
        <Typography fontWeight={600} sx={{ mb: 2 }}>{String(row.trade_date).slice(0, 10)}</Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={marketLabel} size="small" />
          <Chip label={isBuy ? '매수' : '매도'} size="small" color={isBuy ? 'primary' : 'success'} />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>종목</Typography>
        <Typography fontWeight={600} sx={{ mb: 2 }}>
          {row.stock_name || row.ticker || '-'}
          {row.ticker && row.stock_name ? ` (${row.ticker})` : ''}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>수량</Typography>
        <Typography fontWeight={600} sx={{ mb: 2 }}>{formatAmount(row.quantity, '주')}</Typography>

        {row.price != null && (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>단가</Typography>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              {formatAmount(row.price, currency === 'KRW' ? '원' : ` ${currency}`)}
            </Typography>
          </>
        )}

        {!isBuy && row.profit_krw != null && (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>실현손익</Typography>
            <Typography
              fontWeight={700}
              sx={{ mb: 2 }}
              color={Number(row.profit_krw) >= 0 ? 'success.main' : 'error.main'}
            >
              {formatAmount(row.profit_krw)}
            </Typography>
          </>
        )}
      </DialogContent>
      {onDelete && (
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            color="error"
            variant="outlined"
            startIcon={<Delete />}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '삭제 중…' : '삭제'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default ExternalStockTradeEventDialog;
