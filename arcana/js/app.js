// app.js
// Main controller — จัดการ flow ทั้งหมด, state, เชื่อม module

// ═══════════════════════════════════════════
// App State
// ═══════════════════════════════════════════

const AppState = {
  lang: "th",
  theme: "hololive",
  userName: "",
  dob: "",
  zodiac: null,          // { sign, cardNumber, cardName, symbol }
  currentHouse: 0,       // 0-11
  fanCards: [],          // ไพ่ที่กางให้เลือกตอนนี้
  summaryPicked: 0,      // 0-3
  phase: "lang",         // lang | welcome | input | shuffle | draw | final | result
};

const FAN_SIZE = 7; // จำนวนไพ่กางแต่ละรอบ

// ═══════════════════════════════════════════
// Init
// ═══════════════════════════════════════════

function initApp() {
  initStarFields();
  initModalClose();
  bindLangScreen();
  bindWelcomeScreen();
  bindInputScreen();
  bindDrawScreen();
  bindFinalScreen();
  bindResultScreen();
}

// ═══════════════════════════════════════════
// Screen 0 — Language Select
// ═══════════════════════════════════════════

function bindLangScreen() {
  document.querySelectorAll(".btn-lang").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (lang === "en") return; // mockup — ยังไม่เปิด
      currentLang = lang;
      AppState.lang = lang;
      applyLang();
      AppState.phase = "welcome";
      showScreen("screen-welcome");
    });
  });
}

// ═══════════════════════════════════════════
// Screen 1 — Welcome
// ═══════════════════════════════════════════

function bindWelcomeScreen() {
  document.getElementById("btn-start").addEventListener("click", () => {
    AppState.phase = "input";
    showScreen("screen-input");
    initInputValidation();
  });
}

// ═══════════════════════════════════════════
// Screen 2 — Input
// ═══════════════════════════════════════════

function bindInputScreen() {
  document.getElementById("btn-confirm-input").addEventListener("click", () => {
    AppState.userName = document.getElementById("user-name").value.trim();
    AppState.dob = document.getElementById("user-dob").value;
    AppState.zodiac = getZodiacFromString(AppState.dob);

    AppState.phase = "shuffle";
    showScreen("screen-shuffle");
    startShuffle();
  });
}

// ═══════════════════════════════════════════
// Screen 3 — Shuffle
// ═══════════════════════════════════════════

function startShuffle() {
  initDeck(AppState.zodiac.cardNumber);

  playShuffleAnimation(() => {
    AppState.phase = "draw";
    AppState.currentHouse = 0;
    showScreen("screen-draw");
    initDrawScreen();
  });
}

// ═══════════════════════════════════════════
// Screen 4 — Draw x12
// ═══════════════════════════════════════════

function initDrawScreen() {
  // สร้าง spread slots
  const spreadCircle = document.querySelector("#spread-container .spread-circle");
  buildSpreadSlots(spreadCircle);

  // วางไพ่ประจำตัวกลางวง
  renderCenterCard();

  // init floating orb
  initFloatOrb("orb-float", "orb-bubble");

  // เริ่ม house แรก
  startHouseDraw(0);
}

function renderCenterCard() {
  const center = document.getElementById("spread-center-card");
  if (!center || !AppState.zodiac) return;
  center.innerHTML = makeDummyCard(AppState.zodiac.cardNumber, "center-card-svg");
  center.title = AppState.zodiac.cardName;
}

function startHouseDraw(houseIndex) {
  AppState.currentHouse = houseIndex;

  updateHouseLabel(houseIndex);
  updateDrawCounter(houseIndex + 1, 12);

  // orb พูดตาม house
  const msg = LANG[currentLang].orb_draw_messages[houseIndex] || "";
  orbSpeak("orb-float", "orb-bubble", msg, 5000);

  // hide reveal panel ถ้าค้างอยู่
  hideRevealPanel();

  // deal fan
  AppState.fanCards = dealFan(FAN_SIZE);
  const fanContainer = document.getElementById("fan-container");

  buildFan(fanContainer, AppState.fanCards, (cardNumber) => {
    onCardPicked(cardNumber, houseIndex);
  }, AppState.theme);
}

function onCardPicked(cardNumber, houseIndex) {
  const result = pickCard(cardNumber, houseIndex);

  // ดึงคำทำนายจาก data
  const prophecy = getCardProphecy(cardNumber, result.isReversed, houseIndex);

  // แสดง reveal panel
  showRevealPanel(cardNumber, result.isReversed, houseIndex, prophecy);

  // bind ปุ่มวางไพ่
  const btnPlace = document.getElementById("btn-place-card");
  btnPlace.onclick = () => {
    placeCardInSlot(houseIndex, cardNumber, result.isReversed, AppState.theme);
    hideRevealPanel();

    const nextHouse = houseIndex + 1;
    if (nextHouse < 12) {
      setTimeout(() => startHouseDraw(nextHouse), 400);
    } else {
      // ครบ 12 ใบ → ไป final
      setTimeout(() => {
        AppState.phase = "final";
        showScreen("screen-final");
        initFinalScreen();
      }, 600);
    }
  };
}

// tap ไพ่บน spread เพื่อดู modal
function bindSpreadTap() {
  document.querySelector("#spread-container").addEventListener("click", e => {
    const slot = e.target.closest(".house-slot-filled");
    if (!slot) return;
    const houseIdx = parseInt(slot.dataset.house);
    const cardNum = parseInt(slot.dataset.card);
    const isRev = slot.dataset.reversed === "1";
    const prophecy = getCardProphecy(cardNum, isRev, houseIdx);
    openCardModal(cardNum, isRev, prophecy, houseIdx);
  });
}

// ═══════════════════════════════════════════
// Screen 5 — Final 3x3
// ═══════════════════════════════════════════

function initFinalScreen() {
  AppState.summaryPicked = 0;
  updateFinalCounter(0);

  initFloatOrb("orb-float-final", "orb-bubble-final");
  orbSpeak("orb-float-final", "orb-bubble-final", t("final_speech"), 0);

  const finalPool = prepareFinalPool();
  const grid = document.getElementById("grid-3x3");

  buildGrid3x3(grid, finalPool, (cardNumber, summaryIdx) => {
    onSummaryCardPicked(cardNumber, summaryIdx);
  }, AppState.theme);
}

function bindFinalScreen() {
  document.getElementById("btn-confirm-summary")?.addEventListener("click", () => {
    hideSummaryReveal();
  });
}

function onSummaryCardPicked(cardNumber, summaryIdx) {
  const result = pickSummaryCard(cardNumber, summaryIdx);
  AppState.summaryPicked++;
  updateFinalCounter(AppState.summaryPicked);

  const prophecy = getCardSummary(cardNumber, result.isReversed, summaryIdx);
  showSummaryReveal(cardNumber, result.isReversed, summaryIdx, prophecy);

  if (AppState.summaryPicked >= 3) {
    // ครบ 3 ใบ → ไป result หลัง confirm
    const btnConfirm = document.getElementById("btn-confirm-summary");
    btnConfirm.onclick = () => {
      hideSummaryReveal();
      setTimeout(() => {
        AppState.phase = "result";
        showScreen("screen-result");
        initResultScreen();
      }, 400);
    };
  }
}

// ═══════════════════════════════════════════
// Screen 6 — Result
// ═══════════════════════════════════════════

function initResultScreen() {
  renderResultHeader(AppState.userName);
  renderResultSummaryCards(Deck.summary);

  // spread read-only
  const resultSpreadEl = document.querySelector(".spread-circle-result");
  if (resultSpreadEl) {
    // วางไพ่ประจำตัวกลาง
    const centerEl = document.getElementById("result-center-card");
    if (centerEl) {
      centerEl.innerHTML = makeDummyCard(AppState.zodiac.cardNumber, "center-card-svg");
    }

    buildResultSpread(resultSpreadEl, Deck.placed, (houseIdx, cardNum, isRev) => {
      const prophecy = getCardProphecy(cardNum, isRev, houseIdx);
      openCardModal(cardNum, isRev, prophecy, houseIdx);
    }, AppState.theme);
  }

  initFloatOrb("orb-float-result", "orb-bubble-result");
}

function bindResultScreen() {
  document.getElementById("btn-restart")?.addEventListener("click", () => {
    resetApp();
  });

  document.getElementById("btn-save")?.addEventListener("click", () => {
    saveResult();
  });
}

// ═══════════════════════════════════════════
// Data lookup helpers
// ═══════════════════════════════════════════

/**
 * ดึงคำทำนายตาม house position
 * @param {number} cardNumber
 * @param {boolean} isReversed
 * @param {number} houseIndex - 0-11
 */
function getCardProphecy(cardNumber, isReversed, houseIndex) {
  const data = tarotData?.[cardNumber];
  if (!data) return "";
  const side = isReversed ? data.reversed : data.upright;
  const key = `position_${houseIndex + 1}`;
  return side?.[key] ?? "";
}

/**
 * ดึง summary คำทำนาย (summary_1 / summary_2 / summary_3)
 * @param {number} cardNumber
 * @param {boolean} isReversed
 * @param {number} summaryIndex - 0, 1, 2
 */
function getCardSummary(cardNumber, isReversed, summaryIndex) {
  const data = tarotData?.[cardNumber];
  if (!data) return "";
  const side = isReversed ? data.reversed : data.upright;
  const key = `summary_${summaryIndex + 1}`;
  return side?.[key] ?? "";
}

/**
 * ดึงข้อมูล keyword ของไพ่
 */
function getCardKeyword(cardNumber, isReversed) {
  const data = tarotData?.[cardNumber];
  if (!data) return "";
  const side = isReversed ? data.reversed : data.upright;
  return side?.keyword ?? "";
}

// ═══════════════════════════════════════════
// Reset
// ═══════════════════════════════════════════

function resetApp() {
  AppState.userName = "";
  AppState.dob = "";
  AppState.zodiac = null;
  AppState.currentHouse = 0;
  AppState.fanCards = [];
  AppState.summaryPicked = 0;
  AppState.phase = "welcome";

  // reset input fields
  const nameEl = document.getElementById("user-name");
  const dobEl = document.getElementById("user-dob");
  if (nameEl) nameEl.value = "";
  if (dobEl) dobEl.value = "";
  document.getElementById("identity-card").hidden = true;
  document.getElementById("btn-confirm-input").disabled = true;

  showScreen("screen-welcome");
}

// ═══════════════════════════════════════════
// Save (screenshot via html2canvas fallback)
// ═══════════════════════════════════════════

function saveResult() {
  // basic: เปิด print dialog
  // upgrade ทีหลังด้วย html2canvas ถ้าต้องการ
  alert(t("save_not_supported"));
}

// ═══════════════════════════════════════════
// Boot
// ═══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  // bind spread tap หลัง DOM พร้อม
  bindSpreadTap();
});
