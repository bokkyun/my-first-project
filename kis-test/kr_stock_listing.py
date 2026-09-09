"""
국내 주식 종목 목록 — KOSPI/KOSDAQ

FinanceDataReader StockListing 이 KRX URL 404 등으로 실패할 때
한국투자증권 종목 마스터(.mst) ZIP 으로 fallback 합니다.
(API 키 불필요 — 공개 다운로드 URL)

KIS 마스터에는 펀드(수익증권)·ELW 등이 포함되므로
6자리 숫자 종목코드만 남깁니다. FDR StockListing 과 같은 범위입니다.
"""

from __future__ import annotations

import io
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import requests

KIS_MST_URLS = {
    "KOSPI": "https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip",
    "KOSDAQ": "https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip",
}

# KIS 공식 샘플: kospi 후단 228바이트, kosdaq 후단 222바이트
KIS_MST_TRAILER = {
    "KOSPI": 228,
    "KOSDAQ": 222,
}

_CACHE_DIR = Path(__file__).parent / ".cache"
_CACHE_TTL = timedelta(hours=12)
# 정상 KOSPI+KOSDAQ 주식은 수천 개. 이보다 적으면 깨진 캐시로 보고 다시 받습니다.
_MIN_LISTING_ROWS = 1000

# 마스터 그룹필드는 2바이트지만 strip 하면 1글자(S/E/B…)인 경우가 많음.
# B = 수익증권(펀드). ST/EF 같은 2글자 allowlist는 0건이 되므로 쓰지 않습니다.
_FUND_GROUPS = {"B"}


def _normalize_codes(codes: pd.Series) -> pd.Series:
    """'005930', 5930, '5930.0' 을 모두 6자리 문자열로 맞춤."""
    s = codes.astype(str).str.strip()
    s = s.str.replace(r"\.0$", "", regex=True)
    return s


def keep_listed_equities(df: pd.DataFrame) -> pd.DataFrame:
    """6자리 숫자 코드만 유지. F701… 수익증권 등 비주식 제외."""
    if df is None or df.empty:
        return df
    codes = _normalize_codes(df["Code"])
    is_digit = codes.str.isdigit()
    normalized = codes.copy()
    normalized.loc[is_digit] = codes.loc[is_digit].str.zfill(6)
    mask = is_digit & (normalized.str.len() == 6)
    digit_count = int(mask.sum())
    if "group" in df.columns:
        groups = df["group"].astype(str).str.strip().str.upper()
        with_group = mask & ~groups.isin(_FUND_GROUPS)
        if int(with_group.sum()) == 0 and digit_count > 0:
            print("[종목목록] 그룹코드 필터가 전 종목을 지워 6자리 코드 필터만 사용합니다.")
        else:
            mask = with_group
    out = df.loc[mask].copy()
    out["Code"] = normalized.loc[mask]
    if "group" in out.columns:
        out = out.drop(columns=["group"])
    dropped = len(df) - len(out)
    if dropped:
        print(f"[종목목록] 펀드·비주식 제외: {dropped}개 → {len(out)}개")
    if len(out) == 0:
        print("[종목목록] 경고: 필터 후 종목이 0개입니다. 캐시/필터를 무시하고 원본을 확인하세요.")
    return out.reset_index(drop=True)


def _parse_mst_text(text: str, market: str) -> pd.DataFrame:
    trailer = KIS_MST_TRAILER.get(market, 228)
    rows: list[dict] = []
    for line in text.splitlines():
        if len(line) <= trailer:
            continue
        head = line[: len(line) - trailer]
        code = head[0:9].rstrip()
        name = head[21:].strip()
        group = line[-trailer:][:2].strip()
        if code and name:
            rows.append({"Code": code, "Name": name, "market": market, "group": group})
    return pd.DataFrame(rows)


def _download_market_listing(market: str, url: str) -> pd.DataFrame:
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        text = zf.read(zf.namelist()[0]).decode("cp949")
    return _parse_mst_text(text, market)


def _load_cached_listing() -> pd.DataFrame | None:
    cache_file = _CACHE_DIR / "kr_stock_listing.csv"
    if not cache_file.exists():
        return None
    age = datetime.now() - datetime.fromtimestamp(cache_file.stat().st_mtime)
    if age > _CACHE_TTL:
        return None
    cached = pd.read_csv(cache_file, dtype={"Code": str})
    if cached is None or len(cached) < _MIN_LISTING_ROWS:
        print(f"[종목목록] 깨진 캐시 무시 ({0 if cached is None else len(cached)}개) → 다시 받습니다.")
        try:
            cache_file.unlink()
        except OSError:
            pass
        return None
    return cached


def _save_cached_listing(df: pd.DataFrame) -> None:
    if df is None or len(df) < _MIN_LISTING_ROWS:
        return
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(_CACHE_DIR / "kr_stock_listing.csv", index=False)


def fetch_kis_master_listing(use_cache: bool = True) -> pd.DataFrame:
    """KIS kospi/kosdaq_code.mst ZIP 파싱 → [Code, Name, market]."""
    if use_cache:
        cached = _load_cached_listing()
        if cached is not None:
            print(f"[종목목록] KIS 마스터 캐시 사용 - {len(cached)}개")
            return keep_listed_equities(cached)

    frames = []
    for market, url in KIS_MST_URLS.items():
        df = _download_market_listing(market, url)
        frames.append(df)
        print(f"[종목목록] KIS {market} - {len(df)}개")

    merged = keep_listed_equities(pd.concat(frames, ignore_index=True))
    if use_cache:
        try:
            _save_cached_listing(merged)
        except Exception:
            pass
    return merged


def fetch_kr_stock_listing() -> pd.DataFrame:
    """
    KOSPI+KOSDAQ 전 종목 [Code, Name, market].
    FDR StockListing 우선, 실패 시 KIS 마스터 fallback.
    펀드·ELW 등 비주식은 제외합니다.
    """
    try:
        import FinanceDataReader as fdr

        kospi = fdr.StockListing("KOSPI")[["Code", "Name"]].copy()
        kosdaq = fdr.StockListing("KOSDAQ")[["Code", "Name"]].copy()
        kospi["market"] = "KOSPI"
        kosdaq["market"] = "KOSDAQ"
        df = pd.concat([kospi, kosdaq], ignore_index=True)
        print(f"[종목목록] FinanceDataReader - KOSPI {len(kospi)} + KOSDAQ {len(kosdaq)}")
        filtered = keep_listed_equities(df)
        if filtered is None or len(filtered) < _MIN_LISTING_ROWS:
            print("[종목목록] FDR 결과가 너무 적어 KIS 마스터를 사용합니다.")
            return fetch_kis_master_listing()
        return filtered
    except Exception as exc:
        print(f"[종목목록] FinanceDataReader 실패 ({exc}) → KIS 마스터 사용")
        return fetch_kis_master_listing()
