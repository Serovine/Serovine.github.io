// js/generator.js
let rawImageBlob = null;
let tempBaseStats = null;
let currentSelectedClass = null;

function findSaveMarker(bytes, marker) {
  for (let i = bytes.length - marker.length; i >= 0; i--) {
    let found = true;
    for (let j = 0; j < marker.length; j++) {
      if (bytes[i + j] !== marker[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

async function processImageUpload(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const marker = new TextEncoder().encode("===ISEKAI_SAVE_V1===");
  const markerIndex = findSaveMarker(bytes, marker);

  if (markerIndex !== -1) {
    try {
      const jsonBytes = bytes.subarray(markerIndex + marker.length);
      const jsonString = new TextDecoder().decode(jsonBytes);
      const loadedData = JSON.parse(jsonString);

      Object.assign(gameData, loadedData);
      rawImageBlob = file.slice(0, markerIndex);

      const blobUrl = URL.createObjectURL(rawImageBlob);
      document.getElementById("ui-player-avatar").src = blobUrl;
      document.getElementById("preview-image").src = blobUrl;

      document.getElementById("left-panel").classList.remove("hidden-panel");
      document.getElementById("right-panel").classList.remove("hidden-panel");

      updatePlayerUI();
      if (typeof updatePartyUI === "function") updatePartyUI();
      document.getElementById("ui-gold-count").innerText = gameData.gold;
      document.getElementById("ui-day-count").innerText = gameData.day;

      showModal(
        "💾 LOAD GAME SUCCESS!",
        `โหลดบันทึกนักผจญภัย: <b>[ ${gameData.player.name} ]</b><br>DAY: ${gameData.day} | ยอดเงิน: ${gameData.gold} Gold`,
        "alert",
        () => {
          if (typeof enterTown === "function") {
            enterTown();
          } else {
            switchState(4);
          }
        },
      );
      return;
    } catch (e) {
      console.error("Save data corrupted:", e);
      alert(
        "⚠️ ข้อมูลเซฟในรูปภาพนี้เสียหาย! ระบบจะสกัดพลังสร้างตัวละครใหม่แทน",
      );
    }
  }

  rawImageBlob = file;

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
