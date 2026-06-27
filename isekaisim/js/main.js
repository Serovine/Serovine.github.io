// js/main.js

// ==========================================
// 1. ฐานข้อมูล Global State ของเกม
// ==========================================
const gameData = {
  day: 1,
  gold: 150,
  activeQuest: null,
  player: {
    name: "Player",
    class: null,
    level: 1,
    rank: "F",
    exp: 0,
    maxExp: 30,
    power: 0,
    stats: { hp: 0, atk: 0, def: 0, spd: 0, luk: 0 },
    currentHp: 0,
    equipment: { weapon: null, armor: null, head: null, acc: null },
  },
  party: [null, null, null],
};

// ==========================================
// 2. Logic การคำนวณส่วนกลาง (Core Math)
// ==========================================
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

// ==========================================
// 3. Global Utility Functions (เครื่องมือส่วนกลาง)
// ==========================================
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================
// 4. Game Initializer (จุด Start)
// ==========================================
function initGame() {
  if (typeof switchState === "function") {
    switchState(0);
  }

  if (typeof parseCSV === "function") {
    parseCSV();
  }

  if (typeof initTavernPool === "function") {
    initTavernPool();
  }

  console.log("[System] Game Initialized Successfully.");
}

document.addEventListener("DOMContentLoaded", initGame);

// ==========================================
// 5. Game Save System
// ==========================================
async function saveGameToFile() {
  if (!rawImageBlob) {
    showModal(
      "⚠️ ไม่สามารถบันทึกได้",
      "ไม่พบข้อมูลรูปภาพต้นฉบับในระบบ",
      "alert",
    );
    return;
  }

  const jsonString = JSON.stringify(gameData);
  const markerAndData = "===ISEKAI_SAVE_V1===" + jsonString;
  const textBlob = new Blob([markerAndData], { type: "text/plain" });

  const finalSaveBlob = new Blob([rawImageBlob, textBlob], {
    type: "image/png",
  });

  const safeName = (gameData.player.name || "Adventurer")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
  const fileName = `isekai_day${gameData.day}_${safeName}.png`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(finalSaveBlob);
  link.download = fileName;
  link.click();

  showModal(
    "💾 บันทึกสำเร็จ!",
    `โปรดดาวน์โหลดไฟล์เซฟ <b>${fileName}</b> เก็บไว้เพื่อใช้เล่นต่อในคราวหน้า !<br><span style="font-size:11px; color:#ffaa00;">(ถ้าไม่ได้เซฟ กดใหม่ได้นะ)</span>`,
    "alert",
  );
}

// ฟังก์ชันสร้างข้อความรหัส Seed Code จากสถานะของเกมปัจจุบันลง Clipboard
function generateSaveSeedCode() {
  try {
    const jsonString = JSON.stringify(gameData);
    const base64Code = btoa(unescape(encodeURIComponent(jsonString)));

    // 1. ออกแบบกล่อง Modal ให้มี ID ชัดเจนสำหรับอ้างอิง และเพิ่มปุ่ม Copy เสริมเข้าไปเลย
    const modalMessage = `
        เรื่องราวถูกบันทึกเป็น Seed Code เรียบร้อยแล้ว!<br>
        <textarea id="seed-output-area" style="width: 100%; height: 75px; margin-top: 10px; background: #111; color: #ffd700; font-size: 11px; border: 1px solid #555; padding: 6px; border-radius: 4px; font-family: monospace; resize: none; word-break: break-all;" readonly></textarea>
        
        <button onclick="copySeedAgain()" id="btn-copy-again" class="btn-action" style="background: #008cba; padding: 10px; margin-top: 8px; font-size: 13px; box-shadow: 0 4px 0 #005f80;">
            📋 COPY AGAIN
        </button>
    `;

    showModal("🔑 SEED CODE CREATED", modalMessage, "alert");

    setTimeout(() => {
      const targetArea = document.getElementById("seed-output-area");
      if (targetArea) {
        targetArea.value = base64Code;
        targetArea.select();
      }
    }, 10);

    navigator.clipboard.writeText(base64Code).catch((err) => {
      console.warn("Auto-copy blocked by browser. User must copy manually.");
    });
  } catch (e) {
    console.error(e);
    alert("เกิดข้อผิดพลาดในการสร้างรหัสคีย์เซฟ");
  }
}

function copySeedAgain() {
  const targetArea = document.getElementById("seed-output-area");
  const btn = document.getElementById("btn-copy-again");

  if (targetArea && targetArea.value) {
    navigator.clipboard
      .writeText(targetArea.value)
      .then(() => {
        if (btn) {
          const originalText = btn.innerHTML;
          btn.innerHTML = "✅ COPIED!";
          btn.style.background = "#4CAF50";
          btn.style.boxShadow = "0 4px 0 #2e7d32";

          setTimeout(() => {
            btn.innerHTML = "📋 COPY AGAIN";
            btn.style.background = "#008cba";
            btn.style.boxShadow = "0 4px 0 #005f80";
          }, 1500);
        }
      })
      .catch(() => {
        alert(
          "เบราว์เซอร์บล็อกการคัดลอก โปรดกดคลิกที่กล่องข้อความแล้วกด Ctrl+C ด้วยตัวเองครับ",
        );
      });
  }
}
