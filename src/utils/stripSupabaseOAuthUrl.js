/**
 * PKCE 등으로 돌아온 URL의 code/state/error 쿼리를 제거합니다.
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

/**
 * URL에 code가 남아 있는데 세션이 아직 없으면 PKCE 교환 전일 수 있으므로 절대 지우지 않습니다.
 * (교환 전에 지우면 구글 로그인이 영구적으로 실패합니다.)
 */
export function stripSupabaseOAuthFromUrlWhenReady(session) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const hasCode = url.searchParams.has('code');
  const hasOAuthError = url.searchParams.has('error');

  if (hasCode && !session) return;

  if (!hasCode && !hasOAuthError) return;

  stripSupabaseOAuthFromUrl();
}
