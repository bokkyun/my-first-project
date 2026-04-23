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
});
