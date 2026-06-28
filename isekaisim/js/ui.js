// js/ui.js

// ==========================================
// 1. ระบบ Custom Modal Controller & Tabs
// ==========================================
let customModalCallback = null;

function showModal(title, message, type, callback) {
  document.getElementById("custom-modal-title").innerHTML = title;
  document.getElementById("custom-modal-msg").innerHTML = message;

  const btnContainer = document.getElementById("custom-modal-buttons");
  btnContainer.innerHTML = "";
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

function switchMobileTab(target) {
  const container = document.getElementById("game-container");
  if (!container) return;

  container.classList.remove(
    "mobile-show-left",
    "mobile-show-main",
    "mobile-show-right",
  );
  container.classList.add("mobile-show-" + target);

  const tabs = ["left", "main", "right"];
  tabs.forEach((t) => {
    const btn = document.getElementById("mtab-" + t);
    if (btn) btn.classList.toggle("active-m-tab", t === target);
  });
}

function updateStatsUI(stats) {
  document.getElementById("generated-stats").innerHTML = `
        <div>
            <div style="color: #FFD700;">🌟 Lv: 1</div>
            <div>❤️ HP: ${stats.hp}</div>
            <div>⚔️ ATK: ${stats.atk}</div>
            <div>⚡ SPD: ${stats.spd}</div>
            <div>🛡️ DEF: ${stats.def}</div>
            <div>🍀 LUK: ${stats.luk}</div>
        </div>
    `;
}

// ==========================================
// 2. ระบบ Render หน้าจอหลักของเกม
// ==========================================
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

    document.getElementById("ui-det-hp").innerText = `❤️ ${p.stats.hp}`;
    document.getElementById("ui-det-atk").innerText = `⚔️ ${p.stats.atk}`;
    document.getElementById("ui-det-def").innerText = `🛡️ ${p.stats.def}`;
    document.getElementById("ui-det-spd").innerText = `⚡ ${p.stats.spd}`;
    document.getElementById("ui-det-luk").innerText = `🍀 ${p.stats.luk}`;

    document.getElementById("ui-eq-weapon").innerText =
      `🗡️ ${p.equipment?.weapon?.name || "None"}`;
    document.getElementById("ui-eq-armor").innerText =
      `🛡️ ${p.equipment?.armor?.name || "None"}`;
    document.getElementById("ui-eq-head").innerText =
      `🪖 ${p.equipment?.head?.name || "None"}`;
    document.getElementById("ui-eq-acc").innerText =
      `💍 ${p.equipment?.acc?.name || "None"}`;
  }

  const leadNameEl = document.getElementById("ui-party-lead-name");
  if (leadNameEl && p.name) leadNameEl.innerText = p.name.toUpperCase();

  const mg = document.getElementById("m-town-gold");
  const md = document.getElementById("m-town-day");
  if (mg) mg.innerText = gameData.gold || 0;
  if (md) md.innerText = gameData.day || 1;
}

function switchState(stateNumber) {
  document.querySelectorAll(".center-state").forEach((state) => {
    state.style.display = "none";
  });
  const targetState = document.getElementById(`state-${stateNumber}`);
  if (targetState) {
    targetState.style.display = "flex";
  }

  const backBtn = document.getElementById("btn-back-board");
  const goDungeonBtn = document.getElementById("btn-go-dungeon");

  if (stateNumber === 1) {
    if (typeof renderQuestBoard === "function") {
      renderQuestBoard();
    }
  }

  if (typeof refreshQuestDetailUI === "function") {
    refreshQuestDetailUI();
  }

  if (stateNumber === 2) {
    if (backBtn) backBtn.style.display = "block";
    if (goDungeonBtn) {
      goDungeonBtn.style.display = gameData.activeQuest ? "block" : "none";
    }
  } else {
    if (backBtn) backBtn.style.display = "none";
    if (goDungeonBtn) goDungeonBtn.style.display = "none";
  }

  if (stateNumber === 4) {
    if (typeof openTownSubMenu === "function") openTownSubMenu("main");
  }
}

function togglePlayerStatus() {
  const acc = document.getElementById("ui-player-status-accordion");
  if (acc) {
    acc.style.display = acc.style.display === "none" ? "block" : "none";
  }
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

        slot.style.padding = "10px";
        slot.style.justifyContent = "space-between";
        slot.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px; width: 78%;">
                    <div style="width: 38px; height: 38px; background: #0f0d0c; border-radius: 4px; border: 1px solid #5c4a33; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0 0 8px rgba(0,0,0,0.8);">
                        ${miniSvg}
                    </div>
                    <div style="line-height: 1.3; text-align: left; width: 100%;">
                        <span style="color:#f0e6d2; font-size: 13px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; text-shadow: 1px 1px 0px #000;">${member.name}</span>
                        <span style="color:#ffaa00; font-size: 10px; font-weight: bold;">${member.class} <span style="color:#ffd700;">Lv.${member.level}</span></span>

                        <div style="width: 100%; height: 5px; background: #141210; border-radius: 3px; margin-top: 5px; overflow: hidden; border: 1px solid #362f28;">
                            <div style="width: ${hpPercent}%; height: 100%; background: linear-gradient(90deg, #800000, #ff4c4c); transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
                <button onclick="kickNPC(${index})" style="
                    background: linear-gradient(145deg, #800000, #500000);
                    color: #ffcdd2;
                    border: 1px solid #b71c1c;
                    padding: 5px 8px;
                    font-size: 10px;
                    font-weight: 900;
                    border-radius: 3px;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    letter-spacing: 0.5px;
                " onmouseover="this.style.background='linear-gradient(145deg, #b71c1c, #800000)'; this.style.color='#fff';" onmouseout="this.style.background='linear-gradient(145deg, #800000, #500000)'; this.style.color='#ffcdd2';">
                    KICK
                </button>
            </div>
        `;
      } else {
        slot.style.padding = "12px";
        slot.style.justifyContent = "center";
        slot.innerHTML =
          '<span style="color: #5c4a33; font-weight: bold; font-size: 11px; letter-spacing: 1px;">[ EMPTY SLOT ]</span>';
      }
    });
  }

  const countUi = document.getElementById("ui-party-count");
  if (countUi) countUi.innerText = count;

  if (typeof refreshQuestDetailUI === "function") {
    refreshQuestDetailUI();
  }
}

// ==========================================
// 3. ระบบจัดการโหลดเซฟผ่านข้อความ Seed Code
// ==========================================
let tempSeedData = null;
let seedImageSrc = null;
let seedImageBlob = null;

function openSeedLoadModal() {
  tempSeedData = null;
  seedImageSrc = null;
  seedImageBlob = null;
  document.getElementById("seed-code-input").value = "";
  document.getElementById("seed-image-upload").value = "";

  const placeholder = document.getElementById("seed-upload-placeholder");
  const previewImg = document.getElementById("seed-upload-preview-img");
  const uploadLabel = document.getElementById("seed-upload-label");
  if (placeholder) placeholder.style.display = "block";
  if (previewImg) {
    previewImg.src = "";
    previewImg.style.display = "none";
  }
  if (uploadLabel) uploadLabel.style.borderStyle = "dashed";

  document.getElementById("seed-img-status").innerHTML = "";
  document.getElementById("seed-preview-area").style.display = "none";
  document.getElementById("btn-seed-confirm").style.display = "none";
  document.getElementById("seed-load-modal").style.display = "flex";
}

function closeSeedLoadModal() {
  document.getElementById("seed-load-modal").style.display = "none";
}

function previewSeedImage(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;
  seedImageBlob = file;

  const reader = new FileReader();
  reader.onload = function (e) {
    seedImageSrc = e.target.result;

    const placeholder = document.getElementById("seed-upload-placeholder");
    const previewImg = document.getElementById("seed-upload-preview-img");
    const uploadLabel = document.getElementById("seed-upload-label");

    if (placeholder) placeholder.style.display = "none";
    if (previewImg) {
      previewImg.src = seedImageSrc;
      previewImg.style.display = "block";
    }
    if (uploadLabel) uploadLabel.style.borderStyle = "solid";

    document.getElementById("seed-img-status").innerHTML = `
        <span onclick="document.getElementById('seed-image-upload').click()" style="color:#ffd700; font-size:11px; text-decoration:underline; cursor:pointer;">
            🔄 คลิกเพื่อเปลี่ยนรูปใหม่
        </span>`;

    if (
      document.getElementById("seed-preview-area").style.display === "block"
    ) {
      const pImg = document.getElementById("seed-preview-avatar");
      pImg.src = seedImageSrc;
      pImg.style.display = "block";
      const container = document.getElementById("seed-avatar-container");
      if (container.querySelector("svg"))
        container.querySelector("svg").remove();
    }
  };
  reader.readAsDataURL(file);
}

function parseSeedCode() {
  const code = document.getElementById("seed-code-input").value.trim();
  if (!code) {
    alert("กรุณากรอกรหัสคีย์เซฟก่อนระบบประมวลผลครับ");
    return;
  }

  try {
    const jsonString = decodeURIComponent(escape(atob(code)));
    const data = JSON.parse(jsonString);

    if (
      !data.player ||
      !data.player.name ||
      typeof data.day === "undefined" ||
      !data.player.stats
    ) {
      throw new Error("โครงสร้างข้อมูลเซฟไม่ถูกต้อง");
    }

    tempSeedData = data;

    document.getElementById("seed-preview-name").innerText = data.player.name;
    document.getElementById("seed-preview-class").innerText =
      data.player.class || "WANDERER";
    document.getElementById("seed-preview-day").innerText = data.day;
    document.getElementById("seed-preview-gold").innerText = data.gold;
    document.getElementById("seed-preview-rank").innerText =
      data.player.rank || "F";

    const container = document.getElementById("seed-avatar-container");
    const pImg = document.getElementById("seed-preview-avatar");

    if (container.querySelector("svg")) container.querySelector("svg").remove();

    if (seedImageSrc) {
      pImg.src = seedImageSrc;
      pImg.style.display = "block";
    } else {
      pImg.style.display = "none";
      if (typeof generateDynamicAvatar === "function") {
        const generatedSvgString = generateDynamicAvatar(data.player.stats);
        container.insertAdjacentHTML("beforeend", generatedSvgString);

        const svgElement = container.querySelector("svg");
        if (svgElement) {
          svgElement.setAttribute("width", "100%");
          svgElement.setAttribute("height", "100%");
        }
      }
    }

    document.getElementById("seed-preview-area").style.display = "block";
    document.getElementById("btn-seed-confirm").style.display = "block";
  } catch (e) {
    console.error(e);
    alert(
      "❌ รหัสรหัส Seed Code คีย์ไม่ถูกต้อง หรือโครงสร้างข้อมูลเซฟเสียหาย! ดีดกลับหน้าหลัก",
    );
    document.getElementById("seed-preview-area").style.display = "none";
    document.getElementById("btn-seed-confirm").style.display = "none";
    tempSeedData = null;
  }
}

function confirmSeedLoad() {
  if (!tempSeedData) return;

  const confirmMsg = `ต้องการเข้าสู่โลกเดิมต่อด้วยนักผจญภัยชื่อ <b>[ ${tempSeedData.player.name} ]</b> ใช่หรือไม่?`;

  showModal("🛡️ ยืนยันจุติด้วยรหัส", confirmMsg, "confirm", function (isYes) {
    if (isYes) {
      Object.assign(gameData, tempSeedData);

      if (seedImageBlob) {
        rawImageBlob = seedImageBlob;
        const blobUrl = URL.createObjectURL(rawImageBlob);
        document.getElementById("ui-player-avatar").src = blobUrl;
        document.getElementById("preview-image").src = blobUrl;
      } else {
        const container = document.getElementById("seed-avatar-container");
        const svgEl = container.querySelector("svg");
        let cleanSvgString = "";

        if (svgEl) {
          if (!svgEl.getAttribute("xmlns")) {
            svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          }
          if (!svgEl.getAttribute("viewBox")) {
            svgEl.setAttribute("viewBox", "0 0 120 120");
          }
          cleanSvgString = svgEl.outerHTML;
        } else if (typeof generateDynamicAvatar === "function") {
          cleanSvgString = generateDynamicAvatar(gameData.player.stats);
        }

        if (cleanSvgString) {
          const svgDataUrl =
            "data:image/svg+xml;utf8," + encodeURIComponent(cleanSvgString);

          rawImageBlob = new Blob(
            [
              new Uint8Array([
                137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0,
                0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 211, 255, 11, 0, 0, 0,
                13, 73, 68, 65, 84, 120, 156, 98, 248, 159, 129, 5, 0, 3, 245,
                1, 230, 210, 132, 185, 15, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66,
                96, 130,
              ]),
            ],
            { type: "image/png" },
          );

          const avatarTarget = document.getElementById("ui-player-avatar");
          const previewTarget = document.getElementById("preview-image");

          if (avatarTarget) avatarTarget.src = svgDataUrl;
          if (previewTarget) previewTarget.src = svgDataUrl;
        }
      }

      document.getElementById("left-panel").classList.remove("hidden-panel");
      document.getElementById("right-panel").classList.remove("hidden-panel");

      updatePlayerUI();
      if (typeof updatePartyUI === "function") updatePartyUI();
      document.getElementById("ui-gold-count").innerText = gameData.gold;
      document.getElementById("ui-day-count").innerText = gameData.day;

      closeSeedLoadModal();
      if (typeof enterTown === "function") {
        enterTown();
      } else {
        switchState(4);
      }
    }
  });
}
