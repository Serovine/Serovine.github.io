// js/tinder.js (ลบ updatePartyUI ออก)
let tavernPool = [];
let currentNpcIndex = 0;

if (!gameData.party) {
  gameData.party = [null, null, null];
}

function initTavernPool() {
  tavernPool = [];
  for (let i = 0; i < 8; i++) {
    tavernPool.push(createNPCData());
  }
  currentNpcIndex = 0;
  if (document.getElementById("tinder-card-container")) {
    renderTinderCard();
  }
}

function createNPCData() {
  const fName = NAME_PREFIX[Math.floor(Math.random() * NAME_PREFIX.length)];
  const lName = NAME_SUFFIX[Math.floor(Math.random() * NAME_SUFFIX.length)];
  const npcClass = NPC_CLASSES[Math.floor(Math.random() * NPC_CLASSES.length)];

  let pLevel = 1;
  if (gameData && gameData.player && gameData.player.level) {
    pLevel = gameData.player.level;
  }
  const level = Math.max(1, pLevel + Math.floor(Math.random() * 5) - 2);

  const hp = Math.floor(Math.random() * 80) + 20 + level * 20;
  const atk = Math.floor(Math.random() * 40) + 5 + level * 4;
  const def = Math.floor(Math.random() * 30) + 5 + level * 4;
  const spd = Math.floor(Math.random() * 30) + 5 + level * 4;
  const luk = Math.floor(Math.random() * 30) + 1 + level * 2;

  const basePower = hp / 5 + spd + atk + def + luk;
  const estimatedValue = basePower / 1.5 + level * 10;
  const costVariance = Math.random() * 1.0 + 0.5;
  const cost = Math.max(10, Math.floor(estimatedValue * costVariance));

  return {
    name: `${fName} ${lName}`,
    class: npcClass,
    level: level,
    stats: { hp: hp, atk: atk, def: def, spd: spd, luk: luk },
    currentHp: hp,
    cost: cost,
    avatarSvg: generateDynamicAvatar({ hp: hp, atk: atk, def: def, luk: luk }),
    quote: NPC_QUOTES[Math.floor(Math.random() * NPC_QUOTES.length)],
  };
}

function generateDynamicAvatar(stats) {
  const isFemale = stats.hp % 2 === 0;
  const skinTones = ["#ffdbac", "#f1c27d", "#e0ac69", "#8d5524", "#c68642"];
  const skinColor = skinTones[stats.luk % skinTones.length];
  const shadowColor = "rgba(0,0,0,0.2)";
  const hairColor = `hsl(${(stats.atk * 15) % 360}, 50%, 40%)`;
  const clothesColor = `hsl(${(stats.def * 20) % 360}, 60%, 45%)`;

  if (isFemale) {
    return `<svg viewBox="0 0 100 100" width="120" height="120" style="background-color: #3a3a3a; border-radius: 8px; border: 2px solid #555; image-rendering: pixelated;"><rect x="25" y="60" width="50" height="40" fill="${clothesColor}"/><rect x="40" y="50" width="20" height="10" fill="${shadowColor}"/><rect x="30" y="20" width="40" height="35" fill="${skinColor}"/><rect x="25" y="10" width="50" height="15" fill="${hairColor}"/><rect x="20" y="25" width="15" height="45" fill="${hairColor}"/><rect x="65" y="25" width="15" height="45" fill="${hairColor}"/></svg>`;
  } else {
    return `<svg viewBox="0 0 100 100" width="120" height="120" style="background-color: #3a3a3a; border-radius: 8px; border: 2px solid #555; image-rendering: pixelated;"><rect x="20" y="60" width="60" height="40" fill="${clothesColor}"/><rect x="40" y="50" width="20" height="10" fill="${shadowColor}"/><rect x="30" y="15" width="40" height="40" fill="${skinColor}"/><rect x="25" y="10" width="50" height="15" fill="${hairColor}"/><rect x="25" y="25" width="10" height="10" fill="${hairColor}"/><rect x="65" y="25" width="10" height="10" fill="${hairColor}"/></svg>`;
  }
}

function renderTinderCard() {
  const container = document.getElementById("tinder-card-container");

  if (tavernPool.length === 0) {
    container.style.width = "440px";
    container.style.minHeight = "500px";
    container.style.background = "#24211e";
    container.style.borderColor = "#554433";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.innerHTML =
      '<div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center; color: #ff4c4c; font-weight: bold; flex-direction: column;"><span style="font-size: 40px; margin-bottom: 10px;">💨</span><br>ไม่มีแฟ้มประวัตินักผจญภัยเหลือในกิลด์แล้ว!</div>';
    return;
  }

  const currentNPC = tavernPool[currentNpcIndex];
  let displayCost = gameData.day > 1 ? `💰 ${currentNPC.cost} Gold` : `✨ FREE`;

  let targetClass = null;
  if (gameData.activeQuest) {
    targetClass = gameData.activeQuest.reqClass;
  } else if (
    typeof selectedQuestIndex !== "undefined" &&
    selectedQuestIndex !== null &&
    currentBoardQuests[selectedQuestIndex]
  ) {
    targetClass = currentBoardQuests[selectedQuestIndex].reqClass;
  }

  let recTagHTML =
    targetClass && targetClass === currentNPC.class
      ? `<div style="position: absolute; top: -12px; right: -12px; background: linear-gradient(135deg, #b22222, #800000); color: #ffd700; padding: 4px 14px; font-size: 11px; font-weight: 900; border-radius: 3px; border: 2px solid #ffd700; box-shadow: 0 4px 10px rgba(0,0,0,0.8); transform: rotate(10deg); z-index: 10; letter-spacing: 1px;">
         ★ RECOMMENDED
       </div>`
      : "";

  container.style.width = "440px";
  container.style.minHeight = "500px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.background = "#24211e";
  container.style.border = "3px solid #8c7355";
  container.style.borderRadius = "6px";
  container.style.boxShadow =
    "0 12px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(140, 115, 85, 0.15)";
  container.style.padding = "20px";

  container.innerHTML = `
      ${recTagHTML}
  
      <!-- เปลี่ยนจาก style.grid ตรงๆ เป็น class="tinder-layout-grid" -->
      <div class="tinder-layout-grid" style="margin-bottom: 16px;">
          
          <!-- ท่อนที่ 1: อวตาร + ชื่อ + อาชีพ + ค่าจ้าง -->
          <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
              <div style="width: 140px; height: 140px; background: #0f0d0c; border: 2px solid #5c4a33; border-radius: 4px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; box-shadow: inset 0 0 15px rgba(0,0,0,0.8);">
                  ${currentNPC.avatarSvg}
              </div>
              
              <h3 style="color: #f0e6d2; margin: 0 0 4px 0; font-size: 17px; font-weight: 900; text-align: center; line-height: 1.2; text-shadow: 1px 1px 0px #000;">
                  ${currentNPC.name}
              </h3>
              <span style="color: #ffaa00; font-size: 11px; font-weight: bold; margin-bottom: 10px;">
                  [ ${currentNPC.class} ]
              </span>
              
              <div style="background: #141210; border: 1px solid #3d342c; padding: 5px 10px; border-radius: 4px; width: 100%; text-align: center; box-sizing: border-box; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);">
                  <span style="color: #a89274; font-size: 11px; font-weight: bold; margin-right: 4px;">FEE:</span>
                  <span style="color: #ffd700; font-size: 12px; font-weight: 900;">${displayCost}</span>
              </div>
          </div>
  
          <!-- ท่อนที่ 2: สเตตัส (ย้ายมาคล้องคอกับ class ด้านล่างแทน) -->
          <div class="tinder-stats-box" style="background: #141210; border: 1px solid #362f28; border-radius: 4px; padding: 12px 15px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; box-sizing: border-box; box-shadow: inset 0 2px 8px rgba(0,0,0,0.9);">
              <div style="color: #FFD700; font-weight: 900; border-bottom: 1px solid #2a241e; padding-bottom: 6px; margin-bottom: 2px;">🌟 Level: ${currentNPC.level}</div>
              <div style="color: #ff6b6b;">❤️ Max HP: ${currentNPC.stats.hp}</div>
              <div style="color: #ffaa00;">⚔️ ATK: ${currentNPC.stats.atk}</div>
              <div style="color: #4dabf7;">⚡ SPD: ${currentNPC.stats.spd}</div>
              <div style="color: #69db7c;">🛡️ DEF: ${currentNPC.stats.def}</div>
              <div style="color: #cc5de8;">🍀 LUK: ${currentNPC.stats.luk}</div>
          </div>
  
      </div>
  
      <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; background: #1a1816; border: 1px solid #3d342c; border-left: 4px solid #c5a059; padding: 12px 16px; font-size: 13px; color: #e6d8c8; font-style: italic; margin-bottom: 18px; border-radius: 2px; text-align: center; box-shadow: 2px 2px 6px rgba(0,0,0,0.6); line-height: 1.5;">
          "${currentNPC.quote || "ไม่มีบันทึกคำพูดในแฟ้มประวัติ"}"
      </div>
  
      <button onclick="acceptNPC()" class="signboard-btn">
          📜 SIGN CONTRACT
      </button>
    `;
}

function browseNPC(direction) {
  if (tavernPool.length === 0) return;
  currentNpcIndex += direction;
  if (currentNpcIndex < 0) currentNpcIndex = tavernPool.length - 1;
  if (currentNpcIndex >= tavernPool.length) currentNpcIndex = 0;
  renderTinderCard();
}

function rejectNPC() {
  if (tavernPool.length === 0) return;
  const npcName = tavernPool[currentNpcIndex].name;
  const msg =
    "คุณแน่ใจหรือไม่ที่จะปฏิเสธ <b>" +
    npcName +
    "</b> ?<br><span style='color:#ff4c4c; font-size:12px;'>(พวกเขาจะออกจากร้านและไม่โผล่มาอีก)</span>";

  showModal("👋 ปฏิเสธนักผจญภัย", msg, "confirm", function (isYes) {
    if (isYes) {
      tavernPool.splice(currentNpcIndex, 1);
      if (currentNpcIndex >= tavernPool.length) currentNpcIndex = 0;
      renderTinderCard();
    }
  });
}

function acceptNPC() {
  if (tavernPool.length === 0) return;

  if (!Array.isArray(gameData.party) || gameData.party.length !== 3) {
    gameData.party = [null, null, null];
  }

  const partySize = gameData.party.filter((n) => n !== null).length;
  if (partySize >= 3) {
    showModal(
      "⚠️ ปาร์ตี้เต็ม",
      "ปาร์ตี้ของคุณเต็มแล้ว!<br>(รับสมาชิกเพิ่มได้สูงสุด 3 คน)",
      "alert",
    );
    return;
  }

  const currentNPC = tavernPool[currentNpcIndex];
  let actualCost = gameData.day > 1 ? currentNPC.cost : 0;

  if (gameData.gold < actualCost) {
    showModal("💸 เงินไม่พอ", "คุณมีเงินไม่พอจ้างนักผจญภัยคนนี้!", "alert");
    return;
  }

  const emptyIndex = gameData.party.indexOf(null);
  if (emptyIndex !== -1) {
    gameData.gold -= actualCost;
    const goldUi = document.getElementById("ui-gold-count");
    if (goldUi) goldUi.innerText = gameData.gold;

    gameData.party[emptyIndex] = currentNPC;
    updatePartyUI();

    tavernPool.splice(currentNpcIndex, 1);
    if (currentNpcIndex >= tavernPool.length) currentNpcIndex = 0;

    renderTinderCard();
  }
}

function kickNPC(index) {
  if (!gameData.party[index]) return;
  const npcName = gameData.party[index].name;

  showModal(
    "🥾 ไล่ออกจากปาร์ตี้",
    "ต้องการเตะ <b>" + npcName + "</b> ออกจากปาร์ตี้ใช่ไหม?",
    "confirm",
    function (isYes) {
      if (isYes) {
        gameData.party[index] = null;
        updatePartyUI();
      }
    },
  );
}

initTavernPool();
