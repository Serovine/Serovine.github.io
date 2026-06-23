// spread.js
// คำนวณตำแหน่ง 12 house บนวงกลม + จัดการ DOM spread

// ═══════════════════════════════════════════
// House definitions
// ═══════════════════════════════════════════

// 12 houses เรียงทวนเข็มนาฬิกา เริ่ม House 1 = 9 o'clock (180°)
const HOUSE_ANGLES = [
  180, // House 1  — 9 o'clock
  210, // House 2  — 8 o'clock
  240, // House 3  — 7 o'clock
  270, // House 4  — 6 o'clock
  300, // House 5  — 5 o'clock
  330, // House 6  — 4 o'clock
  0, // House 7  — 3 o'clock
  30, // House 8  — 2 o'clock
  60, // House 9  — 1 o'clock
  90, // House 10 — 12 o'clock
  120, // House 11 — 11 o'clock
  150, // House 12 — 10 o'clock
];

// ═══════════════════════════════════════════
// Coordinate calculation
// ═══════════════════════════════════════════

function getHousePosition(houseIndex, radiusPct = 38) {
  const angleDeg = HOUSE_ANGLES[houseIndex];
  const angleRad = (angleDeg * Math.PI) / 180;
  const x = 50 + radiusPct * Math.cos(angleRad);
  const y = 50 + radiusPct * Math.sin(angleRad);
  const rotate = angleDeg + 90;
  return { x: `${x.toFixed(2)}%`, y: `${y.toFixed(2)}%`, rotate };
}

// ═══════════════════════════════════════════
// Build spread DOM
// ═══════════════════════════════════════════

function buildSpreadSlots(container) {
  container.querySelectorAll(".house-slot").forEach((el) => el.remove());

  for (let i = 0; i < 12; i++) {
    const pos = getHousePosition(i);
    const slot = document.createElement("div");
    slot.className = "house-slot house-slot-empty";
    slot.dataset.house = i;
    slot.style.left = pos.x;
    slot.style.top = pos.y;
    slot.style.transform = `translate(-50%, -50%) rotate(${pos.rotate}deg)`;

    const label = document.createElement("span");
    label.className = "house-slot-label";
    label.textContent = i + 1;
    slot.appendChild(label);

    container.appendChild(slot);
  }
}

function placeCardInSlot(
  houseIndex,
  cardNumber,
  isReversed,
  theme = "hololive",
) {
  const slot = document.querySelector(
    `.house-slot[data-house="${houseIndex}"]`,
  );
  if (!slot) return;

  slot.classList.remove("house-slot-empty");
  slot.classList.add("house-slot-filled");
  slot.dataset.card = cardNumber;
  slot.dataset.reversed = isReversed ? "1" : "0";

  const card = document.createElement("div");
  card.className = "spread-card" + (isReversed ? " reversed" : "");

  const img = document.createElement("img");
  img.src = cardImagePath(cardNumber, theme);
  img.alt = CARD_NAMES[cardNumber];
  img.loading = "lazy";
  img.onerror = () => {
    card.classList.add("card-dummy-fallback");
  };

  card.appendChild(img);
  slot.innerHTML = "";
  slot.appendChild(card);

  slot.classList.add("slot-fly-in");
  setTimeout(() => slot.classList.remove("slot-fly-in"), 600);
}

// ═══════════════════════════════════════════
// Fan arc layout
// ═══════════════════════════════════════════

function buildFan(container, cardNumbers, onPick, theme = "hololive") {
  container.innerHTML = "";

  const count = cardNumbers.length;
  const totalSpread = Math.min(count * 14, 120);
  const step = count > 1 ? totalSpread / (count - 1) : 0;
  const startAngle = -totalSpread / 2;

  cardNumbers.forEach((cardNum, i) => {
    const angleDeg = startAngle + step * i;
    const wrapper = document.createElement("div");
    wrapper.className = "fan-card-wrap";
    wrapper.style.transform = `rotate(${angleDeg}deg)`;
    wrapper.style.zIndex = i;

    const card = document.createElement("div");
    card.className = "fan-card";
    card.dataset.card = cardNum;

    const back = document.createElement("div");
    back.className = "fan-card-back";
    card.appendChild(back);

    card.addEventListener("click", () => {
      container
        .querySelectorAll(".fan-card")
        .forEach((c) => c.classList.remove("fan-selected"));
      card.classList.add("fan-selected");
      onPick(cardNum);
    });

    card.addEventListener("pointerenter", () => {
      wrapper.style.transform = `rotate(${angleDeg}deg) translateY(-18px)`;
    });
    card.addEventListener("pointerleave", () => {
      if (!card.classList.contains("fan-selected")) {
        wrapper.style.transform = `rotate(${angleDeg}deg)`;
      }
    });

    wrapper.appendChild(card);
    container.appendChild(wrapper);
  });
}

// ═══════════════════════════════════════════
// 3x3 grid layout
// ═══════════════════════════════════════════

function buildGrid3x3(container, cardNumbers, onPick, theme = "hololive") {
  container.innerHTML = "";
  let pickedCount = 0;

  cardNumbers.forEach((cardNum) => {
    const cell = document.createElement("div");
    cell.className = "grid-card-cell";
    cell.dataset.card = cardNum;

    const card = document.createElement("div");
    card.className = "grid-card";

    const back = document.createElement("div");
    back.className = "grid-card-back";
    card.appendChild(back);
    cell.appendChild(card);

    cell.addEventListener("click", () => {
      if (pickedCount >= 3) return;
      if (cell.classList.contains("grid-picked")) return;

      cell.classList.add("grid-picked");
      const summaryIdx = pickedCount;
      pickedCount++;

      const badge = document.createElement("span");
      badge.className = "grid-pick-badge";
      badge.textContent = summaryIdx + 1;
      cell.appendChild(badge);

      onPick(cardNum, summaryIdx);
    });

    container.appendChild(cell);
  });
}

// ═══════════════════════════════════════════
// Result spread — read-only, tappable
// ═══════════════════════════════════════════

function buildResultSpread(container, placedCards, onTap, theme = "hololive") {
  container.querySelectorAll(".house-slot").forEach((el) => el.remove());

  for (let i = 0; i < 12; i++) {
    const pos = getHousePosition(i);
    const data = placedCards[i];
    if (!data) continue;

    const slot = document.createElement("div");
    slot.className = "house-slot house-slot-filled result-slot";
    slot.dataset.house = i;
    slot.style.left = pos.x;
    slot.style.top = pos.y;
    slot.style.transform = `translate(-50%, -50%) rotate(${pos.rotate}deg)`;

    const card = document.createElement("div");
    card.className = "spread-card" + (data.isReversed ? " reversed" : "");

    const img = document.createElement("img");
    img.src = cardImagePath(data.cardNumber, theme);
    img.alt = CARD_NAMES[data.cardNumber];
    img.loading = "lazy";
    img.onerror = () => {
      card.classList.add("card-dummy-fallback");
    };

    card.appendChild(img);
    slot.appendChild(card);
    slot.addEventListener("click", () =>
      onTap(i, data.cardNumber, data.isReversed),
    );
    container.appendChild(slot);
  }
}
