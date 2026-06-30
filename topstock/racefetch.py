from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf

print("📥 Loading symbols from racesym.csv ...")
symbols = pd.read_csv("racesym.csv")["Symbol"].tolist()
print(f"✅ Loaded {len(symbols)} symbols")

# Mapping exchange yfinance → Google Finance
exchange_map = {
    "NasdaqGS": "NASDAQ",
    "Nasdaq": "NASDAQ",
    "NMS": "NASDAQ",
    "NGM": "NASDAQ",
    "NCM": "NASDAQ",
    "NYSE": "NYSE",
    "ASE": "NYSEAMERICAN",
}


def stage_analysis(change):
    """กำหนด Stage ตาม %Change6M"""
    if change is None:
        return "Unknown"
    elif change >= 50:
        return "STAGE 2"
    elif change >= 20:
        return "STAGE 1"
    elif change >= 0:
        return "STAGE 3"
    else:
        return "STAGE 4"


data = []
six_months_ago = datetime.today() - timedelta(days=180)

print("🚀 Start fetching stock data ...")
for idx, sym in enumerate(symbols, start=1):
    try:
        print(f"[{idx}/{len(symbols)}] Fetching {sym} ...")
        ticker = yf.Ticker(sym)
        info = ticker.info

        price = info.get("regularMarketPrice", None)
        name = info.get("longName", sym)
        if name:
            name = name.replace(",", "")  # ลบ comma ออกจากชื่อบริษัท

        sector = info.get("sector", "Unknown")
        market_cap = info.get("marketCap", 0)
        exchange_raw = info.get("exchange", "Unknown")
        exchange = exchange_map.get(exchange_raw, exchange_raw)
        if exchange_raw not in exchange_map:
            print(f"⚠️ Unknown exchange {exchange_raw}, defaulted to NASDAQ")

        # คำนวณ %Change 6M
        hist = ticker.history(start=six_months_ago.strftime("%Y-%m-%d"))
        if len(hist) > 0 and price:
            start_price = hist["Close"].iloc[0]
            pct_change_6m = ((price - start_price) / start_price) * 100
        else:
            pct_change_6m = None

        stage = stage_analysis(pct_change_6m)

        data.append(
            {
                "Symbol": sym,
                "Company": name,
                "Price": price,
                "%Change6M": pct_change_6m,
                "Sector": sector,
                "Exchange": exchange,
                "MarketCap": market_cap,
                "Stage": stage,
            }
        )
    except Exception as e:
        print(f"❌ Error fetching {sym}: {e}")

print("📊 Building DataFrame ...")
df = pd.DataFrame(data)

print("🔎 Filtering stocks (MarketCap ≥ 1B, valid %Change6M) ...")
df = df[(df["MarketCap"] >= 1e9) & (df["%Change6M"].notnull())]

print("📈 Sorting by %Change6M ...")
df = df.sort_values(by="%Change6M", ascending=False).head(100)

print("💾 Exporting racingstock.csv ...")
df.to_csv("racingstock.csv", index=False)
print("✅ Done! racingstock.csv updated.")
