import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Button, Typography, TextField, MenuItem, Alert, CircularProgress, Paper, Grid,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
} from '@mui/material';
import { fileToBase64 } from '../utils/receiptParser';
import { parseStockTradeImage, calcProfit } from '../utils/stockParser';
import { normalizeParsedTrade, saveStockTrades } from '../utils/stockTradeSave';
import { useAuth } from '../hooks/useAuth';

const TRADE_TYPES = [
  { value: 'buy', label: '매수' },
  { value: 'sell', label: '매도' },
];
const MARKET_TYPES = [
  { value: 'domestic', label: '국내' },
  { value: 'overseas', label: '해외' },
];

function previewProfit(sell, allTrades) {
  const norm = normalizeParsedTrade(sell);
  if (norm.trade_type !== 'sell') return null;
  const buy = allTrades
    .map(normalizeParsedTrade)
    .find((t) => t.trade_type === 'buy' && t.market_type === norm.market_type
      && ((norm.ticker && t.ticker === norm.ticker) || (norm.stock_name && t.stock_name === norm.stock_name)));
  if (!buy) return null;
  return calcProfit(norm, buy);
}

/**
 * HTS/MTS 체결 캡처 → AI 파싱 → stock_trades 저장
 * @param {(result: { saved: object[], dates: string[] }) => void} [onSaved]
 */
export default function StockUploader({ onSaved }) {
  const { user } = useAuth();
  const [step, setStep] = useState('idle');
  const [preview, setPreview] = useState(null);
  const [trades, setTrades] = useState([]);
  const [modelName, setModelName] = useState('');
  const [error, setError] = useState(null);
  const [saveSummary, setSaveSummary] = useState(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setStep('uploading');
    setError(null);
    setSaveSummary(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);
      const { trades: parsed, _model } = await parseStockTradeImage(base64, file.type || 'image/jpeg');
      if (!parsed.length) throw new Error('체결 내역을 찾지 못했습니다.');
      setTrades(parsed);
      setModelName(_model || '');
      setStep('reviewing');
    } catch (e) {
      setError(`분석 실패: ${e.message}`);
      setStep('idle');
    }
  }, [preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const updateTrade = (index, field, value) => {
    setTrades((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const profitHints = useMemo(
    () => trades.map((t) => previewProfit(t, trades)),
    [trades],
  );

  const handleSave = async () => {
    if (!user?.id) {
      setError('로그인이 필요합니다.');
      return;
    }
    setStep('saving');
    setError(null);
    try {
      const rawText = JSON.stringify({ trades, model: modelName });
      const { saved, dates } = await saveStockTrades(user.id, trades, rawText);
      const profitRows = saved.filter((r) => r.trade_type === 'sell' && r.profit_krw != null);
      setSaveSummary({ count: saved.length, profitRows: profitRows.length, dates });
      setStep('done');
      onSaved?.({ saved, dates });
    } catch (e) {
      setError(`저장 실패: ${e.message}`);
      setStep('reviewing');
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setTrades([]);
    setModelName('');
    setSaveSummary(null);
    setError(null);
    setStep('idle');
  };

  if (step === 'done' && saveSummary) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography gutterBottom>
          {saveSummary.count}건 저장 완료
          {saveSummary.profitRows > 0 && ` (실현손익 ${saveSummary.profitRows}건)`}
        </Typography>
        <Button variant="outlined" onClick={reset} sx={{ mt: 2 }}>
          다른 체결 추가
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {step === 'idle' && (
        <Paper
          {...getRootProps()}
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            borderStyle: 'dashed',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          }}
        >
          <input {...getInputProps()} />
          <Typography>HTS·MTS·체결 문자 캡처를 드래그하거나 클릭해서 업로드</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            JPG, PNG, HEIC 지원
          </Typography>
        </Paper>
      )}

      {step === 'uploading' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ mb: 2 }} />
          <Typography>AI가 체결 내역 분석 중...</Typography>
          {preview && (
            <Box component="img" src={preview} alt="preview" sx={{ maxWidth: 200, mt: 2, borderRadius: 2 }} />
          )}
        </Box>
      )}

      {step === 'reviewing' && trades.length > 0 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            {preview && (
              <Box component="img" src={preview} alt="체결" sx={{ width: '100%', borderRadius: 2 }} />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">체결 {trades.length}건 확인</Typography>
              {modelName && <Chip label={modelName} size="small" variant="outlined" />}
            </Box>
            <Box sx={{ overflowX: 'auto', mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>날짜</TableCell>
                    <TableCell>구분</TableCell>
                    <TableCell>시장</TableCell>
                    <TableCell>종목</TableCell>
                    <TableCell align="right">수량</TableCell>
                    <TableCell align="right">가격</TableCell>
                    <TableCell align="right">손익(예상)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map((row, i) => (
                    <TableRow key={`trade-${i}`}>
                      <TableCell sx={{ minWidth: 120 }}>
                        <TextField
                          size="small"
                          type="date"
                          value={String(row.trade_date || '').slice(0, 10)}
                          onChange={(e) => updateTrade(i, 'trade_date', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 72 }}>
                        <TextField
                          select
                          size="small"
                          value={row.trade_type === 'sell' ? 'sell' : 'buy'}
                          onChange={(e) => updateTrade(i, 'trade_type', e.target.value)}
                        >
                          {TRADE_TYPES.map((o) => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell sx={{ minWidth: 72 }}>
                        <TextField
                          select
                          size="small"
                          value={String(row.market_type || '').includes('overseas') ? 'overseas' : 'domestic'}
                          onChange={(e) => updateTrade(i, 'market_type', e.target.value)}
                        >
                          {MARKET_TYPES.map((o) => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <TextField
                          size="small"
                          placeholder="종목명"
                          value={row.stock_name || ''}
                          onChange={(e) => updateTrade(i, 'stock_name', e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 64 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={row.quantity ?? ''}
                          onChange={(e) => updateTrade(i, 'quantity', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 80 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={row.price ?? ''}
                          onChange={(e) => updateTrade(i, 'price', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {profitHints[i] != null ? (
                          <Typography
                            variant="caption"
                            color={profitHints[i] >= 0 ? 'success.main' : 'error.main'}
                            fontWeight={600}
                          >
                            {profitHints[i] >= 0 ? '+' : ''}{Number(profitHints[i]).toLocaleString()}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              매도 손익은 같은 이미지의 매수 또는 DB에 저장된 최근 매수와 매칭해 계산합니다.
            </Typography>
            <Button fullWidth variant="contained" onClick={handleSave}>
              {trades.length}건 저장
            </Button>
          </Grid>
        </Grid>
      )}

      {step === 'saving' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={28} />
          <Typography sx={{ mt: 2 }}>저장 중...</Typography>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
