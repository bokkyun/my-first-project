import { createClient } from '@supabase/supabase-js';

function normalizeEnv(value) {
  if (value == null) return '';
  return String(value).replace(/^\uFEFF/, '').trim().replace(/\r/g, '').replace(/\n/g, '');
}

const supabaseUrl = normalizeEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = normalizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 설정되지 않았습니다. 프로젝트 루트의 .env 또는 빌드 환경(CF Pages 등)에 VITE_SUPABASE_URL 과 VITE_SUPABASE_ANON_KEY 를 지정해주세요.'
  );
}

if (supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
  throw new Error(
    'VITE_SUPABASE_* 값이 잘못되었습니다. Cloudflare Pages는 빌드 시점에 변수가 주입되어야 합니다. Settings → Environment variables를 확인해주세요.'
  );
}

try {
  const u = new URL(supabaseUrl);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('invalid protocol');
  }
} catch {
  throw new Error(
    `VITE_SUPABASE_URL이 올바른 주소가 아닙니다(공백·따옴표·줄바꿈 제거 후 https://xxx.supabase.co 형식인지 확인). 받은 값 앞 60자: ${supabaseUrl.slice(0, 60)}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
