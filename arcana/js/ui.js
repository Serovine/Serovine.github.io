// ui.js
// render ไพ่, animation, orb, modal, theme toggle, screen transitions

// ═══════════════════════════════════════════
// State
// ═══════════════════════════════════════════

const UI = {
  currentTheme: "hololive",
  currentScreen: "screen-lang",
  orbBubbleTimer: null,
};

// ═══════════════════════════════════════════
// Screen transitions
// ═══════════════════════════════════════════

function showScreen(screenId) {
  const current = document.querySelector(".screen.active");
  const next = document.getElementById(screenId);
  if (!next || current === next) return;

  if (current) {
    current.classList.add("screen-exit");
    setTimeout(() => {
      current.classList.remove("active", "screen-exit");
    }, 400);
  }

  next.classList.add("active", "screen-enter");
  setTimeout(() => next.classList.remove("screen-enter"), 400);

  UI.currentScreen = screenId;
}

// ═══════════════════════════════════════════
// Star field background
// ═══════════════════════════════════════════

function initStarFields() {
  document.querySelectorAll(".star-field").forEach((field) => {
    field.innerHTML = "";
    const count = 80;
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      const size = Math.random() * 2.5 + 0.5;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      star.style.animationDuration = `${2 + Math.random() * 3}s`;
      field.appendChild(star);
    }
  });
}

// ═══════════════════════════════════════════
// Orb — hero (screen 0-3)
// ═══════════════════════════════════════════

function setOrbMood(orbEl, mood = "neutral") {
  // mood: neutral | lucky | unlucky | thinking | reveal
  orbEl.dataset.mood = mood;
}

// ═══════════════════════════════════════════
// Orb — floating mini (screen 4-6)
// ═══════════════════════════════════════════

/**
 * แสดง speech bubble บน floating orb
 * @param {string} orbFloatId - id ของ .orb-float element
 * @param {string} message
 * @param {number} duration - ms ก่อนหายไป (0 = ค้างไว้)
 */
function showOrbBubble(orbFloatId, message, duration = 4500) {
  const orbFloat = document.getElementById(orbFloatId);
  if (!orbFloat) return;

  const bubble = orbFloat.querySelector(".orb-bubble");
  if (!bubble) return;

  bubble.textContent = message;
  bubble.removeAttribute("hidden");
  bubble.classList.add("bubble-in");

  if (UI.orbBubbleTimer) clearTimeout(UI.orbBubbleTimer);

  if (duration > 0) {
    UI.orbBubbleTimer = setTimeout(() => {
      bubble.classList.remove("bubble-in");
      bubble.classList.add("bubble-out");
      setTimeout(() => {
        bubble.setAttribute("hidden", "");
        bubble.classList.remove("bubble-out");
      }, 300);
    }, duration);
  }
}

function hideOrbBubble(orbFloatId) {
  const orbFloat = document.getElementById(orbFloatId);
  if (!orbFloat) return;
  const bubble = orbFloat.querySelector(".orb-bubble");
  if (bubble) bubble.setAttribute("hidden", "");
}

// tap orb-float → toggle expand
function initOrbFloat(orbFloatId) {
  const orbFloat = document.getElementById(orbFloatId);
  if (!orbFloat) return;

  const mini = orbFloat.querySelector(".orb-mini");
  if (!mini) return;

  mini.addEventListener("click", () => {
    const bubble = orbFloat.querySelector(".orb-bubble");
    if (!bubble) return;
    if (bubble.hasAttribute("hidden")) {
      // ไม่มี message — pulse เฉยๆ
      mini.classList.add("orb-pulse-once");
      setTimeout(() => mini.classList.remove("orb-pulse-once"), 600);
    } else {
      bubble.setAttribute("hidden", "");
    }
  });
}

// ═══════════════════════════════════════════
// Card dummy (SVG placeholder)
// ═══════════════════════════════════════════

/**
 * สร้าง SVG placeholder สำหรับไพ่ที่ยังไม่มีรูปจริง
 * @param {number} cardNumber
 * @param {boolean} isReversed
 * @returns {string} SVG string
 */
function makeCardDummySVG(cardNumber, isReversed = false) {
  const name = CARD_NAMES[cardNumber] ?? `Card ${cardNumber}`;
  const num = cardNumber === 0 ? "0" : toRoman(cardNumber);
  const bg = isReversed ? "#1a0a2e" : "#0a0a1e";
  const accent = "#c9a84c";
  const textColor = "#e8d5a3";

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 1200" width="660" height="1200">
  <rect width="660" height="1200" fill="${bg}"/>
  <rect x="12" y="12" width="636" height="1176" fill="none" stroke="${accent}" stroke-width="2" rx="18"/>
  <rect x="24" y="24" width="612" height="1152" fill="none" stroke="${accent}" stroke-width="0.8" rx="14" opacity="0.5"/>
  <!-- corner diamonds -->
  <polygon points="50,50 66,66 50,82 34,66" fill="${accent}" opacity="0.7"/>
  <polygon points="610,50 626,66 610,82 594,66" fill="${accent}" opacity="0.7"/>
  <polygon points="50,1150 66,1134 50,1118 34,1134" fill="${accent}" opacity="0.7"/>
  <polygon points="610,1150 626,1134 610,1118 594,1134" fill="${accent}" opacity="0.7"/>
  <!-- star center -->
  <text x="330" y="560" text-anchor="middle" font-size="160" opacity="0.15" fill="${accent}">✦</text>
  <!-- roman numeral -->
  <text x="330" y="420" text-anchor="middle" font-family="serif" font-size="72" fill="${accent}" opacity="0.9">${num}</text>
  <!-- card name -->
  <text x="330" y="720" text-anchor="middle" font-family="serif" font-size="52" fill="${textColor}" letter-spacing="2">${name}</text>
  ${isReversed ? `<text x="330" y="800" text-anchor="middle" font-family="serif" font-size="30" fill="${accent}" opacity="0.7">[ Reversed ]</text>` : ""}
</svg>`)}`;
}

function toRoman(n) {
  const vals = [10, 9, 5, 4, 1];
  const syms = ["X", "IX", "V", "IV", "I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

// ═══════════════════════════════════════════
// Render card image (real or dummy)
// ═══════════════════════════════════════════

/**
 * สร้าง <img> element สำหรับไพ่
 * ถ้าโหลดรูปจริงไม่ได้ fallback เป็น SVG dummy
 */
function makeCardImg(cardNumber, isReversed = false, theme = "hololive") {
  const img = document.createElement("img");
  img.alt = CARD_NAMES[cardNumber] ?? `Card ${cardNumber}`;
  img.loading = "lazy";
  img.className = "card-img";

  const realSrc = cardImagePath(cardNumber, theme);
  img.src = realSrc;
  img.onerror = () => {
    img.src = makeCardDummySVG(cardNumber, isReversed);
    img.onerror = null;
  };

  return img;
}

// ═══════════════════════════════════════════
// Reveal panel (screen 4)
// ═══════════════════════════════════════════

/**
 * แสดง reveal panel หลังผู้ใช้จิ้มเลือกไพ่
 */
function showRevealPanel(cardNumber, isReversed, houseIndex, prophecyText) {
  const panel = document.getElementById("reveal-panel");
  const cardWrap = document.getElementById("reveal-card");
  const nameEl = document.getElementById("reveal-card-name");
  const orientEl = document.getElementById("reveal-orientation");
  const prophecyEl = document.getElementById("reveal-prophecy");

  if (!panel) return;

  // clear
  cardWrap.innerHTML = "";

  // card image
  const img = makeCardImg(cardNumber, isReversed, UI.currentTheme);
  if (isReversed) img.style.transform = "rotate(180deg)";
  cardWrap.appendChild(img);

  nameEl.textContent = CARD_NAMES[cardNumber] ?? "";
  orientEl.textContent = isReversed ? t("reversed") : t("upright");
  orientEl.className =
    "reveal-orientation " +
    (isReversed ? "orientation-reversed" : "orientation-upright");
  prophecyEl.textContent = prophecyText;

  panel.removeAttribute("hidden");
  panel.classList.add("panel-slide-up");
  setTimeout(() => panel.classList.remove("panel-slide-up"), 400);
}

function hideRevealPanel() {
  const panel = document.getElementById("reveal-panel");
  if (panel) panel.setAttribute("hidden", "");
}

// ═══════════════════════════════════════════
// Summary reveal panel (screen 5)
// ═══════════════════════════════════════════

function showSummaryPanel(cardNumber, isReversed, summaryIndex, prophecyText) {
  const panel = document.getElementById("summary-reveal");
  const cardEl = document.getElementById("summary-card");
  const labelEl = document.getElementById("summary-label");
  const nameEl = document.getElementById("summary-card-name");
  const prophecyEl = document.getElementById("summary-prophecy");

  if (!panel) return;

  cardEl.innerHTML = "";
  const img = makeCardImg(cardNumber, isReversed, UI.currentTheme);
  if (isReversed) img.style.transform = "rotate(180deg)";
  cardEl.appendChild(img);

  const labels = LANG[currentLang].summary_labels;
  labelEl.textContent = labels[summaryIndex] ?? "";
  nameEl.textContent = CARD_NAMES[cardNumber] ?? "";
  prophecyEl.textContent = prophecyText;

  panel.removeAttribute("hidden");
  panel.classList.add("panel-slide-up");
  setTimeout(() => panel.classList.remove("panel-slide-up"), 400);
}

function hideSummaryPanel() {
  const panel = document.getElementById("summary-reveal");
  if (panel) panel.setAttribute("hidden", "");
}

// ═══════════════════════════════════════════
// Modal — card detail (flip)
// ═══════════════════════════════════════════

let _modalFlipped = false;

function openCardModal(cardNumber, isReversed, houseIndex, prophecyText) {
  const backdrop = document.getElementById("modal-backdrop");
  const flipEl = document.getElementById("modal-card-flip");
  const frontEl = document.getElementById("modal-card-front");
  const titleEl = document.getElementById("modal-card-title");
  const metaEl = document.getElementById("modal-card-meta");
  const prophecyEl = document.getElementById("modal-card-prophecy");

  if (!backdrop) return;

  _modalFlipped = false;
  flipEl.classList.remove("is-flipped");

  // front = รูปไพ่
  frontEl.innerHTML = "";
  const img = makeCardImg(cardNumber, isReversed, UI.currentTheme);
  if (isReversed) img.style.transform = "rotate(180deg)";
  frontEl.appendChild(img);

  // back = ข้อมูล
  titleEl.textContent = CARD_NAMES[cardNumber] ?? "";

  // meta จาก tarotData ถ้ามี
  const data = typeof tarotData !== "undefined" ? tarotData[cardNumber] : null;
  if (data && data.info) {
    const info = data.info;
    metaEl.innerHTML = `
      <span class="meta-item">✦ ${info.element ?? ""}</span>
      <span class="meta-item">☽ ${info.planet ?? ""}</span>
      <span class="meta-item">${info.zodiac ?? ""}</span>
      <span class="meta-keyword">${info.keyword ?? ""}</span>
    `;
  } else {
    metaEl.innerHTML = "";
  }

  prophecyEl.textContent = prophecyText;

  backdrop.removeAttribute("hidden");
  backdrop.classList.add("modal-in");
  setTimeout(() => backdrop.classList.remove("modal-in"), 300);

  // tap card → flip
  flipEl.onclick = () => {
    _modalFlipped = !_modalFlipped;
    flipEl.classList.toggle("is-flipped", _modalFlipped);
  };
}

function closeCardModal() {
  const backdrop = document.getElementById("modal-backdrop");
  if (!backdrop) return;
  backdrop.classList.add("modal-out");
  setTimeout(() => {
    backdrop.setAttribute("hidden", "");
    backdrop.classList.remove("modal-out");
  }, 300);
}

function initModalClose() {
  const closeBtn = document.getElementById("modal-close");
  const backdrop = document.getElementById("modal-backdrop");

  if (closeBtn) closeBtn.addEventListener("click", closeCardModal);
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeCardModal();
    });
  }
}

// ═══════════════════════════════════════════
// Shuffle animation (screen 3)
// ═══════════════════════════════════════════

function playShuffleAnimation(onComplete) {
  const deck = document.getElementById("shuffle-deck");
  if (!deck) {
    onComplete();
    return;
  }

  const cards = deck.querySelectorAll(".shuffle-card");
  let step = 0;
  const totalSteps = 6;

  function animStep() {
    cards.forEach((c) => {
      const offset = (Math.random() - 0.5) * 40;
      const rot = (Math.random() - 0.5) * 20;
      c.style.transform = `translateX(${offset}px) rotate(${rot}deg)`;
    });
    step++;
    if (step < totalSteps) {
      setTimeout(animStep, 280);
    } else {
      // reset
      setTimeout(() => {
        cards.forEach((c) => {
          c.style.transform = "";
        });
        setTimeout(onComplete, 400);
      }, 280);
    }
  }

  animStep();
}

// ═══════════════════════════════════════════
// Theme toggle
// ═══════════════════════════════════════════

function setTheme(theme) {
  UI.currentTheme = theme;
  // re-render images ทั้งหมดที่มี .card-img
  document.querySelectorAll(".card-img").forEach((img) => {
    const cardNum = parseInt(img.closest("[data-card]")?.dataset.card);
    const isRev = img.closest(".reversed") !== null;
    if (!isNaN(cardNum)) {
      img.src = cardImagePath(cardNum, theme);
      img.onerror = () => {
        img.src = makeCardDummySVG(cardNum, isRev);
        img.onerror = null;
      };
    }
  });
}

// ═══════════════════════════════════════════
// Identity card preview (screen 2)
// ═══════════════════════════════════════════

function showIdentityCard(zodiacResult, userName) {
  const container = document.getElementById("identity-card");
  const iconEl = document.getElementById("identity-zodiac-icon");
  const zodiacNameEl = document.getElementById("identity-zodiac-name");
  const cardNameEl = document.getElementById("identity-card-name");
  const previewEl = document.getElementById("identity-card-preview");
  const speechEl = document.getElementById("identity-speech");
  const confirmBtn = document.getElementById("btn-confirm-input");

  if (!container) return;

  iconEl.textContent = zodiacResult.symbol;
  zodiacNameEl.textContent =
    LANG[currentLang].zodiac_names[zodiacResult.sign] ?? zodiacResult.sign;
  cardNameEl.textContent = zodiacResult.cardName;

  // preview image
  previewEl.innerHTML = "";
  const img = makeCardImg(zodiacResult.cardNumber, false, UI.currentTheme);
  previewEl.appendChild(img);

  speechEl.textContent = `${t("identity_speech_prefix")} ${userName} ${t("identity_speech_suffix")} "${zodiacResult.cardName}"`;

  container.removeAttribute("hidden");
  container.classList.add("identity-in");
  setTimeout(() => container.classList.remove("identity-in"), 400);

  if (confirmBtn) confirmBtn.removeAttribute("disabled");
}

// ═══════════════════════════════════════════
// Draw counter
// ═══════════════════════════════════════════

function updateDrawCounter(current, total) {
  const el = document.getElementById("draw-counter");
  if (el) el.textContent = `${current} / ${total}`;
}

function updateDrawHouseLabel(houseIndex) {
  const el = document.getElementById("draw-house-label");
  if (el) el.textContent = LANG[currentLang].house_names[houseIndex] ?? "";
}

function updateFinalCounter(picked) {
  const el = document.getElementById("final-counter");
  if (el) el.textContent = t("final_counter", { n: picked });
}

// ═══════════════════════════════════════════
// Result screen
// ═══════════════════════════════════════════

function renderResultSummaryCards(summaryCards) {
  const container = document.getElementById("result-summary-cards");
  if (!container) return;

  container.innerHTML = "";
  const labels = LANG[currentLang].summary_labels;

  summaryCards.forEach((item, i) => {
    if (!item) return;
    const wrap = document.createElement("div");
    wrap.className = "result-summary-card";
    wrap.dataset.card = item.cardNumber;

    const label = document.createElement("span");
    label.className = "result-summary-label";
    label.textContent = labels[i] ?? "";

    const img = makeCardImg(item.cardNumber, item.isReversed, UI.currentTheme);
    if (item.isReversed) img.style.transform = "rotate(180deg)";

    const name = document.createElement("span");
    name.className = "result-summary-name";
    name.textContent = CARD_NAMES[item.cardNumber] ?? "";

    wrap.appendChild(label);
    wrap.appendChild(img);
    wrap.appendChild(name);
    container.appendChild(wrap);
  });
}

function setResultTitle(userName) {
  const el = document.getElementById("result-title");
  if (el) el.textContent = userName;
}

// ═══════════════════════════════════════════
// Init all UI
// ═══════════════════════════════════════════

function initUI() {
  initStarFields();
  initModalClose();
  // init orb float listeners
  initOrbFloat("orb-float");
  initOrbFloat("orb-float-final");
  initOrbFloat("orb-float-result");
}
