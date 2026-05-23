import pandas as pd
import yfinance as yf
import datetime
import pytz
import os
import concurrent.futures

BOARD_FILE = "earnings_board.csv"

def get_display_day(date_str, time_str):
    """คู่มือแมปปิ้งวันตามกฎ: After Market วันก่อนหน้า + Before Market วันปัจจุบัน"""
    if date_str == "22-05-26" and time_str == "After Market": return "Monday"
    if date_str == "25-05-26" and time_str == "Before Market": return "Monday"
    
    if date_str == "25-05-26" and time_str == "After Market": return "Tuesday"
    if date_str == "26-05-26" and time_str == "Before Market": return "Tuesday"
    
    if date_str == "26-05-26" and time_str == "After Market": return "Wednesday"
    if date_str == "27-05-26" and time_str == "Before Market": return "Wednesday"
    
    if date_str == "27-05-26" and time_str == "After Market": return "Thursday"
    if date_str == "28-05-26" and time_str == "Before Market": return "Thursday"
    
    if date_str == "28-05-26" and time_str == "After Market": return "Friday"
    if date_str == "29-05-26" and time_str == "Before Market": return "Friday"
    return "N/A"

def fetch_current_price(symbol):
    """ดึงราคาล่าสุด ณ เวลาที่เปิดตลาดหรือรันสคริปต์"""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        if not hist.empty:
            return symbol, hist['Close'].iloc[-1]
    except:
        pass
    return symbol, None

def main():
    if not os.path.exists(BOARD_FILE):
        print(f"❌ ไม่พบไฟล์ {BOARD_FILE} กรุณาตรวจสอบว่ารันถูกโฟลเดอร์")
        return

    # โหลดฐานข้อมูลหลัก
    df = pd.read_csv(BOARD_FILE)
    
    # บังคับ Type ป้องกันบั๊ก Pandas float64 อันเลื่องชื่อ
    for col in ['Bet', '%Today', 'Result']:
        if col in df.columns:
            df[col] = df[col].astype(object)

    # ตรวจสอบวันปัจจุบันตามเวลาประเทศไทย
    tz = pytz.timezone('Asia/Bangkok')
    now = datetime.datetime.now(tz)
    current_day = now.strftime('%A')
    
    print(f"🕒 เวลาปัจจุบัน (ไทย): {now.strftime('%Y-%m-%d %H:%M:%S')} ({current_day})")
    
    # กรองหาหุ้นที่ตรงรอบประกาศของ "วันนี้"
    targets = []
    for idx, row in df.iterrows():
        day = get_display_day(str(row['Earnings Date']), str(row['Time']))
        if day == current_day:
            # 🛑 กฎ One and Done: ถ้าเคยตรวจไปแล้ว (%Today ไม่ว่าง) จะข้ามทันที ไม่บันทึกซ้ำ
            if pd.isna(row['%Today']) or str(row['%Today']).strip() == "":
                targets.append((idx, row['Symbol'], row['Price'], row['Bet']))

    if not targets:
        print(f"✨ ไม่มีหุ้นที่ต้องตรวจหวยเพิ่มสำหรับวัน {current_day} (หรือตรวจผลของวันนี้ไปหมดแล้ว)")
        return

    print(f"🔍 พบหุ้นในรอบวัน {current_day} ที่ต้องอัปเดตราคา {len(targets)} ตัว:")
    symbols_to_fetch = [t[1] for t in targets]
    print(", ".join(symbols_to_fetch))

    # ใช้ Multithreading แยกร่างดึงราคาพร้อมกันด่วนจี๋
    prices_map = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = executor.map(fetch_current_price, symbols_to_fetch)
        for sym, price in results:
            if price:
                prices_map[sym] = price

    # คำนวณ % และบันทึกผลลัพธ์
    updated_count = 0
    for idx, symbol, pre_price, bet in targets:
        if symbol in prices_map:
            current_price = prices_map[symbol]
            pct_change = ((current_price - pre_price) / pre_price) * 100
            
            # 1. หยอด %Today เข้าไปในระบบ
            df.at[idx, '%Today'] = f"{pct_change:+.2f}%"
            
            # 2. คำนวณช่อง Result ทิ้งไว้ให้ (เพื่อความยืดหยุ่น)
            # ในแอปคอมพิวเตอร์: จะอ่านค่านี้ไปโชว์ Hit! / Loss! 
            # ในเว็บมือถือ: จะคำนวณจาก %Today แปลงเป็น SURGED / PLUNGED อัตโนมัติ
            bet_str = str(bet).strip().upper() if pd.notna(bet) else ""
            if bet_str == "LONG":
                df.at[idx, 'Result'] = "Hit!" if pct_change > 0 else ("Loss!" if pct_change < 0 else "Even")
            elif bet_str == "SHORT":
                df.at[idx, 'Result'] = "Hit!" if pct_change < 0 else ("Loss!" if pct_change > 0 else "Even")
            else:
                df.at[idx, 'Result'] = "Long" if pct_change > 0 else ("Short" if pct_change < 0 else "Even")
            
            print(f"🎯 {symbol}: ราคาตั้งต้น ${pre_price:.2f} -> ตอนนี้ ${current_price:.2f} ({pct_change:+.2f}%)")
            updated_count += 1

    # เซฟบันทึกผลกลับลงไฟล์ CSV
    df.to_csv(BOARD_FILE, index=False)
    print(f"💾 อัปเดตราคาและเซฟลงไฟล์ {BOARD_FILE} เรียบร้อย! (อัปเดตไป {updated_count} ตัว)")

    # 🚀 ระบบ Git Push อัตโนมัติสำหรับรันบนคอมพิวเตอร์
    # เอาเครื่องหมาย # ด้านล่างออกได้เลย ถ้าต้องการให้คอมพิวเตอร์สั่ง Push ขึ้น GitHub ให้เองหลังจากรันเสร็จ
    # print("📤 กำลังส่งข้อมูลขึ้น GitHub ตัวเองอัตโนมัติ...")
    # os.system("git add earnings_board.csv")
    # os.system('git commit -m "🤖 Auto-update lotto results via desktop script"')
    # os.system("git push")

if __name__ == "__main__":
    main()
