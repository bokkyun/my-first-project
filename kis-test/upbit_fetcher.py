"""
업비트 공개 시세 API — 일봉 OHLCV 조회

시세(Quotation) API는 API 키 없이 사용 가능합니다.
.env 의 UPBIT_ACCESS_KEY 는 주문·잔고 등 Exchange API용(선택).
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta

import pandas as pd
import requests

UPBIT_QUOTATION = "https://api.upbit.com/v1"

# API 실패 시 사용할 최소 목록
DEFAULT_CRYPTO_TARGETS = [
    {"code": "KRW-BTC", "name": "비트코인", "market": "CRYPTO_BTC"},
    {"code": "KRW-ETH", "name": "이더리움", "market": "CRYPTO_ETH"},
    {"code": "KRW-XRP", "name": "리플", "market": "CRYPTO_XRP"},
    {"code": "KRW-SOL", "name": "솔라나", "market": "CRYPTO_SOL"},
    {"code": "KRW-DOGE", "name": "도지코인", "market": "CRYPTO_DOGE"},
]


def fetch_crypto_scan_targets(top_n: int = 30) -> list[dict]:
    """
    업비트 KRW 마켓 중 24h 거래대금 상위 top_n — scanner CRYPTO_TARGETS 형식.
    market_warning 이 NONE 인 종목만 (투자유의·주의 제외).
    """
    resp = requests.get(f"{UPBIT_QUOTATION}/market/all", timeout=30)
    resp.raise_for_status()
    krw_meta = [
        m for m in resp.json()
        if str(m.get("market", "")).startswith("KRW-")
        and str(m.get("market_warning") or "NONE") == "NONE"
    ]
    if not krw_meta:
        return DEFAULT_CRYPTO_TARGETS[:top_n]

    name_by_code = {m["market"]: m.get("korean_name") or m["market"].split("-")[1] for m in krw_meta}
    codes = list(name_by_code.keys())
    tickers: list[dict] = []

    for i in range(0, len(codes), 100):
        batch = ",".join(codes[i : i + 100])
        tr = requests.get(f"{UPBIT_QUOTATION}/ticker", params={"markets": batch}, timeout=30)
        tr.raise_for_status()
        tickers.extend(tr.json())
        time.sleep(0.11)

    tickers.sort(key=lambda t: float(t.get("acc_trade_price_24h") or 0), reverse=True)
    results: list[dict] = []
    for t in tickers[:top_n]:
        code = t["market"]
        symbol = code.split("-", 1)[1]
        results.append({
            "code": code,
            "name": name_by_code.get(code, symbol),
            "market": f"CRYPTO_{symbol}",
        })
    return results or DEFAULT_CRYPTO_TARGETS[:top_n]


def fetch_ohlcv_daily(market: str, start: str, end: str | None = None) -> pd.DataFrame:
    """
    업비트 일봉 OHLCV — detect_signals() 호환 컬럼(Open, High, Low, Close).
    market: KRW-BTC, KRW-ETH 등
    """
    end = end or datetime.today().strftime("%Y-%m-%d")
    rows: list[dict] = []
    to_dt = datetime.strptime(end, "%Y-%m-%d").replace(hour=23, minute=59)
    start_ts = pd.Timestamp(start)

    while True:
        params = {
            "market": market,
            "count": 200,
            "to": to_dt.strftime("%Y-%m-%dT%H:%M:%S"),
        }
        resp = requests.get(f"{UPBIT_QUOTATION}/candles/days", params=params, timeout=30)
        resp.raise_for_status()
        chunk = resp.json()
        if not chunk:
            break

        for c in chunk:
            dt = pd.Timestamp(str(c["candle_date_time_kst"])[:10])
            rows.append({
                "date": dt,
                "Open": float(c["opening_price"]),
                "High": float(c["high_price"]),
                "Low": float(c["low_price"]),
                "Close": float(c["trade_price"]),
            })

        oldest = pd.Timestamp(str(chunk[-1]["candle_date_time_kst"])[:10])
        to_dt = (oldest - timedelta(days=1)).to_pydatetime().replace(hour=23, minute=59)
        if oldest <= start_ts:
            break
        time.sleep(0.11)

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows).drop_duplicates(subset=["date"]).sort_values("date")
    df = df.set_index("date")
    df.index = pd.to_datetime(df.index)
    return df
