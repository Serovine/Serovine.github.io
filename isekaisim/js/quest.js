// js/quest.js

let QUEST_DATABASE = [];
let currentBoardQuests = [];
let selectedQuestIndex = null;

// ==========================================
// 1. ระบบจัดการฐานข้อมูลเควส
// ==========================================
function parseCSV() {
  QUEST_DATABASE = [];
  const lines = QUEST_CSV.trim().split("\n");
  const headers = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(",");
    if (data.length !== headers.length) continue; // ป้องกันบรรทัดว่าง

    let quest = {};
    headers.forEach((header, index) => {
      let val = data[index].trim();
      if (
        ["reqParty", "reqPow", "reward", "exp", "days"].includes(header.trim())
      )
        val = Number(val);
      if (val === "None") val = null;
      quest[header.trim()] = val;
    });
    QUEST_DATABASE.push(quest);
  }
}

// ==========================================
// 2. ระบบสุ่มเควสประจำวัน (3-5 เควส + Rank Up)
// ==========================================
function generateDailyQuests() {
  if (QUEST_DATABASE.length === 0) parseCSV();

  let playerRankData =
    RANK_TABLE.find((r) => r.rank === gameData.player.rank) || RANK_TABLE[0];
  let availableQuests = QUEST_DATABASE.filter((q) => {
    let qRank = RANK_TABLE.find((r) => r.rank === q.rank);
    return qRank && qRank.weight <= playerRankData.weight;
  });

  currentBoardQuests = [];

  // 2.1 สุ่มจำนวนเควส 3 ถึง 5 เควส
  let questCount = Math.floor(Math.random() * 3) + 3;

  for (let i = 0; i < questCount; i++) {
    if (availableQuests.length === 0) break;
    const randomIndex = Math.floor(Math.random() * availableQuests.length);
    // Deep copy ป้องกันการแก้ไขอ้างอิง object ต้นฉบับ
    currentBoardQuests.push({ ...availableQuests[randomIndex] });
    availableQuests.splice(randomIndex, 1); // ลบออกกันสุ่มซ้ำ
  }

  // 2.2 แทรกเควสเลื่อนขั้น (Rank Up) ไว้บนสุดถ้า EXP เต็ม
  if (
    gameData.player.exp >= playerRankData.maxExp &&
    playerRankData.next !== "MAX"
  ) {
    const rankUpQuest = {
      name: `🔥 [TRIAL] ทดสอบเลื่อนขั้นเป็น Rank ${playerRankData.next}`,
      desc: `บททดสอบขีดจำกัดของคุณ พิสูจน์ความแข็งแกร่งด้วยพลัง`,
      type: "RankUp",
      reqClass: null,
      reqParty: 1,
      reqPow: playerRankData.weight * 120 + 250,
      rank: playerRankData.rank,
      reward: playerRankData.weight * 300,
      exp: 0,
      days: 1,
      isRankUp: true,
      targetRank: playerRankData.next,
    };
    // ดันเข้าช่องแรกสุดของ Array ให้เสนอหน้าอยู่บนสุดเสมอ
    currentBoardQuests.unshift(rankUpQuest);
  }

  renderQuestBoard();
}

// ==========================================
// 3. ลอจิกการคำนวณอัตราความสำเร็จ
// ==========================================
function calculateSuccessRate(quest) {
  // เควส Rank Up ใช้ Party Power เพียวๆ
  if (quest.isRankUp) {
    let rate = (getPartyPower() / quest.reqPow) * 100;
    return Math.min(Math.max(Math.floor(rate), 0), 100);
  }

  let rate = 0;
  let currentPartySize = 1 + gameData.party.filter((n) => n !== null).length;
  let partyPower = getPartyPower();

  let hasReqClass = quest.reqClass
    ? gameData.player.class === quest.reqClass ||
      gameData.party.some((n) => n && n.class === quest.reqClass)
    : false;
  let hasHealer =
    gameData.player.class === "Healer" ||
    gameData.party.some((n) => n && n.class === "Healer");
  let hasScout =
    gameData.player.class === "Scout" ||
    gameData.party.some((n) => n && n.class === "Scout");
  let hasBackpacker =
    gameData.player.class === "Backpacker" ||
    gameData.party.some((n) => n && n.class === "Backpacker");

  // สูตรคำนวณตามประเภทของเควส
  if (quest.type === "Combat") {
    rate = quest.reqPow > 0 ? (partyPower / quest.reqPow) * 100 : 100;
  } else if (quest.type === "Escort") {
    rate = quest.reqPow > 0 ? (partyPower / quest.reqPow) * 100 : 100;
    if (hasHealer || hasReqClass) rate += 20;
  } else if (quest.type === "Explore") {
    rate = (currentPartySize / quest.reqParty) * 80;
    if (hasScout) rate += 20;
  } else if (quest.type === "Collect") {
    rate = (currentPartySize / quest.reqParty) * 80;
    if (hasBackpacker) rate += 20;
  }

  // โบนัสอาชีพตรงกับที่เควสต้องการ
  if (hasReqClass) {
    rate += 20;
  }

  return Math.min(Math.max(Math.floor(rate), 5), 100);
}

// ==========================================
// 4. ระบบจัดการ UI ของบอร์ดเควส
// ==========================================
function renderQuestBoard() {
  const listContainer = document.getElementById("quest-list-container");
  const boardArea = document.getElementById("quest-board-area");
  const ongoingArea = document.getElementById("ongoing-quest-area");
  const btnAccept = document.getElementById("btn-accept-quest");

  if (gameData.activeQuest) {
    boardArea.style.display = "none";
    ongoingArea.style.display = "block";
    btnAccept.style.display = "none";
    return;
  }

  boardArea.style.display = "flex"; // <-- [แก้ไข] เปลี่ยนจาก block เป็น flex
  ongoingArea.style.display = "none";
  listContainer.innerHTML = "";
  selectedQuestIndex = null;
  btnAccept.style.display = "none";

  currentBoardQuests.forEach((q, index) => {
    let isRankUpTheme = q.isRankUp
      ? "border: 2px solid #ff4c4c; background: #3a1c1c;"
      : "border: 2px solid transparent; background: #444;";

    listContainer.innerHTML += `
            <div class="quest-list-item" id="quest-item-${index}" style="${isRankUpTheme} width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 5px; cursor: pointer;" onclick="selectQuest(${index})">
                <h3 style="margin-bottom: 5px; color:${q.isRankUp ? "#ff4c4c" : "#fff"};">[${q.rank}] ${q.name}</h3>
                <p style="font-size: 12px; color: #aaa;">👤 ${q.reqParty}+ | ⚔️ Pow ${q.reqPow} | 💰 ${q.reward}g</p>
            </div>
        `;
  });
}

function cancelQuest() {
  gameData.activeQuest = null;
  document.getElementById("ongoing-quest-area").style.display = "none";
  document.getElementById("quest-board-area").style.display = "flex"; // <-- [แก้ไข] เปลี่ยนจาก block เป็น flex
  renderQuestBoard();
}

function refreshQuestDetailUI() {
  let quest = gameData.activeQuest;
  if (!quest && selectedQuestIndex !== null) {
    quest = currentBoardQuests[selectedQuestIndex];
  }

  if (!quest) {
    document.getElementById("right-quest-info").innerHTML =
      '<p style="color: #888; text-align: center; margin-top: 50px;">เลือกเควสเพื่อประเมินความเสี่ยง</p>';
    return;
  }

  let reqClassHtml = quest.reqClass
    ? `<span style="color: #ffaa00;">${quest.reqClass}</span>`
    : `<span style="color: #aaa;">None</span>`;
  let successRate = calculateSuccessRate(quest);
  let rateColor =
    successRate >= 70 ? "#4CAF50" : successRate >= 40 ? "#ffaa00" : "#ff4c4c";
  let partyPower = getPartyPower();

  let rankUpNotice = quest.isRankUp
    ? `<div style="color:#ff4c4c; font-size:11px; margin-top:10px; background:#221111; padding:8px; border-radius:4px; border-left:3px solid #ff4c4c;">⚠️ <b>บททดสอบขีดจำกัด:</b><br>วัดผลจาก <b>Party Power</b> ล้วนๆ ไม่สนโบนัสอาชีพใดๆ!</div>`
    : "";

  // [ส่วนที่เพิ่มใหม่] สร้าง UI แถบ Progress Bar สำหรับเควสหลายวัน
  let progressHtml = "";
  if (quest.days > 1) {
    let currentDay = quest.currentDay || 0;
    let progressPercent = (currentDay / quest.days) * 100;
    progressHtml = `
        <div style="background: #111; padding: 10px; border-radius: 5px; margin: 15px 0; border: 1px solid #444; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; color: #ffaa00;">
                <strong>⏳ PROGRESS</strong>
                <span>${currentDay} / ${quest.days} Days</span>
            </div>
            <div style="width: 100%; height: 8px; background: #222; border-radius: 4px; overflow: hidden; border: 1px solid #000;">
                <div style="width: ${progressPercent}%; height: 100%; background: #4caf50; transition: width 0.5s;"></div>
            </div>
        </div>
    `;
  } else {
    progressHtml = `<p><strong>Duration:</strong> ⏱️ 1 Day</p>`;
  }

  document.getElementById("right-quest-info").innerHTML = `
    <h4 style="margin-bottom: 5px; color: ${quest.isRankUp ? "#ff4c4c" : "#fff"};">${quest.name}</h4>
    <p style="font-size: 12px; color: #aaa; margin-bottom: 15px; line-height: 1.4;">${quest.desc}</p>
    <p><strong>Type:</strong> ${quest.type}</p>
    <p><strong>Req Class:</strong> ${reqClassHtml}</p>
    <p><strong>Req Party:</strong> 👤 ${quest.reqParty} คน</p>
    <p><strong>Req Power:</strong> ⚔️ ${quest.reqPow} <span style="font-size: 10px; color:${partyPower >= quest.reqPow ? "#4CAF50" : "#ff4c4c"};">(Party: ${partyPower})</span></p>
    <p><strong>Reward:</strong> 💰 ${quest.reward} Gold | 🌟 ${quest.exp} EXP</p>
    ${progressHtml}
    ${rankUpNotice}
    <hr style="margin: 15px 0; border-color: #444;">
    <h3 style="color: ${rateColor}; text-align: center; transition: 0.3s;">SUCCESS RATE: ${successRate}%</h3>
  `;
}

// ==========================================
// 5. ระบบปฏิสัมพันธ์ (คลิก, รับเควส, ยกเลิก)
// ==========================================
function selectQuest(index) {
  selectedQuestIndex = index;

  // รีเซ็ตขอบเควสทั้งหมด (แต่คงสีพื้นหลังของ Rank Up ไว้)
  document.querySelectorAll(".quest-list-item").forEach((el, i) => {
    let q = currentBoardQuests[i];
    el.style.borderColor = q.isRankUp ? "#ff4c4c" : "transparent";
  });

  // ไฮไลต์เควสที่เลือกด้วยสีทอง
  document.getElementById(`quest-item-${index}`).style.borderColor = "#FFD700";
  document.getElementById("btn-accept-quest").style.display = "block";

  refreshQuestDetailUI();
}

function acceptQuest() {
  if (selectedQuestIndex === null) return;
  const quest = currentBoardQuests[selectedQuestIndex];
  quest.winRate = calculateSuccessRate(quest);
  quest.currentDay = 0; // [เพิ่ม] เซ็ตความคืบหน้าเริ่มต้น
  gameData.activeQuest = quest;

  document.getElementById("quest-board-area").style.display = "none";
  document.getElementById("ongoing-quest-area").style.display = "block";

  switchState(2);
}

function cancelQuest() {
  gameData.activeQuest = null;
  document.getElementById("ongoing-quest-area").style.display = "none";
  document.getElementById("quest-board-area").style.display = "block";
  renderQuestBoard();
}

function restForToday() {
  if (typeof initTavernPool === "function") initTavernPool();
  showModal(
    "☕ วันหยุดพักผ่อน",
    "วันนี้คุณเลือกที่จะไม่รับงาน...<br>ใช้ชีวิตส่วนตัวและเดินเล่นในเมืองเพื่อผ่อนคลาย",
    "alert",
    function () {
      switchState(4);
      if (typeof openTownSubMenu === "function") openTownSubMenu("inn");
    },
  );
}
