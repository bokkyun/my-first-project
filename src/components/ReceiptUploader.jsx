import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Button, Typography, TextField, MenuItem, Alert, CircularProgress, Paper, Grid,
} from '@mui/material';
import { fileToBase64, parseReceiptImage } from '../utils/receiptParser';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['식비', '쇼핑', '교통', '의료', '문화', '기타'];

/**
 * 영수증·카드문자 이미지 업로드 → AI 파싱 → Supabase expenses 저장
 * @param {() => void} [onSaved]
 */
export default function ReceiptUploader({ onSaved }) {
  const { user } = useAuth();
  const [step, setStep] = useState('idle');
  const [preview, setPreview] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setStep('uploading');
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);
      const result = await parseReceiptImage(base64, file.type || 'image/jpeg');
      setParsed(result);
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

  const handleSave = async () => {
    if (!user?.id) {
      setError('로그인이 필요합니다.');
      return;
    }
    setStep('saving');
    setError(null);
    try {
      const { error: dbError } = await supabase.from('expenses').insert({
        user_id: user.id,
        date: parsed.date,
        amount: parsed.amount,
        merchant: parsed.merchant,
        items: parsed.items ?? [],
        category: parsed.category,
        source_type: parsed.source_type,
        raw_text: JSON.stringify(parsed),
      });
      if (dbError) throw dbError;
      setStep('done');
      onSaved?.(parsed);
    } catch (e) {
      setError(`저장 실패: ${e.message}`);
      setStep('reviewing');
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setParsed(null);
    setError(null);
    setStep('idle');
  };

  if (step === 'done') {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography gutterBottom>
          {parsed.date} / {parsed.merchant} / {Number(parsed.amount).toLocaleString()}원 저장 완료
        </Typography>
        <Button variant="outlined" onClick={reset} sx={{ mt: 2 }}>
          다른 영수증 추가
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
          <Typography>영수증·카드문자·전표 이미지를 드래그하거나 클릭해서 업로드</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            JPG, PNG, HEIC 지원
          </Typography>
        </Paper>
      )}

      {step === 'uploading' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ mb: 2 }} />
          <Typography>AI가 분석 중...</Typography>
          {preview && (
            <Box
              component="img"
              src={preview}
              alt="preview"
              sx={{ maxWidth: 200, mt: 2, borderRadius: 2 }}
            />
          )}
        </Box>
      )}

      {step === 'reviewing' && parsed && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {preview && (
              <Box
                component="img"
                src={preview}
                alt="영수증"
                sx={{ width: '100%', borderRadius: 2 }}
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>파싱 결과 확인</Typography>
            <TextField
              fullWidth
              label="날짜"
              type="date"
              value={parsed.date ?? ''}
              onChange={(e) => setParsed({ ...parsed, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="금액 (원)"
              type="number"
              value={parsed.amount ?? ''}
              onChange={(e) => setParsed({ ...parsed, amount: Number(e.target.value) })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="가맹점"
              value={parsed.merchant ?? ''}
              onChange={(e) => setParsed({ ...parsed, merchant: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="카테고리"
              value={parsed.category ?? '기타'}
              onChange={(e) => setParsed({ ...parsed, category: e.target.value })}
              sx={{ mb: 2 }}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              신뢰도:{' '}
              {parsed.confidence === 'high' ? '높음' : parsed.confidence === 'medium' ? '중간' : '낮음'}
            </Typography>
            <Button fullWidth variant="contained" onClick={handleSave}>
              저장
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
