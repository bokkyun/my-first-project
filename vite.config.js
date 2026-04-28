import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages 프로젝트 사이트: /저장소이름/ — 로컬은 미설정 시 '/' */
function viteBase() {
  const raw = process.env.VITE_BASE;
  if (!raw || raw === '/') return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const subwayKey = (env.VITE_SEOUL_SUBWAY_API_KEY || '').replace(/^\uFEFF/, '').trim();
  const subwayTarget = (env.VITE_SEOUL_SUBWAY_ORIGIN || 'https://openapi.seoul.go.kr:8088').replace(/\/$/, '');

  /** 서울시 열린데이터 지하철: 브라우저 CORS 우회 (npm run dev 전용). 키가 있을 때만 활성화 */
  const seoulSubwayProxy = subwayKey
    ? {
        '/__seoul_subway_proxy': {
          target: subwayTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/__seoul_subway_proxy/, `/${subwayKey}/json`),
        },
      }
    : {};

  return {
    plugins: [react()],
    base: viteBase(),
    server: {
      /** 공공데이터(data.go.kr) CORS 우회: 개발 시에만 프록시 */
      proxy: {
        ...seoulSubwayProxy,
        '/__public_data_go_proxy': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/__public_data_go_proxy/, ''),
        },
        /** 오픈 API 포털 api.odcloud.kr CORS 우회(개발 전용) */
        '/__odcloud_proxy': {
          target: 'https://api.odcloud.kr',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/__odcloud_proxy/, ''),
        },
        /** 금융감독원 Open DART (list.json) CORS 우회 — 개발 전용 */
        '/__opendart_proxy': {
          target: 'https://opendart.fss.or.kr',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/__opendart_proxy/, ''),
        },
      },
    },
  };
});
