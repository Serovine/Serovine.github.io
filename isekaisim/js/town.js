// js/town.js

let currentShopItems = [];

function enterTown() {
  switchState(4);
  const s4 = document.getElementById("state-4");
  if (s4 && SVGS.bg_town) {
    s4.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(SVGS.bg_town)}')`;
  }
  openTownSubMenu("main");
}

function openTownSubMenu(menu) {
  document.getElementById("town-main-menu").style.display = "none";
  document.getElementById("town-status-menu").style.display = "none";
  document.getElementById("town-shop-menu").style.display = "none";
  document.getElementById("town-inn-menu").style.display = "none";
  if (document.getElementById("town-save-menu")) {
    document.getElementById("town-save-menu").style.display = "none";
  }

  if (menu === "main") {
    document.getElementById("town-main-menu").style.display = "flex";
  } else if (menu === "status") {
    document.getElementById("town-status-menu").style.display = "flex";
    renderStatusMenu();
  } else if (menu === "shop") {
    document.getElementById("town-shop-menu").style.display = "flex";
    if (currentShopItems.length === 0) generateShopItems();
    renderShopMenu();
  } else if (menu === "inn") {
    document.getElementById("town-inn-menu").style.display = "flex";
    renderInnMenu();
  } else if (menu === "save") {
    const saveEl = document.getElementById("town-save-menu");
    if (saveEl) {
      saveEl.style.display = "flex";
      renderSaveMenu();
    }
  }
}

// ==========================================
// 1. TRAINING MENU
// ==========================================
function renderStatusMenu() {
  const stats = [
    { key: "hp", name: "❤️ Max HP", baseCost: 5, costPerPoint: 0.05, inc: 10 },
    { key: "atk", name: "⚔️ Attack", baseCost: 8, costPerPoint: 0.1, inc: 3 },
    { key: "def", name: "🛡️ Defense", baseCost: 8, costPerPoint: 0.1, inc: 3 },
    { key: "spd", name: "⚡ Speed", baseCost: 8, costPerPoint: 0.1, inc: 3 },
    { key: "luk", name: "🍀 Luck", baseCost: 12, costPerPoint: 0.18, inc: 2 },
  ];

  const container = document.getElementById("town-upgrade-list");
  if (!container) return;
  container.innerHTML = "";

  stats.forEach((s) => {
    let currentVal = gameData.player.stats[s.key];
    let upgradedTimes = Math.max(0, currentVal - 150); // สูตรเดิมของคุณ 100%
    let cost = Math.floor(s.baseCost + upgradedTimes * s.costPerPoint);

    container.innerHTML += `
        <div class="town-item-card" style="border-left: 4px solid #ff4c4c;">
            <div class="item-text-stack">
                <p style="color: #a89274;">${s.name}</p>
                <h4>${currentVal} <span style="color: #ff4c4c; font-size: 11px;">(+${s.inc})</span></h4>
            </div>
            <button onclick="upgradeStat('${s.key}', ${cost}, ${s.inc})" class="btn-buy-3d gym-btn-style">
                TRAIN 💰 ${cost}g
            </button>
        </div>
    `;
  });
}

// อัปเกรดสเตตัส
function upgradeStat(key, cost, inc) {
  if (gameData.gold < cost) {
    showModal("💸 Not enough money", "เงินไม่พออัพ  ไปหามาเพิ่มก่อน", "alert");
    return;
  }

  // ตัดเงินและบวกสเตตัส
  gameData.gold -= cost;
  gameData.player.stats[key] += inc;
  document.getElementById("ui-gold-count").innerText = gameData.gold;

  updatePlayerUI();
  renderStatusMenu();
}

// ==========================================
// 2. SHOP EQUIPMENT
// ==========================================
function generateShopItems() {
  const PREFIXES = [
    "Rusty",
    "Wooden",
    "Bronze",
    "Iron",
    "Steel",
    "Silver",
    "Golden",
    "Platinum",
    "Mithril",
    "Cursed",
    "Blessed",
    "Ancient",
    "Mystic",
    "Dragon",
    "Dog",
    "Duck",
    "Beautiful",
    "Ugly",
    "Super",
    "Heroic",
  ];

  const ITEM_TYPES = [
    {
      type: "Weapon",
      slot: "weapon",
      statType: "atk",
      svg: SVGS.weapon,
      names: ["Sword", "Blade", "Axe", "Spear", "Dagger", "Mace", "Katana"],
    },
    {
      type: "Armor",
      slot: "armor",
      statType: "def",
      svg: SVGS.armor,
      names: ["Vest", "Mail", "Plate", "Armor", "Cloak", "Robe", "Tunic"],
    },
    {
      type: "Headgear",
      slot: "head",
      statType: "hp",
      svg: SVGS.head,
      names: ["Helm", "Hat", "Crown", "Bandana", "Casque", "Hood"],
    },
    {
      type: "Accessory",
      slot: "acc",
      statType: "luk",
      svg: SVGS.acc,
      names: ["Ring", "Amulet", "Necklace", "Bangle", "Charm", "Earring"],
    },
  ];

  // ── Rank → stat range table ──
  const RANK_STAT_TABLE = {
    F: { min: 5, max: 40 },
    E: { min: 30, max: 60 },
    D: { min: 50, max: 90 },
    C: { min: 70, max: 100 },
    B: { min: 90, max: 120 },
    A: { min: 100, max: 150 },
    S: { min: 120, max: 180 },
    SS: { min: 150, max: 250 },
    SSS: { min: 200, max: 320 },
    GOD: { min: 200, max: 500 },
  };

  const playerRank = gameData.player.rank || "F";
  const statRange = RANK_STAT_TABLE[playerRank] || RANK_STAT_TABLE["F"];

  currentShopItems = [];
  let usedNames = new Set();

  while (currentShopItems.length < 5) {
    const cat = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const baseName = cat.names[Math.floor(Math.random() * cat.names.length)];
    const fullName = `${prefix} ${baseName}`;

    if (usedNames.has(fullName)) continue;
    usedNames.add(fullName);

    let statVal =
      Math.floor(Math.random() * (statRange.max - statRange.min + 1)) +
      statRange.min;

    let basePrice = statVal * 10;
    let priceVariance = Math.random() * 0.6 + 0.7;
    let finalCost = Math.floor(basePrice * priceVariance);

    currentShopItems.push({
      name: fullName,
      type: cat.type,
      slot: cat.slot,
      statType: cat.statType,
      statValue: statVal,
      cost: finalCost,
      svg: cat.svg,
      isBought: false,
    });
  }
}

// ==========================================
// 2. EQUIPMENT SHOP
// ==========================================
function renderShopMenu() {
  const container = document.getElementById("town-shop-list");
  if (!container) return;
  container.innerHTML = "";

  currentShopItems.forEach((item, index) => {
    if (item.isBought) {
      container.innerHTML += `
          <div class="town-item-card" style="opacity: 0.4; border-left: 4px solid #555;">
              <div class="item-icon-frame">${item.svg}</div>
              <div class="item-text-stack">
                  <h4 style="text-decoration: line-through; color: #888;">${item.name}</h4>
                  <p style="color: #ff4c4c;">❌ SOLD OUT</p>
              </div>
              <button class="btn-buy-3d" style="background: #333; cursor: not-allowed;" disabled>BOUGHT</button>
          </div>
      `;
    } else {
      let statColor =
        item.statType === "hp"
          ? "#ff4c4c"
          : item.statType === "def"
            ? "#008CBA"
            : "#FFD700";
      container.innerHTML += `
          <div class="town-item-card" style="border-left: 4px solid #008cba;">
              <div class="item-icon-frame">${item.svg}</div>
              <div class="item-text-stack">
                  <h4>${item.name}</h4>
                  <p style="color: #aaa;">[ ${item.type} ] <span style="color: ${statColor}; font-weight: bold;">+${item.statValue} ${item.statType.toUpperCase()}</span></p>
              </div>
              <button onclick="buyItem(${index})" class="btn-buy-3d shop-btn-style">
                  BUY 💰 ${item.cost}g
                </button>
          </div>
      `;
    }
  });
}

function buyItem(index) {
  const item = currentShopItems[index];
  if (gameData.gold < item.cost) {
    showModal(
      "💸 เงินไม่พอ",
      "หาเงินมาเพิ่มก่อนเถ้าแก่ถึงจะยอมขายให้!",
      "alert",
    );
    return;
  }

  let p = gameData.player;
  let oldEquipment = p.equipment[item.slot];

  let oldItemText = "ไม่มีไอเท็มสวมใส่";
  if (oldEquipment) {
    oldItemText = `<b>${oldEquipment.name}</b> (+${oldEquipment.statValue} ${oldEquipment.statType.toUpperCase()})`;
  }

  showModal(
    "🛒 ยืนยันการซื้อ",
    `ต้องการซื้อ <b>${item.name}</b> (+${item.statValue} ${item.statType.toUpperCase()})<br>ในราคา 💰 ${item.cost} Gold ใช่หรือไม่?<br><br>
    <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; margin-bottom: 8px; font-size: 13px;">
      <span style="color:#aaa;">ของที่ใส่อยู่ปัจจุบัน (${item.slot.toUpperCase()}):</span><br>
      <span style="color:#4CAF50;">${oldItemText}</span>
    </div>
    <span style="color:#ffaa00; font-size: 11px;">(สวมใส่ทันที และจะถูกแทนที่ไอเท็มเก่า)</span>`,
    "confirm",
    function (isYes) {
      if (isYes) {
        gameData.gold -= item.cost;
        document.getElementById("ui-gold-count").innerText = gameData.gold;
        currentShopItems[index].isBought = true;

        if (oldEquipment) {
          p.stats[oldEquipment.statType] -= oldEquipment.statValue;
        }

        p.equipment[item.slot] = {
          name: item.name,
          statType: item.statType,
          statValue: item.statValue,
        };

        p.stats[item.statType] += item.statValue;

        if (item.statType === "hp") {
          p.currentHp += item.statValue;
        } else if (item.statType === "mp") {
          p.currentMp += item.statValue;
        }

        if (typeof updatePlayerUI === "function") updatePlayerUI();
        renderShopMenu();
      }
    },
  );
}

// ==========================================
// 3. SAVE MENU CONTROLLER
// ==========================================
function renderSaveMenu() {
  const container = document.getElementById("town-save-list");
  if (!container) return;

  container.innerHTML = `
      <div class="town-item-card" style="border-left: 4px solid #4caf50;">
          <div class="item-text-stack">
              <h4>1. Save to PNG (Original)</h4>
              <p style="color: #bbb;">ฝังข้อมูลเซฟลงในไฟล์รูปภาพดั้งเดิม</p>
          </div>
          <button onclick="saveGameToFile()" class="btn-buy-3d" style="background: linear-gradient(180deg, #4caf50, #2e7d32); box-shadow: 0 4px 0 #1b5e20;">SAVE PNG</button>
      </div>
      <div class="town-item-card" style="border-left: 4px solid #008cba;">
          <div class="item-text-stack">
              <h4>2. Create Seed Code</h4>
              <p style="color: #bbb;">สร้างรหัสสำหรับบันทึกการผจญภัย</p>
          </div>
          <button onclick="generateSaveSeedCode()" class="btn-buy-3d shop-btn-style">GET SEED</button>
      </div>
  `;
}

// ==========================================
// 4. INN & SLEEP
// ==========================================
function renderInnMenu() {
  const meals = [
    {
      id: "lux",
      name: "Luxurious Steak",
      desc: "มื้อหรู! ฟื้น HP เต็ม 100% พร้อมรับบัฟ Pow+20% วันพรุ่งนี้",
      cost: 200,
      svg: SVGS.lux_meal,
      color: "#FFD700",
    },
    {
      id: "reg",
      name: "Regular Meal",
      desc: "มื้ออาหารปกติ ฟื้นฟู HP กลับมาเต็ม 100%",
      cost: 50,
      svg: SVGS.reg_meal,
      color: "#4CAF50",
    },
    {
      id: "life",
      name: "Lifesaving Bread",
      desc: "ขนมปังประทังชีวิต ฟื้นฟู HP ขั้นต่ำที่ 70%",
      cost: 10,
      svg: SVGS.life_meal,
      color: "#ff9800",
    },
    {
      id: "starve",
      name: "Sleep",
      desc: "เข้าพักผ่อนทันทีโดยไม่ทานอาหาร",
      cost: 0,
      svg: SVGS.bed_meal,
      color: "#888888",
    },
  ];

  const container = document.getElementById("town-inn-list");
  if (!container) return;
  container.innerHTML = "";

  meals.forEach((m) => {
    container.innerHTML += `
        <div class="town-item-card" style="border-left: 4px solid ${m.color};">
            <div class="item-icon-frame">${m.svg}</div>
            <div class="item-text-stack">
                <h4 style="color: ${m.color};">${m.name}</h4>
                <p style="color: #bbb;">${m.desc}</p>
            </div>
            <button onclick="eatMeal('${m.id}', ${m.cost})" class="btn-buy-3d inn-btn-style" style="background: ${m.cost > 0 ? "" : "linear-gradient(180deg, #607d8b, #37474f)"}; box-shadow: ${m.cost > 0 ? "" : "0 4px 0 #263238"};">
                ${m.cost > 0 ? `ORDER 💰 ${m.cost}g` : `REST ✨ FREE`}
            </button>
        </div>
    `;
  });
}

function eatMeal(type, cost) {
  if (gameData.gold < cost) {
    showModal(
      "💸 Not enough money",
      "ไม่มีเงินจ่ายค่าอาหาร ไปหาเพิ่มเงินก่อน !",
      "alert",
    );
    return;
  }

  showModal(
    "🍲 ทานอาหาร & พักผ่อน",
    "ปาร์ตี้จะเข้าพักผ่อนและเริ่มต้นวันใหม่ทันที ต้องการยืนยันหรือไม่?",
    "confirm",
    function (isYes) {
      if (isYes) {
        gameData.gold -= cost;
        document.getElementById("ui-gold-count").innerText = gameData.gold;

        if (type === "lux") {
          gameData.hasLuxBuff = true;
        } else {
          gameData.hasLuxBuff = false;
        }

        let p = gameData.player;
        if (p) {
          if (type === "lux" || type === "reg") {
            p.currentHp = p.stats.hp;
          } else if (type === "life") {
            let targetHp = Math.floor(p.stats.hp * 0.7);
            if (p.currentHp < targetHp) p.currentHp = targetHp;
          }
        }
        if (typeof updatePlayerUI === "function") updatePlayerUI();

        if (Array.isArray(gameData.party)) {
          gameData.party.forEach((member) => {
            if (member) {
              if (type === "lux" || type === "reg") {
                member.currentHp = member.stats.hp;
              } else if (type === "life") {
                let targetHp = Math.floor(member.stats.hp * 0.7);
                if (member.currentHp < targetHp) member.currentHp = targetHp;
              }
            }
          });
        }
        if (typeof updatePartyUI === "function") updatePartyUI();

        document.getElementById("custom-modal-overlay").style.display = "flex";
        document.getElementById("custom-modal-title").innerHTML = "💤 Zzz...";
        document.getElementById("custom-modal-msg").innerHTML =
          "ปาร์ตี้ของคุณหลับพักผ่อน...<br>เตรียมพร้อมสำหรับการผจญภัยในวันพรุ่งนี้";
        document.getElementById("custom-modal-buttons").innerHTML = "";

        setTimeout(() => {
          document.getElementById("custom-modal-overlay").style.display =
            "none";

          if (!gameData.day) gameData.day = 1;
          gameData.day++;
          document.getElementById("ui-day-count").innerText = gameData.day;

          currentShopItems = [];
          if (typeof generateDailyQuests === "function") generateDailyQuests();
          if (typeof initTavernPool === "function") initTavernPool();

          switchState(1);
        }, 2000);
      }
    },
  );
}
