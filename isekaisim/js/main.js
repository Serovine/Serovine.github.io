// js/main.js

// ==========================================
// 1. ฐานข้อมูล Global State ของเกม
// ==========================================
const gameData = {
  day: 1,
  gold: 150, // เริ่มต้นให้มีตังค์ติดตัวบ้าง
  activeQuest: null,
  player: {
    name: "Player",
    class: null,
    level: 1,
    rank: "F",
    exp: 0,
    maxExp: 30, // อ้างอิงจาก RANK_TABLE ตัวแรก
    power: 0,
    stats: { hp: 0, atk: 0, def: 0, spd: 0, luk: 0 },
    currentHp: 0,
    equipment: { weapon: null, armor: null, head: null, acc: null },
  },
  // จองพื้นที่ปาร์ตี้ไว้ 3 ช่องเสมอ ป้องกันบั๊ก Array length
  party: [null, null, null],
};

// ==========================================
// 2. ระบบ UI Component Injection (ลด Bloat ให้ index.html)
// ==========================================
function injectModals() {
  // เช็กก่อนว่าถูกสร้างไปหรือยัง ป้องกันการยัดโค้ดเบิ้ล
  if (document.getElementById("custom-modal-overlay")) return;

  const modalsHTML = `
        <div id="character-creation-modal">
            <div class="modal-content-professional">
                <div class="modal-header">
                    <h2>✨ สกัดพลังสำเร็จ ✨</h2>
                    <div class="name-input-container">
                        <label>NAME:</label>
                        <input type="text" id="player-name-input" placeholder="ใส่ชื่อตัวละคร..." maxlength="15" />
                    </div>
                </div>

                <div class="profile-stats-container">
                    <img id="preview-image" src="" alt="Profile" />
                    <div class="stats-wrapper">
                        <h3>STATUS</h3>
                        <div id="generated-stats" class="stat-list"></div>
                    </div>
                </div>

                <div class="class-selection-area">
                    <h3>SELECT CLASS</h3>
                    <div class="class-grid">
                        <button class="btn-class class-warrior" onclick="selectClass(this, 'Warrior')">⚔️ Warrior</button>
                        <button class="btn-class class-mage" onclick="selectClass(this, 'Mage')">🪄 Mage</button>
                        <button class="btn-class class-healer" onclick="selectClass(this, 'Healer')">✨ Healer</button>
                        <button class="btn-class class-scout" onclick="selectClass(this, 'Scout')">🏹 Scout</button>
                        <button class="btn-class class-backpacker" onclick="selectClass(this, 'Backpacker')">🎒 Backpacker</button>
                    </div>
                </div>

                <button class="btn-ok" onclick="confirmCharacter()">CONFIRM</button>
            </div>
        </div>

        <div id="custom-modal-overlay">
            <div style="background: #2a2a30; border: 2px solid #ffd700; border-radius: 8px; padding: 25px; width: 320px; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);">
                <h3 id="custom-modal-title" style="color: #ffd700; margin-bottom: 10px; font-size: 20px;">TITLE</h3>
                <p id="custom-modal-msg" style="color: #ccc; margin-bottom: 25px; font-size: 14px; line-height: 1.6;">Message here</p>
                <div id="custom-modal-buttons" style="display: flex; justify-content: space-around; gap: 15px;"></div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", modalsHTML);
}

// ==========================================
// 3. ระบบ Custom Modal Controller
// ==========================================
let customModalCallback = null;

function showModal(title, message, type, callback) {
  document.getElementById("custom-modal-title").innerHTML = title;
  document.getElementById("custom-modal-msg").innerHTML = message;

  const btnContainer = document.getElementById("custom-modal-buttons");
  btnContainer.innerHTML = ""; // ล้างปุ่มเก่า
  customModalCallback = callback;

  if (type === "alert") {
    btnContainer.innerHTML = `<button onclick="closeCustomModal(true)" class="btn-action" style="flex: 1; background: #4CAF50; box-shadow: 0 4px 0 #2e7d32;">OK</button>`;
  } else if (type === "confirm") {
    btnContainer.innerHTML = `
            <button onclick="closeCustomModal(false)" class="btn-action" style="flex: 1; background: #555; box-shadow: 0 4px 0 #333;">NO</button>
            <button onclick="closeCustomModal(true)" class="btn-action" style="flex: 1; background: #d9534f; box-shadow: 0 4px 0 #b32d2d;">YES</button>
        `;
  }

  document.getElementById("custom-modal-overlay").style.display = "flex";
}

function closeCustomModal(result) {
  document.getElementById("custom-modal-overlay").style.display = "none";
  if (customModalCallback) {
    customModalCallback(result);
  }
}

// ==========================================
// 4. Global Utility Functions (เครื่องมือส่วนกลาง)
// ==========================================
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================
// 5. Game Initializer (จุด Start)
// ==========================================
function initGame() {
  injectModals();

  if (typeof switchState === "function") {
    switchState(0);
  }
  if (typeof parseCSV === "function") {
    parseCSV();
  }
  if (typeof initTavernPool === "function") {
    initTavernPool();
  }

  console.log("[System] Game Initialized & Modals Injected Successfully.");
}

document.addEventListener("DOMContentLoaded", initGame);

// ==========================================
// 6. Game Save System
// ==========================================
async function saveGameToFile() {
  if (!rawImageBlob) {
    showModal("⚠️ ไม่สามารถบันทึกได้", "ไม่พบข้อมูลรูปภาพต้นฉบับในระบบ", "alert");
    return;
  }

  const jsonString = JSON.stringify(gameData);
  const markerAndData = "===ISEKAI_SAVE_V1===" + jsonString;
  const textBlob = new Blob([markerAndData], { type: "text/plain" });

  const finalSaveBlob = new Blob([rawImageBlob, textBlob], { type: "image/png" });

  const safeName = (gameData.player.name || "Adventurer").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const fileName = `isekai_day${gameData.day}_${safeName}.png`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(finalSaveBlob);
  link.download = fileName;
  link.click();

  showModal("💾 บันทึกสาส์นลับสำเร็จ!", `ไฟล์เซฟ <b>${fileName}</b> ถูกดาวน์โหลดแล้ว<br><span style="font-size:11px; color:#ffaa00;">(ใช้รูปนี้อัปโหลดเพื่อเล่นต่อคราวหน้าได้เลย ตัวรูปยังกดเปิดดูได้ปกติ!)</span>`, "alert");
}

// ==========================================
// 7. Mobile Tab Controller (สลับหน้าต่างมือถือ)
// ==========================================
function switchMobileTab(target) {
  const container = document.getElementById('game-container');
  if (!container) return;

  container.classList.remove('mobile-show-left', 'mobile-show-main', 'mobile-show-right');
  container.classList.add('mobile-show-' + target);

  // Safe Reset: ล้างสีเหลืองออกให้หมดก่อน แล้วค่อยเติมเป้าหมาย
  const tabs = ['left', 'main', 'right'];
  tabs.forEach(t => {
    const btn = document.getElementById('mtab-' + t);
    if (btn) btn.classList.toggle('active-m-tab', t === target);
  });
}
