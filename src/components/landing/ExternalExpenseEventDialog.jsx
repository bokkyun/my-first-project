import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Typography, Box, Chip, Divider, Button,
} from '@mui/material';
import { Close, Delete } from '@mui/icons-material';

function formatAmount(value, suffix = '원') {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `${n.toLocaleString()}${suffix}`;
}

/**
 * @param {{ open: boolean, onClose: () => void, event: object|null, onDelete?: (expenseId: string) => Promise<void>|void }} props
 */
function ExternalExpenseEventDialog({ open, onClose, event, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const row = event?._expenseRow;
  if (!row) return null;

  const items = Array.isArray(row.items) ? row.items : [];

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    const ok = window.confirm('이 영수증(지출) 기록을 삭제할까요?');
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

export default ExternalExpenseEventDialog;
