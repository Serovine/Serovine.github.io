const PromptProcessor = (function() {
  'use strict';

  const WEIGHT_REGEX = /^\((.+?)(?::([\d.]+))?\)$/;

  function cleanTag(text) {
    return text.toLowerCase().replace(/_/g, ' ').trim().replace(/\s+/g, ' ');
  }

  return {
    process(rawText) {
      if (!rawText || typeof rawText !== 'string') {
        const empty = [];
        empty.duplicatesRemoved = 0;
        return empty;
      }

      const seen = new Set();
      let duplicateCount = 0;

      const result = rawText.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(raw => {
          let text = raw;
          let weight = 1.0;
          const match = text.match(WEIGHT_REGEX);

          if (match) {
            text = match[1].trim();
            if (match[2]) {
              weight = parseFloat(match[2]);
              if (isNaN(weight) || weight < 0.1) weight = 0.1;
              if (weight > 2.0) weight = 2.0;
            }
          } else {
            text = text.replace(/^_+|_+$/g, '');
          }

          return { text: cleanTag(text), weight };
        })
        .filter(t => {
          if (t.text.length === 0) return false;
          if (seen.has(t.text)) {
            duplicateCount++;
            return false;
          }
          seen.add(t.text);
          return true;
        });

      result.duplicatesRemoved = duplicateCount;
      return result;
    },

    toString(tags) {
      if (!Array.isArray(tags)) return '';
      return tags.map(t => t.weight === 1.0 ? t.text : `(${t.text}:${parseFloat(t.weight.toFixed(2))})`).join(', ');
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptProcessor;
}
