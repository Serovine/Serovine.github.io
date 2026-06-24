// lang.js — UI strings for all screens
// คำทำนายอยู่ใน data.th.js / data.en.js แยกต่างหาก

const LANG = {
  th: {
    // App
    app_title: "Celestial Arcana",
    app_subtitle: "ไพ่ทาโรต์แห่งจักรราศี",

    // Screen 0 — Lang select (hardcoded, no translation needed)

    // Screen 1 — Welcome
    welcome_speech:
      "ข้าพเจ้าจะเผยโชคชะตาของท่าน\nด้วยพลังแห่งดวงดาวทั้งสิบสอง\nท่านพร้อมแล้วหรือยัง...",
    btn_start: "เริ่มดูดวง",

    // Screen 2 — Input
    input_speech:
      "บอกชื่อและวันเกิดของท่านมา\nเพื่อให้ข้าพเจ้าเปิดเผยไพ่แห่งโชคชะตา",
    label_name: "ชื่อของท่าน",
    placeholder_name: "กรอกชื่อ...",
    label_dob: "วันเกิด",
    btn_confirm: "เริ่มการทำนาย",

    // identity card
    identity_speech_prefix: "ไพ่ประจำตัวของ",
    identity_speech_suffix: "คือ",

    // Screen 3 — Shuffle
    shuffle_speech:
      "จงรวมพลังจิตของท่าน\nมุ่งความตั้งใจไปยังดวงดาว\nข้าพเจ้ากำลังสับไพ่แห่งชะตา...",

    // Screen 4 — Draw
    draw_instruction: "จงเลือกไพ่ที่ดึงดูดจิตใจท่าน",
    btn_place: "วางไพ่",

    // House names
    house_names: [
      "House I — ตัวตน",
      "House II — ทรัพย์สิน",
      "House III — การสื่อสาร",
      "House IV — บ้านและครอบครัว",
      "House V — ความรักและความสุข",
      "House VI — สุขภาพและงาน",
      "House VII — คู่ครอง",
      "House VIII — การเปลี่ยนแปลง",
      "House IX — ปรัชญาและการเดินทาง",
      "House X — อาชีพและชื่อเสียง",
      "House XI — มิตรภาพและความหวัง",
      "House XII — จิตใต้สำนึก",
    ],

    // House short labels (for spread circle)
    house_short: [
      "ตัวตน",
      "ทรัพย์",
      "สื่อสาร",
      "บ้าน",
      "ความรัก",
      "สุขภาพ",
      "คู่ครอง",
      "เปลี่ยนแปลง",
      "ปรัชญา",
      "อาชีพ",
      "มิตร",
      "จิตใต้สำนึก",
    ],

    // Orb messages during draw (per house)
    orb_draw_messages: [
      "ไพ่นี้จะเปิดเผย... ตัวตนที่แท้จริงของท่าน",
      "ดวงดาวกำลังส่องทาง... ทรัพย์สินและความมั่งคั่ง",
      "เสียงกระซิบจากจักรวาล... การสื่อสารและความคิด",
      "รากเหง้าแห่งชีวิต... บ้านและผู้คนที่รัก",
      "หัวใจย่อมรู้... ความรักและความสุขในชีวิต",
      "กายและจิต... สุขภาพและหน้าที่ประจำวัน",
      "กระจกแห่งความสัมพันธ์... คู่ครองและพันธมิตร",
      "ประตูสู่การเปลี่ยนแปลง... พลังและการแปรเปลี่ยน",
      "เส้นทางของผู้แสวงหา... ปรัชญาและการผจญภัย",
      "ยอดเขาแห่งโชค... อาชีพและชื่อเสียง",
      "เครือข่ายแห่งดวงดาว... มิตรภาพและความฝัน",
      "ห้วงลึกแห่งจิตใจ... สิ่งซ่อนเร้นและจิตใต้สำนึก",
    ],

    // Orientation labels
    upright: "ตรง",
    reversed: "กลับหัว",

    // Screen 5 — Final 3x3
    final_speech:
      "ไพ่สุดท้ายสามใบ\nจะเปิดเผยโชคชะตาอันใกล้นี้...\nจงเลือกด้วยหัวใจ",
    final_counter: "เลือก {n} / 3",
    summary_labels: ["อนาคตอันใกล้", "สิ่งที่จะเผชิญ", "โชคชะตา"],
    btn_confirm_summary: "รับทราบ",

    // Screen 6 — Result
    result_subtitle: "สรุปผลการทำนาย",
    result_summary_title: "ไพ่แห่งชะตากรรม",
    btn_restart: "ดูดวงใหม่",
    btn_save: "บันทึกผล",

    // Modal
    modal_hint: "แตะไพ่เพื่อพลิกดูคำทำนาย",

    // Zodiac names (TH)
    zodiac_names: {
      aries: "เมษ",
      taurus: "พฤษภ",
      gemini: "เมถุน",
      cancer: "กรกฎ",
      leo: "สิงห์",
      virgo: "กันย์",
      libra: "ตุลย์",
      scorpio: "พิจิก",
      sagittarius: "ธนู",
      capricorn: "มกร",
      aquarius: "กุมภ์",
      pisces: "มีน",
    },

    // Luck labels
    luck_lucky: "ผลการทำนาย",
    luck_unlucky: "ผลการทำนาย",

    // Save / screenshot
    save_not_supported: "เบราว์เซอร์นี้ไม่รองรับการบันทึกภาพ",
  },

  en: {
    // App
    app_title: "Celestial Arcana",
    app_subtitle: "Tarot of the Twelve Houses",

    // Screen 1 — Welcome
    welcome_speech:
      "I shall reveal your fate\nthrough the power of the twelve stars.\nAre you ready?",
    btn_start: "Begin Reading",

    // Screen 2 — Input
    input_speech:
      "Tell me your name and date of birth\nso I may reveal the cards of your destiny.",
    label_name: "Your Name",
    placeholder_name: "Enter your name...",
    label_dob: "Date of Birth",
    btn_confirm: "Begin the Reading",

    identity_speech_prefix: "The birth card of",
    identity_speech_suffix: "is",

    // Screen 3 — Shuffle
    shuffle_speech:
      "Focus your mind.\nDirect your intention toward the stars.\nI am shuffling the cards of fate...",

    // Screen 4 — Draw
    draw_instruction: "Choose the card that draws your spirit",
    btn_place: "Place Card",

    house_names: [
      "House I — Self",
      "House II — Wealth",
      "House III — Communication",
      "House IV — Home & Family",
      "House V — Love & Pleasure",
      "House VI — Health & Work",
      "House VII — Partnerships",
      "House VIII — Transformation",
      "House IX — Philosophy & Travel",
      "House X — Career & Fame",
      "House XI — Friendship & Hope",
      "House XII — The Subconscious",
    ],

    house_short: [
      "Self",
      "Wealth",
      "Comms",
      "Home",
      "Love",
      "Health",
      "Partner",
      "Change",
      "Quest",
      "Career",
      "Friends",
      "Shadow",
    ],

    orb_draw_messages: [
      "This card shall reveal... your true self",
      "The stars illuminate... wealth and abundance",
      "A whisper from the cosmos... thought and expression",
      "The roots of existence... home and loved ones",
      "The heart already knows... love and pleasure",
      "Body and soul... health and daily duties",
      "The mirror of bonds... partners and allies",
      "The gate of change... power and transformation",
      "The seeker's road... philosophy and adventure",
      "The mountain peak... career and reputation",
      "The stellar network... friendship and dreams",
      "The deep vault of mind... the hidden and subconscious",
    ],

    upright: "Upright",
    reversed: "Reversed",

    final_speech:
      "The final three cards\nshall reveal your near destiny...\nChoose with your heart.",
    final_counter: "Chosen {n} / 3",
    summary_labels: ["Near Future", "What You'll Face", "Your Fate"],
    btn_confirm_summary: "Acknowledge",

    result_subtitle: "Your Fate of the Twelve Houses",
    result_summary_title: "Cards of Destiny",
    btn_restart: "New Reading",
    btn_save: "Save Result",

    modal_hint: "Tap the card to flip",

    zodiac_names: {
      aries: "Aries",
      taurus: "Taurus",
      gemini: "Gemini",
      cancer: "Cancer",
      leo: "Leo",
      virgo: "Virgo",
      libra: "Libra",
      scorpio: "Scorpio",
      sagittarius: "Sagittarius",
      capricorn: "Capricorn",
      aquarius: "Aquarius",
      pisces: "Pisces",
    },

    luck_lucky: "✦ Auspicious",
    luck_unlucky: "✧ Inauspicious",

    save_not_supported: "Screenshot not supported in this browser.",
  },
};

// Active language — set by app.js on lang select
let currentLang = "th";

function t(key, vars = {}) {
  const str = LANG[currentLang][key] ?? LANG["th"][key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function applyLang() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}
