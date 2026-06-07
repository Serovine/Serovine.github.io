/**
 * tagManager.js
 * Loads tags.csv, categorizes tags, handles sorting logic and search for autocomplete.
 */
const TagManager = (function() {
  'use strict';

  const tagDB = new Map();
  let isLoaded = false;

  const CATEGORY_ORDER = {
    'quality': 1,
    'style': 2,
    'image_composition': 3,
    'character': 4,
    'background': 5,
    'lora': 6,
    'general': 7
  };

  const SUBCATEGORY_ORDER = {
    'quality': { 'score': 1, 'qc': 2, 'size': 3 },
    'style': { 'art': 1, 'medium': 2, 'light effect': 3 },
    'image_composition': { 'frame': 1, 'angle': 2 },
    'character': { 'person': 1, 'body': 2, 'cloth': 3, 'pose': 4 }
  };

  function parseCSV(csvText) {
    const lines = csvText.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim().replace(/\r/g, '');
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length >= 2) {
        const tag = parts[0].trim().toLowerCase();
        // แปลงช่องว่างเป็น Underscore เพื่อให้ตรงกับ CSS Class
        const category = parts[1].trim().toLowerCase().replace(/\s+/g, '_');
        const subcategory = parts[2] ? parts[2].trim().toLowerCase() : '';

        tagDB.set(tag, { category, subcategory });
      }
    }
  }

  return {
    async init(csvPath = 'data/tags.csv') {
      try {
        const response = await fetch(csvPath);
        if (!response.ok) {
          console.error('Failed to load tags.csv: Network response was not ok');
          return Promise.reject('Network response was not ok');
        }
        const csvText = await response.text();
        parseCSV(csvText);
        isLoaded = true;
        console.log(`TagManager Initialized: Loaded ${tagDB.size} tags.`);
      } catch (error) {
        console.error('Failed to load tags.csv:', error);
      }
    },

    getInfo(tagText) {
      if (!isLoaded) return { category: 'general', subcategory: '' };
      const cleanTag = tagText.toLowerCase().trim();
      return tagDB.get(cleanTag) || { category: 'general', subcategory: '' };
    },

    arrange(tagsArray) {
      return [...tagsArray].sort((a, b) => {
        const catA = a.cate || 'general';
        const catB = b.cate || 'general';

        const catOrderA = CATEGORY_ORDER[catA] || 99;
        const catOrderB = CATEGORY_ORDER[catB] || 99;

        if (catOrderA !== catOrderB) return catOrderA - catOrderB;

        const subA = a.subcate || '';
        const subB = b.subcate || '';
        const subMap = SUBCATEGORY_ORDER[catA];

        if (subMap) {
          const subOrderA = subMap[subA] || 99;
          const subOrderB = subMap[subB] || 99;
          if (subOrderA !== subOrderB) return subOrderA - subOrderB;
        }

        return a.text.localeCompare(b.text);
      });
    },

    search(query, limit = 10) {
      if (!isLoaded || !query) return [];
      const q = query.toLowerCase().trim();
      const results = [];

      for (const key of tagDB.keys()) {
        if (key.includes(q)) {
          results.push(key);
          if (results.length >= limit) break;
        }
      }
    }
  };
})();
