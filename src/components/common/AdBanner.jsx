import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

/**
 * Google AdSense 광고 배너 컴포넌트
 *
 * Props:
 * @param {string} slot - 애드센스 광고 슬롯 ID [Required]
 * @param {string} format - 광고 형식 [Optional, 기본값: 'auto']
 * @param {object} sx - MUI sx 스타일 [Optional]
 *
 * 슬롯 ID는 Cloudflare Pages 환경변수로 관리:
 *   VITE_AD_SLOT_HORIZONTAL  - 가로형 배너 (랜딩페이지)
 *   VITE_AD_SLOT_SIDEBAR     - 사이드바 배너 (캘린더)
 *
 * Example usage:
 * <AdBanner slot={import.meta.env.VITE_AD_SLOT_HORIZONTAL} />
 */
function AdBanner({ slot, format = 'auto', sx = {} }) {
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      // 광고 로드 실패 시 무시
    }
  }, [slot]);

  /** 슬롯 ID가 없으면 렌더링하지 않음 */
  if (!slot) return null;

  return (
    <Box sx={{ textAlign: 'center', overflow: 'hidden', ...sx }}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-3300541490593571"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </Box>
  );
}

export default AdBanner;
