let stockData = [];
let sectorChartInstance = null;
let sectorColorMap = {}; // เก็บว่า Sector ไหนใช้สีอะไร

// ตัวแปรเก็บสถานะการ Filter
let currentSectorFilter = null;
let currentSearchQuery = "";
let currentStageFilter = "all";

const neonColors = [
  "#00ffff", // Cyan (Tech มักจะได้สีนี้เพราะมีเยอะสุด)
  "#39ff14", // Neon Green
  "#ffea00", // Yellow
  "#ff00ff", // Magenta
  "#ff9933", // Orange
  "#ff073a", // Neon Red
  "#9d00ff", // Purple
  "#00ffcc", // Aqua
  "#ff3399", // Pink
];

async function loadData() {
  try {
    const response = await fetch("racingstock.csv");
    const text = await response.text();
    const rows = text.split("\n").filter((row) => row.trim() !== "");
    if (rows.length < 2) return;

    const headers = rows[0].split(",");
    const colIndex = {};
    headers.forEach((h, i) => {
      colIndex[h.trim()] = i;
    });

    stockData = rows
      .slice(1)
      .map((row) => {
        const cols = row.split(",");
        if (cols.length >= 7) {
          return {
            symbol: cols[colIndex["Symbol"]],
            company: cols[colIndex["Company"]],
            price: parseFloat(cols[colIndex["Price"]]),
            change6m: parseFloat(cols[colIndex["%Change6M"]]),
            sector: cols[colIndex["Sector"]],
            stage:
              colIndex["Stage"] !== undefined
                ? cols[colIndex["Stage"]]
                : "Unknown",
            exchange: cols[colIndex["Exchange"]],
            marketCap: parseFloat(cols[colIndex["MarketCap"]]),
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    // กำหนดสีให้แต่ละ Sector
    const uniqueSectors = [...new Set(stockData.map((d) => d.sector))];
    uniqueSectors.forEach((sector, index) => {
      sectorColorMap[sector] = neonColors[index % neonColors.length];
    });

    renderDashboard();
  } catch (error) {
    console.error("❌ Error loading CSV:", error);
  }
}

// ฟังก์ชันกรองข้อมูลตามเงื่อนไข (Search, Stage, Sector)
function getFilteredData() {
  return stockData.filter((d) => {
    const matchSearch =
      d.symbol.toLowerCase().includes(currentSearchQuery) ||
      d.company.toLowerCase().includes(currentSearchQuery);
    const matchStage =
      currentStageFilter === "all" ||
      d.stage.toLowerCase() === currentStageFilter.toLowerCase();
    const matchSector =
      currentSectorFilter === null || d.sector === currentSectorFilter;

    return matchSearch && matchStage && matchSector;
  });
}

// ถูกเรียกเมื่อมีการพิมพ์ Search หรือเปลี่ยน Dropdown
function applyFilters() {
  currentSearchQuery = document
    .getElementById("searchInput")
    .value.toLowerCase();
  currentStageFilter = document.getElementById("stageFilter").value;
  updateClearButtonState();

  // อัปเดตเฉพาะรายชื่อ ไม่ต้องวาด Pie Chart ใหม่
  renderLeaderboard();
  renderRacingTrack();
}

// ถูกเรียกเมื่อต้องการล้าง Filter ทั้งหมด
function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("stageFilter").value = "all";
  currentSearchQuery = "";
  currentStageFilter = "all";
  currentSectorFilter = null; // ล้าง Sector ที่กดจาก Pie Chart ด้วย

  updateClearButtonState();
  renderLeaderboard();
  renderRacingTrack();
}

function updateClearButtonState() {
  const btn = document.getElementById("clearFilterBtn");
  if (
    currentSearchQuery !== "" ||
    currentStageFilter !== "all" ||
    currentSectorFilter !== null
  ) {
    btn.style.display = "inline-block";
  } else {
    btn.style.display = "none";
  }
}

function renderDashboard() {
  renderSectorChart();
  renderLeaderboard();
  renderRacingTrack();
}

function renderSectorChart() {
  const ctx = document.getElementById("sectorChart").getContext("2d");
  const sectorCounts = {};
  stockData.forEach((d) => {
    sectorCounts[d.sector] = (sectorCounts[d.sector] || 0) + 1;
  });

  const labels = Object.keys(sectorCounts);
  const data = Object.values(sectorCounts);
  // ใช้สีจากที่ Map ไว้ เพื่อให้ตรงกับการ์ด
  const bgColors = labels.map((label) => sectorColorMap[label]);

  if (sectorChartInstance) sectorChartInstance.destroy();

  sectorChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: bgColors,
          borderColor: "#1a1a2e",
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#e0e0e0",
            font: { family: "'Courier New', Courier, monospace" },
          },
        },
      },
      // อีเวนต์เมื่อคลิกที่ Pie Chart ให้ทำการ Filter Sector
      onClick: (evt, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          currentSectorFilter = labels[index];
          updateClearButtonState();
          renderLeaderboard();
          renderRacingTrack();
        }
      },
    },
  });
}

// ฟังก์ชันช่วยแปลงตัวเลข Market Cap ให้เป็นหน่วย B (Billion)
function formatMarketCap(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + " B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + " M";
  return num;
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  const displayData = getFilteredData();
  if (displayData.length === 0) {
    container.innerHTML = `<div class="loading-text" style="color:#ff073a;">⚠️ NO STOCKS FOUND MATCHING SCANNER ⚠️</div>`;
    return;
  }

  const MAX_BAR_TARGET = 200;

  displayData.forEach((d, index) => {
    const oldPrice = d.price / (1 + d.change6m / 100);
    const barWidth = Math.min((d.change6m / MAX_BAR_TARGET) * 100, 100);

    const isOverdrive = d.change6m >= MAX_BAR_TARGET;
    const barClass = isOverdrive ? "overdrive-bar-fill" : "neon-bar-fill";
    const overdriveLabel = isOverdrive
      ? '<span class="overdrive-txt">🔥 OVERDRIVE</span>'
      : "";

    const link = `https://www.google.com/finance/quote/${d.symbol}:${d.exchange}`;
    const card = document.createElement("div");
    card.className = "player-card";
    card.style.setProperty("--sector-color", sectorColorMap[d.sector]);
    card.onclick = () => window.open(link, "_blank");

    const stageClass = d.stage.replace(/\s+/g, "-").toLowerCase();

    card.innerHTML = `
            <div class="card-header">
                <span class="rank">#${index + 1}</span>
                <span class="symbol">${d.symbol}</span>
                <span class="stage-badge ${stageClass}">${d.stage}</span>
            </div>
            <div class="card-body">
                <div class="company-name">${d.company}</div>

                <div class="price-timeline-grid">
                    <div class="timeline-box">
                        <span class="timeline-label">6M AGO</span>
                        <span class="timeline-val">$${oldPrice.toFixed(2)}</span>
                    </div>
                    <div class="timeline-arrow">➔</div>
                    <div class="timeline-box">
                        <span class="timeline-label">NOW</span>
                        <span class="timeline-val current">$${d.price.toFixed(2)}</span>
                    </div>
                    <div class="timeline-box sector-box">
                        <span class="timeline-label">SECTOR</span>
                        <span class="timeline-val sector-txt">${d.sector}</span>
                    </div>
                </div>
                <div class="market-cap-badge">💰 MARKET CAP: ${formatMarketCap(d.marketCap)}</div>
                <div class="growth-section">
                    <div class="growth-labels">
                        <span class="growth-title">POWER LIMIT ${overdriveLabel}</span>
                        <span class="growth-value">+${d.change6m.toFixed(2)}%</span>
                    </div>
                    <div class="neon-bar-bg">
                        <div class="${barClass}" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            </div>
        `;
    container.appendChild(card);
  });
}

function renderRacingTrack() {
  const trackContainer = document.getElementById("racing-track-container");
  if (!trackContainer) return;

  trackContainer.innerHTML = "";
  const tooltip = document.getElementById("cyber-tooltip");

  const displayData = getFilteredData();
  if (displayData.length === 0) {
    trackContainer.innerHTML = `<div style="text-align:center; color:#ff073a; padding: 40px;">⚠️ NO RACERS ON THE TRACK ⚠️</div>`;
    return;
  }

  const MAX_BAR_TARGET = 200;

  displayData.forEach((d, index) => {
    const barWidth = Math.min((d.change6m / MAX_BAR_TARGET) * 100, 100);
    const link = `https://www.google.com/finance/quote/${d.symbol}:${d.exchange}`;

    const lane = document.createElement("div");
    lane.className = "track-lane";
    lane.onclick = () => window.open(link, "_blank");

    const stageClass = d.stage.replace(/\s+/g, "-").toLowerCase();

    lane.addEventListener("mousemove", (e) => {
      tooltip.innerHTML = `
                <div class="tooltip-header">
                    <span>${d.symbol}</span>
                    <span class="stage-badge ${stageClass}">${d.stage}</span>
                </div>
                <div class="tooltip-body">
                    <div><span>Company:</span> <strong>${d.company}</strong></div>
                    <div><span>Sector:</span> <strong style="color:${sectorColorMap[d.sector]}">${d.sector}</strong></div>
                    <div><span>Price:</span> <strong>$${d.price.toFixed(2)}</strong></div>
                    <div><span>Growth 6M:</span> <strong class="growth-txt">+${d.change6m.toFixed(2)}%</strong></div>
                </div>
            `;
      tooltip.classList.add("visible");
      tooltip.style.left = e.clientX + "px";
      tooltip.style.top = e.clientY + "px";
    });

    lane.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
    });

    lane.innerHTML = `
            <div class="lane-rank">#${index + 1}</div>
            <div class="lane-symbol" style="color: ${sectorColorMap[d.sector]}">${d.symbol}</div>
            <div class="lane-bar-container">
                <div class="lane-bar ${d.change6m >= MAX_BAR_TARGET ? "overdrive-bg" : ""}" style="width: 0%;" data-width="${barWidth}%"></div>
            </div>
            <div class="lane-value">+${d.change6m.toFixed(2)}%</div>
        `;
    trackContainer.appendChild(lane);
  });

  // ทริกเกอร์แอนิเมชันกราฟแท่ง
  setTimeout(() => {
    document.querySelectorAll(".lane-bar").forEach((bar) => {
      bar.style.width = bar.getAttribute("data-width");
    });
  }, 50);
}

document.addEventListener("DOMContentLoaded", loadData);
