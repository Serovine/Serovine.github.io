// deck.js
// จัดการ pool ไพ่, สุ่ม upright/reversed, กางไพ่ fan

// ═══════════════════════════════════════════
// State
// ═══════════════════════════════════════════

const Deck = {
  // pool ไพ่ที่ยังไม่ได้ใช้ (array of card numbers)
  pool: [],

  // ไพ่ประจำตัว (ดึงออกก่อนเลย)
  identityCard: null,

  // ไพ่ที่ถูกเลือกไปแล้ว { houseIndex: { cardNumber, isReversed } }
  placed: {},

  // summary ไพ่ 3 ใบสุดท้าย
  summary: [],

  // 9 ใบที่เหลือสำหรับ final draw
  finalPool: [],
};

// ═══════════════════════════════════════════
// Init
// ═══════════════════════════════════════════

/**
 * เริ่มต้น session ใหม่
 * @param {number} identityCardNumber - ไพ่ประจำตัวจาก zodiac-map.js
 */
function initDeck(identityCardNumber) {
  // reset state
  Deck.pool = [];
  Deck.placed = {};
  Deck.summary = [];
  Deck.finalPool = [];
  Deck.identityCard = identityCardNumber;

  // สร้าง pool ไพ่ทั้ง 22 ใบ ยกเว้นไพ่ประจำตัว
  for (let i = 0; i <= 21; i++) {
    if (i !== identityCardNumber) {
      Deck.pool.push(i);
    }
  }

  // สุ่ม upright/reversed ให้ทุกใบตั้งแต่แรก
  // เก็บใน Map เพื่อให้ orientation คงที่ตลอด session
  Deck._orientations = {};
  for (let i = 0; i <= 21; i++) {
    Deck._orientations[i] = Math.random() < 0.5 ? "upright" : "reversed";
  }

  // shuffle pool
  shuffleArray(Deck.pool);
}

// ═══════════════════════════════════════════
// Draw phase 1 — 12 house cards
// ═══════════════════════════════════════════

/**
 * ดึงไพ่ N ใบจาก pool มาให้ผู้ใช้เลือก (fan display)
 * @param {number} fanSize - จำนวนไพ่ที่กางให้เลือก
 * @returns {number[]} array ของ card numbers
 */
function dealFan(fanSize = 7) {
  const count = Math.min(fanSize, Deck.pool.length);
  // ดึงมาจากด้านหน้า pool (pool ถูก shuffle แล้ว)
  return Deck.pool.slice(0, count);
}

/**
 * ผู้ใช้เลือกไพ่ใบนี้สำหรับ house นี้
 * @param {number} cardNumber
 * @param {number} houseIndex - 0-11
 * @returns {{ cardNumber, isReversed, orientation }}
 */
function pickCard(cardNumber, houseIndex) {
  // เอาออกจาก pool
  Deck.pool = Deck.pool.filter((n) => n !== cardNumber);

  const orientation = Deck._orientations[cardNumber];
  const isReversed = orientation === "reversed";

  Deck.placed[houseIndex] = { cardNumber, isReversed, orientation };

  return { cardNumber, isReversed, orientation };
}

// ═══════════════════════════════════════════
// Draw phase 2 — final 3x3
// ═══════════════════════════════════════════

/**
 * เตรียม pool 9 ใบสำหรับ final draw
 * เรียกหลังจาก place ครบ 12 ใบแล้ว
 * @returns {number[]} 9 card numbers (pool ที่เหลือ)
 */
function prepareFinalPool() {
  // pool ที่เหลือต้องมี 9 ใบพอดี (21 - 12 = 9)
  Deck.finalPool = [...Deck.pool];
  shuffleArray(Deck.finalPool);
  return Deck.finalPool;
}

/**
 * ผู้ใช้เลือก summary card
 * @param {number} cardNumber
 * @param {number} summaryIndex - 0, 1, 2
 * @returns {{ cardNumber, isReversed, orientation }}
 */
function pickSummaryCard(cardNumber, summaryIndex) {
  Deck.finalPool = Deck.finalPool.filter((n) => n !== cardNumber);

  const orientation = Deck._orientations[cardNumber];
  const isReversed = orientation === "reversed";

  Deck.summary[summaryIndex] = { cardNumber, isReversed, orientation };

  return { cardNumber, isReversed, orientation };
}

// ═══════════════════════════════════════════
// Query helpers
// ═══════════════════════════════════════════

/** ได้ orientation ของไพ่ใบนั้น */
function getOrientation(cardNumber) {
  return Deck._orientations[cardNumber] ?? "upright";
}

/** ไพ่ที่วางใน house index นั้น */
function getPlacedCard(houseIndex) {
  return Deck.placed[houseIndex] ?? null;
}

/** จำนวนไพ่ที่วางแล้ว */
function placedCount() {
  return Object.keys(Deck.placed).length;
}

/** จำนวน summary ที่เลือกแล้ว */
function summaryCount() {
  return Deck.summary.filter(Boolean).length;
}

// ═══════════════════════════════════════════
// Utils
// ═══════════════════════════════════════════

/** Fisher-Yates shuffle in-place */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * แปลง card number → filename
 * เช่น 0 → "no00.webp", 17 → "no17.webp"
 */
function cardFilename(cardNumber, ext = "webp") {
  return `no${String(cardNumber).padStart(2, "0")}.${ext}`;
}

/**
 * path รูปไพ่ตาม theme ปัจจุบัน
 * @param {number} cardNumber
 * @param {"hololive"|"classic"} theme
 */
function cardImagePath(cardNumber, theme = "hololive") {
  return `assets/card/${theme}/${cardFilename(cardNumber)}`;
}
