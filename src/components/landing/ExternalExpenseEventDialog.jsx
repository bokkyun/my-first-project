import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Chip, Divider,
} from '@mui/material';
import { Close } from '@mui/icons-material';

function formatAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString()}원` : '-';
}

/**
 * @param {{ open: boolean, onClose: () => void, event: object|null }} props
 */
function ExternalExpenseEventDialog({ open, onClose, event }) {
  const row = event?._expenseRow;
  if (!row) return null;

  const items = Array.isArray(row.items) ? row.items : [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6" fontWeight={700}>지출 상세</Typography>
        <IconButton onClick={onClose} aria-label="닫기" size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>날짜</Typography>
        <Typography fontWeight={600} sx={{ mb: 2 }}>{String(row.date).slice(0, 10)}</Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>가맹점</Typography>
        <Typography fontWeight={600} sx={{ mb: 2 }}>{row.merchant || '-'}</Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>금액</Typography>
        <Typography fontWeight={700} color="error.main" sx={{ mb: 2 }}>
          {formatAmount(row.amount)}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {row.category && <Chip label={row.category} size="small" color="default" />}
          {row.source_type && (
            <Chip label={row.source_type} size="small" variant="outlined" />
          )}
        </Box>

        {items.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>품목</Typography>
            {items.map((item, i) => (
              <Typography key={`${item.name}-${i}`} variant="body2" sx={{ mb: 0.5 }}>
                {item.name || '품목'}
                {item.qty ? ` x${item.qty}` : ''}
                {item.price != null ? ` — ${formatAmount(item.price)}` : ''}
              </Typography>
            ))}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExternalExpenseEventDialog;
