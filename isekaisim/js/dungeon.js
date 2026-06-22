// js/dungeon.js

let expeditionTimer = null;

function enterDungeon() {
  if (!gameData.activeQuest) return;

  switchState(3);

  // [SAFE HOOK] สั่งโหลดฉากหลัง SVG ลง State 3 ทันที
  let qType = gameData.activeQuest.type || "Combat";
  let rawSvg = SVGS[`bg_${qType.toLowerCase()}`] || SVGS.bg_escort; // ชั่วคราวถ้ายังไม่มี combat ให้ดึง escort มาใช้ก่อน
  const s3 = document.getElementById("state-3");
  if (s3 && rawSvg) {
    s3.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}')`;
  }

  document.getElementById("btn-go-dungeon").style.display = "none";
  const backBtn = document.getElementById("btn-back-board");
  if (backBtn) backBtn.style.display = "none";

  document.getElementById("dungeon-quest-name").innerText =
    gameData.activeQuest.name;
  document.getElementById("dungeon-quest-desc").innerText =
    gameData.activeQuest.desc;

  document.getElementById("dungeon-log-box").innerHTML =
    "> กำลังเตรียมตัวเดินทาง...<br>> ปาร์ตี้พร้อมแล้ว กรุณากด START เพื่อเริ่มภารกิจ<br>";
  document.getElementById("dungeon-progress-bar").style.width = "0%";
  document.getElementById("dungeon-progress-bar").style.background = "#ffaa00";

  document.getElementById("btn-start-expedition").style.display = "block";
  document.getElementById("btn-claim-reward").style.display = "none";
  document.getElementById("btn-dungeon-fail").style.display = "none";
}

function startExpedition() {
  document.getElementById("btn-start-expedition").style.display = "none";
  const logBox = document.getElementById("dungeon-log-box");
  const progressBar = document.getElementById("dungeon-progress-bar");

  const battleResult = calculateExpedition(gameData.activeQuest);
  gameData.activeQuest.isSuccess = battleResult.isSuccess;

  let progress = 0;
  let logIndex = 0;
  let timeline = battleResult.timeline;
  let stepProg = 100 / timeline.length;

  // Sync HP ทันทีที่ข้อความแต่ละบรรทัดปรากฎ!
  expeditionTimer = setInterval(() => {
    if (logIndex < timeline.length) {
      let currentStep = timeline[logIndex];
      logBox.innerHTML += currentStep.text + "<br>";
      logBox.scrollTop = logBox.scrollHeight;

      // ดึงสถานะ HP ณ เวลานั้นมาบังคับทับลงไป
      gameData.player.currentHp = currentStep.hpState.p;
      if (gameData.party && currentStep.hpState.party) {
        gameData.party.forEach((m, i) => {
          if (m && currentStep.hpState.party[i] !== null) {
            m.currentHp = currentStep.hpState.party[i];
          }
        });
      }

      // สั่งรีเฟรชกราฟิกหลอดเลือดฝั่งซ้ายมือทันที
      if (typeof updatePlayerUI === "function") updatePlayerUI();
      if (typeof updatePartyUI === "function") updatePartyUI();

      progress += stepProg;
      progressBar.style.width = progress + "%";
      logIndex++;
    } else {
      clearInterval(expeditionTimer);
      progressBar.style.width = "100%";

      if (battleResult.isSuccess) {
        progressBar.style.background = "#4CAF50";
        document.getElementById("btn-claim-reward").style.display = "block";
      } else {
        progressBar.style.background = "#ff4c4c";
        document.getElementById("btn-dungeon-fail").style.display = "block";
      }
      logBox.scrollTop = logBox.scrollHeight;

      gameData.activeQuest.tempBonusGold = battleResult.bonusGold;
    }
  }, 1200);
}

function finishExpedition() {
  let quest = gameData.activeQuest;
  if (!quest) return;

  let fledMembers = [];
  let p = gameData.player;
  let eventBonusGold = quest.tempBonusGold || 0;

  let playerKnockedOut = false;
  // เช็กว่าหัวหน้าตายไหม
  if (p.currentHp <= 0) {
    p.currentHp = 0;
    playerKnockedOut = true;
    quest.isSuccess = false;
  }

  // เช็กสมาชิกปอดแหกหนีทัพ (HP <= 10%)
  if (Array.isArray(gameData.party)) {
    gameData.party.forEach((member, index) => {
      if (member) {
        if (
          member.currentHp <= Math.max(1, Math.floor(member.stats.hp * 0.1))
        ) {
          fledMembers.push(member.name);
          gameData.party[index] = null;
        }
      }
    });
  }

  let extraLogs =
    fledMembers.length > 0
      ? `\n\n⚠️ สมาชิกหนีออกจากปาร์ตี้: ${fledMembers.join(", ")}`
      : "";
  let modalTitle = "";
  let modalMsg = "";
  let isFinalSuccess = false;

  if (playerKnockedOut) {
    modalTitle = "💀 ปาร์ตี้แตก!";
    modalMsg = `หัวหน้าปาร์ตี้หมดสติ! ปาร์ตี้ล่มสลาย ต้องหามกลับเมือง...\n(ความคืบหน้าไม่เพิ่ม)${extraLogs}`;
  } else if (quest.isSuccess) {
    if (quest.currentDay === undefined) quest.currentDay = 0;
    quest.currentDay++;

    // กรณี: ลุยครบทุกวัน (วันสุดท้าย)
    if (quest.currentDay >= quest.days) {
      isFinalSuccess = true;

      let backpackerCount = 0;
      if (
        gameData.player.class === "Backpacker" ||
        (typeof getMainClass === "function" &&
          getMainClass(gameData.player.class) === "Backpacker")
      ) {
        backpackerCount++;
      }
      if (Array.isArray(gameData.party)) {
        gameData.party.forEach((m) => {
          if (
            m &&
            (m.class === "Backpacker" ||
              (typeof getMainClass === "function" &&
                getMainClass(m.class) === "Backpacker")) &&
            m.currentHp > 0
          ) {
            backpackerCount++;
          }
        });
      }

      let finalReward = quest.reward + eventBonusGold;
      let extraRewardLog =
        eventBonusGold > 0
          ? `\n🎁 โบนัสจากอีเวนต์วันนี้: ${eventBonusGold} Gold`
          : "";

      if (quest.days > 1) {
        let multiDayBonus = Math.floor(quest.reward * 0.5);
        finalReward += multiDayBonus;
        extraRewardLog += `\n⏳ โบนัสเควสหลายวัน: ${multiDayBonus} Gold`;
      }

      if (backpackerCount > 0) {
        let bpBonus = Math.floor(quest.reward * (0.2 * backpackerCount));
        finalReward += bpBonus;
        extraRewardLog += `\n🎒 โบนัส Backpacker: ${bpBonus} Gold`;
      }

      if (!gameData.gold) gameData.gold = 0;
      gameData.gold += finalReward;

      if (quest.isRankUp) {
        gameData.player.rank = quest.targetRank;
        gameData.player.exp = 0;
        modalTitle = "🌟 RANK UP SUCCESS!";
        modalMsg = `เลื่อนขั้นเป็น [ Rank ${quest.targetRank} ] สำเร็จ!\n💰 ได้รับ ${finalReward} Gold${extraRewardLog}${extraLogs}`;
      } else {
        let expGain = Math.max(5, Math.floor(quest.reward / 10));
        if (quest.days > 1) expGain += Math.floor(expGain * 0.5);

        if (!gameData.player.exp) gameData.player.exp = 0;
        gameData.player.exp += expGain;

        let currentRankData =
          RANK_TABLE.find((r) => r.rank === gameData.player.rank) ||
          RANK_TABLE[0];
        let rankUpLog = "";
        if (
          gameData.player.exp >= currentRankData.maxExp &&
          currentRankData.next !== "MAX"
        ) {
          gameData.player.exp = currentRankData.maxExp;
          rankUpLog = `\n\n⭐ <b>[ RANK UP AVAILABLE ]</b>\nบททดสอบเลื่อนขั้นพร้อมแล้ว!`;
        }

        modalTitle = "🏆 ภารกิจสำเร็จ!";
        modalMsg = `💰 ได้รับ ${finalReward} Gold และ 🌟 ${expGain} EXP${extraRewardLog}${extraLogs}${rankUpLog}`;
      }
    } else {
      // กรณี: วันระหว่างทาง (เควสยังไม่จบ)
      modalTitle = "⛺ พักแรมระหว่างทาง";
      let dailyBonusLog = "";

      // [แก้ไข] นำเงินโบนัสเข้ากระเป๋าทันทีที่พักแรม
      if (eventBonusGold > 0) {
        if (!gameData.gold) gameData.gold = 0;
        gameData.gold += eventBonusGold;
        dailyBonusLog = `\n🎁 ได้รับโบนัสระหว่างทาง: ${eventBonusGold} Gold`;
      }

      modalMsg = `เคลียร์พื้นที่สำเร็จ! (ความคืบหน้า ${quest.currentDay} / ${quest.days})\nกลับไปเติมเสบียงที่เมืองเพื่อลุยต่อวันพรุ่งนี้${dailyBonusLog}${extraLogs}`;
    }
  } else {
    // ถอยทัพ / ล้มเหลว (จะไม่ได้รับเงินโบนัส ถือว่าทำหล่นหายไปตอนหนี)
    modalTitle = "🩹 ถอยทัพ!";
    modalMsg = `ภารกิจสะดุด ต้องหนีกลับเมืองไปตั้งหลักใหม่\n(ความคืบหน้าไม่เพิ่ม)${extraLogs}`;
  }

  // อัปเดต UI ยอดเงินให้ตรงกับความเป็นจริงเสมอ (ครอบคลุม Event โดนปล้นเงินด้วย)
  const globalGoldUi = document.getElementById("ui-gold-count");
  if (globalGoldUi) globalGoldUi.innerText = gameData.gold;

  try {
    if (typeof updatePlayerUI === "function") updatePlayerUI();
  } catch (e) {}
  try {
    if (typeof updatePartyUI === "function") updatePartyUI();
  } catch (e) {}
  if (typeof refreshQuestDetailUI === "function") refreshQuestDetailUI();

  if (
    typeof showModal === "function" &&
    document.getElementById("custom-modal-overlay")
  ) {
    showModal(modalTitle, modalMsg.replace(/\n/g, "<br>"), "alert", () =>
      returnFromDungeon(isFinalSuccess),
    );
  } else {
    alert(`${modalTitle}\n\n${modalMsg}`);
    returnFromDungeon(isFinalSuccess);
  }
}

function returnFromDungeon(isFinalSuccess) {
  if (isFinalSuccess) {
    gameData.activeQuest = null;
    document.getElementById("ongoing-quest-area").style.display = "none";
    document.getElementById("quest-board-area").style.display = "flex";

    if (typeof generateDailyQuests === "function") {
      generateDailyQuests();
    }
  } else {
    document.getElementById("ongoing-quest-area").style.display = "block";
    document.getElementById("quest-board-area").style.display = "none";
  }
  enterTown();
}
