import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Divider, Button,
} from '@mui/material';
import { Close, OpenInNew } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

function todayLocalYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 네이버 통합검색 — `query`로 열면 검색창·결과에 동일 검색어가 반영됩니다. */
function naverSearchUrl(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const u = new URL('https://search.naver.com/search.naver');
  u.searchParams.set('where', 'nexearch');
  u.searchParams.set('sm', 'top_hty');
  u.searchParams.set('ie', 'utf8');
  u.searchParams.set('query', q);
  return u.toString();
}

/**
 * FRED·ISM·한국은행 외부 거시 일정 읽기 전용 상세
 */
function ExternalFredEventDialog({ open, onClose, event }) {
  const row = event?._fredRow;
  const isBok = event?._external === 'bok';

  const [ecosSnap, setEcosSnap] = useState(null);
  const [ecosErr, setEcosErr] = useState(null);
  const [ecosLoading, setEcosLoading] = useState(false);

  useEffect(() => {
    if (!open || !isBok || !row?.category_code || !row?.release_date) {
      setEcosSnap(null);
      setEcosErr(null);
      setEcosLoading(false);
      return;
    }
    if (row.release_date > todayLocalYmd()) {
      setEcosSnap(null);
      setEcosErr(null);
      setEcosLoading(false);
      return;
    }

    let cancelled = false;
    setEcosLoading(true);
    setEcosErr(null);

    void supabase.functions
      .invoke('fetch-bok-ecos-latest', {
        body: { category_code: row.category_code, release_date: row.release_date },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setEcosSnap(null);
          setEcosErr(error.message || String(error));
          return;
        }
        if (data && typeof data === 'object' && data.ok) {
          setEcosSnap(data);
          setEcosErr(null);
        } else if (data && typeof data === 'object' && data.error === 'missing_bok_ecos_key') {
          setEcosSnap(null);
          setEcosErr(
            '수치 자동 조회를 쓰려면 Supabase Secrets에 BOK_ECOS_API_KEY(한국은행 Open API 인증키)를 등록해야 합니다.',
          );
        } else {
          setEcosSnap(null);
          setEcosErr(
            (data && typeof data === 'object' && data.error)
              ? String(data.error)
              : 'ECOS에서 값을 가져오지 못했습니다. 아래 통계표 링크에서 확인해 주세요.',
          );
        }
      })
      .catch((e) => {
        if (!cancelled) setEcosErr(e?.message || String(e));
      })
      .finally(() => {
        if (!cancelled) setEcosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isBok, row?.category_code, row?.release_date]);

  if (!row) return null;

  const formatRange = () => {
    if (!event.starts_at) return '';
    if (event.is_all_day) {
      return new Date(event.starts_at).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    }
    return new Date(event.starts_at).toLocaleString('ko-KR');
  };

  const isFredSource = !isBok && !row.source_url;
  const seriesUrl = isFredSource && row.series_id
    ? `https://fred.stlouisfed.org/series/${encodeURIComponent(row.series_id)}`
    : null;
  const releaseUrl = isFredSource && row.release_id
    ? `https://fred.stlouisfed.org/release?rid=${encodeURIComponent(row.release_id)}`
    : null;
  const legacySourceUrl = row.source_url || seriesUrl;
  const hasActualValue = row.actual_value != null && String(row.actual_value).trim() !== '';
  const isReleased = hasActualValue || row.status === 'released';

  const calendarUrl = row.calendar_url || (isBok ? row.source_url : null);
  const indicatorUrl = row.indicator_url || (row.ecos_stat_code
    ? `https://ecos.bok.or.kr/#/SearchStat/${encodeURIComponent(row.ecos_stat_code)}`
    : null);
  const extraMaterialUrl = isBok && row.source_url && calendarUrl && row.source_url !== calendarUrl
    ? row.source_url
    : null;

  const bokNaverSearchUrl = isBok && row.title
    ? naverSearchUrl(`한국은행 ${String(row.title).replace(/\s+/g, ' ').trim()}`)
    : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ pr: 1 }}>
            {row.title}
            {row.regionFlag ? ` ${row.regionFlag}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: { xs: '80vh', sm: 520 }, overflow: 'auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{formatRange()}</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>지표·발표</Typography>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{isFredSource ? 'FRED series_id' : '자료 출처'}</Typography>
            <Typography variant="body2">{isFredSource ? (row.series_id || '—') : (row.source_name || row.series_id || '—')}</Typography>
          </Box>
          {isBok && row.ecos_stat_code && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ECOS 통계표코드</Typography>
              <Typography variant="body2">{row.ecos_stat_code}</Typography>
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>예정·발표일 (릴리스 기준)</Typography>
            <Typography variant="body2">{row.release_date || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>상태</Typography>
            <Typography variant="body2">
              {isFredSource
                ? (hasActualValue ? '발표 후 FRED 값 반영됨' : '발표 전/대기')
                : (isReleased ? '발표 후 공식 자료 확인 가능' : '발표 전/대기')}
            </Typography>
          </Box>
          {row.observation_date && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>관측치 기준일</Typography>
              <Typography variant="body2">{row.observation_date}</Typography>
            </Box>
          )}
          {hasActualValue && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>값 (FRED)</Typography>
              <Typography variant="body2" fontWeight={600}>{row.actual_value}</Typography>
            </Box>
          )}
          {row.previous_value != null && String(row.previous_value).trim() !== '' && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>이전 관측 (동기화 시점)</Typography>
              <Typography variant="body2">{row.previous_value}</Typography>
            </Box>
          )}
          {isBok && ecosLoading && (
            <Typography variant="body2" color="text.secondary">ECOS에서 최근 수치를 불러오는 중…</Typography>
          )}
          {isBok && !ecosLoading && ecosSnap?.data_value != null && String(ecosSnap.data_value).trim() !== '' && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ECOS 조회 시계열 (해당 구간 최종 시점)</Typography>
              <Typography variant="body2" fontWeight={600}>
                {ecosSnap.data_value}
                {ecosSnap.unit_name ? ` ${ecosSnap.unit_name}` : ''}
              </Typography>
              {ecosSnap.time && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                  시점: {ecosSnap.time}{ecosSnap.item_hint ? ` · ${ecosSnap.item_hint}` : ''}
                </Typography>
              )}
            </Box>
          )}
          {isBok && !ecosLoading && ecosErr && row.release_date <= todayLocalYmd() && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', lineHeight: 1.5 }}>
              {ecosErr}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, lineHeight: 1.5 }}>
          {isFredSource
            ? '발표 전에는 릴리스 일정만 표시하고, 발표 후에는 FRED 시계열에서 최신 관측치를 채웁니다. 공식 수치·개정은 아래 FRED 자료 URL에서 확인하세요.'
            : isBok
              ? 'ECOS 링크는 통계표 화면으로만 이동하는 경우가 많습니다. 최신 보도자료·표는 「네이버 검색」으로 바로 찾거나, 아래 ECOS·공표 일정·보도 링크를 함께 이용하세요.'
              : '발표 일정은 공식 공표일정을 기준으로 표시합니다. 실제 수치·개정은 아래 공식 자료에서 확인하세요.'}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {isBok && bokNaverSearchUrl && (
            <Button
              component="a"
              href={bokNaverSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNew />}
              variant="contained"
              color="primary"
              size="small"
            >
              네이버 검색 (자료 찾기)
            </Button>
          )}
          {isBok && indicatorUrl && (
            <Button
              component="a"
              href={indicatorUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNew />}
              variant="outlined"
              color="primary"
              size="small"
            >
              {row.indicator_label || 'ECOS 통계표·시계열'}
            </Button>
          )}
          {isBok && calendarUrl && (
            <Button
              component="a"
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNew />}
              variant="outlined"
              size="small"
            >
              공표 일정표
            </Button>
          )}
          {isBok && extraMaterialUrl && (
            <Button
              component="a"
              href={extraMaterialUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNew />}
              variant="outlined"
              size="small"
            >
              {row.source_label || '보도·첨부 자료'}
            </Button>
          )}
          {!isBok && legacySourceUrl && (
            <Button
              component="a"
              href={legacySourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNew />}
              variant="outlined"
              size="small"
            >
              {row.source_label || 'FRED 시리즈 자료'}
            </Button>
          )}
          {!isBok && releaseUrl && (
            <Button
              component="a"
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNew />}
              variant="outlined"
              size="small"
            >
              FRED 발표 캘린더
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default ExternalFredEventDialog;
