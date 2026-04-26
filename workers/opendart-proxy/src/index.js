/**
 * Cloudflare Worker — opendart.fss.or.kr 로만 전달 + CORS 헤더
 *
 * 배포(예: wrangler deploy) 후 URL을 VITE_DART_OPENDART_ORIGIN 으로 넣습니다.
 * (GitHub Secret 이름 동일, 값은 https://이워커URL.workers.dev 처럼 끝 슬래시 없이)
 */
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }
    const u = new URL(request.url);
    if (!u.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404, headers: corsHeaders() });
    }
    const target = `https://opendart.fss.or.kr${u.pathname}${u.search}`;
    const upstream = await fetch(target, {
      method: request.method,
      redirect: 'manual',
    });
    const h = new Headers(upstream.headers);
    applyCors(h);
    return new Response(upstream.body, { status: upstream.status, headers: h });
  },
};

function applyCors(headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
}

function corsHeaders() {
  const h = new Headers();
  applyCors(h);
  return h;
}
