import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages 프로젝트 사이트: /저장소이름/ — 로컬은 미설정 시 '/' */
function viteBase() {
  const raw = process.env.VITE_BASE;
  if (!raw || raw === '/') return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export default defineConfig({
  plugins: [react()],
  base: viteBase(),
  server: {
    /** 공공데이터(data.go.kr) CORS 우회: 개발 시에만 프록시 */
    proxy: {
      '/__public_data_go_proxy': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/__public_data_go_proxy/, ''),
      },
    },
  },
});
