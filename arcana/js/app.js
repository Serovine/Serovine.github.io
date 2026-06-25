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
  buildDeckSelector();
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
// Screen 0 — Deck Selector
// ═══════════════════════════════════════════
const DECKS = [
  { id: "classic", name: "Classic Tarot", credit: "Arts by Rider–Waite" },
  { id: "astrologia", name: "Astrologia Tarot", credit: "Arts by me" },
  {
    id: "hololive",
    name: "HoloSphere",
    credit: "Arts by Tatsuya Ishihara C106",
  },
  { id: "fgo", name: "FGO Tarot", credit: "Art by starshadowmagician" },
  {
    id: "jojo",
    name: "JOJO Tarot",
    credit: "Original from JoJo's Bizarre Adventure",
  },
];

function bindWelcomeScreen() {
  buildDeckSelector();

  document.getElementById("btn-start").addEventListener("click", () => {
    AppState.phase = "input";
    showScreen("screen-input");
    initInputValidation();
  });
}

function buildDeckSelector() {
  const list = document.getElementById("deck-list");
  if (!list) return;
  list.innerHTML = "";

  DECKS.forEach((deck) => {
    const btn = document.createElement("button");
    btn.className =
      "deck-btn" + (deck.id === AppState.theme ? " deck-btn-active" : "");
    btn.textContent = deck.name;
    btn.dataset.id = deck.id;

    btn.addEventListener("click", () => {
      AppState.theme = deck.id;
      list
        .querySelectorAll(".deck-btn")
        .forEach((b) => b.classList.remove("deck-btn-active"));
      btn.classList.add("deck-btn-active");
      updateDeckPreview(deck);
    });

    list.appendChild(btn);
  });

  // แสดง preview deck ปัจจุบัน
  const current = DECKS.find((d) => d.id === AppState.theme) || DECKS[0];
  updateDeckPreview(current);
}

function updateDeckPreview(deck) {
  const previewCard = document.getElementById("deck-preview-card");
  const previewName = document.getElementById("deck-preview-name");
  const previewCredit = document.getElementById("deck-preview-credit");
  if (!previewCard) return;

  // สุ่มเลขไพ่ 0-21
  const randomCard = Math.floor(Math.random() * 22);
  previewCard.innerHTML = "";
  const img = document.createElement("img");
  img.src = `assets/card/${deck.id}/${cardFilename(randomCard)}`;
  img.style.cssText =
    "width:100%;height:100%;object-fit:cover;border-radius:6px;";
  img.onerror = () => {
    previewCard.innerHTML = makeDummyCard(randomCard);
  };
  previewCard.appendChild(img);

  if (previewName) previewName.textContent = deck.name;
  if (previewCredit) previewCredit.textContent = deck.credit;
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

  for (let i = 0; i <= 21; i++) {
    const img = new Image();
    img.src = cardImagePath(i, AppState.theme);
  }

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
  center.style.cursor = "pointer";
  center.addEventListener("click", () => openIdentityModal());
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
      setTimeout(() => openSummaryModal(), 400);
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
  renderResultHeader("12 house of Astrology Tarot");
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
      centerEl.style.cursor = "pointer";
      centerEl.addEventListener("click", () => openIdentityModal());
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

  // orb result screen
  const orbQuotes = [
    "การ์ด 1 ใบ สามารถตีความได้หลากหลาย บางครั้งอาจอยู่นอกเหนือในคำทำนาย",
    "โชคชะตาเป็นสิ่งถูกกำหนดโดยมนุษย์ หรือพระเจ้า หรือแค่ความบังเอิญ",
    "โหราศาสตร์เป็นศาสตร์ของความเชื่อส่วนบุคคล โปรดใช้วิจารณญาณ",
    "การทำนายซ้ำๆ บ่อยๆ เมื่อผลลัพธ์ไม่เป็นดังหวัง ไม่ได้ช่วยให้หนีจากคำทำนายแรกได้",
    "คุณไม่สามารถกำหนดได้ว่า คำทำนายจะออกมาอย่างไร แต่คุณสามารถกำหนดมื้อเย็นของคุณได้",
    "การได้รับคำทำนายว่าโชคร้าย นั่นหมายความว่า คุณมีเวลารับมือกับสิ่งที่ไม่รู้ว่าจะเกิดขึ้นหรือไม่",
  ];
  let quoteIndex = 0;

  const orbFloatResult = document.getElementById("orb-float-result");
  if (orbFloatResult) {
    orbSpeak("orb-float-result", "orb-bubble-result", orbQuotes[0], 9000);

    const orbMini = orbFloatResult.querySelector(".orb-mini");
    if (orbMini) {
      orbMini.onclick = (e) => {
        e.stopPropagation();
        quoteIndex = (quoteIndex + 1) % orbQuotes.length;
        orbSpeak(
          "orb-float-result",
          "orb-bubble-result",
          orbQuotes[quoteIndex],
          0,
        );
      };
    }
  }
  initFloatOrb("orb-float-result", "orb-bubble-result");
}

function bindResultScreen() {
  document.getElementById("btn-restart")?.addEventListener("click", () => {
    resetApp();
  });
  document.getElementById("btn-summary")?.addEventListener("click", () => {
    openSummaryModal();
  });
}

function openSummaryModal() {
  const backdrop = document.getElementById("summary-modal-backdrop");
  const titleEl = document.getElementById("summary-modal-title");
  const zodiacEl = document.getElementById("summary-modal-zodiac");
  const bodyEl = document.getElementById("summary-modal-body");

  // header
  titleEl.textContent = `ผลการทำนายโชคชะตา ของ ${AppState.userName}`;
  const zodiacName = LANG[currentLang].zodiac_names[AppState.zodiac.sign];
  zodiacEl.textContent = `ราศี: ${zodiacName}  •  ไพ่ประจำตัว: ${AppState.zodiac.cardName}`;

  // body
  let html = "";

  // summary 3 ใบ
  html += `<div class="sm-section">`;
  html += `<h3 class="sm-section-title">สรุปผลการทำนาย</h3>`;
  const summaryLabels = LANG[currentLang].summary_labels;
  Deck.summary.forEach((item, i) => {
    if (!item) return;
    const prophecy = getCardSummary(item.cardNumber, item.isReversed, i);
    html += `<p class="sm-summary-line">
      <span class="sm-summary-label">${summaryLabels[i]}</span>
      <span class="sm-summary-text">${prophecy}</span>
    </p>`;
  });
  html += `</div>`;

  // 12 houses
  html += `<div class="sm-section">`;
  html += `<h3 class="sm-section-title">โชคชะตาทั้ง 12 ราศี</h3>`;
  const houseNames = LANG[currentLang].house_names;
  for (let i = 0; i < 12; i++) {
    const placed = Deck.placed[i];
    if (!placed) continue;
    const prophecy = getCardProphecy(placed.cardNumber, placed.isReversed, i);
    html += `<p class="sm-house-line">
      <span class="sm-house-label">${houseNames[i]}</span>
      <span class="sm-house-text">${prophecy}</span>
    </p>`;
  }
  html += `</div>`;

  bodyEl.innerHTML = html;

  backdrop.hidden = false;
  backdrop.classList.add("modal-fade-in");
  setTimeout(() => backdrop.classList.remove("modal-fade-in"), 300);

  document.getElementById("summary-modal-close").onclick = () => {
    backdrop.classList.add("modal-fade-out");
    setTimeout(() => {
      backdrop.hidden = true;
      backdrop.classList.remove("modal-fade-out");
    }, 300);
  };
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
