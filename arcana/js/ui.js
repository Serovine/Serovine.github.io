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
    }, 350);
  }

  next.classList.add("active", "screen-enter");
  setTimeout(() => {
    next.classList.remove("screen-enter");
  }, 350);

  UI.currentScreen = screenId;
}

// ═══════════════════════════════════════════
// Star field background
// ═══════════════════════════════════════════

function initStarFields() {
  document.querySelectorAll(".star-field").forEach(field => {
    field.innerHTML = "";
    const count = 80;
    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
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
  // mood: neutral | excited | mystical | warning
  orbEl.dataset.mood = mood;
}

// ═══════════════════════════════════════════
// Orb — floating mini (screen 4-6)
// ═══════════════════════════════════════════

/**
 * แสดง speech bubble บน floating orb
 * @param {string} floatOrbId - id ของ .orb-float element
 * @param {string} bubbleId   - id ของ .orb-bubble element
 * @param {string} message
 * @param {number} duration   - ms ก่อนหาย (0 = ไม่หาย)
 */
function orbSpeak(floatOrbId, bubbleId, message, duration = 4500) {
  const bubble = document.getElementById(bubbleId);
  if (!bubble) return;

  bubble.textContent = message;
  bubble.hidden = false;
  bubble.classList.add("bubble-pop");
  setTimeout(() => bubble.classList.remove("bubble-pop"), 300);

  if (UI.orbBubbleTimer) clearTimeout(UI.orbBubbleTimer);
  if (duration > 0) {
    UI.orbBubbleTimer = setTimeout(() => {
      bubble.classList.add("bubble-fade");
      setTimeout(() => {
        bubble.hidden = true;
        bubble.classList.remove("bubble-fade");
      }, 300);
    }, duration);
  }
}

function initFloatOrb(floatOrbId, bubbleId) {
  const orbFloat = document.getElementById(floatOrbId);
  if (!orbFloat) return;

  orbFloat.addEventListener("click", () => {
    const bubble = document.getElementById(bubbleId);
    if (!bubble) return;
    if (bubble.hidden) {
      bubble.hidden = false;
      bubble.classList.add("bubble-pop");
      setTimeout(() => bubble.classList.remove("bubble-pop"), 300);
    } else {
      bubble.hidden = true;
    }
  });
}

// ═══════════════════════════════════════════
// Identity card (screen 2)
// ═══════════════════════════════════════════

function renderIdentityCard(zodiacResult, userName) {
  const card = document.getElementById("identity-card");
  const icon = document.getElementById("identity-zodiac-icon");
  const zodiacName = document.getElementById("identity-zodiac-name");
  const cardName = document.getElementById("identity-card-name");
  const preview = document.getElementById("identity-card-preview");
  const speech = document.getElementById("identity-speech");

  icon.textContent = zodiacResult.symbol;
  zodiacName.textContent = t(`zodiac_names.${zodiacResult.sign}`) ||
    LANG[currentLang].zodiac_names[zodiacResult.sign];
  cardName.textContent = zodiacResult.cardName;

  // dummy card preview
  preview.innerHTML = makeDummyCard(zodiacResult.cardNumber, "identity-dummy");

  const prefix = t("identity_speech_prefix");
  const suffix = t("identity_speech_suffix");
  speech.textContent = `${prefix} ${userName} ${suffix} "${zodiacResult.cardName}"`;

  card.hidden = false;
  card.classList.add("identity-reveal");
  setTimeout(() => card.classList.remove("identity-reveal"), 500);
}

// ═══════════════════════════════════════════
// Dummy card SVG (placeholder ก่อนมีรูปจริง)
// ═══════════════════════════════════════════

function makeDummyCard(cardNumber, className = "") {
  const name = CARD_NAMES[cardNumber] || `Card ${cardNumber}`;
  const num = String(cardNumber).padStart(2, "0");
  return `
    <svg class="dummy-card-svg ${className}"
         viewBox="0 0 66 120"
         xmlns="http://www.w3.org/2000/svg">
      <rect width="66" height="120" rx="4" ry="4"
            fill="#0a0a1a" stroke="#c9a84c" stroke-width="1.5"/>
      <rect x="3" y="3" width="60" height="114" rx="3" ry="3"
            fill="none" stroke="#c9a84c" stroke-width="0.5" opacity="0.4"/>
      <!-- corner diamonds -->
      <polygon points="8,8 11,5 14,8 11,11" fill="#c9a84c" opacity="0.6"/>
      <polygon points="52,8 55,5 58,8 55,11" fill="#c9a84c" opacity="0.6"/>
      <polygon points="8,112 11,109 14,112 11,115" fill="#c9a84c" opacity="0.6"/>
      <polygon points="52,112 55,109 58,112 55,115" fill="#c9a84c" opacity="0.6"/>
      <!-- number -->
      <text x="33" y="52" text-anchor="middle"
            font-family="Cinzel, serif" font-size="18" fill="#c9a84c">${num}</text>
      <!-- divider -->
      <line x1="12" y1="58" x2="54" y2="58" stroke="#c9a84c" stroke-width="0.5" opacity="0.5"/>
      <!-- name (wrap manually for SVG) -->
      <text x="33" y="76" text-anchor="middle"
            font-family="Cinzel, serif" font-size="5.5" fill="#e8d5a0"
            letter-spacing="0.5">${name.toUpperCase()}</text>
    </svg>`;
}

// ═══════════════════════════════════════════
// Reveal panel (screen 4 — after pick)
// ═══════════════════════════════════════════

function showRevealPanel(cardNumber, isReversed, houseIndex, prophecy) {
  const panel = document.getElementById("reveal-panel");
  const cardEl = document.getElementById("reveal-card");
  const nameEl = document.getElementById("reveal-card-name");
  const orientEl = document.getElementById("reveal-orientation");
  const prophecyEl = document.getElementById("reveal-prophecy");

  // render card image หรือ dummy
  cardEl.innerHTML = makeDummyCard(cardNumber);
  if (isReversed) cardEl.classList.add("reversed");
  else cardEl.classList.remove("reversed");

  nameEl.textContent = CARD_NAMES[cardNumber];
  orientEl.textContent = isReversed ? t("reversed") : t("upright");
  orientEl.dataset.type = isReversed ? "reversed" : "upright";
  prophecyEl.textContent = prophecy;

  panel.hidden = false;
  panel.classList.add("panel-slide-up");
  setTimeout(() => panel.classList.remove("panel-slide-up"), 400);
}

function hideRevealPanel() {
  const panel = document.getElementById("reveal-panel");
  panel.classList.add("panel-slide-down");
  setTimeout(() => {
    panel.hidden = true;
    panel.classList.remove("panel-slide-down");
  }, 300);
}

// ═══════════════════════════════════════════
// Summary reveal panel (screen 5)
// ═══════════════════════════════════════════

function showSummaryReveal(cardNumber, isReversed, summaryIndex, prophecy) {
  const panel = document.getElementById("summary-reveal");
  const cardEl = document.getElementById("summary-card");
  const labelEl = document.getElementById("summary-label");
  const nameEl = document.getElementById("summary-card-name");
  const prophecyEl = document.getElementById("summary-prophecy");

  cardEl.innerHTML = makeDummyCard(cardNumber);
  if (isReversed) cardEl.classList.add("reversed");
  else cardEl.classList.remove("reversed");

  const labels = LANG[currentLang].summary_labels;
  labelEl.textContent = labels[summaryIndex] || "";
  nameEl.textContent = CARD_NAMES[cardNumber];
  prophecyEl.textContent = prophecy;

  panel.hidden = false;
  panel.classList.add("panel-slide-up");
  setTimeout(() => panel.classList.remove("panel-slide-up"), 400);
}

function hideSummaryReveal() {
  const panel = document.getElementById("summary-reveal");
  panel.classList.add("panel-slide-down");
  setTimeout(() => {
    panel.hidden = true;
    panel.classList.remove("panel-slide-down");
  }, 300);
}

// ═══════════════════════════════════════════
// Draw counter
// ═══════════════════════════════════════════

function updateDrawCounter(current, total) {
  const el = document.getElementById("draw-counter");
  if (el) el.textContent = `${current} / ${total}`;
}

function updateHouseLabel(houseIndex) {
  const el = document.getElementById("draw-house-label");
  if (!el) return;
  const names = LANG[currentLang].house_names;
  el.textContent = names[houseIndex] || "";
  el.classList.add("label-flash");
  setTimeout(() => el.classList.remove("label-flash"), 400);
}

function updateFinalCounter(picked) {
  const el = document.getElementById("final-counter");
  if (el) el.textContent = t("final_counter", { n: picked });
}

// ═══════════════════════════════════════════
// Card Modal (flip detail)
// ═══════════════════════════════════════════

function openCardModal(cardNumber, isReversed, prophecy, houseIndex) {
  const backdrop = document.getElementById("modal-backdrop");
  const flipEl = document.getElementById("modal-card-flip");
  const frontEl = document.getElementById("modal-card-front");
  const titleEl = document.getElementById("modal-card-title");
  const metaEl = document.getElementById("modal-card-meta");
  const prophecyEl = document.getElementById("modal-card-prophecy");

  // reset flip state
  flipEl.classList.remove("flipped");

  // front = รูปไพ่
  frontEl.innerHTML = makeDummyCard(cardNumber, "modal-dummy");
  if (isReversed) frontEl.classList.add("reversed");
  else frontEl.classList.remove("reversed");

  // back = ข้อมูล
  titleEl.textContent = CARD_NAMES[cardNumber];

  const orientation = isReversed ? t("reversed") : t("upright");
  const houseName = houseIndex !== undefined
    ? LANG[currentLang].house_names[houseIndex]
    : "";
  const luckKey = isReversed ? "luck_unlucky" : "luck_lucky";

  metaEl.innerHTML = `
    <span class="meta-orientation ${isReversed ? "reversed" : "upright"}">${orientation}</span>
    ${houseName ? `<span class="meta-house">${houseName}</span>` : ""}
    <span class="meta-luck">${t(luckKey)}</span>
  `;

  prophecyEl.textContent = prophecy;

  // flip on tap
  flipEl.onclick = () => flipEl.classList.toggle("flipped");

  backdrop.hidden = false;
  backdrop.classList.add("modal-fade-in");
  setTimeout(() => backdrop.classList.remove("modal-fade-in"), 300);
}

function closeCardModal() {
  const backdrop = document.getElementById("modal-backdrop");
  backdrop.classList.add("modal-fade-out");
  setTimeout(() => {
    backdrop.hidden = true;
    backdrop.classList.remove("modal-fade-out");
    document.getElementById("modal-card-flip").classList.remove("flipped");
  }, 300);
}

function initModalClose() {
  document.getElementById("modal-close").addEventListener("click", closeCardModal);
  document.getElementById("modal-backdrop").addEventListener("click", e => {
    if (e.target === document.getElementById("modal-backdrop")) closeCardModal();
  });
}

// ═══════════════════════════════════════════
// Theme toggle
// ═══════════════════════════════════════════

function setTheme(theme) {
  UI.currentTheme = theme;
  document.body.dataset.theme = theme;
  // refresh รูปไพ่ทุกใบที่แสดงอยู่
  document.querySelectorAll(".spread-card img, .reveal-card img").forEach(img => {
    const cardNum = parseInt(img.closest("[data-card]")?.dataset.card);
    if (!isNaN(cardNum)) img.src = cardImagePath(cardNum, theme);
  });
}

// ═══════════════════════════════════════════
// Result screen
// ═══════════════════════════════════════════

function renderResultHeader(userName) {
  const titleEl = document.getElementById("result-title");
  if (titleEl) titleEl.textContent = userName;
}

function renderResultSummaryCards(summaryData) {
  const container = document.getElementById("result-summary-cards");
  if (!container) return;
  container.innerHTML = "";

  const labels = LANG[currentLang].summary_labels;

  summaryData.forEach((item, i) => {
  if (!item) return;
  const wrap = document.createElement("div");
  wrap.className = "result-summary-item";

  const label = document.createElement("span");
  label.className = "result-summary-label";
  label.textContent = labels[i] || "";

  const cardDiv = document.createElement("div");
  cardDiv.className = "result-summary-card" + (item.isReversed ? " reversed" : "");

  const img = document.createElement("img");
  img.src = cardImagePath(item.cardNumber, AppState?.theme || "hololive");
  img.alt = CARD_NAMES[item.cardNumber];
  img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:6px;";
  img.onerror = () => {
    cardDiv.innerHTML = makeDummyCard(item.cardNumber);
  };
  cardDiv.appendChild(img);

  const name = document.createElement("span");
  name.className = "result-summary-name";
  name.textContent = CARD_NAMES[item.cardNumber];

  wrap.appendChild(label);
  wrap.appendChild(cardDiv);
  wrap.appendChild(name);
  container.appendChild(wrap);
});
}
// ═══════════════════════════════════════════
// Shuffle animation
// ═══════════════════════════════════════════

function playShuffleAnimation(onComplete) {
  const deck = document.getElementById("shuffle-deck");
  if (!deck) { onComplete?.(); return; }

  deck.classList.add("shuffle-animate");
  // animation 2.5s แล้ว callback
  setTimeout(() => {
    deck.classList.remove("shuffle-animate");
    onComplete?.();
  }, 2500);
}

// ═══════════════════════════════════════════
// Input validation helper
// ═══════════════════════════════════════════

function validateInputs() {
  const name = document.getElementById("user-name")?.value.trim();
  const dob = document.getElementById("user-dob")?.value;
  const btn = document.getElementById("btn-confirm-input");
  if (btn) btn.disabled = !(name && dob);
}

function initInputValidation() {
  document.getElementById("user-name")?.addEventListener("input", validateInputs);
  document.getElementById("user-dob")?.addEventListener("change", () => {
    validateInputs();
    const dob = document.getElementById("user-dob")?.value;
    const name = document.getElementById("user-name")?.value.trim();
    if (dob) {
      const zodiac = getZodiacFromString(dob);
      renderIdentityCard(zodiac, name || "...");
    }
  });
  document.getElementById("user-name")?.addEventListener("input", () => {
    const dob = document.getElementById("user-dob")?.value;
    const name = document.getElementById("user-name")?.value.trim();
    if (dob && name) {
      const zodiac = getZodiacFromString(dob);
      renderIdentityCard(zodiac, name);
    }
  });
}
