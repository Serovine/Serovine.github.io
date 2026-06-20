// js/tinder.js

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

  const hp = Math.floor(Math.random() * 80) + 20 + level * 15;
  const atk = Math.floor(Math.random() * 40) + 5 + level * 4;
  const def = Math.floor(Math.random() * 30) + 5 + level * 4;
  const spd = Math.floor(Math.random() * 30) + 5 + level * 4;
  const luk = Math.floor(Math.random() * 30) + 1 + level * 2;

  const basePower = hp/5 + spd + atk + def + luk;
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
  if (tavernPool.length === 0) {
    document.getElementById("tinder-card-container").innerHTML =
      '<div style="height: 300px; display: flex; align-items: center; justify-content: center; text-align: center; color: #ff4c4c; font-weight: bold; flex-direction: column;"><span style="font-size: 40px; margin-bottom: 10px;">💨</span>ไม่มีนักผจญภัยเหลือในร้านแล้ว!</div>';
    document.getElementById("npc-cost").innerText = "";
    return;
  }

  const currentNPC = tavernPool[currentNpcIndex];

  document.getElementById("npc-avatar-container").innerHTML =
    currentNPC.avatarSvg;
  document.getElementById("npc-name").innerText = currentNPC.name;
  document.getElementById("npc-class").innerText = `Class: ${currentNPC.class}`;

  document.getElementById("npc-stats").innerHTML = `
      <div class="stat-grid-2x3">
          <div style="color: #FFD700;">🌟 Lv: ${currentNPC.level}</div>
          <div>❤️ HP: ${currentNPC.stats.hp}</div>
          <div>⚔️ ATK: ${currentNPC.stats.atk}</div>
          <div>⚡ SPD: ${currentNPC.stats.spd}</div>
          <div>🛡️ DEF: ${currentNPC.stats.def}</div>
          <div>🍀 LUK: ${currentNPC.stats.luk}</div>
      </div>
  `;

  let displayCost =
    gameData.day > 1 ? `💰 ${currentNPC.cost} Gold` : `🎉 FREE (Day 1)`;
  document.getElementById("npc-cost").innerHTML = `Hire: ${displayCost}`;

  const recTag = document.getElementById("npc-recommended-tag");
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

  if (recTag) {
    recTag.style.display =
      targetClass && targetClass === currentNPC.class ? "block" : "none";
  }
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

function updatePartyUI() {
  let count = 1;

  if (Array.isArray(gameData.party)) {
    gameData.party.forEach((member, index) => {
      const slot = document.getElementById("ui-party-slot-" + index);
      if (!slot) return;

      if (member) {
        count++;

        if (member.currentHp === undefined) member.currentHp = member.stats.hp;
        let hpPercent = Math.max(0, (member.currentHp / member.stats.hp) * 100);

        let miniSvg = member.avatarSvg.replace(
          /width="120" height="120"/g,
          'width="100%" height="100%"',
        );

        slot.style.padding = "8px";
        slot.style.justifyContent = "space-between";
        slot.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px; width: 75%;">
                    <div style="width: 35px; height: 35px; background: #111; border-radius: 4px; border: 1px solid #444; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        ${miniSvg}
                    </div>
                    <div style="line-height: 1.3; text-align: left; width: 100%;">
                        <span style="color:#fff; font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${member.name}</span>
                        <span style="color:#FFD700; font-size: 10px;">${member.class} Lv. ${member.level}</span>

                        <div style="width: 100%; height: 5px; background: #222; border-radius: 3px; margin-top: 4px; overflow: hidden; border: 1px solid #111;">
                            <div style="width: ${hpPercent}%; height: 100%; background: #ff4c4c; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
                <button onclick="kickNPC(${index})" style="background:#d9534f; color:white; border:none; padding:5px 6px; font-size:10px; font-weight: bold; border-radius:4px; cursor:pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">KICK</button>
            </div>
        `;
      } else {
        slot.style.padding = "10px";
        slot.style.justifyContent = "center";
        slot.innerHTML = '<span style="color: #555;">[ EMPTY ]</span>';
      }
    });
  }

  const countUi = document.getElementById("ui-party-count");
  if (countUi) countUi.innerText = count;

  if (typeof refreshQuestDetailUI === "function") {
    refreshQuestDetailUI();
  }
}

initTavernPool();
