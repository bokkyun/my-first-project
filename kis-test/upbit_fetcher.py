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
