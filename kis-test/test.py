import FinanceDataReader as fdr
import pandas as pd


def calc_macd(df):
    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False).mean()

    # 골든크로스: 전일 macd < signal, 당일 macd >= signal
    golden = (macd.shift(1) < signal.shift(1)) & (macd >= signal)
    return df.index[golden].tolist()


# 삼성전자 테스트
df = fdr.DataReader("005930", "2025-01-01")
dates = calc_macd(df)

print("삼성전자 MACD 골든크로스 발생일:")
for d in dates:
    print(f"  {str(d)[:10]}")
