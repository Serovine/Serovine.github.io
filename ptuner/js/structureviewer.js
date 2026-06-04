/**
 * structureViewer.js
 * Handles the rendering of the structure panel.
 */
const StructureViewer = (function() {
  'use strict';

  const CATEGORIES = [
    'quality', 'style', 'image_composition',
    'character', 'background', 'lora',
    'general', 'negative'
  ];

  return {
    /**
     * @param {Array} positiveTags - Array ของ Positive tags ทั้งหมด
     * @param {Array} negativeTags - Array ของ Negative tags ทั้งหมด
     * @param {Function} createBadgeFn - ฟังก์ชันสร้างหน้าตา Badge ส่งมาจาก app.js
     */
    render(positiveTags, negativeTags, createBadgeFn) {
      CATEGORIES.forEach(c => {
        const container = document.querySelector(`#struct-${c} .cate-body`);
        if (!container) return;

        container.innerHTML = '';

        const tags = c === 'negative'
          ? negativeTags
          : positiveTags.filter(t => t.cate === c || (!t.cate && c === 'general'));

        const btnTemplate = document.querySelector(`#struct-${c} .btn-template`);

        if (tags.length === 0) {
          const empty = document.createElement('span');
          empty.style.cssText = 'color:#555; font-size:0.8rem; font-style:italic;';
          empty.textContent = '(empty)';
          container.appendChild(empty);

          if (btnTemplate) btnTemplate.classList.remove('hidden');
        }
        else {
          tags.forEach(tag => {
            const originalIndex = c === 'negative' ? negativeTags.indexOf(tag) : positiveTags.indexOf(tag);
            container.appendChild(createBadgeFn(tag, c === 'negative' ? 'negative' : 'positive', originalIndex));
          });

          if (btnTemplate) btnTemplate.classList.add('hidden');
        }
      });
    }
  };
})();