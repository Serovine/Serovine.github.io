import pandas as pd
import yfinance as yf

print("📥 Loading symbols from racesym.csv ...")
try:
    symbols = pd.read_csv("racesym.csv")["Symbol"].tolist()
    print(f"✅ Loaded {len(symbols)} symbols")
except FileNotFoundError:
    print("❌ Error: racesym.csv not found.")
    exit(1)

# Mapping exchange yfinance → Google Finance (อัปเดตตามเวอร์ชันของคุณ ครบถ้วนสุดๆ)
exchange_map = {
    "NasdaqGS": "NASDAQ",
    "Nasdaq": "NASDAQ",
    "NMS": "NASDAQ",
    "NGM": "NASDAQ",
    "NCM": "NASDAQ",
    "NYSE": "NYSE",
    "NYQ": "NYSE",
    "ASE": "NYSEAMERICAN",
}

data = []

print("🚀 Start fetching stock data ...")
for idx, sym in enumerate(symbols, start=1):
    try:
        print(f"[{idx}/{len(symbols)}] Fetching {sym} ...")
        ticker = yf.Ticker(sym)
        info = ticker.info

        price = info.get("regularMarketPrice", info.get("currentPrice", None))
        name = info.get("longName", info.get("shortName", sym))
        if name:
            name = name.replace(",", "")  # ลบ comma ออกจากชื่อบริษัท

        sector = info.get("sector", "Unknown")
        market_cap = info.get("marketCap", 0)
        exchange_raw = info.get("exchange", "Unknown")
        exchange = exchange_map.get(exchange_raw, exchange_raw)

        # แจ้งเตือนถ้าเจอ Exchange ประหลาด
        if exchange_raw not in exchange_map and exchange_raw != "Unknown":
            print(f"⚠️ Unknown exchange {exchange_raw}, defaulted to {exchange}")

        # ดึงประวัติ 1 ปีเต็ม เพื่อใช้คำนวณ SMA และเทียบราคา 6 เดือนเป๊ะๆ
        hist = ticker.history(period="1y")

        pct_change_6m = None
        stage = "Unknown"

        if len(hist) > 0:
            current_close = hist["Close"].iloc[-1]
            if not price:
                price = current_close

            # คำนวณช่วงเวลา 6 เดือนเป๊ะๆ แบบตามปฏิทิน
            six_months_target = pd.Timestamp.today().normalize() - pd.DateOffset(
                months=6
            )
            if hist.index.tz is not None:
                six_months_target = six_months_target.tz_localize(hist.index.tz)

            hist_6m = hist[hist.index >= six_months_target]

            if len(hist_6m) > 0:
                start_price_6m = hist_6m["Close"].iloc[0]
                pct_change_6m = (
                    (current_close - start_price_6m) / start_price_6m
                ) * 100

            # คำนวณ Stage Analysis (SMA 150) ของแท้
            if len(hist) >= 150:
                hist["SMA_150"] = hist["Close"].rolling(window=150).mean()
                current_sma = hist["SMA_150"].iloc[-1]
                past_sma = hist["SMA_150"].iloc[-20]

                if current_close > current_sma and current_sma > past_sma:
                    stage = "Stage2"
                elif current_close < current_sma and current_sma < past_sma:
                    stage = "Stage4"
                elif current_close > current_sma and current_sma <= past_sma:
                    stage = "Stage3"
                elif current_close < current_sma and current_sma >= past_sma:
                    stage = "Stage1"

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
