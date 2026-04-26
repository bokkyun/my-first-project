# Open DART CORS 프록시 (Cloudflare Worker)

GitHub Pages 등 **정적 사이트**에서는 브라우저가 `opendart.fss.or.kr`에 직접 `fetch` 할 수 없을 수 있습니다. 이 Worker가 동일 API로 전달만 하고 CORS 헤더를 붙입니다.

## 배포

1. [Cloudflare](https://dash.cloudflare.com) 계정, Wrangler 설치: `npm i -g wrangler` 후 `wrangler login`
2. 이 폴더에서: `wrangler deploy`
3. 출력되는 URL (예: `https://opendart-proxy-teamsync.xxx.workers.dev`)을 복사
4. **끝 슬래시 없이** 아래에 넣습니다.
   - 로컬 `.env` / GitHub Actions Secret: `VITE_DART_OPENDART_ORIGIN`
   - 기존 `VITE_DART_CRTFC_KEY`는 그대로 (쿼리에 포함, Worker는 키를 저장하지 않음)

`npm run build` / CI 빌드 후 사이트에서 공모(DART) 메뉴를 다시 켜서 확인하세요.
