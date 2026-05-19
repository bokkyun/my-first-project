"""
실시간 매수신호 스캐너 (다중 구독자 버전)
- 장중 N분마다 KIS REST API로 현재가 조회
- 과거 OHLCV + 오늘 실시간 캔들로 detect_signals() 재실행
- 신규 시그널 발생 시 Supabase telegram_subscribers 의 모든 활성 구독자에게 텔레그램 전송
- 중복 알림 방지 (오늘 이미 보낸 시그널 skip)

실행:
  python realtime_scanner.py             # 30분 간격 (기본)
  python realtime_scanner.py --interval 10  # 10분 간격
  (telegram_bot.py 와 별도 터미널에서 동시 실행)
"""

import os
import sys
import time
import argparse
from datetime import datetime, timedelta

import requests
import pandas as pd
import FinanceDataReader as fdr
from dotenv import load_dotenv
from supabase import create_client, Client

from scanner import detect_signals, SIGNAL_DEFS, _is_spac_listing, upsert_batch

load_dotenv()

SUPABASE_URL   = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY   = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
KIS_APP_KEY    = os.environ.get("KIS_APP_KEY", "")
KIS_APP_SECRET = os.environ.get("KIS_APP_SECRET", "")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
KIS_BASE_URL   = "https://openapi.koreainvestment.com:9443"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

sent_signals: set = set()
sent_date: str = ""


# ══════════════════════════════════════════════
# 구독자 조회
# ══════════════════════════════════════════════

def get_active_subscribers() -> list[str]:
    """Supabase에서 활성 구독자 chat_id 목록 반환"""
    try:
        result = supabase.table("telegram_subscribers")\
            .select("chat_id")\
            .eq("is_active", True)\
            .execute()
        return [row["chat_id"] for row in result.data]
    except Exception as e:
        print(f"[구독자 조회 오류] {e}")
        return []


# ══════════════════════════════════════════════
# 텔레그램 전송 (전체 구독자)
# ══════════════════════════════════════════════

def send_telegram_to_all(message: str, subscribers: list[str]):
    """모든 활성 구독자에게 텔레그램 메시지 전송"""
    if not TELEGRAM_BOT_TOKEN:
        print("[텔레그램] BOT_TOKEN 미설정")
        return
    if not subscribers:
        print("[텔레그램] 활성 구독자 없음")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    success = 0
    fail = 0

    for chat_id in subscribers:
        try:
            r = requests.post(url, json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML",
            }, timeout=10)
            if r.status_code == 200:
                success += 1
            else:
                err = r.json().get("error_code", 0)
                if err in (403, 400):  # 봇 차단 시 자동 구독 해제
                    supabase.table("telegram_subscribers")\
                        .update({"is_active": False})\
                        .eq("chat_id", chat_id)\
                        .execute()
                    print(f"  [자동 해제] {chat_id} — 봇 차단")
                fail += 1
        except Exception:
            fail += 1
        time.sleep(0.05)  # 텔레그램 API 속도 제한 (초당 30건)

    print(f"  [텔레그램] 성공 {success}명 / 실패 {fail}명")


def send_signal_messages(signals: list, interval_min: int, subscribers: list[str]):
    """시그널 목록을 30건씩 나눠 전체 구독자에게 발송"""
    now_str = datetime.now().strftime("%H:%M")
    chunk_size = 30

    for idx in range(0, len(signals), chunk_size):
        chunk = signals[idx: idx + chunk_size]
        part_label = f" ({idx // chunk_size + 1}부)" if len(signals) > chunk_size else ""

        lines = [
            f"🚨 <b>매수시그널 {len(signals)}건{part_label}</b>",
            f"⏰ {now_str}  (다음 스캔 약 {interval_min}분 후)\n",
        ]

        by_cat: dict[str, list] = {}
        for s in chunk:
            by_cat.setdefault(s["signal_category"], []).append(s)

        for cat, items in by_cat.items():
            lines.append(f"<b>[{cat}]</b>")
            for s in items:
                lines.append(
                    f"  • {s['name']}({s['code']}) "
                    f"<i>{s['signal_name']}</i> [{s['market']}]"
                )
            lines.append("")

        lines.append("⚠️ 투자 판단 및 책임은 본인에게 있습니다.")
        send_telegram_to_all("\n".join(lines), subscribers)
        time.sleep(1)


def send_to_all(message: str):
    """공지 등 단순 메시지를 전체 구독자에게 전송"""
    subscribers = get_active_subscribers()
    send_telegram_to_all(message, subscribers)


# ══════════════════════════════════════════════
# KIS REST API
# ══════════════════════════════════════════════

_kis_token: str = ""
_kis_token_expires: datetime = datetime.min


def get_kis_token() -> str:
    global _kis_token, _kis_token_expires
    if _kis_token and datetime.now() < _kis_token_expires:
        return _kis_token
    url = f"{KIS_BASE_URL}/oauth2/tokenP"
    try:
        r = requests.post(url, json={
            "grant_type": "client_credentials",
            "appkey": KIS_APP_KEY,
            "appsecret": KIS_APP_SECRET,
        }, timeout=10)
        _kis_token = r.json().get("access_token", "")
        _kis_token_expires = datetime.now() + timedelta(hours=6)
        print(f"[KIS] 토큰 발급 완료 (만료: {_kis_token_expires.strftime('%H:%M')})")
    except Exception as e:
        print(f"[KIS] 토큰 발급 실패: {e}")
    return _kis_token


def get_current_price(code: str) -> dict | None:
    token = get_kis_token()
    if not token:
        return None
    url = f"{KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = {
        "authorization": f"Bearer {token}",
        "appkey": KIS_APP_KEY,
        "appsecret": KIS_APP_SECRET,
        "tr_id": "FHKST01010100",
        "custtype": "P",
    }
    params = {"fid_cond_mrkt_div_code": "J", "fid_input_iscd": code}
    try:
        r = requests.get(url, headers=headers, params=params, timeout=5)
        out = r.json().get("output", {})
        close = float(out.get("stck_prpr", 0) or 0)
        if close <= 0:
            return None
        return {
            "Open":  float(out.get("stck_oprc", 0) or 0),
            "High":  float(out.get("stck_hgpr", 0) or 0),
            "Low":   float(out.get("stck_lwpr", 0) or 0),
            "Close": close,
        }
    except Exception:
        return None


# ══════════════════════════════════════════════
# 장 시간 체크
# ══════════════════════════════════════════════

def is_market_open() -> bool:
    now = datetime.now()
    if now.weekday() >= 5:
        return False
    open_t  = now.replace(hour=9,  minute=0,  second=0, microsecond=0)
    close_t = now.replace(hour=15, minute=30, second=0, microsecond=0)
    return open_t <= now <= close_t


# ══════════════════════════════════════════════
# 스캔 사이클
# ══════════════════════════════════════════════

def scan_once(stocks: pd.DataFrame, hist_data: dict, interval_min: int):
    global sent_signals, sent_date

    today = datetime.today().strftime("%Y-%m-%d")
    if sent_date != today:
        sent_signals.clear()
        sent_date = today

    target_dates = {today}
    new_signals = []
    total = len(stocks)

    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 스캔 시작 ({total}종목) ...")

    for i, row in stocks.iterrows():
        code   = str(row["Code"]).strip()
        name   = str(row["Name"]).strip()
        market = row["market"]

        if code not in hist_data:
            continue

        df = hist_data[code].copy()

        price = get_current_price(code)
        time.sleep(0.05)

        if price:
            today_ts = pd.Timestamp(today)
            df.loc[today_ts] = [price["Open"], price["High"], price["Low"], price["Close"]]
            df = df[~df.index.duplicated(keep="last")].sort_index()

        signals = detect_signals(df, target_dates)

        for s in signals:
            key = f"{today}_{code}_{s['signal_type']}"
            if key in sent_signals:
                continue
            sent_signals.add(key)
            meta = SIGNAL_DEFS[s["signal_type"]]
            new_signals.append({
                "date":            today,
                "code":            code,
                "name":            name,
                "market":          market,
                "signal_type":     s["signal_type"],
                "signal_category": meta["category"],
                "signal_name":     meta["name"],
            })

        if (i + 1) % 500 == 0:
            print(f"  진행: {i + 1}/{total}  신규 신호: {len(new_signals)}건")

    print(f"[{datetime.now().strftime('%H:%M:%S')}] 완료 — 신규 신호: {len(new_signals)}건")

    if new_signals:
        upsert_batch(new_signals)
        subscribers = get_active_subscribers()
        print(f"  → 구독자 {len(subscribers)}명에게 발송 중...")
        send_signal_messages(new_signals, interval_min, subscribers)
    else:
        print("  → 신규 시그널 없음")


# ══════════════════════════════════════════════
# 초기 데이터 로딩
# ══════════════════════════════════════════════

def load_stocks_and_hist() -> tuple[pd.DataFrame, dict]:
    print("[초기화] 종목 목록 로딩 중...")
    kospi  = fdr.StockListing("KOSPI")[["Code", "Name"]].copy()
    kosdaq = fdr.StockListing("KOSDAQ")[["Code", "Name"]].copy()
    kospi["market"]  = "KOSPI"
    kosdaq["market"] = "KOSDAQ"
    stocks = pd.concat([kospi, kosdaq], ignore_index=True)
    stocks = stocks[~stocks["Name"].astype(str).map(_is_spac_listing)].reset_index(drop=True)
    print(f"[초기화] 스캔 대상: {len(stocks)}종목")

    fetch_start = (datetime.today() - timedelta(days=400)).strftime("%Y-%m-%d")
    hist_data: dict = {}

    print(f"[초기화] 과거 OHLCV 로딩 중...")
    for i, row in stocks.iterrows():
        code = str(row["Code"]).strip()
        try:
            df = fdr.DataReader(code, fetch_start)
            if df is None or len(df) < 60:
                continue
            rename = {}
            for c in df.columns:
                if c.lower() == "open":    rename[c] = "Open"
                elif c.lower() == "high":  rename[c] = "High"
                elif c.lower() == "low":   rename[c] = "Low"
                elif c.lower() == "close": rename[c] = "Close"
            df = df.rename(columns=rename)
            if {"Open", "High", "Low", "Close"}.issubset(df.columns):
                hist_data[code] = df[["Open", "High", "Low", "Close"]].dropna()
        except Exception:
            pass
        if (i + 1) % 300 == 0:
            print(f"  {i + 1}/{len(stocks)} 완료 ({len(hist_data)}종목)")

    print(f"[초기화 완료] {len(hist_data)}종목 준비됨\n")
    return stocks, hist_data


# ══════════════════════════════════════════════
# 메인
# ══════════════════════════════════════════════

def main(interval_min: int):
    missing = []
    if not SUPABASE_URL or not SUPABASE_KEY: missing.append("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
    if not KIS_APP_KEY or not KIS_APP_SECRET: missing.append("KIS_APP_KEY / KIS_APP_SECRET")
    if not TELEGRAM_BOT_TOKEN: missing.append("TELEGRAM_BOT_TOKEN")
    if missing:
        print("오류: .env 누락:\n  " + "\n  ".join(missing))
        sys.exit(1)

    get_kis_token()
    stocks, hist_data = load_stocks_and_hist()

    subscriber_count = len(get_active_subscribers())
    send_to_all(
        f"✅ <b>실시간 스캐너 시작</b>\n"
        f"📊 감시 종목: {len(hist_data)}개\n"
        f"⏱ 스캔 주기: {interval_min}분\n"
        f"👥 현재 구독자: {subscriber_count}명"
    )

    print(f"[실시간 스캐너] {interval_min}분 간격 (장중에만)\n")

    while True:
        if is_market_open():
            scan_once(stocks, hist_data, interval_min)
        else:
            print(f"[{datetime.now().strftime('%H:%M')}] 장외 대기")
        time.sleep(interval_min * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--interval", type=int, default=30, help="스캔 주기(분), 기본 30")
    args = parser.parse_args()
    main(interval_min=args.interval)
