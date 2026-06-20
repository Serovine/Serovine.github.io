// js/battle.js

let dungeonRunCount = 0;

function getMainClass(className) {
  if (!className) return "None";
  return CLASS_ALIASES[className] || className;
}

function getPartyInfo() {
  let info = {
    totalAtk: 0,
    totalDef: 0,
    totalSpd: 0,
    totalLuk: 0,
    hasHealer: false,
    healerNames: [],
    hasScout: false,
    scoutNames: [],
    hasBackpacker: false,
    memberCount: 0,
  };

  let p = gameData.player;
  if (p.currentHp === undefined) p.currentHp = p.stats.hp;

  if (p.currentHp > 0) {
    let mainPClass = getMainClass(p.class);
    info.totalAtk += p.stats.atk;
    info.totalDef += p.stats.def;
    info.totalSpd += p.stats.spd;
    info.totalLuk += p.stats.luk;
    if (mainPClass === "Healer") {
      info.hasHealer = true;
      info.healerNames.push(gameData.player.name || "คุณ");
    }
    if (mainPClass === "Scout") {
      info.hasScout = true;
      info.scoutNames.push(p.name || "คุณ");
    }
    if (mainPClass === "Backpacker") info.hasBackpacker = true;
    info.memberCount++;
  }

  if (Array.isArray(gameData.party)) {
    gameData.party.forEach((npc) => {
      if (npc) {
        if (npc.currentHp === undefined) npc.currentHp = npc.stats.hp;
        if (npc.currentHp > 0) {
          let mainClass = getMainClass(npc.class);
          info.totalAtk += npc.stats.atk;
          info.totalDef += npc.stats.def;
          info.totalSpd += npc.stats.spd;
          info.totalLuk += npc.stats.luk;
          if (mainClass === "Healer") {
            info.hasHealer = true;
            info.healerNames.push(npc.name);
          }
          if (mainClass === "Scout") {
            info.hasScout = true;
            info.scoutNames.push(npc.name);
          }
          if (mainClass === "Backpacker") info.hasBackpacker = true;
          info.memberCount++;
        }
      }
    });
  }
  return info;
}

// [ลอจิกใหม่] กระจายดาเมจ 3 รูปแบบ หัก HP ตรงๆ เดี๋ยวนั้นเลย
function applyDamageToParty(totalDamage) {
  if (totalDamage <= 0) return;

  let aliveMembers = [];
  if (gameData.player.currentHp > 0) aliveMembers.push(gameData.player);
  if (Array.isArray(gameData.party)) {
    gameData.party.forEach((npc) => {
      if (npc && npc.currentHp > 0) aliveMembers.push(npc);
    });
  }

  let n = aliveMembers.length;
  if (n === 0) return;

  // สลับตำแหน่งเพื่อแรนด้อมคนที่ซวย
  aliveMembers.sort(() => Math.random() - 0.5);
  let distType = Math.floor(Math.random() * 3) + 1;

  if (n === 1) {
    aliveMembers[0].currentHp = Math.max(
      0,
      aliveMembers[0].currentHp - totalDamage,
    );
    return;
  }

  if (distType === 1) {
    // แบบ 1: หารเท่ากันทุกคน
    let splitDmg = Math.ceil(totalDamage / n);
    aliveMembers.forEach(
      (m) => (m.currentHp = Math.max(0, m.currentHp - splitDmg)),
    );
  } else if (distType === 2) {
    // แบบ 2: คนนึงโดน 50% ที่เหลือหารเท่ากัน
    let mainDmg = Math.ceil(totalDamage * 0.5);
    let restDmg = Math.ceil((totalDamage - mainDmg) / (n - 1));
    aliveMembers[0].currentHp = Math.max(
      0,
      aliveMembers[0].currentHp - mainDmg,
    );
    for (let i = 1; i < n; i++) {
      aliveMembers[i].currentHp = Math.max(
        0,
        aliveMembers[i].currentHp - restDmg,
      );
    }
  } else if (distType === 3) {
    // แบบ 3: โดน 2 คน คนละ 50%
    let halfDmg = Math.ceil(totalDamage * 0.5);
    aliveMembers[0].currentHp = Math.max(
      0,
      aliveMembers[0].currentHp - halfDmg,
    );
    aliveMembers[1].currentHp = Math.max(
      0,
      aliveMembers[1].currentHp - (totalDamage - halfDmg),
    );
  }
}

function applyHealToParty(healAmount) {
  let p = gameData.player;
  if (p.currentHp > 0)
    p.currentHp = Math.min(p.stats.hp, p.currentHp + healAmount);
  if (Array.isArray(gameData.party)) {
    gameData.party.forEach((npc) => {
      if (npc && npc.currentHp > 0)
        npc.currentHp = Math.min(npc.stats.hp, npc.currentHp + healAmount);
    });
  }
}

function triggerRandomEvent(partyInfo) {
  dungeonRunCount++;
  if (Math.random() <= 0.2 || dungeonRunCount >= 5) {
    dungeonRunCount = 0;
    let validEvents = RANDOM_EVENTS.filter((ev) => {
      if (ev.cond === "none") return true;
      if (ev.cond === "scout" && partyInfo.hasScout) return true;
      if (ev.cond === "full" && partyInfo.memberCount === 4) return true;
      if (ev.cond === "rich" && gameData.gold > 500) return true;
      return false;
    });
    if (validEvents.length > 0)
      return validEvents[Math.floor(Math.random() * validEvents.length)];
  }
  return null;
}

function calculateExpedition(quest) {
  let timeline = [];
  let pInfo = getPartyInfo();
  let partyPower = Math.floor(
    gameData.player.stats.hp / 5 +
    pInfo.totalAtk + pInfo.totalDef + pInfo.totalSpd + pInfo.totalLuk
  );
  let ratio = partyPower / quest.reqPow;
  let isSuccess = false;
  let bonusGold = 0;

  // ระบบ Snapshot: ถ่ายรูป HP ปัจจุบันแนบไปกับข้อความ Log ทุกบรรทัด
  function addLog(text) {
    let snap = { p: Math.max(0, gameData.player.currentHp), party: [] };
    if (gameData.party) {
      gameData.party.forEach((m) =>
        snap.party.push(m ? Math.max(0, m.currentHp) : null),
      );
    }
    timeline.push({ text: text, hpState: snap });
  }

  let qType = quest.type;
  if (
    quest.isRankUp &&
    !["Combat", "Escort", "Explore", "Collect"].includes(qType)
  ) {
    qType = "Combat";
  }

  let dayStr =
    quest.days > 1
      ? ` (วันที่ ${(quest.currentDay || 0) + 1}/${quest.days})`
      : "";
  addLog(`> [SYSTEM] เริ่มภารกิจ: ${quest.name}${dayStr}...`);
  addLog(`> กำลังประมวลผลสภาพแวดล้อม...`);

  let eventSkipDamage = false;
  let eventFreeWin = false;
  let ev = triggerRandomEvent(pInfo);

  if (ev) {
    addLog(`<br><span style="color: #bb86fc;">> ❓ [EVENT] ${ev.text}</span>`);
    if (ev.effect === "heal") {
      applyHealToParty(999);
    }
    if (ev.effect === "gold") {
      bonusGold += ev.value;
    }
    if (ev.effect === "skip_dmg") {
      eventSkipDamage = true;
    }
    if (ev.effect === "free_win") {
      eventFreeWin = true;
    }
    if (ev.effect === "dmg_party") {
      applyDamageToParty(ev.value);
    }
    if (ev.effect === "lose_gold") {
      gameData.gold = Math.floor(gameData.gold * 0.8);
    }
    if (ev.effect === "member_leave") {
      let pList = gameData.party;
      let idx = pList.findIndex((n) => n !== null);
      if (idx !== -1) pList[idx] = null;
    }
    addLog(`<span style="color: #ffaa00;">> ↳ [RESULT] ${ev.res}</span><br>`);
  }

  if (eventFreeWin) {
    addLog(`> 🎉 [SUCCESS] ภารกิจสำเร็จลุล่วงด้วยปาฏิหาริย์!`);
    return { timeline, isSuccess: true, bonusGold };
  }

  // ----------------------
  // ---- COMBAT QUEST ----
  // ----------------------
  if (qType === "Combat") {
    addLog(`> ⚠️ เจอมอนสเตอร์เป้าหมาย...`);
    addLog(`> ⚔️ เข้าปะทะ!`);

    let mHp = quest.reqPow;
    let mAtk = Math.floor(quest.reqPow * 0.3);
    let dmgCap = Math.floor(quest.reqPow * 0.8); // cap แทน 100 ตายตัว
    let turn = 1;

    while (mHp > 0 && gameData.player.currentHp > 0) {
      let basePDmg = Math.floor(quest.reqPow * 0.25 * ratio);
      let pDmg = Math.floor(basePDmg * (0.8 + Math.random() * 0.4));
      pDmg = Math.max(Math.floor(quest.reqPow * 0.08), pDmg); // floor 8% of mHp
      mHp -= pDmg;
      addLog(
        `> [Turn ${turn}] ปาร์ตี้ระดมโจมตี สร้างความเสียหาย ${pDmg} แต้ม!`,
      );

      if (mHp > 0) {
        let mDmg = Math.floor(mAtk * (quest.reqPow / (quest.reqPow + pInfo.totalDef)));
        mDmg = Math.max(Math.floor(quest.reqPow * 0.03), mDmg); // floor 3% of reqPow
        if (eventSkipDamage) mDmg = 0;
        applyDamageToParty(mDmg); // ดาเมจลดตรงนี้
        addLog(
          `> [Turn ${turn}] มอนสเตอร์เป้าหมาย สวนกลับ! ปาร์ตี้รับดาเมจรวม ${mDmg} แต้ม`,
        );
      }
      if (pInfo.hasHealer) {
        applyHealToParty(Math.floor(quest.reqPow * 0.05));
        let hName =
          pInfo.healerNames[
            Math.floor(Math.random() * pInfo.healerNames.length)
          ];
        addLog(`> ✨ [${hName}] ร่ายเวทปฐมพยาบาล ฟื้นฟูบาดแผลให้ปาร์ตี้`);
      }
      turn++;
      if (turn > 10) break;
    }
    if (mHp <= 0) {
      addLog(`> 💀 มอนสเตอร์เป้าหมาย ถูกกำจัด!`);
      isSuccess = true;
    }

    // ----------------------
    // ---- ESCORT QUEST ----
    // ----------------------
  } else if (qType === "Escort") {
    let waves = Math.floor(Math.random() * 4) + 2; // 2-5 เวฟ
    let waveMulti = [0.12, 0.20, 0.30, 0.42, 0.56]; // เพิ่มขึ้นเรื่อยๆ
    addLog(`> ขบวนเริ่มเดินทางเข้าสู่เขตอันตราย...`);
    for (let i = 1; i <= waves; i++) {
      if (gameData.player.currentHp <= 0) break;
      let d = eventSkipDamage
        ? 0
        : Math.floor(quest.reqPow * waveMulti[i-1] * (quest.reqPow / (quest.reqPow + pInfo.totalDef)));
      d = Math.max(Math.floor(quest.reqPow * 0.05), d);
      applyDamageToParty(d);
      addLog(
        `> 🛡️ พบมอนสเตอร์เป้าหมายดักซุ่มโจมตี! ปาร์ตี้ต้านทานสำเร็จ (รับดาเมจ ${d} แต้ม)`,
      );
      if (pInfo.hasHealer) {
        applyHealToParty(Math.floor(quest.reqPow * 0.05));
        let hName =
          pInfo.healerNames[
            Math.floor(Math.random() * pInfo.healerNames.length)
          ];
        addLog(`> ✨ [${hName}] ร่ายเวทปฐมพยาบาล ฟื้นฟูบาดแผลให้ปาร์ตี้`);
      }
    }
    if (gameData.player.currentHp > 0) isSuccess = true;

    // ----------------------
    // ---- EXPLORE QUEST ----
    // ----------------------
  } else if (qType === "Explore") {
      addLog(`> 🧭 ปาร์ตี้เริ่มแยกย้ายค้นหาเบาะแส...`);
      const EX_TEXTS = [
        "มอนสเตอร์เป้าหมายซุ่มโจมตี",
        "กลไกกับดักมรณะทำงาน",
        "หมอกอาบยาพิษปกคลุมพื้นที่",
      ];
  
      let nodes = Math.floor(Math.random() * 4) + 2; // 2-5 node แทน hardcode 2
  
      for (let i = 0; i < nodes; i++) {
        if (gameData.player.currentHp <= 0) break;
        let txt = EX_TEXTS[Math.floor(Math.random() * EX_TEXTS.length)];
        addLog(`> ⚠️ พบ${txt}! (ระบบทอยแต้มหลบหลีก...)`);
  
        let threshold = quest.reqPow * 1.5; // แทน hardcode 100
        let roll = (pInfo.totalSpd + pInfo.totalLuk)
                 + (pInfo.hasScout ? quest.reqPow * 0.3 : 0)
                 + (Math.random() * quest.reqPow * 0.5);
  
        if (roll > threshold || eventSkipDamage) {
          addLog(`> 🏃 ${pInfo.hasScout ? "[Scout] ตาไว! พาทีม" : "ปาร์ตี้"}หลบฉากออกมาได้ปลอดภัย`);
        } else {
          let nodeDmg = Math.floor(quest.reqPow * 0.15); // แทน hardcode 25
          applyDamageToParty(nodeDmg);
          addLog(`> 💥 หลบไม่พ้น! โดนลูกหลงเต็มๆ (รับดาเมจ ${nodeDmg} แต้ม)`);
        }
      }
  
      // โบนัส gold
      let chestRoll = pInfo.totalLuk + (pInfo.hasScout ? quest.reqPow * 0.2 : 0) + Math.random() * quest.reqPow;
      if (chestRoll > quest.reqPow * 1.2) {
        let chestGold = Math.floor(quest.reward * 0.3); // แทน hardcode 100
        bonusGold += chestGold;
        addLog(`> 🎲 แจ็คพอต! ค้นพบห้องลับ... ได้โบนัส ${chestGold} Gold!`);
      }
  
      if (gameData.player.currentHp > 0) isSuccess = true;

    // ----------------------
    // ---- COLLECT QUEST ----
    // ----------------------
  } else if (qType === "Collect") {
    let target = quest.targetItems || Math.max(8, Math.floor(quest.reqPow / 20));
    quest.targetItems = target;
    let current = quest.currentCollected || 0;
    addLog(`> 🎒 เป้าหมายการฟาร์ม: ขาดอีก ${target - current} ชิ้น`);

    let round = 1;
    while (
      current < target &&
      gameData.player.currentHp > gameData.player.stats.hp * 0.15
    ) {
      let find =
        Math.floor((pInfo.totalLuk + pInfo.totalSpd) / 40)
                 + (pInfo.hasBackpacker ? Math.floor(quest.reqPow * 0.02) : 1)
                 + Math.floor(Math.random() * 3);
      current += find;
      addLog(
        `> ค้นหารอบที่ ${round}... ได้มา ${find} ชิ้น (สะสม ${Math.min(current, target)}/${target})`,
      );
      if (current < target) {
        let fatigueDmg = Math.floor(quest.reqPow * 0.05); // แทน hardcode 15
        applyDamageToParty(fatigueDmg);
        addLog(`> 💦 พักเหนื่อย`);
      }
      round++;
    }
    quest.currentCollected = current;
    if (current >= target) {
      addLog(`> ✅ รวบรวมไอเท็มครบถ้วน!`);
      isSuccess = true;
    } else if (gameData.player.currentHp > 0) {
      addLog(
        `> ⚠️ วันนี้เหนื่อยเกินไปแล้ว ขอกลับไปพักทดยอดไว้ทำต่อพรุ่งนี้...`,
      );
      isSuccess = false;
    }
  }

  if (gameData.player.currentHp <= 0) {
    addLog(
      `<br><span style="color: #ff4c4c; font-weight: bold;">> 💀 ปาร์ตี้แตก! หัวหน้าหมดสติระหว่างทาง!</span>`,
    );
    isSuccess = false;
  } else if (isSuccess) {
    addLog(
      `<br><span style="color: #4CAF50; font-weight: bold;">> 🎉 [SUCCESS] เคลียร์พื้นที่เรียบร้อย!</span>`,
    );
  } else {
    addLog(
      `<br><span style="color: #ff4c4c; font-weight: bold;">> 🩹 [RETREAT] ต้องถอยทัพกลับเมือง...</span>`,
    );
  }

  return { timeline, isSuccess, bonusGold };
}
