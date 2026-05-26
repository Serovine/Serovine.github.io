import pandas as pd
import yfinance as yf
import datetime
import pytz
import os
import concurrent.futures

BOARD_FILE = "earnings_board.csv"

def get_display_day(date_str, time_str):
    """
    แมปวันที่ประกาศงบ → วันที่ตลาดจะซื้อขาย
    BMO  → วันเดิม
    AMC  → วันทำการถัดไป (ข้าม Weekend ถ้าจำเป็น)
    """
    try:
        dt = datetime.datetime.strptime(str(date_str).strip(), '%d-%m-%y')
        if str(time_str).strip() == "After Market":
            days_ahead = 3 if dt.weekday() == 4 else 1  # ศุกร์ → จันทร์, อื่น → +1
            dt += datetime.timedelta(days=days_ahead)
        return dt.strftime('%A')
    except Exception:
        return "N/A"

def fetch_current_price(symbol):
    """ดึงราคาปัจจุบันด้วย yfinance"""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        if not hist.empty:
            return symbol, float(hist['Close'].iloc[-1])
    except Exception:
        pass
    return symbol, None

def is_value_empty(val):
    """เช็คว่าช่องนั้น 'ว่าง' จริงๆ ไม่ว่าจะเป็น NaN, '', หรือ string 'nan'"""
    if val is None:
        return True
    if pd.isna(val):
        return True
    return str(val).strip().lower() in ("", "nan")

def main():
    # ─── DST Guard: เช็คว่าตลาด NY เปิดแล้วหรือยัง ───────────────────────────
    ny_tz  = pytz.timezone('America/New_York')
    ny_now = datetime.datetime.now(ny_tz)
    market_open = ny_now.replace(hour=9, minute=30, second=0, microsecond=0)

    if ny_now < market_open:
        print(f"🚫 ตลาดยังไม่เปิด! NY ตอนนี้ {ny_now.strftime('%H:%M')} (รอ 09:30)")
        return

    # ─── โหลดไฟล์ ──────────────────────────────────────────────────────────────
    if not os.path.exists(BOARD_FILE):
        print(f"❌ ไม่พบไฟล์ {BOARD_FILE}")
        return

    df = pd.read_csv(BOARD_FILE)

    # บังคับ column ที่อาจมีปัญหา type เป็น object ทั้งหมด
    for col in ['Bet', '%Today', 'Result']:
        if col in df.columns:
            df[col] = df[col].astype(object)

    # ─── หาวันปัจจุบัน (เวลา NY เท่านั้น) ────────────────────────────────────────────────
    current_day = ny_now.strftime('%A')
    print(f"🗽 เวลาปัจจุบัน (นิวยอร์ก):  {ny_now.strftime('%Y-%m-%d %H:%M:%S')} ({current_day})")

    # ─── กรองหุ้นที่ต้องอัปเดตวันนี้ ────────────────────────────────────────────
    targets = []
    for idx, row in df.iterrows():
        day = get_display_day(str(row['Earnings Date']), str(row['Time']))
        if day != current_day:
            continue
        # One-and-Done: ถ้ามี %Today แล้ว ข้ามเลย
        if not is_value_empty(row.get('%Today')):
            continue
        try:
            pre_price = float(str(row['Price']).replace(',', '').strip())
        except (ValueError, TypeError):
            print(f"⚠️  {row['Symbol']}: Price '{row['Price']}' แปลงเป็นตัวเลขไม่ได้ ข้าม")
            continue
        targets.append((idx, str(row['Symbol']).strip(), pre_price, row.get('Bet', '')))

    if not targets:
        print(f"✨ ไม่มีหุ้นที่ต้องอัปเดตสำหรับวัน {current_day}")
        return

    print(f"🔍 พบ {len(targets)} ตัวที่ต้องอัปเดต: {', '.join(t[1] for t in targets)}")

    # ─── ดึงราคาแบบ Parallel ──────────────────────────────────────────────────
    prices_map = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        for sym, price in executor.map(fetch_current_price, [t[1] for t in targets]):
            if price is not None:
                prices_map[sym] = price

    # ─── คำนวณ % และบันทึก ───────────────────────────────────────────────────
    updated_count = 0
    for idx, symbol, pre_price, bet in targets:
        if symbol not in prices_map:
            print(f"⚠️  {symbol}: ดึงราคาไม่ได้ ข้าม")
            continue

        current_price = prices_map[symbol]
        pct_change    = ((current_price - pre_price) / pre_price) * 100

        df.at[idx, '%Today'] = f"{pct_change:+.2f}%"

        bet_str = str(bet).strip().upper() if not is_value_empty(bet) else ""
        if bet_str == "LONG":
            result = "Hit!" if pct_change > 0 else ("Loss!" if pct_change < 0 else "Even")
        elif bet_str == "SHORT":
            result = "Hit!" if pct_change < 0 else ("Loss!" if pct_change > 0 else "Even")
        else:
            result = "Long" if pct_change > 0 else ("Short" if pct_change < 0 else "Even")

        df.at[idx, '
