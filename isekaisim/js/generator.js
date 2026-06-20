// js/generator.js

function calculatePower(stats) {
  if (!stats) return 0;
  return Math.floor(
    stats.hp / 5 + stats.spd + stats.atk + stats.def + stats.luk,
  );
}

function getPartyPower() {
  if (!gameData.player || !gameData.player.stats) return 0;
  let total = calculatePower(gameData.player.stats);

  if (Array.isArray(gameData.party)) {
    gameData.party.forEach((npc) => {
      if (npc && npc.currentHp > 0) total += calculatePower(npc.stats);
    });
  }
  return total;
}

function calculatePlayerLevel() {
  if (!gameData.player || !gameData.player.stats) return { level: 1, power: 0 };
  let power = calculatePower(gameData.player.stats);
  let level = 1;
  let req = 280;
  let step = 20;

  while (power >= req) {
    level++;
    req += step;
    step += 10;
  }
  return { level: level, power: power };
}

let tempBaseStats = null;
let currentSelectedClass = null;

function processImageUpload(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const fileSize = file.size;
  const minPool = 150,
    maxPool = 250;
  let totalPoints = (fileSize % (maxPool - minPool + 1)) + minPool;

  let currentSeed = fileSize;
  function seededRandom() {
    let x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  }

  let baseStats = { hp: 10, atk: 10, def: 10, spd: 10, luk: 10 };
  let remainingPoints = totalPoints - 50;
  const statKeys = Object.keys(baseStats);

  for (let i = 0; i < remainingPoints; i++) {
    baseStats[statKeys[Math.floor(seededRandom() * statKeys.length)]] += 1;
  }
  baseStats.hp = Math.floor(baseStats.hp * 2.5);

  tempBaseStats = baseStats;
  currentSelectedClass = null;

  document.getElementById("player-name-input").value = "";
  document
    .querySelectorAll(".btn-class")
    .forEach((btn) => btn.classList.remove("selected"));
  document.getElementById("preview-image").src = URL.createObjectURL(file);

  updateStatsUI(tempBaseStats);
  document.getElementById("character-creation-modal").style.display = "flex";
}

function selectClass(btnElement, className) {
  document
    .querySelectorAll(".btn-class")
    .forEach((btn) => btn.classList.remove("selected"));
  btnElement.classList.add("selected");
  currentSelectedClass = className;

  const bonus = CLASS_BONUS[className];
  let previewStats = {
    hp: tempBaseStats.hp + bonus.hp,
    atk: tempBaseStats.atk + bonus.atk,
    def: tempBaseStats.def + bonus.def,
    spd: tempBaseStats.spd + bonus.spd,
    luk: tempBaseStats.luk + bonus.luk,
  };
  updateStatsUI(previewStats);
}

function updateStatsUI(stats) {
  document.getElementById("generated-stats").innerHTML = `
        <div class="stat-grid-2x3">
            <div style="color: #FFD700;">🌟 Lv: 1</div>
            <div>❤️ HP: ${stats.hp}</div>
            <div>⚔️ ATK: ${stats.atk}</div>
            <div>⚡ SPD: ${stats.spd}</div>
            <div>🛡️ DEF: ${stats.def}</div>
            <div>🍀 LUK: ${stats.luk}</div>
        </div>
    `;
}

function confirmCharacter() {
  const playerName = document.getElementById("player-name-input").value.trim();
  if (!playerName) {
    showModal(
      "⚠️ ไม่พบชื่อตัวละคร",
      "กรุณาตั้งชื่อตัวละครก่อนเริ่มเกมครับ!",
      "alert",
    );
    return;
  }
  if (!currentSelectedClass) {
    showModal("⚠️ ข้อมูลไม่ครบ", "กรุณาเลือกอาชีพก่อนเริ่มเกมครับ!", "alert");
    return;
  }

  const bonus = CLASS_BONUS[currentSelectedClass];
  gameData.player.name = playerName;
  gameData.player.class = currentSelectedClass;
  gameData.player.rank = "F";
  gameData.player.exp = 0;

  gameData.player.stats = {
    hp: tempBaseStats.hp + bonus.hp,
    atk: tempBaseStats.atk + bonus.atk,
    def: tempBaseStats.def + bonus.def,
    spd: tempBaseStats.spd + bonus.spd,
    luk: tempBaseStats.luk + bonus.luk,
  };
  gameData.player.currentHp = gameData.player.stats.hp;
  gameData.player.equipment = {
    weapon: null,
    armor: null,
    head: null,
    acc: null,
  };

  document.getElementById("character-creation-modal").style.display = "none";
  switchState(1);

  document.getElementById("left-panel").classList.remove("hidden-panel");
  document.getElementById("right-panel").classList.remove("hidden-panel");

  updatePlayerUI();
  if (typeof generateDailyQuests === "function") generateDailyQuests();
}

function updatePlayerUI() {
  const p = gameData.player;
  if (!p) return;
  if (p.currentHp === undefined) p.currentHp = p.stats.hp;

  const levelData = calculatePlayerLevel();
  p.level = levelData.level;

  const avatarEl = document.getElementById("ui-player-avatar");
  const previewEl = document.getElementById("preview-image");
  if (avatarEl && previewEl) avatarEl.src = previewEl.src;

  const nameEl = document.getElementById("ui-player-name");
  if (nameEl && p.name) nameEl.innerText = `[ ${p.name.toUpperCase()} ]`;

  const classEl = document.getElementById("ui-player-class");
  if (classEl && p.class) classEl.innerText = `CLASS: ${p.class.toUpperCase()}`;

  const levelEl = document.getElementById("ui-player-level");
  if (levelEl) levelEl.innerText = `Lv. ${p.level}`;

  let hpPercent = Math.max(0, (p.currentHp / p.stats.hp) * 100);
  const hpText = document.getElementById("ui-player-hp-text");
  if (hpText) hpText.innerText = `${p.currentHp} / ${p.stats.hp}`;
  const hpBar = document.getElementById("ui-player-hp-bar");
  if (hpBar) hpBar.style.width = `${hpPercent}%`;

  const rankEl = document.getElementById("ui-player-rank");
  if (rankEl) {
    let currentRankData =
      RANK_TABLE.find((r) => r.rank === p.rank) || RANK_TABLE[0];
    rankEl.innerText = `RANK: ${p.rank || "F"}`;
    document.getElementById("ui-player-exp").innerText =
      `EXP: ${p.exp || 0} / ${currentRankData.maxExp}`;

    document.getElementById("ui-det-hp").innerText = `Max HP: ${p.stats.hp}`;
    document.getElementById("ui-det-spd").innerText = `⚡ SPD: ${p.stats.spd}`;
    document.getElementById("ui-det-atk").innerText = `⚔️ ATK: ${p.stats.atk}`;
    document.getElementById("ui-det-def").innerText = `🛡️ DEF: ${p.stats.def}`;
    document.getElementById("ui-det-luk").innerText = `🍀 LUK: ${p.stats.luk}`;

    document.getElementById("ui-eq-weapon").innerText =
      `🗡️ WEAPON: ${p.equipment?.weapon?.name || "Null"}`;
    document.getElementById("ui-eq-armor").innerText =
      `🛡️ ARMOR: ${p.equipment?.armor?.name || "Null"}`;
    document.getElementById("ui-eq-head").innerText =
      `🪖 HEAD: ${p.equipment?.head?.name || "Null"}`;
    document.getElementById("ui-eq-acc").innerText =
      `💍 ACC: ${p.equipment?.acc?.name || "Null"}`;
  }

  const leadNameEl = document.getElementById("ui-party-lead-name");
  if (leadNameEl && p.name) leadNameEl.innerText = p.name.toUpperCase();
}

function togglePlayerStatus() {
  const acc = document.getElementById("ui-player-status-accordion");
  const btn = event.currentTarget;

  if (acc.style.display === "none") {
    acc.style.display = "block";
    btn.innerHTML = "📊 HIDE STATUS 🔼";
    btn.style.background = "#666";
  } else {
    acc.style.display = "none";
    btn.innerHTML = "📊 VIEW STATUS 🔽";
    btn.style.background = "#444";
  }
}

function switchState(stateNumber) {
  document.querySelectorAll(".center-state").forEach((state) => {
    state.style.display = "none";
  });
  const targetState = document.getElementById(`state-${stateNumber}`);
  if (targetState) {
    targetState.style.display = "flex"; // <-- [แก้ไข] ล็อกเป็น flex เสมอ
  }

  const backBtn = document.getElementById("btn-back-board");
  const goDungeonBtn = document.getElementById("btn-go-dungeon");

  if (stateNumber === 2) {
    if (backBtn) backBtn.style.display = "block";
    if (goDungeonBtn) {
      goDungeonBtn.style.display = gameData.activeQuest ? "block" : "none";
    }
    if (typeof refreshQuestDetailUI === "function") {
      refreshQuestDetailUI();
    }
  } else {
    if (backBtn) backBtn.style.display = "none";
    if (goDungeonBtn) goDungeonBtn.style.display = "none";
  }

  if (stateNumber === 4) {
    if (typeof openTownSubMenu === "function") openTownSubMenu("main");
  }
}
