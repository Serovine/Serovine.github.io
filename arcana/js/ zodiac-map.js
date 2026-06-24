// zodiacmap.js
// รับวันเกิด → zodiac → ไพ่ประจำตัว (Major Arcana)

const ZODIAC_MAP = [
  { sign: "capricorn", start: [12, 22], end: [1, 19], card: 15 }, // The Devil
  { sign: "aquarius", start: [1, 20], end: [2, 18], card: 17 }, // The Star
  { sign: "pisces", start: [2, 19], end: [3, 20], card: 18 }, // The Moon
  { sign: "aries", start: [3, 21], end: [4, 19], card: 4 }, // The Emperor
  { sign: "taurus", start: [4, 20], end: [5, 20], card: 5 }, // The Hierophant
  { sign: "gemini", start: [5, 21], end: [6, 20], card: 6 }, // The Lovers
  { sign: "cancer", start: [6, 21], end: [7, 22], card: 7 }, // The Chariot
  { sign: "leo", start: [7, 23], end: [8, 22], card: 8 }, // Strength
  { sign: "virgo", start: [8, 23], end: [9, 22], card: 9 }, // The Hermit
  { sign: "libra", start: [9, 23], end: [10, 22], card: 11 }, // Justice
  { sign: "scorpio", start: [10, 23], end: [11, 21], card: 13 }, // Death
  { sign: "sagittarius", start: [11, 22], end: [12, 21], card: 14 }, // Temperance
];

// ชื่อไพ่ทั้ง 22 ใบ (index = card number)
const CARD_NAMES = [
  "The Fool", // 0
  "The Magician", // 1
  "The High Priestess", // 2
  "The Empress", // 3
  "The Emperor", // 4
  "The Hierophant", // 5
  "The Lovers", // 6
  "The Chariot", // 7
  "Strength", // 8
  "The Hermit", // 9
  "Wheel of Fortune", // 10
  "Justice", // 11
  "The Hanged Man", // 12
  "Death", // 13
  "Temperance", // 14
  "The Devil", // 15
  "The Tower", // 16
  "The Star", // 17
  "The Moon", // 18
  "The Sun", // 19
  "Judgement", // 20
  "The World", // 21
];

// zodiac symbol unicode
const ZODIAC_SYMBOLS = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

/**
 * รับ Date object → return { sign, cardNumber, cardName, symbol }
 */
function getZodiacFromDate(date) {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();

  for (const z of ZODIAC_MAP) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;

    let match = false;
    if (sm <= em) {
      // same month range (ไม่ข้ามปี)
      match =
        (m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em);
    } else {
      // ข้ามปี (capricorn: Dec 22 – Jan 19)
      match =
        (m === sm && d >= sd) || (m === em && d <= ed) || m > sm || m < em;
    }

    if (match) {
      return {
        sign: z.sign,
        cardNumber: z.card,
        cardName: CARD_NAMES[z.card],
        symbol: ZODIAC_SYMBOLS[z.sign],
      };
    }
  }

  // fallback (ไม่ควรเกิดขึ้น)
  return {
    sign: "aquarius",
    cardNumber: 17,
    cardName: "The Star",
    symbol: "♒",
  };
}

/**
 * รับ string "YYYY-MM-DD" → return zodiac object
 */
function getZodiacFromString(dateStr) {
  const date = new Date(dateStr + "T12:00:00"); // noon เพื่อหลีก timezone drift
  return getZodiacFromDate(date);
}
