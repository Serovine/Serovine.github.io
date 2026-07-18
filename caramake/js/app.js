/* ============================================================
   app.js — UI rendering & events (Tree Structure & Multi-lang)
   ============================================================ */
const app = (() => {
  let db              = [];
  let activeSectionId = null;
  let activeGroupId   = null;
  let currentLang     = 'th';

  function boot() { init(); }

  function init() {
    db = window.CHARACTER_DB || [];
    core.initState(db);
    renderTabs();
    if (db.length) switchSection(db[0].id);
  }

  function toggleLanguage() {
    currentLang = currentLang === 'th' ? 'en' : 'th';
    document.getElementById('lang-toggle').textContent = currentLang.toUpperCase();

    const sec = db.find(s => s.id === activeSectionId);
    if (sec) {
        renderSubmenu(sec); renderContent(sec); renderTopBar(sec); renderActiveTags(sec);
    }
  }

  function getLabel(g) {
      if (!g) return '';
      return currentLang === 'th' ? (g.label_th || g.label_en || g.id) : (g.label_en || g.label_th || g.id);
  }

  function getName(opt) {
      if (!opt) return '';
      return currentLang === 'th' ? (opt.name_th || opt.name_en || opt.tag) : (opt.name_en || opt.name_th || opt.tag);
  }

  function renderTabs() {
    const track = document.querySelector('.tab-track');
    track.innerHTML = '';
    db.forEach((sec, i) => {
      const el = document.createElement('div');
      el.className  = 'tab-item';
      el.dataset.id = sec.id;
      el.innerHTML  = `<span class="tab-name">${sec.label || sec.id.toUpperCase()}</span>
                       <span class="step-badge">STEP ${i + 1}</span>`;
      el.addEventListener('click', () => switchSection(sec.id));
      track.appendChild(el);
    });
  }

  function updateTabStates() {
    document.querySelectorAll('.tab-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === activeSectionId);
      el.classList.toggle('done',   core.hasAnySelection(el.dataset.id));
    });
  }

  function switchSection(secId) {
    activeSectionId = secId;
    const sec = db.find(s => s.id === secId);
    if (!sec) return;

    activeGroupId = sec.groups?.[0]?.id || null;
    updateTabStates();
    renderSubmenu(sec);
    renderContent(sec);
    renderTopBar(sec);
    renderActiveTags(sec); // 💡 เรียกวาดแถบ Tag
  }

  // ── แถบ Active Tags (ฟีเจอร์ใหม่) ──────────────────────────────────
  function renderActiveTags(sec) {
    const bar = document.getElementById('active-tags-bar');
    if (!bar) return;
    bar.innerHTML = '';

    let hasTags = false;

    // ค้นหาทุก Group ใน Section ปัจจุบัน
    core.walkGroups(sec.groups, g => {
        const v = core.getState(sec.id, g.id);
        if (!v || (Array.isArray(v) && v.length === 0)) return;

        const arr = Array.isArray(v) ? v : [v];

        arr.forEach(tag => {
            hasTags = true;
            const opt = (g.options || []).find(o => o.tag === tag);

            const badge = document.createElement('div');
            badge.className = 'tag-badge';

            // ส่วนข้อความ (กดแล้ววาร์ป)
            const txt = document.createElement('div');
            txt.className = 'tag-badge-text';
            txt.textContent = opt ? getName(opt) : tag;
            const hint = currentLang === 'th' ? 'ไปยังหมวดหมู่นี้' : 'Go to Category';
            txt.title = hint;
            txt.addEventListener('click', () => {
                activeGroupId = g.id; // วาร์ปไปที่ Group นี้
                renderSubmenu(sec); renderContent(sec); renderTopBar(sec);
            });

            // ปุ่มลบ (กดแล้วลบ Tag ทิ้ง)
            const rm = document.createElement('div');
            rm.className = 'tag-badge-remove';
            rm.textContent = '✕';
            rm.addEventListener('click', (e) => {
                e.stopPropagation();
                core.select(sec.id, g.id, tag); // กดยกเลิก

                // อัปเดตหน้าจอทั้งหมด
                updatePrompt(); updateTabStates();
                renderSubmenu(sec); renderContent(sec); renderTopBar(sec); renderActiveTags(sec);
            });

            badge.appendChild(txt);
            badge.appendChild(rm);
            bar.appendChild(badge);
        });
    });

    // ถ้าไม่มี Tag เลย ให้ซ่อนแถบไปเลยจะได้ไม่เกะกะ
    if (!hasTags) {
        bar.style.display = 'none';
    } else {
        bar.style.display = 'flex';
    }
  }

  // ── เมนูซ้าย ──────────────────────────────────────────
  function renderSubmenu(sec) {
    const submenu = document.getElementById('submenu');
    submenu.innerHTML = '';

    const validGroups = (sec.groups || []).filter(g => g.type !== 'color-only');
    renderTree(validGroups, 0);

    function renderTree(groupsList, depth) {
        groupsList.forEach(g => {
            const isGroupActive = (g.id === activeGroupId);
            const item = document.createElement('div');
            item.className = 'submenu-item' + (isGroupActive ? ' active' : '');
            item.style.paddingLeft = `${12 + (depth * 14)}px`;
            if (depth > 0) item.style.borderLeft = '2px solid var(--border-accent)';

            const nm = document.createElement('div');
            nm.className = 'submenu-name';
            nm.textContent = getLabel(g);

            item.appendChild(nm);
            item.addEventListener('click', () => {
                activeGroupId = g.id;
                renderSubmenu(sec); renderContent(sec); renderTopBar(sec);
            });
            submenu.appendChild(item);

            const v = core.getState(sec.id, g.id);
            if (v) {
                const selectedTags = Array.isArray(v) ? v : [v];
                selectedTags.forEach(tag => {
                    const opt = g.options.find(o => o.tag === tag);
                    if (opt && opt.children && opt.children.length > 0) {
                        renderTree(opt.children, depth + 1);
                    }
                });
            }
        });
    }
  }

  // ── เนื้อหาหลัก ──────────────────────────────────────────
  function renderContent(sec) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const g = core.findGroupDeep(sec.groups, activeGroupId);
    if (!g) return;

    const header = document.createElement('div');
    header.className = 'group-header';
    header.textContent = getLabel(g);
    content.appendChild(header);
//
 //   if (g.options.length > (window.DROPDOWN_THRESHOLD || 12)) {
   //     renderSearchDropdown(sec, g, content);
     //   return;
        //  }

    const grid = document.createElement('div');
    grid.className = 'option-grid';

    const hasAnyImage = g.options.some(o => o.img && o.img.trim() !== '');

    g.options.forEach(opt => {
        const isSelected = core.isSelected(sec.id, g.id, opt.tag);
        const card = document.createElement('div');
        card.className = 'option-card' + (isSelected ? ' selected' : '');

        if (hasAnyImage) {
            const imgBox = document.createElement('div');
            imgBox.className = 'option-img';
            imgBox.innerHTML = opt.img ? `<img src="${opt.img}">` : '<span class="no-img">🖼</span>';
            card.appendChild(imgBox);
        }

        const nm = document.createElement('div');
        nm.className = 'option-name';
        nm.textContent = getName(opt);

        if (!hasAnyImage) {
            nm.style.padding = '12px 4px';
            nm.style.fontSize = '13px';
            nm.style.fontWeight = 'bold';
        }

        card.appendChild(nm);

        let emojis = [];
        if (opt.colorable) emojis.push('🎨');
        if (opt.patternable) emojis.push('🏁');
        if (opt.children && opt.children.length > 0) emojis.push('📁');

        if (emojis.length > 0) {
            const indicator = document.createElement('div');
            indicator.style.fontSize = '12px';
            indicator.style.textAlign = 'center';
            indicator.style.paddingBottom = '6px';
            indicator.style.letterSpacing = '3px';
            indicator.style.opacity = isSelected ? '1' : '0.5';
            indicator.textContent = emojis.join('');
            card.appendChild(indicator);
        }

        card.addEventListener('click', () => {
            const wasSelected = core.isSelected(sec.id, g.id, opt.tag);
            core.select(sec.id, g.id, opt.tag);

            if (!wasSelected && opt.children && opt.children.length > 0) {
                activeGroupId = opt.children[0].id;
            }

            renderSubmenu(sec); renderContent(sec); renderTopBar(sec); renderActiveTags(sec);
            updatePrompt(); updateTabStates();
        });

        grid.appendChild(card);
    });
    content.appendChild(grid);
  }

  function renderSearchDropdown(sec, g, content) {
      const wrap = document.createElement('div');
      wrap.className = 'dropdown-group';
      const search = document.createElement('input');
      search.className = 'dropdown-search';

      const searchHint = currentLang === 'th' ? 'ค้นหา' : 'Search';
      search.placeholder = `${searchHint} ${getLabel(g)}...`;

      const list = document.createElement('div');
      list.className = 'dropdown-list';

      function renderChips(filter) {
          list.innerHTML = '';
          const q = filter.toLowerCase();
          g.options.filter(o => {
              const nameEn = (o.name_en || o.tag).toLowerCase();
              const nameTh = (o.name_th || '').toLowerCase();
              return !q || nameEn.includes(q) || nameTh.includes(q);
          })
          .forEach(opt => {
              const chip = document.createElement('div');
              chip.className = 'dropdown-chip' + (core.isSelected(sec.id, g.id, opt.tag) ? ' selected' : '');
              chip.textContent = getName(opt);
              chip.addEventListener('click', () => {
                  core.select(sec.id, g.id, opt.tag);
                  renderChips(search.value); renderSubmenu(sec); renderTopBar(sec); renderActiveTags(sec);
                  updatePrompt(); updateTabStates();
              });
              list.appendChild(chip);
          });
      }
      search.addEventListener('input', () => renderChips(search.value));
      renderChips('');
      wrap.appendChild(search); wrap.appendChild(list);
      content.appendChild(wrap);
  }

  // ── แถบสี และลวดลาย ──────────────────────────────────────────
  function renderTopBar(sec) {
    const bar = document.getElementById('color-bar');
    bar.innerHTML = '';
    bar.classList.add('hidden');

    const g = core.findGroupDeep(sec.groups, activeGroupId);
    if (!g) return;

    let hasColorRows = false;

    const parentInfo = core.findParentTagOfGroup(sec.groups, g.id);
    if (parentInfo && parentInfo.opt.colorable) {
        bar.classList.remove('hidden');
        renderColorRowForTag(parentInfo.opt, bar);
        hasColorRows = true;
    }

    g.options.forEach(opt => {
        if (opt.colorable && core.isSelected(sec.id, g.id, opt.tag)) {
            bar.classList.remove('hidden');
            renderColorRowForTag(opt, bar);
            hasColorRows = true;
        }
    });
  }

  function renderColorRowForTag(opt, container) {
      const row = document.createElement('div');
      row.className = 'color-row';
      const lbl = document.createElement('span');
      lbl.className = 'color-label';
      const clrHint = currentLang === 'th' ? 'สีของ' : 'COLOR:';
      lbl.textContent = `${clrHint} ${getName(opt).toUpperCase()}`;
      row.appendChild(lbl);

      const cs = core.getColorState(opt.tag);
      const swatches = document.createElement('div');
      swatches.className = 'swatch-list';
      Object.entries(window.PALETTES || {}).forEach(([cName, hex]) => {
          const sw = document.createElement('div');
          sw.className = 'swatch' + (cs.color1 === cName ? ' selected' : '');
          sw.style.background = hex;
          sw.title = cName;
          sw.addEventListener('click', () => {
              core.setColor(opt.tag, 1, cName);
              renderTopBar(window.CHARACTER_DB.find(s=>s.id===activeSectionId));
              updatePrompt();
          });
          swatches.appendChild(sw);
      });

      const clrBtn = document.createElement('button');
      clrBtn.className = 'clear-btn'; clrBtn.textContent = '✕';
      clrBtn.addEventListener('click', () => {
           core.clearColor(opt.tag, 1);
           renderTopBar(window.CHARACTER_DB.find(s=>s.id===activeSectionId));
           updatePrompt();
      });

      row.appendChild(swatches);
      row.appendChild(clrBtn);
      container.appendChild(row);

      if (opt.patternable) {
          const pRow = document.createElement('div');
          pRow.className = 'color-row';
          const pLbl = document.createElement('span');
          pLbl.className = 'color-label';
          pLbl.textContent = currentLang === 'th' ? 'ลวดลาย' : 'PATTERN';
          pRow.appendChild(pLbl);

          const pList = document.createElement('div');
          pList.className = 'pattern-list';

          (window.PATTERN_DATA || []).forEach(patObj => {
              const chip = document.createElement('div');
              chip.className = 'pattern-chip' + (cs.pattern === patObj.tag ? ' selected' : '');

              const patName = currentLang === 'th' ? (patObj.name_th || patObj.tag) : (patObj.name_en || patObj.tag);
              chip.title = patName;

              if (patObj.img) {
                  const imgEl = document.createElement('img');
                  imgEl.src = patObj.img;
                  imgEl.alt = patName;

                  imgEl.onerror = () => {
                      chip.innerHTML = '';
                      chip.textContent = patName;
                      chip.style.padding = '0 4px';
                  };

                  chip.appendChild(imgEl);
              } else {
                  chip.textContent = patName;
              }

              chip.addEventListener('click', () => {
                  core.setPattern(opt.tag, patObj.tag);
                  renderTopBar(window.CHARACTER_DB.find(s=>s.id===activeSectionId));
                  updatePrompt();
              });
              pList.appendChild(chip);
          });

          const pClrBtn = document.createElement('button');
          pClrBtn.className = 'clear-btn'; pClrBtn.textContent = '✕';
          pClrBtn.addEventListener('click', () => {
               if (cs.pattern) core.setPattern(opt.tag, cs.pattern);
               renderTopBar(window.CHARACTER_DB.find(s=>s.id===activeSectionId));
               updatePrompt();
          });

          pRow.appendChild(pList);
          pRow.appendChild(pClrBtn);
          container.appendChild(pRow);
      }
  }

  // ── เครื่องมืออื่นๆ ──────────────────────────────────────────
  function updatePrompt() {
    document.getElementById('prompt-text').textContent = core.buildPrompt(db);
  }

  function copyPrompt() {
    const txt = document.getElementById('prompt-text').textContent;
    navigator.clipboard.writeText(txt).then(() => {
      const btn = document.querySelector('.btn-copy');
      const orig = btn.textContent;
      btn.textContent = 'COPIED!';
      setTimeout(() => btn.textContent = orig, 1200);
    });
  }

  function clearAll() {
    core.clearAll(db);
    const sec = db.find(s => s.id === activeSectionId);
    if (sec) {
        activeGroupId = sec.groups?.[0]?.id || null;
        renderTopBar(sec); renderSubmenu(sec); renderContent(sec); renderActiveTags(sec);
    }
    updateTabStates(); updatePrompt();
  }

  function randomize() {
    core.randomize(db);
    const sec = db.find(s => s.id === activeSectionId);
    if (sec) {
        activeGroupId = sec.groups?.[0]?.id || null;
        renderTopBar(sec); renderSubmenu(sec); renderContent(sec); renderActiveTags(sec);
    }
    updateTabStates(); updatePrompt();
  }

  return { boot, copyPrompt, clearAll, randomize, toggleLanguage };
})();
