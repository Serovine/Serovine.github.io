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
  zodiac: null, // { sign, cardNumber, cardName, symbol }
  currentHouse: 0, // 0-11
  fanCards: [], // ไพ่ที่กางให้เลือกตอนนี้
  summaryPicked: 0, // 0-3
  phase: "lang", // lang | welcome | input | shuffle | draw | final | result
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
  bindFinalScreen();
  bindResultScreen();
}

// ═══════════════════════════════════════════
// Screen 0 — Language Select
// ═══════════════════════════════════════════

function bindLangScreen() {
  document.querySelectorAll(".btn-lang").forEach((btn) => {
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
  const spreadCircle = document.querySelector(
    "#spread-container .spread-circle",
  );
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
  center.innerHTML = "";
  const img = document.createElement("img");
  img.src = cardImagePath(AppState.zodiac.cardNumber, AppState.theme);
  img.alt = AppState.zodiac.cardName;
  img.style.cssText =
    "width:52px;height:94px;object-fit:cover;border-radius:6px;";
  img.onerror = () => {
    center.innerHTML = makeDummyCard(
      AppState.zodiac.cardNumber,
      "center-card-svg",
    );
  };
  center.appendChild(img);
  center.title = AppState.zodiac.cardName;
}

function startHouseDraw(houseIndex) {
  AppState.currentHouse = houseIndex;

  AppState.stagedCard = null;

  updateHouseLabel(houseIndex);
  updateDrawCounter(houseIndex + 1, 12);

  const msg = LANG[currentLang].orb_draw_messages[houseIndex] || "";
  orbSpeak("orb-float", "orb-bubble", msg, 5000);

  hideRevealPanel();

  AppState.fanCards = dealFan(FAN_SIZE);
  const fanContainer = document.getElementById("fan-container");

  if (fanContainer) fanContainer.style.pointerEvents = "auto";

  buildFan(
    fanContainer,
    AppState.fanCards,
    (cardNumber) => {
      onCardPicked(cardNumber, houseIndex);
    },
    AppState.theme,
  );
}

function onCardPicked(cardNumber, houseIndex) {
  // ══════════════════════════════════════════════════════════════
  // STAGE PHASE
  // ══════════════════════════════════════════════════════════════
  AppState.stagedCard = cardNumber;

  const orientation = getOrientation(cardNumber);
  const isReversed = orientation === "reversed";
  const prophecy = getCardProphecy(cardNumber, isReversed, houseIndex);

  showRevealPanel(cardNumber, isReversed, houseIndex, prophecy);

  const btnPlace = document.getElementById("btn-place-card");
  btnPlace.disabled = false;

  // ══════════════════════════════════════════════════════════════
  // COMMIT PHASE
  // ══════════════════════════════════════════════════════════════
  btnPlace.onclick = () => {
    if (AppState.stagedCard === null) return;
    btnPlace.disabled = true;

    const fanContainer = document.getElementById("fan-container");
    if (fanContainer) fanContainer.style.pointerEvents = "none";

    const committedCard = AppState.stagedCard;
    AppState.stagedCard = null;

    const result = pickCard(committedCard, houseIndex);

    placeCardInSlot(
      houseIndex,
      committedCard,
      result.isReversed,
      AppState.theme,
    );
    hideRevealPanel();

    const nextHouse = houseIndex + 1;
    if (nextHouse < 12) {
      setTimeout(() => startHouseDraw(nextHouse), 400);
    } else {
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
  document.querySelector("#spread-container").addEventListener("click", (e) => {
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
  AppState.summarySelected = [];
  updateFinalCounter(0);

  initFloatOrb("orb-float-final", "orb-bubble-final");
  orbSpeak("orb-float-final", "orb-bubble-final", t("final_speech"), 0);

  const finalPool = prepareFinalPool();
  const grid = document.getElementById("grid-3x3");
  buildGrid3x3(
    grid,
    finalPool,
    (cardNumber, summaryIdx) => {
      onSummaryCardPicked(cardNumber, summaryIdx);
    },
    AppState.theme,
  );

  const panel = document.getElementById("summary-reveal");
  if (panel) panel.hidden = true;

  const btnConfirm = document.getElementById("btn-confirm-summary");
  if (btnConfirm) {
    btnConfirm.textContent = "ยืนยันการเลือก";
    btnConfirm.hidden = true;
    btnConfirm.onclick = () => startPrayerScreen();
  }
}

function onSummaryCardPicked(cardNumber, summaryIdx) {
  const result = pickSummaryCard(cardNumber, summaryIdx);
  AppState.summaryPicked++;
  AppState.summarySelected.push({
    cardNumber,
    isReversed: result.isReversed,
    summaryIdx,
  });
  updateFinalCounter(AppState.summaryPicked);

  if (AppState.summaryPicked >= 3) {
    const btnConfirm = document.getElementById("btn-confirm-summary");
    if (btnConfirm) btnConfirm.hidden = false;
    orbSpeak(
      "orb-float-final",
      "orb-bubble-final",
      "เลือกครบแล้ว... พร้อมรับโชคชะตาหรือยัง?",
      0,
    );
  }
}

function startPrayerScreen() {
  const grid = document.getElementById("grid-3x3");
  if (grid) grid.hidden = true;

  const btnConfirm = document.getElementById("btn-confirm-summary");
  if (btnConfirm) btnConfirm.hidden = true;

  const finalHeader = document.querySelector(".final-header");
  if (finalHeader) finalHeader.hidden = true;

  // สร้าง prayer div แยกต่างหาก ไม่ทับ summary-reveal
  let prayerDiv = document.getElementById("prayer-div");
  if (!prayerDiv) {
    prayerDiv = document.createElement("div");
    prayerDiv.id = "prayer-div";
    prayerDiv.style.cssText =
      "text-align:center; padding:40px 20px; display:flex; flex-direction:column; align-items:center; gap:24px;";
    document.getElementById("screen-final").appendChild(prayerDiv);
  }
  prayerDiv.hidden = false;
  prayerDiv.innerHTML = `
  <p style="font-family:'Cinzel',serif; font-size:14px; color:var(--gold-light); line-height:2;">
    จงหลับตา<br>รวมพลังจิต<br>มุ่งความตั้งใจไปยังดวงดาว...
  </p>
  <div style="display:flex; gap:16px; justify-content:center; margin:8px 0;">
    ${AppState.summarySelected
      .map(
        (item) => `
      <div style="width:66px; height:120px; border-radius:6px; overflow:hidden; box-shadow:0 0 12px rgba(201,168,76,0.3);">
        <img src="assets/card/cardback.webp"
             style="width:100%;height:100%;object-fit:cover;"
             onerror="this.parentElement.style.background='#1a0e3a';this.parentElement.style.border='1px solid #c9a84c'">
      </div>
    `,
      )
      .join("")}
  </div>
  <button class="btn-primary" id="btn-reveal-start">เปิดเผยโชคชะตา</button>
`;
  document.getElementById("btn-reveal-start").onclick = () => {
    prayerDiv.hidden = true;
    startRevealSequence();
  };
}
function startRevealSequence() {
  const panel = document.getElementById("summary-reveal");
  if (panel) panel.hidden = true;

  AppState.revealIndex = 0;
  revealNextSummaryCard();
}

function revealNextSummaryCard() {
  const idx = AppState.revealIndex;
  if (idx >= AppState.summarySelected.length) {
    setTimeout(() => {
      AppState.phase = "result";
      showScreen("screen-result");
      initResultScreen();
    }, 600);
    return;
  }

  const item = AppState.summarySelected[idx];
  const prophecy = getCardSummary(
    item.cardNumber,
    item.isReversed,
    item.summaryIdx,
  );
  showSummaryReveal(
    item.cardNumber,
    item.isReversed,
    item.summaryIdx,
    prophecy,
  );

  const btnConfirm = document.getElementById("btn-confirm-summary");
  if (btnConfirm) {
    btnConfirm.hidden = false;
    btnConfirm.textContent = idx < 2 ? "ใบต่อไป" : "ดูผลทำนาย";
    btnConfirm.onclick = () => {
      hideSummaryReveal();
      AppState.revealIndex++;
      setTimeout(() => revealNextSummaryCard(), 400);
    };
  }
}

function bindFinalScreen() {
  // binding ทำใน initFinalScreen แล้ว
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
      const img = document.createElement("img");
      img.src = cardImagePath(AppState.zodiac.cardNumber, AppState.theme);
      img.style.cssText =
        "width:52px;height:94px;border-radius:6px;object-fit:cover;";
      img.onerror = () => {
        centerEl.innerHTML = makeDummyCard(
          AppState.zodiac.cardNumber,
          "center-card-svg",
        );
      };
      centerEl.innerHTML = "";
      centerEl.appendChild(img);
    }

    buildResultSpread(
      resultSpreadEl,
      Deck.placed,
      (houseIdx, cardNum, isRev) => {
        const prophecy = getCardProphecy(cardNum, isRev, houseIdx);
        openCardModal(cardNum, isRev, prophecy, houseIdx);
      },
      AppState.theme,
    );
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
