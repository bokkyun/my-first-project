/**
 * PKCE 등으로 돌아온 URL의 code/state/error 쿼리를 제거합니다.
 * Supabase가 세션을 읽은 뒤에만 호출해야 합니다.
 */
export function stripSupabaseOAuthFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const keys = ['code', 'state', 'error', 'error_code', 'error_description'];
  let touched = false;
  for (const k of keys) {
    if (url.searchParams.has(k)) {
      url.searchParams.delete(k);
      touched = true;
    }
  }
  if (!touched) return;
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, next);
}
