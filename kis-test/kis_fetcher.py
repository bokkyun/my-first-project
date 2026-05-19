"""
KIS (한국투자증권) API — 국내주식 일별 OHLCV 조회 모듈

사용 전 .env 에 다음 항목 추가 필요:
  KIS_APP_KEY=<발급받은 앱키>
  KIS_APP_SECRET=<발급받은 앱시크릿>

KIS 개발자 포털: https://apiportal.koreainvestment.com
"""

import json
import time
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import requests

KIS_BASE_URL = "https://openapi.koreainvestment.com:9443"
_TOKEN_CACHE = Path(__file__).parent / ".kis_token_cache.json"


# ──────────────────────────────────────────────
# 토큰 관리
# ──────────────────────────────────────────────

def _load_cached_token() -> str | None:
    if not _TOKEN_CACHE.exists():
        return None
    try:
        cache = json.loads(_TOKEN_CACHE.read_text(encoding="utf-8"))
        expires_at = datetime.fromisoformat(cache["expires_at"])
        if datetime.now() < expires_at - timedelta(minutes=10):
            return cache["access_token"]
    except Exception:
        pass
    return None


def _save_token(token: str, expires_in_sec: int) -> None:
    expires_at = datetime.now() + timedelta(seconds=expires_in_sec)
    _TOKEN_CACHE.write_text(
        json.dumps({"access_token": token, "expires_at": expires_at.isoformat()}),
        encoding="utf-8",
    )


def get_access_token(app_key: str, app_secret: str) -> str:
    """KIS OAuth 토큰 발급 (24시간 파일 캐시)."""
    cached = _load_cached_token()
    if cached:
        return cached

    resp = requests.post(
        f"{KIS_BASE_URL}/oauth2/tokenP",
        headers={"content-type": "application/json"},
        json={
            "grant_type": "client_credentials",
            "appkey": app_key,
            "appsecret": app_secret,
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    token = data["access_token"]
    expires_in = int(data.get("expires_in", 86400))
    _save_token(token, expires_in)
    print(f"[KIS] 신규 토큰 발급 완료 (유효: {expires_in // 3600}시간)")
    return token


# ──────────────────────────────────────────────
# 일별 OHLCV 조회
# ──────────────────────────────────────────────

def fetch_ohlcv(
    code: str,
    start_date: str,
    end_date: str,
    app_key: str,
    app_secret: str,
    adj_price: bool = True,
) -> pd.DataFrame:
    """
    KIS API 일봉차트조회 (FHKST03010100) — 일별 OHLCV 반환.

    Args:
        code:       6자리 종목코드 (예: "003490")
        start_date: "YYYY-MM-DD" 형식 시작일
        end_date:   "YYYY-MM-DD" 형식 종료일
        adj_price:  True = 수정주가 기준 (기본값)

    Returns:
        DatetimeIndex, columns=[Open, High, Low, Close, Volume], 오름차순
    """
    token = get_access_token(app_key, app_secret)

    start_yyyymmdd = start_date.replace("-", "")
    end_yyyymmdd   = end_date.replace("-", "")

    headers = {
        "content-type": "application/json",
        "authorization": f"Bearer {token}",
        "appkey": app_key,
        "appsecret": app_secret,
        "tr_id": "FHKST03010100",
    }

    all_rows: list[dict] = []
    cur_end = end_yyyymmdd

    while True:
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": code,
            "FID_INPUT_DATE_1": start_yyyymmdd,
            "FID_INPUT_DATE_2": cur_end,
            "FID_PERIOD_DIV_CODE": "D",
            "FID_ORG_ADJ_PRC": "0" if adj_price else "1",
        }

        resp = requests.get(
            f"{KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
            headers=headers,
            params=params,
            timeout=15,
        )
        resp.raise_for_status()
        body = resp.json()

        if body.get("rt_cd") != "0":
            raise RuntimeError(f"KIS API 오류 [{code}]: {body.get('msg1', '알 수 없는 오류')}")

        rows = body.get("output2", [])
        if not rows:
            break

        for r in rows:
            date_str = r.get("stck_bsop_date", "")
            if not date_str or date_str < start_yyyymmdd:
                continue
            all_rows.append({
                "Date":   date_str,
                "Open":   int(r.get("stck_oprc", 0) or 0),
                "High":   int(r.get("stck_hgpr", 0) or 0),
                "Low":    int(r.get("stck_lwpr", 0) or 0),
                "Close":  int(r.get("stck_clpr", 0) or 0),
                "Volume": int(r.get("acml_vol", 0) or 0),
            })

        # 100건 미만이면 마지막 페이지
        if len(rows) < 100:
            break

        oldest = min(r["stck_bsop_date"] for r in rows if r.get("stck_bsop_date"))
        next_end_dt = datetime.strptime(oldest, "%Y%m%d") - timedelta(days=1)
        if next_end_dt.strftime("%Y%m%d") < start_yyyymmdd:
            break
        cur_end = next_end_dt.strftime("%Y%m%d")
        time.sleep(0.05)

    if not all_rows:
        return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume"])

    df = pd.DataFrame(all_rows)
    df["Date"] = pd.to_datetime(df["Date"], format="%Y%m%d")
    df = df.set_index("Date").sort_index()
    df = df[~df.index.duplicated(keep="last")]
    return df
