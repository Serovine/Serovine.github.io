// js/town.js

let currentShopItems = [];

// เปิดหน้าเมือง
function enterTown() {
  switchState(4);
  openTownSubMenu("main");
}

// สลับเมนูย่อย
function openTownSubMenu(menu) {
  document.getElementById("town-main-menu").style.display = "none";
  document.getElementById("town-status-menu").style.display = "none";
  document.getElementById("town-shop-menu").style.display = "none";
  document.getElementById("town-inn-menu").style.display = "none";

  if (menu === "main") {
    document.getElementById("town-main-menu").style.display = "flex";
  } else if (menu === "status") {
    document.getElementById("town-status-menu").style.display = "flex";
    renderStatusMenu();
  } else if (menu === "shop") {
    document.getElementById("town-shop-menu").style.display = "flex";
    if (currentShopItems.length === 0) generateShopItems(); // ถ้าเป็นวันใหม่ สุ่มของใหม่
    renderShopMenu();
  } else if (menu === "inn") {
    document.getElementById("town-inn-menu").style.display = "flex";
    renderInnMenu();
  }
}

// ==========================================
// 1. ระบบ STATUS UPGRADE
// ==========================================
function renderStatusMenu() {
  const stats = [
    { key: "hp",  name: "❤️ HP",  baseCost: 5,  costPerPoint: 0.05, inc: 10 }, // HP +10 → Power +2
    { key: "atk", name: "⚔️ ATK", baseCost: 8,  costPerPoint: 0.10, inc: 3  }, // ATK +3 → Power +3
    { key: "def", name: "🛡️ DEF", baseCost: 8,  costPerPoint: 0.10, inc: 3  }, // DEF +3 → Power +3
    { key: "spd", name: "⚡ SPD", baseCost: 8,  costPerPoint: 0.10, inc: 3  }, // SPD +3 → Power +3
    { key: "luk", name: "🍀 LUK", baseCost: 12, costPerPoint: 0.18, inc: 2  }, // LUK +2 → Power +2
  ];

  const container = document.getElementById("town-upgrade-list");
  container.innerHTML = "";

  stats.forEach((s) => {
    let currentVal = gameData.player.stats[s.key];
    let upgradedTimes = Math.max(0, currentVal - 150);
    let cost = Math.floor(s.baseCost + upgradedTimes * s.costPerPoint);

    container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #222; padding: 10px; border-radius: 5px; margin-bottom: 10px; border-left: 3px solid #4CAF50;">
                <div style="text-align: left;">
                    <span style="font-size: 12px; color: #ccc;">${s.name}</span><br>
                    <span style="font-size: 16px; color: #fff; font-weight: bold;">${currentVal} <span style="color: #4CAF50; font-size: 10px;">(+${s.inc})</span></span>
                </div>
                <button onclick="upgradeStat('${s.key}', ${cost}, ${s.inc})" class="btn-action" style="width: auto; padding: 5px 10px; font-size: 12px; background: #4CAF50; box-shadow: 0 4px 0 #2e7d32; margin: 0;">UPGRADE 💰 ${cost}</button>
            </div>
        `;
  });
}

// อัปเกรดสเตตัส
function upgradeStat(key, cost, inc) {
  if (gameData.gold < cost) {
    showModal("💸 เงินไม่พอ", "ต้องไปลงดันเจี้ยนหาเงินมาก่อนนะ!", "alert");
    return;
  }

  // ตัดเงินและบวกสเตตัส
  gameData.gold -= cost;
  gameData.player.stats[key] += inc;
  document.getElementById("ui-gold-count").innerText = gameData.gold;

  // เลเวลจะถูกคำนวณใหม่แบบเรียลไทม์ผ่านฟังก์ชันนี้เลย!
  updatePlayerUI();
  renderStatusMenu();
}

// ==========================================
// 2. ระบบ SHOP (อัปเกรดระบบ Procedural Items)
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
    F:   { min: 5,    max: 12  },
    E:   { min: 10,   max: 20  },
    D:   { min: 18,   max: 32  },
    C:   { min: 28,   max: 45  },
    B:   { min: 40,   max: 65  },
    A:   { min: 60,   max: 95  },
    S:   { min: 85,   max: 130 },
    SS:  { min: 120,  max: 180 },
    SSS: { min: 160,  max: 240 },
    GOD: { min: 220,  max: 320 },
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

    // สุ่ม stat ตาม rank range
    let statVal = Math.floor(Math.random() * (statRange.max - statRange.min + 1)) + statRange.min;

    // ราคา = stat * 10 ± 30% (เหมือนเดิม logic ดีอยู่แล้ว)
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

function renderShopMenu() {
  const container = document.getElementById("town-shop-list");
  container.innerHTML = "";

  currentShopItems.forEach((item, index) => {
    if (item.isBought) {
      container.innerHTML += `
                <div style="display: flex; align-items: center; background: #222; padding: 10px; border-radius: 5px; opacity: 0.5;">
                    <div style="width: 48px; height: 48px; background: #111; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">${item.svg}</div>
                    <div style="flex: 1; text-align: left;">
                        <span style="font-size: 14px; color: #fff; text-decoration: line-through;">${item.name}</span><br>
                        <span style="font-size: 12px; color: #ff4c4c;">SOLD OUT</span>
                    </div>
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
                <div style="display: flex; align-items: center; background: #2a2a30; padding: 10px; border-radius: 5px; border-left: 3px solid #008CBA;">
                    <div style="width: 48px; height: 48px; background: #111; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">${item.svg}</div>
                    <div style="flex: 1; text-align: left;">
                        <span style="font-size: 14px; color: #fff; font-weight: bold;">${item.name}</span><br>
                        <span style="font-size: 11px; color: #aaa;">
                            [ ${item.type} ] | <span style="color: ${statColor};">+${item.statValue} ${item.statType.toUpperCase()}</span>
                        </span>
                    </div>
                    <button onclick="buyItem(${index})" class="btn-action" style="width: auto; padding: 6px 10px; font-size: 12px; background: #008CBA; box-shadow: 0 4px 0 #006b8f; margin: 0;">BUY 💰 ${item.cost}</button>
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

  // เตรียมข้อความแสดงไอเท็มของเดิม
  let oldItemText = "ไม่มีไอเท็มสวมใส่";
  if (oldEquipment) {
    // ถ้ามีของเดิมใส่อยู่ ให้โชว์ชื่อและสเตตัส
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
        // หักเงิน
        gameData.gold -= item.cost;
        document.getElementById("ui-gold-count").innerText = gameData.gold;
        currentShopItems[index].isBought = true;

        // 1. ถ้ามีของเดิมอยู่ ให้หักสเตตัสของเดิมออกก่อน
        if (oldEquipment) {
          p.stats[oldEquipment.statType] -= oldEquipment.statValue;
        }

        // 2. สวมใส่ของใหม่ บันทึกลง Object
        p.equipment[item.slot] = {
          name: item.name,
          statType: item.statType,
          statValue: item.statValue,
        };

        // 3. บวกสเตตัสใหม่เข้าตัวละคร
        p.stats[item.statType] += item.statValue;

        // 4. กรณีเป็น Headgear (+HP) หรือไอเท็มเพิ่มเลือด ให้บวกเลือดปัจจุบันตามไปด้วยกันเลือดแหว่ง
        if (item.statType === "hp") {
          p.currentHp += item.statValue;
        } else if (item.statType === "mp") {
          p.currentMp += item.statValue;
        }

        // สั่งรีเฟรชหน้าต่างซ้ายมือและหน้าต่างร้านค้า
        if (typeof updatePlayerUI === "function") updatePlayerUI();
        renderShopMenu();
      }
    },
  );
}

// ==========================================
// 3. ระบบ INN & SLEEP (กินข้าวข้ามวัน)
// ==========================================
function renderInnMenu() {
  const meals = [
    {
      id: "lux",
      name: "Luxurious Steak",
      desc: "มื้อหรู! ฟื้น HP เต็ม + บัฟ ATK/DEF +10% วันพรุ่งนี้",
      cost: 200,   // ~2 quests F
      svg: SVGS.lux_meal,
      color: "#FFD700",
    },
    {
      id: "reg",
      name: "Regular Soup",
      desc: "มื้อปกติ ฟื้น HP เต็ม",
      cost: 50,    // ~0.5 quest F
      svg: SVGS.reg_meal,
      color: "#4CAF50",
    },
    {
      id: "life",
      name: "Lifesaving Bread",
      desc: "ฟื้น HP กลับมา 70%",
      cost: 15,    // แค่ค่าน้ำ
      svg: SVGS.life_meal,
      color: "#ff9800",
    },
    {
      id: "starve",
      name: "Sleep",
      desc: "นอนดื้อๆ HP ไม่ฟื้น",
      cost: 0,
      svg: SVGS.bed_meal,
      color: "#555555",
    },
  ];

  const container = document.getElementById("town-inn-list");
  container.innerHTML = "";

  meals.forEach((m) => {
    container.innerHTML += `
            <div style="display: flex; align-items: center; background: #2a2a30; padding: 10px; border-radius: 5px; border-left: 3px solid ${m.color};">
                <div style="width: 48px; height: 48px; background: #111; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">${m.svg}</div>
                <div style="flex: 1; text-align: left;">
                    <span style="font-size: 14px; color: ${m.color}; font-weight: bold;">${m.name}</span><br>
                    <span style="font-size: 10px; color: #aaa;">${m.desc}</span>
                </div>
                <button onclick="eatMeal('${m.id}', ${m.cost})" class="btn-action" style="width: auto; padding: 6px 10px; font-size: 12px; background: #ff9800; box-shadow: 0 4px 0 #c66900; margin: 0;">COST 💰 ${m.cost}</button>
            </div>
        `;
  });
}

function eatMeal(type, cost) {
  if (gameData.gold < cost) {
    showModal(
      "💸 เงินไม่พอ",
      "ป้าเจ้าของร้านบอกว่าไม่มีเงินก็ไปนอนข้างถนน!",
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

        // --- [ ลอจิกฮีลเลือดตามประเภทอาหาร ] ---
        let p = gameData.player;
        if (p) {
          if (type === "lux" || type === "reg") {
            p.currentHp = p.stats.hp;
          } else if (type === "life") {
            let targetHp = Math.floor(p.stats.hp * 0.7);
            if (p.currentHp < targetHp) p.currentHp = targetHp;
          }
        }
        if (typeof updatePlayerUI === "function") updatePlayerUI(); // สั่งรีเฟรชหน้าต่างซ้ายมือ

        // --- [ ลอจิกฮีลเลือด ลูกน้อง ] ---
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

        // เอฟเฟกต์หน้าจอมืดจำลองการนอน
        document.getElementById("custom-modal-overlay").style.display = "flex";
        document.getElementById("custom-modal-title").innerHTML = "💤 Zzz...";
        document.getElementById("custom-modal-msg").innerHTML =
          "ปาร์ตี้ของคุณหลับพักผ่อน...<br>เตรียมพร้อมสำหรับการผจญภัยในวันพรุ่งนี้";
        document.getElementById("custom-modal-buttons").innerHTML = ""; // ซ่อนปุ่ม บังคับรอ

        // หน่วงเวลา 2 วินาทีแล้วเริ่มวันใหม่
        setTimeout(() => {
          document.getElementById("custom-modal-overlay").style.display =
            "none";

          // +1 วัน
          if (!gameData.day) gameData.day = 1;
          gameData.day++;
          document.getElementById("ui-day-count").innerText = gameData.day;

          // รีเซ็ตของในร้านค้าสำหรับวันใหม่
          currentShopItems = [];

          // สุ่มกระดานเควสใหม่
          if (typeof generateDailyQuests === "function") generateDailyQuests();

          // สุ่ม NPC ในโรงเตี๊ยมใหม่
          if (typeof initTavernPool === "function") initTavernPool();

          // เด้งกลับไปกระดานเควส
          switchState(1);
        }, 2000);
      }
    },
  );
}
