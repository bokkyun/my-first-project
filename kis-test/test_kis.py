"""
KIS API 연결 테스트 — 대한항공(003490) MACD 검증

실행 전 .env 에 KIS_APP_KEY, KIS_APP_SECRET 추가 필요.
"""

import os
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from dotenv import load_dotenv

from kis_fetcher import fetch_ohlcv

load_dotenv()

APP_KEY    = os.environ.get("KIS_APP_KEY", "")
APP_SECRET = os.environ.get("KIS_APP_SECRET", "")

if not APP_KEY or not APP_SECRET:
    print("오류: .env 에 KIS_APP_KEY 와 KIS_APP_SECRET 을 추가해주세요.")
    print("  KIS 개발자 포털: https://apiportal.koreainvestment.com")
    exit(1)

CODE = "003490"  # 대한항공
END   = datetime.today().strftime("%Y-%m-%d")
START = (datetime.today() - timedelta(days=400)).strftime("%Y-%m-%d")

print(f"\n대한항공({CODE}) {START} ~ {END} 조회 중...")
df = fetch_ohlcv(CODE, START, END, APP_KEY, APP_SECRET)
print(f"조회된 데이터: {len(df)}행\n")

# ── MACD 계산 ──────────────────────────────────
close     = df["Close"]
ema12     = close.ewm(span=12, adjust=False).mean()
ema26     = close.ewm(span=26, adjust=False).mean()
macd      = ema12 - ema26
macd_sig  = macd.ewm(span=9, adjust=False).mean()

golden_cross = (macd.shift(1) < macd_sig.shift(1)) & (macd >= macd_sig)
cross_dates  = golden_cross[golden_cross].index

print("── MACD 골든크로스 발생 날짜 (KIS 데이터 기준) ──")
for d in cross_dates[-10:]:
    print(f"  {d.strftime('%Y-%m-%d')}  MACD={macd[d]:.2f}  Signal={macd_sig[d]:.2f}")

print("\n── 최근 15일 종가 및 MACD ──")
recent = pd.DataFrame({
    "Close":  close,
    "MACD":   macd.round(2),
    "Signal": macd_sig.round(2),
    "Cross":  golden_cross,
}).tail(15)
print(recent.to_string())
