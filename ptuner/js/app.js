document.addEventListener('DOMContentLoaded', () => {
    TagManager.init()
    .then(() => {
      console.log('TagManager is ready.');
    })
    .catch(err => {
      console.error('TagManager init error:', err);
    });

    // Load Template JSON
  fetch('data/template.json')
    .then(response => response.json())
    .then(data => {
      templates = data;
      console.log('Templates loaded:', templates);
    })
    .catch(err => console.error('Failed to load template.json:', err));

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    promptInput: $('#promptInput'),
    negativeInput: $('#negativeInput'),
    btnScreen: $('#btnScreen'),
    btnAdjust: $('#btnAdjust'),
    btnCopyPositive: $('#btnCopyPositive'),
    btnCopyNegative: $('#btnCopyNegative'),
    btnDanbooru: $('#btnDanbooru'),
    tagCount: $('#tagCount'),
    tagDisplayArea: $('#tagDisplayArea'),
    btnStructure: $('#btnStructure'),
    btnArrange: $('#btnArrange'),
    btnAddPrompt: $('#btnAddPrompt'),
    addPromptPanel: $('#addPromptPanel'),
    inputAddTag: $('#inputAddTag'),
    btnConfirmAddTag: $('#btnConfirmAddTag'),
    btnCancelAddTag: $('#btnCancelAddTag'),
    autocompleteList: $('#autocompleteList'),
    savePanel: $('#savePanel'),
    btnSavePngHeader: $('#btnSavePngHeader'),
    btnLoadPngHeader: $('#btnLoadPngHeader'),
    fileOpenPng: $('#fileOpenPng'),
    pasteImageArea: $('#pasteImageArea'),
    previewImage: $('#previewImage'),
    btnDoSavePng: $('#btnDoSavePng'),
    structurePanel: $('#structurePanel'),
    modalBadge: $('#modalBadge'),
    btnEditApply: $('#btnEditApply'),
    btnEditCancel: $('#btnEditCancel'),
    editTagName: $('#editTagName'),
    editTagCate: $('#editTagCate'),
    editTagWeight: $('#editTagWeight'),
    modalDanbooru: $('#modalDanbooru'),
    danbooruInput: $('#danbooruInput'),
    btnDanbooruConvert: $('#btnDanbooruConvert'),
    btnDanbooruAdd: $('#btnDanbooruAdd'),
    btnDanbooruCancel: $('#btnDanbooruCancel'),
    danbooruPreview: $('#danbooruPreview'),
  };

  let positiveTags = [];
  let negativeTags = [];
  let editingIndex = null;
  let editingType = null;
  let danbooruConverted = '';
  let currentImageBlob = null;
  let templates = {};
  let tagToDelete = null;
  let skipDeleteConfirm = false;

  const toggleVisibility = (el, show) => el.classList.toggle('hidden', !show);

  // --- Toast Notification System ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: ${type === 'warning' ? 'var(--accent-red)' : 'var(--bg-elevated)'};
      color: #fff; padding: 12px 20px; border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg); font-size: 0.85rem; font-weight: 500;
      z-index: 9999; opacity: 0; transform: translateY(-10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      border: 1px solid ${type === 'warning' ? 'rgba(255,255,255,0.2)' : 'var(--border-hover)'};
      max-width: 320px; line-height: 1.4;
    `;
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10);
    setTimeout(() => {
      toast.style.opacity = '0'; toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  function createBadge(tag, type, index) {
    const badge = document.createElement('span');
    badge.className = `tag-badge ${type === 'negative' ? 'cate-negative' : (tag.cate ? `cate-${tag.cate}` : 'unknown')}`;

    const textSpan = document.createElement('span');
    textSpan.textContent = tag.text;
    badge.appendChild(textSpan);

    if (tag.weight !== 1.0) {
      const w = document.createElement('span');
      w.className = 'weight';
      w.textContent = parseFloat(tag.weight.toFixed(2)).toString();
      badge.appendChild(w);
    }

    const remove = document.createElement('span');
    remove.className = 'remove';
    remove.textContent = '×';
    remove.addEventListener('click', (e) => {
      e.stopPropagation();

      // Skip Warning Modal
      if (skipDeleteConfirm) {
        if (type === 'positive') positiveTags.splice(index, 1);
        else negativeTags.splice(index, 1);
        renderTags();
        return;
      }

      // Warning Modal
      tagToDelete = { index, type, text: tag.text };
      $('#deleteTargetName').textContent = tag.text;
      toggleVisibility($('#modalConfirmDelete'), true);
    });
    badge.appendChild(remove);

    badge.addEventListener('click', () => openBadgeEditor(type, index));

    // ── Drag & Drop ──
    badge.draggable = true;

    badge.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify({ index, type }));
      setTimeout(() => badge.classList.add('dragging'), 0);
    });

    badge.addEventListener('dragend', () => {
      badge.classList.remove('dragging');
      document.querySelectorAll('.tag-badge').forEach(b => {
        b.classList.remove('drag-over-left', 'drag-over-right');
      });
    });

    badge.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const rect = badge.getBoundingClientRect();
      const midPoint = rect.left + rect.width / 2;

      if (e.clientX < midPoint) {
        badge.classList.add('drag-over-left');
        badge.classList.remove('drag-over-right');
      } else {
        badge.classList.add('drag-over-right');
        badge.classList.remove('drag-over-left');
      }
    });

    badge.addEventListener('dragleave', () => {
      badge.classList.remove('drag-over-left', 'drag-over-right');
    });

    badge.addEventListener('drop', (e) => {
      e.preventDefault();
      badge.classList.remove('drag-over-left', 'drag-over-right');

      try {
        const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
        const fromIndex = draggedData.index;
        const fromType = draggedData.type;

        let toIndex = index;
        const toType = type;

        const rect = badge.getBoundingClientRect();
        const midPoint = rect.left + rect.width / 2;
        const insertAfter = e.clientX > midPoint;

        if (fromType === toType) {
          const arr = fromType === 'positive' ? positiveTags : negativeTags;
          if (fromIndex === toIndex) return; // ปล่อยที่เดิม ไม่ต้องทำอะไร

          const [movedItem] = arr.splice(fromIndex, 1);
          if (fromIndex < toIndex) toIndex--;
          if (insertAfter) toIndex++;
          arr.splice(toIndex, 0, movedItem);
          renderTags();
        }
      } catch (err) {
        console.error("Drop error", err);
      }
    });

    return badge;
  }

  function renderTags() {
    els.tagDisplayArea.innerHTML = '';
    if (!positiveTags.length && !negativeTags.length) {
      const ph = document.createElement('span');
      ph.className = 'canvas-placeholder';
      ph.textContent = 'Processed tags will appear here after screening';
      els.tagDisplayArea.appendChild(ph);
      els.tagCount.textContent = '0';
      els.tagCount.style.color = 'var(--accent-green)';

      if (!els.structurePanel.classList.contains('hidden'))
          StructureViewer.render(positiveTags, negativeTags, createBadge);
      return;
    }

    positiveTags.forEach((tag, i) => els.tagDisplayArea.appendChild(createBadge(tag, 'positive', i)));

    if (negativeTags.length) {
      const divider = document.createElement('span');
      divider.style.cssText = 'width:100%; height:1px; background:#333; margin:8px 0;';
      els.tagDisplayArea.appendChild(divider);

      const negLabel = document.createElement('span');
      negLabel.textContent = 'NEGATIVE';
      negLabel.style.cssText = 'width:100%; font-size:0.7rem; color:#666; letter-spacing:1px; font-weight:600;';
      els.tagDisplayArea.appendChild(negLabel);

      negativeTags.forEach((tag, i) => els.tagDisplayArea.appendChild(createBadge(tag, 'negative', i)));
    }

    els.tagCount.textContent = positiveTags.length.toString();
    if (positiveTags.length > 75) {
      els.tagCount.style.color = 'var(--accent-red)';
    } else {
      els.tagCount.style.color = 'var(--accent-green)';
    }

    if (!els.structurePanel.classList.contains('hidden'))
        StructureViewer.render(positiveTags, negativeTags, createBadge);
  }

  function doScreen() {
    const processedPos = PromptProcessor.process(els.promptInput.value);
    const processedNeg = PromptProcessor.process(els.negativeInput.value);

    // Update category and subcategory from TagManager database
    positiveTags = processedPos.map(t => {
      const info = TagManager.getInfo(t.text);
      return { ...t, cate: info.category, subcate: info.subcategory };
    });

    negativeTags = processedNeg;

    renderTags();

    const totalDuplicates = (processedPos.duplicatesRemoved || 0) + (processedNeg.duplicatesRemoved || 0);

    if (totalDuplicates > 0) {
      showToast(`✨ <b>Optimized</b><br>Automatically removed ${totalDuplicates} duplicate tag${totalDuplicates > 1 ? 's' : ''}.`, 'info');
    }

    if (positiveTags.length > 75) {
      setTimeout(() => {
        showToast(`⚠️ <b>Warning: Token Limit Risk</b><br>You have ${positiveTags.length} positive tags. Exceeding 75 tags may cause the AI model to ignore parts of your prompt.`, 'warning');
      }, totalDuplicates > 0 ? 800 : 0);
    }
  }

  els.btnScreen.addEventListener('click', doScreen);

  // Copy Buttons
  const setupCopyButton = (btn, getTagsFn) => {
    btn.addEventListener('click', () => {
      const text = PromptProcessor.toString(getTagsFn());
      navigator.clipboard.writeText(text).then(() => {
        const origText = btn.innerHTML;
        btn.innerHTML = 'Copied!';
        setTimeout(() => btn.innerHTML = origText, 1500);
      });
    });
  };
  setupCopyButton(els.btnCopyPositive, () => positiveTags);
  setupCopyButton(els.btnCopyNegative, () => negativeTags);

  // Badge Editor
  function openBadgeEditor(type, index) {
    const tag = type === 'positive' ? positiveTags[index] : negativeTags[index];
    const formattedTag = tag.text.trim().replace(/ /g, '_');
    if (!tag) return;
    editingIndex = index;
    editingType = type;
    els.editTagName.textContent = tag.text;
    $('#btnDanbooruInfo').href = `https://danbooru.donmai.us/wiki_pages/${encodeURIComponent(formattedTag)}`;
    els.editTagCate.value = tag.cate || 'general';
    els.editTagWeight.value = tag.weight;
    toggleVisibility(els.modalBadge, true);
  }

  els.btnEditApply.addEventListener('click', () => {
    const arr = editingType === 'positive' ? positiveTags : negativeTags;
    if (arr[editingIndex]) {
      arr[editingIndex].cate = els.editTagCate.value;
      arr[editingIndex].weight = parseFloat(els.editTagWeight.value) || 1.0;
    }
    toggleVisibility(els.modalBadge, false);
    renderTags();
  });

  els.btnEditCancel.addEventListener('click', () => toggleVisibility(els.modalBadge, false));

  $$('.weight-presets .preset').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.weight-presets .preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      els.editTagWeight.value = btn.dataset.w;
    });
  });

  // Add Tag Panel
  function addManualTag() {
    const text = els.inputAddTag.value.trim();
    if (!text) return;
    PromptProcessor.process(text).forEach(t => {
      const info = TagManager.getInfo(t.text);
      positiveTags.push({ ...t, cate: info.category, subcate: info.subcategory });
    });
    els.inputAddTag.value = '';
    renderTags();
  }

  els.btnAddPrompt.addEventListener('click', () => {
    els.addPromptPanel.classList.toggle('hidden');
    if (!els.addPromptPanel.classList.contains('hidden')) els.inputAddTag.focus();
  });

  els.btnConfirmAddTag.addEventListener('click', addManualTag);
  els.btnCancelAddTag.addEventListener('click', () => {
    els.inputAddTag.value = '';
    toggleVisibility(els.addPromptPanel, false);
  });

  els.inputAddTag.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addManualTag();
    if (e.key === 'Escape') toggleVisibility(els.addPromptPanel, false);
  });

  // Autocomplete Logic
  els.inputAddTag.addEventListener('input', (e) => {
    const val = e.target.value;
    if (!val.trim()) {
      toggleVisibility(els.autocompleteList, false);
      return;
    }

    const matches = TagManager.search(val, 12);
    if (matches.length === 0) {
      toggleVisibility(els.autocompleteList, false);
      return;
    }

    els.autocompleteList.innerHTML = '';
    matches.forEach(match => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';

      const regex = new RegExp(`(${val})`, 'gi');
      item.innerHTML = match.replace(regex, '<span style="color: var(--accent-blue); font-weight: bold;">$1</span>');

      item.addEventListener('click', () => {
        els.inputAddTag.value = match;
        toggleVisibility(els.autocompleteList, false);
        addManualTag(); // กดปุ๊บ แอดลง Tag Canvas อัตโนมัติ
        els.inputAddTag.focus(); // ให้ Cursor ยังกระพริบต่อ พิมพ์คำต่อไปได้เลย
      });

      els.autocompleteList.appendChild(item);
    });

    toggleVisibility(els.autocompleteList, true);
  });

  document.addEventListener('click', (e) => {
    if (!els.addPromptPanel.contains(e.target)) {
      toggleVisibility(els.autocompleteList, false);
    }
  });

  // Structure Panel
  els.btnStructure.addEventListener('click', () => {
    els.structurePanel.classList.toggle('hidden');

    if (!els.structurePanel.classList.contains('hidden')) {
      StructureViewer.render(positiveTags, negativeTags, createBadge);

      setTimeout(() => {
        els.structurePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  });

  // Danbooru
  els.btnDanbooru.addEventListener('click', () => {
    els.danbooruInput.value = '';
    toggleVisibility(els.danbooruPreview, false);
    els.btnDanbooruAdd.disabled = true;
    toggleVisibility(els.modalDanbooru, true);
  });

  els.btnDanbooruCancel.addEventListener('click', () => {
    toggleVisibility(els.modalDanbooru, false);
  });

  els.btnDanbooruConvert.addEventListener('click', () => {
    const raw = els.danbooruInput.value;
    if (!raw.trim()) return;

    // Delegate parsing logic to the new module
    const parsedTags = DanbooruProcessor.parse(raw);

    // Pass through PromptProcessor for formatting and deduplication
    danbooruConverted = PromptProcessor.toString(PromptProcessor.process(parsedTags));

    els.danbooruPreview.textContent = danbooruConverted;
    toggleVisibility(els.danbooruPreview, true);
    els.btnDanbooruAdd.disabled = false;
  });

  els.btnDanbooruAdd.addEventListener('click', () => {
    if (!danbooruConverted) return;

    const currentPrompt = els.promptInput.value.trim();
    if (currentPrompt) {
      const separator = currentPrompt.endsWith(',') ? ' ' : ', ';
      els.promptInput.value = currentPrompt + separator + danbooruConverted;
    } else {
      els.promptInput.value = danbooruConverted;
    }

    toggleVisibility(els.modalDanbooru, false);
    doScreen();
  });

  // Save PNG Area
  const inputMetaModel = $('#metaModel');
  const inputMetaMethod = $('#metaMethod');
  const inputMetaSteps = $('#metaSteps');
  const inputMetaCFG = $('#metaCFG');
  const btnPasteClipboard = $('#btnPasteClipboard');
  const btnBrowseImage = $('#btnBrowseImage');
  const fileInputImage = $('#fileInputImage');

  els.btnSavePngHeader.addEventListener('click', () => {
    els.savePanel.classList.toggle('hidden');
    els.btnSavePngHeader.classList.toggle('active');
    if (!els.savePanel.classList.contains('hidden')) {
      setTimeout(() => els.savePanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  });

  function handleImageFile(file) {
    if (file && file.type.startsWith('image/')) {
      currentImageBlob = file;
      els.previewImage.src = URL.createObjectURL(currentImageBlob);
      toggleVisibility(els.previewImage, true);
      els.pasteImageArea.querySelector('.dropzone-content').style.display = 'none';
      showToast('🖼️ <b>Image Loaded</b><br>Ready to embed data.', 'info');
    } else {
      showToast('⚠️ <b>Invalid File</b><br>Please select a valid image file.', 'warning');
    }
  }

  btnBrowseImage.addEventListener('click', () => {
    fileInputImage.click();
  });

  fileInputImage.addEventListener('change', (e) => {
    handleImageFile(e.target.files[0]);
    e.target.value = ''; // Reset value เพื่อให้สามารถเลือกไฟล์เดิมซ้ำได้ในครั้งต่อไป
  });

  btnPasteClipboard.addEventListener('click', async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await clipboardItem.getType(imageTypes[0]);
          handleImageFile(blob);
          return;
        }
      }
      showToast('⚠️ <b>No Image Found</b><br>Your clipboard does not contain an image.', 'warning');
    } catch (err) {
      console.error('Clipboard Error:', err);
      showToast('❌ <b>Clipboard Error</b><br>Unable to read clipboard. Please ensure permissions are granted or use the Browse button instead.', 'warning');
    }
  });

  els.pasteImageArea.addEventListener('click', () => els.pasteImageArea.focus());
  els.pasteImageArea.addEventListener('paste', (e) => {
    e.preventDefault();
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        handleImageFile(item.getAsFile());
        break;
      }
    }
  });

  // ── Load PNG Logic ──
  let tempLoadedData = null;
  const modalLoadPng = $('#modalLoadPng');

  els.btnLoadPngHeader.addEventListener('click', () => els.fileOpenPng.click());

  els.fileOpenPng.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await PngHandler.extract(file);

      if (!data || data.app !== 'promptuner-savefile') {
        showToast('❌ <b>No Data Found</b><br>This PNG does not contain Prompt Tuner data.', 'warning');
        e.target.value = '';
        return;
      }

      tempLoadedData = data;
      $('#loadPreviewImg').src = URL.createObjectURL(file);

      let metaHtml = '';
      if (data.metadata) {
         metaHtml += `<div class="meta-item"><span>Model:</span> <strong>${data.metadata.model || '-'}</strong></div>`;
         metaHtml += `<div class="meta-item"><span>Method:</span> <strong>${data.metadata.method || '-'}</strong></div>`;
         metaHtml += `<div class="meta-item"><span>Steps:</span> <strong>${data.metadata.steps || '-'}</strong></div>`;
         metaHtml += `<div class="meta-item"><span>CFG:</span> <strong>${data.metadata.cfg || '-'}</strong></div>`;
      }
      $('#loadMetadata').innerHTML = metaHtml || '<div class="meta-item"><span>No metadata found</span></div>';

      $('#loadPositivePrompt').textContent = PromptProcessor.toString(data.positiveTags);
      $('#loadNegativePrompt').textContent = PromptProcessor.toString(data.negativeTags);

      toggleVisibility(modalLoadPng, true);
    } catch (err) {
      console.error("Load PNG Error:", err);
      showToast('❌ <b>Error</b><br>Failed to load data from the image.', 'warning');
    } finally {
      e.target.value = ''; // Reset input
    }
  });

  $('#btnLoadCancelHeader').addEventListener('click', () => toggleVisibility(modalLoadPng, false));
  $('#btnLoadCancel').addEventListener('click', () => toggleVisibility(modalLoadPng, false));

  $('#btnLoadConfirm').addEventListener('click', () => {
    if (!tempLoadedData) return;

    els.promptInput.value = PromptProcessor.toString(tempLoadedData.positiveTags);
    els.negativeInput.value = PromptProcessor.toString(tempLoadedData.negativeTags);

    if (tempLoadedData.metadata) {
      $('#metaModel').value = tempLoadedData.metadata.model || '';
      $('#metaMethod').value = tempLoadedData.metadata.method || '';
      $('#metaSteps').value = tempLoadedData.metadata.steps || '';
      $('#metaCFG').value = tempLoadedData.metadata.cfg || '';
    }

    doScreen();
    toggleVisibility(modalLoadPng, false);
    showToast('✅ <b>Prompt Loaded</b><br>Workspace has been overwritten successfully.', 'info');
  });

  // Execute Save
  els.btnDoSavePng.addEventListener('click', async () => {
    if (!currentImageBlob) {
      showToast('⚠️ <b>No Image</b><br>Please add an image first.', 'warning');
      return;
    }

    const origHTML = els.btnDoSavePng.innerHTML;
    els.btnDoSavePng.innerHTML = '<span class="loading"></span> Saving...';
    els.btnDoSavePng.disabled = true;

    const payload = {
      positiveTags: positiveTags,
      negativeTags: negativeTags,
      metadata: {
        model: inputMetaModel.value.trim(),
        method: inputMetaMethod.value.trim(),
        steps: inputMetaSteps.value ? parseInt(inputMetaSteps.value, 10) : null,
        cfg: inputMetaCFG.value ? parseFloat(inputMetaCFG.value) : null
      }
    };

    const success = await PngHandler.save(currentImageBlob, payload, `promptuner-${Date.now()}.png`);

    if (success) {
      showToast('✅ <b>Success</b><br>Image saved with embedded prompt data.', 'info');
    } else {
      showToast('❌ <b>Error</b><br>Failed to save the image.', 'warning');
    }

    els.btnDoSavePng.innerHTML = origHTML;
    els.btnDoSavePng.disabled = false;
  });

  // Arrange Button
  els.btnArrange.addEventListener('click', () => {
    if (positiveTags.length === 0) return;

    // Sort array using TagManager logic
    positiveTags = TagManager.arrange(positiveTags);

    // Render and notify user
    renderTags();
    showToast('✨ <b>Arranged</b><br>Tags have been perfectly sorted by structure.', 'info');
  });

  // Adjust Button
  els.btnAdjust.addEventListener('click', () => {
    els.promptInput.value = PromptProcessor.toString(positiveTags);
    els.negativeInput.value = PromptProcessor.toString(negativeTags);
    const origHTML = els.btnAdjust.innerHTML;
    els.btnAdjust.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Adjusted!';
    setTimeout(() => els.btnAdjust.innerHTML = origHTML, 1500);
  });

  $$('.btn-template').forEach(btn => {
    btn.addEventListener('click', () => {
      const tmpl = templates[btn.dataset.cate];

      if (!tmpl) {
        console.warn('No template found for category:', btn.dataset.cate);
        return;
      }

      tmpl.forEach(text => {
        PromptProcessor.process(text).forEach(t => {
          if (btn.dataset.cate === 'negative') negativeTags.push(t);
          else positiveTags.push({ ...t, cate: btn.dataset.cate });
        });
      });
      renderTags();
    });

    // ── Delete Confirmation Logic ──
  const modalConfirmDelete = $('#modalConfirmDelete');
  const chkDontAskDelete = $('#chkDontAskDelete');

  $('#btnDeleteCancel').addEventListener('click', () => {
    toggleVisibility(modalConfirmDelete, false);
    tagToDelete = null;
    chkDontAskDelete.checked = false;
  });

  $('#btnDeleteConfirm').addEventListener('click', () => {
    if (chkDontAskDelete.checked) {
      skipDeleteConfirm = true;
    }

    if (tagToDelete) {
      if (tagToDelete.type === 'positive') {
        positiveTags.splice(tagToDelete.index, 1);
      } else {
        negativeTags.splice(tagToDelete.index, 1);
      }

      renderTags();

      toggleVisibility(modalConfirmDelete, false);
      tagToDelete = null;
      chkDontAskDelete.checked = false;
    }
  });
  });
  // ── x Structure Panel ──
  $('#btnCloseStructure').addEventListener('click', () => {
    els.structurePanel.classList.add('hidden');
    els.btnStructure.classList.remove('active');
  });

  // ── x Save Panel ──
  $('#btnCloseSave').addEventListener('click', () => {
    els.savePanel.classList.add('hidden');
    els.btnSavePngHeader.classList.remove('active');
  });
});
