/* ============================================================
   Character Maker Studio — app.js
   UI Rendering, Event Handling, Search, Presets, and Modern UX
   ============================================================ */

const app = (() => {
  let db              = [];
  let activeSectionId = null;
  let activeGroupId   = null;
  let currentLang     = 'th';
  let mobilePanelClosed = false;
  let inGroupFilterQuery = '';

  const PRESETS_STORAGE_KEY = 'character_maker_presets_v2';

  /* ── Boot & Init ─────────────────────────────────────────── */
  function boot() {
    init();
  }

  function init() {
    db = window.CHARACTER_DB || [];
    core.initState(db);

    renderTabs();
    if (db.length) {
      switchSection(db[0].id);
    }
    
    initGlobalSearch();
    initKeyboardShortcuts();
    initMobileUI();
    updateHeaderTagCount();
    updatePromptStats();
  }

  /* ── Language Helpers ────────────────────────────────────── */
  function toggleLanguage() {
    currentLang = currentLang === 'th' ? 'en' : 'th';
    const langBtn = document.getElementById('lang-text');
    if (langBtn) langBtn.textContent = currentLang.toUpperCase();

    // Update global search placeholder
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.placeholder = currentLang === 'th' 
        ? 'ค้นหาแท็กทั่วทั้งระบบ... (Ctrl + K)' 
        : 'Search all tags... (Ctrl + K)';
    }

    // Re-render current views
    const sec = db.find(s => s.id === activeSectionId);
    if (sec) {
      renderTabs();
      renderSubmenu(sec);
      renderContent(sec);
      renderTopBar(sec);
      renderActiveTags(sec);
    }

    showToast(currentLang === 'th' ? 'เปลี่ยนภาษาเป็นไทย' : 'Language set to English', 'fa-globe');
  }

  function getLabel(g) {
    if (!g) return '';
    return currentLang === 'th' ? (g.label_th || g.label_en || g.id) : (g.label_en || g.label_th || g.id);
  }

  function getName(opt) {
    if (!opt) return '';
    return currentLang === 'th' ? (opt.name_th || opt.name_en || opt.tag) : (opt.name_en || opt.name_th || opt.tag);
  }

  /* ── Section Navigation (Tabs) ───────────────────────────── */
  function renderTabs() {
    const track = document.querySelector('.tab-track');
    if (!track) return;
    track.innerHTML = '';

    db.forEach((sec, i) => {
      const el = document.createElement('div');
      el.className  = 'tab-item';
      el.dataset.id = sec.id;

      const stepNum = String(i + 1).padStart(2, '0');
      const selectedCount = core.countSelectedInSection(sec.id);

      el.innerHTML = `
        <span class="tab-step-number">${stepNum}</span>
        <span class="tab-name">${sec.label || sec.id.toUpperCase()}</span>
        <span class="tab-count-badge">${selectedCount}</span>
      `;

      if (sec.id === activeSectionId) el.classList.add('active');
      if (selectedCount > 0) el.classList.add('done', 'has-selected');

      el.addEventListener('click', () => switchSection(sec.id));
      track.appendChild(el);
    });
  }

  function updateTabStates() {
    document.querySelectorAll('.tab-item').forEach(el => {
      const secId = el.dataset.id;
      const count = core.countSelectedInSection(secId);
      
      el.classList.toggle('active', secId === activeSectionId);
      el.classList.toggle('done', count > 0);
      el.classList.toggle('has-selected', count > 0);

      const countBadge = el.querySelector('.tab-count-badge');
      if (countBadge) {
        countBadge.textContent = count;
        countBadge.style.display = count > 0 ? 'inline-block' : 'none';
      }
    });

    updateHeaderTagCount();
  }

  function switchSection(secId) {
    activeSectionId = secId;
    const sec = db.find(s => s.id === secId);
    if (!sec) return;

    inGroupFilterQuery = '';

    // If activeGroupId is not within current section, pick the first valid group
    const currentGroupValid = sec.groups?.some(g => g.id === activeGroupId) ||
      core.findGroupDeep(sec.groups, activeGroupId);
    
    if (!currentGroupValid) {
      activeGroupId = sec.groups?.[0]?.id || null;
    }

    updateTabStates();
    renderSubmenu(sec);
    renderContent(sec);
    renderTopBar(sec);
    renderActiveTags(sec);
  }

  /* ── Header Counters & Stats ─────────────────────────────── */
  function updateHeaderTagCount() {
    const total = core.countTotalSelected(db);
    const numEl = document.getElementById('active-tag-num');
    if (numEl) numEl.textContent = total;
  }

  function updatePromptStats() {
    const promptText = core.buildPrompt(db);
    const totalTags = promptText ? promptText.split(',').length : 0;
    const totalChars = promptText.length;

    const tagCountEl = document.getElementById('prompt-tag-count');
    if (tagCountEl) {
      tagCountEl.innerHTML = `<i class="fa-solid fa-tag"></i> ${totalTags} ${currentLang === 'th' ? 'แท็ก' : 'Tags'}`;
    }

    const charCountEl = document.getElementById('prompt-char-count');
    if (charCountEl) {
      charCountEl.innerHTML = `<i class="fa-solid fa-font"></i> ${totalChars} ${currentLang === 'th' ? 'ตัวอักษร' : 'Chars'}`;
    }
  }

  /* ── Active Tags Tray (Prompt Chips) ──────────────────────── */
  function renderActiveTags(sec) {
    const bar = document.getElementById('active-tags-bar');
    if (!bar) return;
    bar.innerHTML = '';

    const allActive = core.getAllActiveTags(db);

    if (allActive.length === 0) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'flex';

    allActive.forEach(item => {
      const badge = document.createElement('div');
      badge.className = 'tag-badge';

      // Color Dot Preview
      if (item.colorState.color1) {
        const hex = (window.PALETTES && window.PALETTES[item.colorState.color1]) || '#6366f1';
        const dot = document.createElement('div');
        dot.className = 'tag-color-dot';
        dot.style.background = hex;
        dot.title = `Color: ${item.colorState.color1}`;
        badge.appendChild(dot);
      }

      // Text and Category jump
      const txt = document.createElement('div');
      txt.className = 'tag-badge-text';
      
      let displayText = getName(item.opt);
      if (item.colorState.pattern) displayText = `🏁 ${displayText}`;
      
      txt.innerHTML = `
        <span class="tag-badge-category">${item.secLabel} /</span>
        <span>${displayText}</span>
      `;
      txt.title = currentLang === 'th' ? 'คลิกเพื่อไปยังหมวดหมู่นี้' : 'Click to jump to category';

      txt.addEventListener('click', () => {
        if (activeSectionId !== item.secId) {
          switchSection(item.secId);
        }
        activeGroupId = item.groupId;
        const currentSec = db.find(s => s.id === activeSectionId);
        if (currentSec) {
          renderSubmenu(currentSec);
          renderContent(currentSec);
          renderTopBar(currentSec);
        }
      });

      // Remove button
      const rm = document.createElement('div');
      rm.className = 'tag-badge-remove';
      rm.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      rm.title = currentLang === 'th' ? 'ยกเลิกแท็กนี้' : 'Remove tag';
      rm.addEventListener('click', (e) => {
        e.stopPropagation();
        core.select(item.secId, item.groupId, item.tag);

        updatePrompt();
        updateTabStates();
        updatePromptStats();

        const currentSec = db.find(s => s.id === activeSectionId);
        if (currentSec) {
          renderSubmenu(currentSec);
          renderContent(currentSec);
          renderTopBar(currentSec);
          renderActiveTags(currentSec);
        }
      });

      badge.appendChild(txt);
      badge.appendChild(rm);
      bar.appendChild(badge);
    });

    // Clear All Button inside Tray
    const clearTrayBtn = document.createElement('button');
    clearTrayBtn.className = 'tag-tray-clear-all';
    clearTrayBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> ' + (currentLang === 'th' ? 'ล้างทั้งหมด' : 'Clear All');
    clearTrayBtn.addEventListener('click', () => clearAll());
    bar.appendChild(clearTrayBtn);
  }

  /* ── Submenu Tree Navigation (Left Sidebar) ──────────────── */
  function renderSubmenu(sec) {
    const container = document.getElementById('submenu-tree');
    if (!container) return;
    container.innerHTML = '';

    const validGroups = (sec.groups || []).filter(g => g.type !== 'color-only');
    renderTree(validGroups, 0, container);

    function renderTree(groupsList, depth, parentEl) {
      groupsList.forEach(g => {
        const isGroupActive = (g.id === activeGroupId);
        const item = document.createElement('div');
        item.className = 'submenu-item' + (isGroupActive ? ' active' : '');
        
        if (depth > 0) {
          item.style.paddingLeft = `${10 + (depth * 14)}px`;
        }

        const contentWrap = document.createElement('div');
        contentWrap.className = 'submenu-item-content';

        const iconEl = document.createElement('i');
        iconEl.className = depth === 0 ? 'fa-solid fa-folder-closed' : 'fa-regular fa-folder';
        if (isGroupActive) iconEl.className = 'fa-solid fa-folder-open';
        iconEl.style.fontSize = '11px';
        iconEl.style.color = isGroupActive ? 'var(--accent)' : 'var(--text-muted)';
        contentWrap.appendChild(iconEl);

        const nm = document.createElement('div');
        nm.className = 'submenu-name';
        nm.textContent = getLabel(g);
        contentWrap.appendChild(nm);

        item.appendChild(contentWrap);

        // Count selected in this group
        const groupState = core.getState(sec.id, g.id);
        const countInGroup = Array.isArray(groupState) 
          ? groupState.length 
          : (groupState ? 1 : 0);

        if (countInGroup > 0) {
          const badge = document.createElement('span');
          badge.className = 'submenu-badge';
          badge.textContent = countInGroup;
          item.appendChild(badge);
        }

        item.addEventListener('click', () => {
          activeGroupId = g.id;
          inGroupFilterQuery = '';
          renderSubmenu(sec);
          renderContent(sec);
          renderTopBar(sec);
        });

        parentEl.appendChild(item);

        // Recursively render child groups if parent option is selected
        if (groupState) {
          const selectedTags = Array.isArray(groupState) ? groupState : [groupState];
          selectedTags.forEach(tag => {
            const opt = g.options?.find(o => o.tag === tag);
            if (opt && opt.children && opt.children.length > 0) {
              renderTree(opt.children, depth + 1, parentEl);
            }
          });
        }
      });
    }
  }

  /* ── Main Content Area (Option Cards Grid) ───────────────── */
  function renderContent(sec) {
    const content = document.getElementById('content');
    if (!content) return;
    content.innerHTML = '';

    const g = core.findGroupDeep(sec.groups, activeGroupId);
    if (!g) return;

    // Header row with In-Group Filter
    const headerRow = document.createElement('div');
    headerRow.className = 'group-header-row';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'group-header-title';
    titleWrap.innerHTML = `<span>${getLabel(g)}</span>`;

    const countBadge = document.createElement('span');
    countBadge.className = 'group-header-count';
    const totalOptions = g.options?.length || 0;
    countBadge.textContent = `(${totalOptions} ${currentLang === 'th' ? 'รายการ' : 'items'})`;
    titleWrap.appendChild(countBadge);
    headerRow.appendChild(titleWrap);

    // In-group filter input
    const filterBox = document.createElement('div');
    filterBox.className = 'group-filter-box';
    filterBox.innerHTML = '<i class="fa-solid fa-filter" style="font-size:10px;color:var(--text-muted)"></i>';
    
    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.placeholder = currentLang === 'th' ? 'กรองในหมวดนี้...' : 'Filter options...';
    filterInput.value = inGroupFilterQuery;
    filterInput.addEventListener('input', (e) => {
      inGroupFilterQuery = e.target.value.toLowerCase().trim();
      renderOptionGrid(sec, g, content);
    });

    filterBox.appendChild(filterInput);
    headerRow.appendChild(filterBox);
    content.appendChild(headerRow);

    renderOptionGrid(sec, g, content);
  }

  function renderOptionGrid(sec, g, container) {
    let existingGrid = container.querySelector('.option-grid');
    if (existingGrid) existingGrid.remove();

    const grid = document.createElement('div');
    grid.className = 'option-grid';

    const filteredOptions = (g.options || []).filter(opt => {
      if (!inGroupFilterQuery) return true;
      const nameEn = (opt.name_en || opt.tag || '').toLowerCase();
      const nameTh = (opt.name_th || '').toLowerCase();
      const tag = (opt.tag || '').toLowerCase();
      return nameEn.includes(inGroupFilterQuery) || 
             nameTh.includes(inGroupFilterQuery) || 
             tag.includes(inGroupFilterQuery);
    });

    if (filteredOptions.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.style.gridColumn = '1 / -1';
      emptyNotice.style.padding = '30px';
      emptyNotice.style.textAlign = 'center';
      emptyNotice.style.color = 'var(--text-muted)';
      emptyNotice.innerHTML = `<i class="fa-solid fa-magnifying-glass" style="font-size:24px;margin-bottom:8px;display:block;"></i>${currentLang === 'th' ? 'ไม่พบตัวเลือกที่ตรงกับคำค้นหา' : 'No matching options found'}`;
      grid.appendChild(emptyNotice);
      container.appendChild(grid);
      return;
    }

    filteredOptions.forEach(opt => {
      const isSelected = core.isSelected(sec.id, g.id, opt.tag);
      const card = document.createElement('div');
      card.className = 'option-card' + (isSelected ? ' selected' : '');

      // Top Row: Checkmark Pill + Wiki Link
      const topRow = document.createElement('div');
      topRow.className = 'card-top-row';

      const checkPill = document.createElement('div');
      checkPill.className = 'card-check-pill';
      checkPill.innerHTML = '<i class="fa-solid fa-check"></i>';
      topRow.appendChild(checkPill);

      const searchBtn = document.createElement('a');
      searchBtn.className = 'btn-search-link';
      const tagForSearch = opt.tag.replace(/ /g, '_');
      searchBtn.href = `https://danbooru.donmai.us/wiki_pages/${encodeURIComponent(tagForSearch)}`;
      searchBtn.target = '_blank';
      searchBtn.innerHTML = '<i class="fa-solid fa-book-open"></i> Wiki';
      searchBtn.title = currentLang === 'th' ? 'เปิด Danbooru Wiki' : 'Open Danbooru Wiki';
      searchBtn.addEventListener('click', (e) => e.stopPropagation());
      topRow.appendChild(searchBtn);

      card.appendChild(topRow);

      // Option Name
      const nm = document.createElement('div');
      nm.className = 'option-name';
      nm.textContent = getName(opt);
      card.appendChild(nm);

      // Badges Row (Colorable, Patternable, Submenu)
      const badgesRow = document.createElement('div');
      badgesRow.className = 'card-badges-row';

      if (opt.colorable) {
        const b = document.createElement('span');
        b.className = 'card-badge-indicator';
        b.innerHTML = '<i class="fa-solid fa-palette"></i>';
        b.title = currentLang === 'th' ? 'เลือกสีได้' : 'Colorable';
        badgesRow.appendChild(b);
      }

      if (opt.patternable) {
        const b = document.createElement('span');
        b.className = 'card-badge-indicator';
        b.innerHTML = '<i class="fa-solid fa-shapes"></i>';
        b.title = currentLang === 'th' ? 'เลือกลายได้' : 'Patternable';
        badgesRow.appendChild(b);
      }

      if (opt.children && opt.children.length > 0) {
        const b = document.createElement('span');
        b.className = 'card-badge-indicator';
        b.innerHTML = '<i class="fa-solid fa-folder-tree"></i>';
        b.title = currentLang === 'th' ? 'มีหมวดย่อย' : 'Has sub-items';
        badgesRow.appendChild(b);
      }

      if (badgesRow.children.length > 0) {
        card.appendChild(badgesRow);
      }

      // Card Click Handler
      card.addEventListener('click', () => {
        const wasSelected = core.isSelected(sec.id, g.id, opt.tag);
        core.select(sec.id, g.id, opt.tag);

        if (!wasSelected && opt.children && opt.children.length > 0) {
          activeGroupId = opt.children[0].id;
        }

        mobilePanelClosed = false;

        renderSubmenu(sec);
        renderContent(sec);
        renderTopBar(sec);
        renderActiveTags(sec);
        updatePrompt();
        updateTabStates();
        updatePromptStats();
      });

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  /* ── Properties Studio (Color & Pattern Inspector) ────────── */
  function renderTopBar(sec) {
    const panel = document.getElementById('properties-panel');
    if (!panel) return;
    panel.innerHTML = '';
    panel.classList.add('hidden');
    panel.classList.remove('slide-down');

    const g = core.findGroupDeep(sec.groups, activeGroupId);
    if (!g) return;

    let hasProps = false;
    const propsContainer = document.createElement('div');
    propsContainer.style.display = 'flex';
    propsContainer.style.flexDirection = 'column';
    propsContainer.style.gap = '14px';

    const parentInfo = core.findParentTagOfGroup(sec.groups, g.id);
    if (parentInfo && parentInfo.opt.colorable) {
      panel.classList.remove('hidden');
      renderPropertySection(parentInfo.opt, propsContainer);
      hasProps = true;
    }

    g.options.forEach(opt => {
      if ((opt.colorable || opt.patternable) && core.isSelected(sec.id, g.id, opt.tag)) {
        panel.classList.remove('hidden');
        renderPropertySection(opt, propsContainer);
        hasProps = true;
      }
    });

    if (hasProps) {
      const closeBtn = document.createElement('div');
      closeBtn.className = 'prop-close-btn';
      closeBtn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> <span>${currentLang === 'th' ? 'ปิดสตูดิโอสี (Close)' : 'Close Palette Studio'}</span>`;
      closeBtn.addEventListener('click', () => {
        if (isMobile()) {
          hideMobilePanel();
        } else {
          panel.classList.add('hidden');
        }
      });

      panel.appendChild(closeBtn);
      panel.appendChild(propsContainer);

      if (isMobile()) {
        if (mobilePanelClosed) {
          panel.classList.add('hidden');
          setMobileFabVisible(true);
          setMobileOverlayVisible(false);
        } else {
          setMobileFabVisible(false);
          setMobileOverlayVisible(true);
        }
      }
    } else {
      if (isMobile()) {
        setMobileFabVisible(false);
        setMobileOverlayVisible(false);
        mobilePanelClosed = false;
      }
    }
  }

  function renderPropertySection(opt, container) {
    const section = document.createElement('div');
    section.className = 'prop-section';

    const title = document.createElement('div');
    title.className = 'prop-title';
    title.innerHTML = `<i class="fa-solid fa-sliders"></i> <span>${getName(opt)}</span>`;
    section.appendChild(title);

    const cs = core.getColorState(opt.tag);

    // Color Swatches
    if (opt.colorable) {
      const colorWrap = document.createElement('div');

      const cLabel = document.createElement('div');
      cLabel.className = 'prop-sub-label';
      cLabel.innerHTML = `<span><i class="fa-solid fa-palette"></i> ${currentLang === 'th' ? 'เลือกสี (Color)' : 'Color'}</span>`;
      if (cs.color1) {
        cLabel.innerHTML += `<span style="color:var(--accent-light)">${cs.color1}</span>`;
      }
      colorWrap.appendChild(cLabel);

      const grid = document.createElement('div');
      grid.className = 'swatch-grid';

      Object.entries(window.PALETTES || {}).forEach(([cName, hex]) => {
        const sw = document.createElement('div');
        sw.className = 'prop-swatch' + (cs.color1 === cName ? ' selected' : '');
        sw.style.background = hex;
        sw.title = cName;

        sw.addEventListener('click', () => {
          core.setColor(opt.tag, 1, cName);
          const currentSec = db.find(s => s.id === activeSectionId);
          renderTopBar(currentSec);
          renderActiveTags(currentSec);
          updatePrompt();
          updatePromptStats();
        });

        grid.appendChild(sw);
      });
      colorWrap.appendChild(grid);

      const btnClear = document.createElement('button');
      btnClear.className = 'btn-clear-prop';
      btnClear.innerHTML = `<i class="fa-solid fa-rotate-left"></i> ${currentLang === 'th' ? 'ล้างสีที่เลือก' : 'Clear Color'}`;
      btnClear.addEventListener('click', () => {
        core.clearColor(opt.tag, 1);
        const currentSec = db.find(s => s.id === activeSectionId);
        renderTopBar(currentSec);
        renderActiveTags(currentSec);
        updatePrompt();
        updatePromptStats();
      });
      colorWrap.appendChild(btnClear);

      section.appendChild(colorWrap);
    }

    // Pattern Swatches
    if (opt.patternable) {
      const patWrap = document.createElement('div');
      patWrap.style.marginTop = '8px';

      const pLabel = document.createElement('div');
      pLabel.className = 'prop-sub-label';
      pLabel.innerHTML = `<span><i class="fa-solid fa-shapes"></i> ${currentLang === 'th' ? 'เลือกลวดลาย (Pattern)' : 'Pattern'}</span>`;
      if (cs.pattern) {
        pLabel.innerHTML += `<span style="color:var(--cyan)">${cs.pattern}</span>`;
      }
      patWrap.appendChild(pLabel);

      const grid = document.createElement('div');
      grid.className = 'pattern-grid';

      (window.PATTERN_DATA || []).forEach(patObj => {
        const chip = document.createElement('div');
        chip.className = 'prop-pattern' + (cs.pattern === patObj.tag ? ' selected' : '');
        const patName = currentLang === 'th' ? (patObj.name_th || patObj.tag) : (patObj.name_en || patObj.tag);
        chip.title = patName;

        if (patObj.img) {
          const imgEl = document.createElement('img');
          imgEl.src = patObj.img;
          imgEl.alt = patName;
          chip.appendChild(imgEl);
        }

        const lbl = document.createElement('div');
        lbl.className = 'pat-label';
        lbl.textContent = patName;
        chip.appendChild(lbl);

        chip.addEventListener('click', () => {
          core.setPattern(opt.tag, patObj.tag);
          const currentSec = db.find(s => s.id === activeSectionId);
          renderTopBar(currentSec);
          renderActiveTags(currentSec);
          updatePrompt();
          updatePromptStats();
        });

        grid.appendChild(chip);
      });
      patWrap.appendChild(grid);

      const btnClear = document.createElement('button');
      btnClear.className = 'btn-clear-prop';
      btnClear.innerHTML = `<i class="fa-solid fa-rotate-left"></i> ${currentLang === 'th' ? 'ล้างลวดลาย' : 'Clear Pattern'}`;
      btnClear.addEventListener('click', () => {
        if (cs.pattern) core.setPattern(opt.tag, cs.pattern);
        const currentSec = db.find(s => s.id === activeSectionId);
        renderTopBar(currentSec);
        renderActiveTags(currentSec);
        updatePrompt();
        updatePromptStats();
      });
      patWrap.appendChild(btnClear);

      section.appendChild(patWrap);
    }

    container.appendChild(section);
  }

  /* ── Global Search Feature ───────────────────────────────── */
  function initGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const dropdown = document.getElementById('search-results-dropdown');
    const clearBtn = document.getElementById('search-clear-btn');
    if (!input || !dropdown) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

      if (!q || q.length < 2) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
      }

      const results = searchAllTags(q);
      renderSearchResults(results, dropdown);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        input.focus();
      });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#global-search-box')) {
        dropdown.classList.add('hidden');
      }
    });
  }

  function searchAllTags(q) {
    const results = [];
    const limit = 20;

    for (const sec of db) {
      core.walkGroups(sec.groups, g => {
        for (const opt of (g.options || [])) {
          if (results.length >= limit) return;

          const tag = (opt.tag || '').toLowerCase();
          const nameEn = (opt.name_en || '').toLowerCase();
          const nameTh = (opt.name_th || '').toLowerCase();

          if (tag.includes(q) || nameEn.includes(q) || nameTh.includes(q)) {
            results.push({
              secId: sec.id,
              secLabel: sec.label || sec.id.toUpperCase(),
              groupId: g.id,
              groupLabel: getLabel(g),
              opt,
              tag: opt.tag
            });
          }
        }
      });
    }
    return results;
  }

  function renderSearchResults(results, dropdown) {
    dropdown.innerHTML = '';
    if (results.length === 0) {
      dropdown.innerHTML = `<div style="padding:12px;color:var(--text-muted);text-align:center;font-size:12px;">${currentLang === 'th' ? 'ไม่พบข้อมูลที่ค้นหา' : 'No results found'}</div>`;
      dropdown.classList.remove('hidden');
      return;
    }

    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'search-result-item';

      item.innerHTML = `
        <div class="search-result-left">
          <span class="search-result-name">${getName(res.opt)}</span>
          <span class="search-result-path">${res.secLabel} › ${res.groupLabel}</span>
        </div>
        <span class="search-result-tag">${res.tag}</span>
      `;

      item.addEventListener('click', () => {
        switchSection(res.secId);
        activeGroupId = res.groupId;
        core.select(res.secId, res.groupId, res.tag);

        updatePrompt();
        updateTabStates();
        updatePromptStats();

        const currentSec = db.find(s => s.id === activeSectionId);
        if (currentSec) {
          renderSubmenu(currentSec);
          renderContent(currentSec);
          renderTopBar(currentSec);
          renderActiveTags(currentSec);
        }

        dropdown.classList.add('hidden');
        showToast(currentLang === 'th' ? `เลือก "${getName(res.opt)}"` : `Selected "${getName(res.opt)}"`, 'fa-check');
      });

      dropdown.appendChild(item);
    });

    dropdown.classList.remove('hidden');
  }

  /* ── Presets Management ──────────────────────────────────── */
  function openPresetsModal() {
    const modal = document.getElementById('presets-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderPresetList();
  }

  function closePresetsModal() {
    const modal = document.getElementById('presets-modal');
    if (modal) modal.classList.add('hidden');
  }

  function getPresets() {
    try {
      const data = localStorage.getItem(PRESETS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function savePresets(presets) {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('Failed to save presets', e);
    }
  }

  function saveCurrentPreset() {
    const nameInput = document.getElementById('preset-name-input');
    const name = (nameInput?.value || '').trim() || `Preset ${new Date().toLocaleDateString()}`;
    const exported = core.exportState();

    const presets = getPresets();
    presets.unshift({
      id: Date.now(),
      name,
      date: new Date().toLocaleString(),
      prompt: core.buildPrompt(db),
      data: exported
    });

    savePresets(presets);
    if (nameInput) nameInput.value = '';
    renderPresetList();
    showToast(currentLang === 'th' ? `บันทึก "${name}" สำเร็จ!` : `Preset "${name}" saved!`, 'fa-floppy-disk');
  }

  function loadPreset(id) {
    const presets = getPresets();
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    core.importState(db, preset.data);

    const sec = db.find(s => s.id === activeSectionId) || db[0];
    if (sec) {
      activeGroupId = sec.groups?.[0]?.id || null;
      renderSubmenu(sec);
      renderContent(sec);
      renderTopBar(sec);
      renderActiveTags(sec);
    }

    updateTabStates();
    updatePrompt();
    updatePromptStats();
    closePresetsModal();

    showToast(currentLang === 'th' ? `โหลด Preset "${preset.name}" แล้ว!` : `Loaded preset "${preset.name}"!`, 'fa-bookmark');
  }

  function deletePreset(id) {
    let presets = getPresets();
    presets = presets.filter(p => p.id !== id);
    savePresets(presets);
    renderPresetList();
    showToast(currentLang === 'th' ? 'ลบ Preset สำเร็จ' : 'Preset deleted', 'fa-trash-can');
  }

  function renderPresetList() {
    const container = document.getElementById('preset-items-container');
    const countEl = document.getElementById('preset-count');
    if (!container) return;

    const presets = getPresets();
    if (countEl) countEl.textContent = presets.length;

    container.innerHTML = '';
    if (presets.length === 0) {
      container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">${currentLang === 'th' ? 'ยังไม่มี Preset ที่บันทึกไว้' : 'No saved presets yet'}</div>`;
      return;
    }

    presets.forEach(p => {
      const card = document.createElement('div');
      card.className = 'preset-item-card';

      card.innerHTML = `
        <div class="preset-info">
          <span class="preset-name">${p.name}</span>
          <span class="preset-date">${p.date} • ${p.prompt.slice(0, 35)}...</span>
        </div>
        <div class="preset-actions">
          <button class="btn-preset-load" onclick="app.loadPreset(${p.id})">
            <i class="fa-solid fa-arrow-down-to-bracket"></i> ${currentLang === 'th' ? 'โหลด' : 'Load'}
          </button>
          <button class="btn-preset-del" onclick="app.deletePreset(${p.id})" title="${currentLang === 'th' ? 'ลบ' : 'Delete'}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  }

  /* ── Toast Notification System ───────────────────────────── */
  function showToast(message, icon = 'fa-circle-check', duration = 2200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color:var(--cyan)"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /* ── Mobile UI & FAB ─────────────────────────────────────── */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  function initMobileUI() {
    if (document.getElementById('mobile-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'mobile-overlay';
    overlay.addEventListener('click', hideMobilePanel);
    document.body.appendChild(overlay);

    const fab = document.createElement('button');
    fab.id = 'mobile-palette-fab';
    fab.innerHTML = '<i class="fa-solid fa-palette"></i>';
    fab.setAttribute('aria-label', 'Open palette');
    fab.addEventListener('click', showMobilePanel);
    document.body.appendChild(fab);
  }

  function showMobilePanel() {
    const panel   = document.getElementById('properties-panel');
    const overlay = document.getElementById('mobile-overlay');
    const fab     = document.getElementById('mobile-palette-fab');
    if (!panel) return;
    panel.classList.remove('hidden', 'slide-down');
    if (overlay) overlay.classList.add('show');
    if (fab) fab.classList.remove('visible');
    mobilePanelClosed = false;
  }

  function hideMobilePanel() {
    const panel   = document.getElementById('properties-panel');
    const overlay = document.getElementById('mobile-overlay');
    const fab     = document.getElementById('mobile-palette-fab');
    if (!panel) return;
    panel.classList.add('slide-down');
    if (overlay) overlay.classList.remove('show');
    mobilePanelClosed = true;
    setTimeout(() => {
      if (mobilePanelClosed && panel.classList.contains('slide-down')) {
        panel.classList.add('hidden');
        panel.classList.remove('slide-down');
        if (fab) fab.classList.add('visible');
      }
    }, 280);
  }

  function setMobileFabVisible(show) {
    const fab = document.getElementById('mobile-palette-fab');
    if (fab) fab.classList.toggle('visible', show);
  }

  function setMobileOverlayVisible(show) {
    const overlay = document.getElementById('mobile-overlay');
    if (overlay) overlay.classList.toggle('show', show);
  }

  /* ── Keyboard Shortcuts ──────────────────────────────────── */
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl + K -> Global Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) {
          input.focus();
          input.select();
        }
      }
      // Escape -> Close Modals or Properties
      if (e.key === 'Escape') {
        closePresetsModal();
        const searchDropdown = document.getElementById('search-results-dropdown');
        if (searchDropdown) searchDropdown.classList.add('hidden');
        if (isMobile()) hideMobilePanel();
      }
    });
  }

  /* ── Bottom Prompt Bar Actions ───────────────────────────── */
  function updatePrompt() {
    const promptEl = document.getElementById('prompt-text');
    if (promptEl) {
      promptEl.textContent = core.buildPrompt(db);
    }
  }

  function copyPrompt() {
    const txt = document.getElementById('prompt-text')?.textContent || '';
    if (!txt.trim()) {
      showToast(currentLang === 'th' ? 'ยังไม่มี Prompt ให้คัดลอก' : 'No prompt to copy', 'fa-triangle-exclamation');
      return;
    }

    navigator.clipboard.writeText(txt).then(() => {
      const btn = document.querySelector('.btn-copy');
      if (btn) {
        btn.classList.add('copied');
        const label = btn.querySelector('.copy-label');
        if (label) label.textContent = 'COPIED! ✨';
        setTimeout(() => {
          btn.classList.remove('copied');
          if (label) label.textContent = 'COPY PROMPT';
        }, 1500);
      }
      showToast(currentLang === 'th' ? 'คัดลอก Prompt เรียบร้อยแล้ว! ✨' : 'Prompt copied to clipboard! ✨', 'fa-copy');
    });
  }

  function clearAll() {
    core.clearAll(db);
    const sec = db.find(s => s.id === activeSectionId);
    if (sec) {
      activeGroupId = sec.groups?.[0]?.id || null;
      renderTopBar(sec);
      renderSubmenu(sec);
      renderContent(sec);
      renderActiveTags(sec);
    }
    updateTabStates();
    updatePrompt();
    updatePromptStats();
    showToast(currentLang === 'th' ? 'ล้างการเลือกทั้งหมดแล้ว' : 'All selections cleared', 'fa-trash-can');
  }

  function randomize() {
    core.randomize(db);
    const sec = db.find(s => s.id === activeSectionId);
    if (sec) {
      activeGroupId = sec.groups?.[0]?.id || null;
      renderTopBar(sec);
      renderSubmenu(sec);
      renderContent(sec);
      renderActiveTags(sec);
    }
    updateTabStates();
    updatePrompt();
    updatePromptStats();
    showToast(currentLang === 'th' ? 'สุ่มตัวละครสำเร็จ! 🎲' : 'Character randomized! 🎲', 'fa-dice');
  }

  return {
    boot,
    copyPrompt,
    clearAll,
    randomize,
    toggleLanguage,
    openPresetsModal,
    closePresetsModal,
    saveCurrentPreset,
    loadPreset,
    deletePreset
  };
})();
