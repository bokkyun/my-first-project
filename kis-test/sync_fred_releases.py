"""
FRED 거시지표 발표일·수치 → Supabase fred_economic_releases 동기화

Edge Function(sync-fred-releases)과 동일한 release/series 목록(CPI·PCE·PPI·NFP 등).

사용법:
  cp .env.example .env   # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRED_API_KEY
  python sync_fred_releases.py

FRED API 키(무료): https://fred.stlouisfed.org/docs/api/api_key.html
"""

from __future__ import annotations

import os
import sys
import time
from datetime import datetime, timedelta

import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

FRED_BASE = "https://api.stlouisfed.org/fred"

RELEASE_GROUPS: list[dict] = [
    {"release_id": 10, "series": [{"series_id": "CPIAUCSL", "title": "CPI (소비자물가)"}]},
    {"release_id": 21, "series": [{"series_id": "M2SL", "title": "M2 통화량"}]},
    {
        "release_id": 50,
        "series": [
            {"series_id": "UNRATE", "title": "실업률"},
            {"series_id": "PAYEMS", "title": "비농업고용 (NFP)"},
        ],
    },
    {"release_id": 53, "series": [{"series_id": "GDPC1", "title": "실질 GDP (연율 환산)"}]},
    {"release_id": 46, "series": [{"series_id": "PPIFIS", "title": "PPI (생산자물가·최종수요)"}]},
    {"release_id": 54, "series": [{"series_id": "PCEPI", "title": "PCE (개인소비지출 물가)"}]},
]

TRACKED_SERIES_IDS = [s["series_id"] for g in RELEASE_GROUPS for s in g["series"]]


def today_ymd() -> str:
    return datetime.today().strftime("%Y-%m-%d")


def ymd_add_days(ymd: str, days: int) -> str:
    d = datetime.strptime(ymd, "%Y-%m-%d") + timedelta(days=days)
    return d.strftime("%Y-%m-%d")


def fred_json(path: str, params: dict, api_key: str) -> dict:
    p = {"api_key": api_key, "file_type": "json", **params}
    r = requests.get(f"{FRED_BASE}{path}", params=p, timeout=30)
    if not r.ok:
        raise RuntimeError(f"FRED HTTP {r.status_code}: {r.text[:240]}")
    return r.json()


def run() -> None:
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    fred_key = os.environ.get("FRED_API_KEY", "").strip()

    if not supabase_url or not supabase_key:
        print("오류: .env 에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 설정해주세요.")
        sys.exit(1)
    if not fred_key:
        print("오류: .env 에 FRED_API_KEY 를 설정해주세요.")
        print("  발급: https://fred.stlouisfed.org/docs/api/api_key.html")
        print("  (Supabase 대시보드 → Edge Functions → sync-fred-releases secrets 에도 동일 키 필요)")
        sys.exit(1)

    admin = create_client(supabase_url, supabase_key)
    start = ymd_add_days(today_ymd(), -21)
    end = ymd_add_days(today_ymd(), 420)
    rows: list[dict] = []

    print(f"[FRED] 발표일 조회 {start} ~ {end}")
    for g in RELEASE_GROUPS:
        data = fred_json(
            "/release/dates",
            {
                "release_id": g["release_id"],
                "realtime_start": start,
                "realtime_end": end,
                "include_release_dates_with_no_data": "true",
            },
            fred_key,
        )
        dates = data.get("release_dates") or []
        print(f"  release {g['release_id']}: {len(dates)}일")
        time.sleep(0.12)
        for rd in dates:
            date_str = rd.get("date")
            if not date_str:
                continue
            for s in g["series"]:
                rows.append({
                    "release_id": g["release_id"],
                    "series_id": s["series_id"],
                    "title": s["title"],
                    "release_date": date_str,
                    "status": "scheduled",
                    "updated_at": datetime.utcnow().isoformat(),
                })

    if rows:
        chunk = 100
        for i in range(0, len(rows), chunk):
            batch = rows[i : i + chunk]
            admin.table("fred_economic_releases").upsert(
                batch, on_conflict="release_id,series_id,release_date"
            ).execute()
        print(f"[업로드] 발표일 {len(rows)}행 upsert 완료")

    today = today_ymd()
    need_obs = (
        admin.table("fred_economic_releases")
        .select("id, series_id, release_date")
        .lt("release_date", today)
        .is_("actual_value", "null")
        .execute()
    ).data or []

    filled = 0
    for row in need_obs:
        obs = fred_json(
            "/series/observations",
            {
                "series_id": row["series_id"],
                "observation_start": ymd_add_days(str(row["release_date"]), -420),
                "observation_end": today,
                "sort_order": "desc",
                "limit": 2,
            },
            fred_key,
        )
        valid = [o for o in (obs.get("observations") or []) if o.get("value") and o["value"] != "."]
        time.sleep(0.12)
        if not valid:
            continue
        latest, *rest = valid
        prev = rest[0] if rest else None
        admin.table("fred_economic_releases").update({
            "actual_value": latest["value"],
            "previous_value": prev["value"] if prev else None,
            "observation_date": latest["date"],
            "status": "released",
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", row["id"]).execute()
        filled += 1

    print(f"[완료] 과거 발표 수치 채움 {filled}건")
    for sid in TRACKED_SERIES_IDS:
        cnt = (
            admin.table("fred_economic_releases")
            .select("id", count="exact")
            .eq("series_id", sid)
            .execute()
        )
        print(f"  {sid}: {cnt.count}건")


if __name__ == "__main__":
    run()
