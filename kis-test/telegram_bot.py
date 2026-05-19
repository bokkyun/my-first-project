"""
텔레그램 봇 서버 — 사용자 구독 관리
사용자가 봇에게 /start 를 보내면 chat_id 를 Supabase에 저장하고 시그널 알림을 받을 수 있습니다.

지원 명령어:
  /start  — 구독 시작 (처음 등록 또는 재구독)
  /stop   — 구독 취소 (알림 중지)
  /status — 현재 구독 상태 확인

실행:
  python telegram_bot.py     (realtime_scanner.py 와 별도 터미널에서 동시 실행)
"""

import os
import sys
import time

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
SUPABASE_URL       = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY       = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not TELEGRAM_BOT_TOKEN or not SUPABASE_URL or not SUPABASE_KEY:
    print("오류: .env 에 TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 설정해주세요.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BASE_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


# ══════════════════════════════════════════════
# 텔레그램 API
# ══════════════════════════════════════════════

def send_message(chat_id: str, text: str):
    try:
        requests.post(f"{BASE_URL}/sendMessage", json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        }, timeout=10)
    except Exception as e:
        print(f"[텔레그램] 메시지 전송 실패 ({chat_id}): {e}")


def get_updates(offset: int = 0) -> list:
    try:
        r = requests.get(f"{BASE_URL}/getUpdates", params={
            "offset": offset,
            "timeout": 20,
            "allowed_updates": ["message"],
        }, timeout=30)
        return r.json().get("result", [])
    except Exception as e:
        print(f"[텔레그램] getUpdates 오류: {e}")
        return []


# ══════════════════════════════════════════════
# Supabase 구독자 관리
# ══════════════════════════════════════════════

def subscribe(chat_id: str, username: str, first_name: str) -> bool:
    """구독 등록 또는 재활성화. True=신규, False=재구독"""
    existing = supabase.table("telegram_subscribers")\
        .select("id, is_active")\
        .eq("chat_id", chat_id)\
        .execute()

    if existing.data:
        was_active = existing.data[0]["is_active"]
        supabase.table("telegram_subscribers")\
            .update({"is_active": True, "username": username, "first_name": first_name})\
            .eq("chat_id", chat_id)\
            .execute()
        return not was_active  # 비활성→활성이면 True(신규처럼 처리)
    else:
        supabase.table("telegram_subscribers").insert({
            "chat_id":    chat_id,
            "username":   username,
            "first_name": first_name,
            "is_active":  True,
        }).execute()
        return True


def unsubscribe(chat_id: str) -> bool:
    """구독 취소. True=성공, False=등록 자체가 없음"""
    existing = supabase.table("telegram_subscribers")\
        .select("id")\
        .eq("chat_id", chat_id)\
        .execute()
    if not existing.data:
        return False
    supabase.table("telegram_subscribers")\
        .update({"is_active": False})\
        .eq("chat_id", chat_id)\
        .execute()
    return True


def get_status(chat_id: str) -> str | None:
    """None=미등록, 'active'=구독중, 'inactive'=취소됨"""
    result = supabase.table("telegram_subscribers")\
        .select("is_active")\
        .eq("chat_id", chat_id)\
        .execute()
    if not result.data:
        return None
    return "active" if result.data[0]["is_active"] else "inactive"


# ══════════════════════════════════════════════
# 명령어 핸들러
# ══════════════════════════════════════════════

def handle_start(chat_id: str, username: str, first_name: str):
    is_new = subscribe(chat_id, username, first_name)
    name = first_name or username or "회원"
    if is_new:
        send_message(chat_id,
            f"👋 안녕하세요, {name}님!\n\n"
            f"✅ <b>매수시그널 알림 구독이 완료됐습니다.</b>\n\n"
            f"📊 KOSPI/KOSDAQ 전 종목을 장중 실시간으로 스캔해\n"
            f"아래 11가지 기술적 시그널이 발생하면 알려드립니다:\n\n"
            f"<b>[추세]</b>\n"
            f"  • MACD 골든크로스\n"
            f"  • 이동평균 골든크로스\n"
            f"  • 20일선 돌파\n"
            f"  • 이동평균 정배열\n\n"
            f"<b>[모멘텀]</b>\n"
            f"  • RSI 과매도 탈출\n"
            f"  • RSI 50선 돌파\n"
            f"  • 스토캐스틱 골든크로스\n"
            f"  • CCI -100선 돌파\n\n"
            f"<b>[볼린저]</b>\n"
            f"  • 볼린저 하단 반등\n"
            f"  • 볼린저 밴드 상향 돌파\n"
            f"  • 볼린저 중심선 회복\n\n"
            f"⚠️ 본 정보는 투자 참고용이며, 투자 판단 및 책임은 본인에게 있습니다.\n\n"
            f"구독 취소: /stop"
        )
    else:
        send_message(chat_id,
            f"✅ {name}님, 이미 구독 중이십니다.\n"
            f"구독 취소를 원하시면 /stop 을 입력해주세요."
        )


def handle_stop(chat_id: str, first_name: str):
    success = unsubscribe(chat_id)
    name = first_name or "회원"
    if success:
        send_message(chat_id,
            f"🔕 {name}님, 알림 구독이 취소됐습니다.\n"
            f"다시 받고 싶으시면 /start 를 입력해주세요."
        )
    else:
        send_message(chat_id,
            f"❗ 구독 기록이 없습니다. /start 로 먼저 구독해주세요."
        )


def handle_status(chat_id: str):
    status = get_status(chat_id)
    if status == "active":
        send_message(chat_id, "✅ 현재 매수시그널 알림을 <b>구독 중</b>입니다.\n취소: /stop")
    elif status == "inactive":
        send_message(chat_id, "🔕 구독이 <b>취소된</b> 상태입니다.\n재구독: /start")
    else:
        send_message(chat_id, "❗ 아직 구독하지 않으셨습니다.\n구독: /start")


def handle_unknown(chat_id: str):
    send_message(chat_id,
        "사용 가능한 명령어:\n"
        "/start  — 알림 구독 시작\n"
        "/stop   — 알림 구독 취소\n"
        "/status — 현재 구독 상태 확인"
    )


# ══════════════════════════════════════════════
# 메인 루프
# ══════════════════════════════════════════════

def main():
    print("[텔레그램 봇] 시작 — 사용자 명령 대기 중...")
    offset = 0

    while True:
        updates = get_updates(offset)

        for update in updates:
            offset = update["update_id"] + 1
            msg = update.get("message", {})
            if not msg:
                continue

            chat_id    = str(msg["chat"]["id"])
            text       = msg.get("text", "").strip()
            username   = msg.get("from", {}).get("username", "")
            first_name = msg.get("from", {}).get("first_name", "")

            print(f"[봇] 수신: {chat_id} ({first_name}) → {text}")

            if text.startswith("/start"):
                handle_start(chat_id, username, first_name)
            elif text.startswith("/stop"):
                handle_stop(chat_id, first_name)
            elif text.startswith("/status"):
                handle_status(chat_id)
            else:
                handle_unknown(chat_id)

        time.sleep(1)  # 1초마다 폴링


if __name__ == "__main__":
    main()
