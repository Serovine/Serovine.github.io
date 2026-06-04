/**
 * danbooruProcessor.js
 * Parses raw text copied from Danbooru and extracts clean tags.
 */
const DanbooruProcessor = (function() {
  'use strict';

  const EXCLUDED_HEADERS = new Set(['general', 'meta', 'copyright', 'artist', 'character']);

  return {
    parse(rawText) {
      if (!rawText || typeof rawText !== 'string') return '';

      return rawText.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '?' && line !== '')
        .filter(line => !EXCLUDED_HEADERS.has(line.toLowerCase()))
        .map(line => line.replace(/\s+[\d.]+[kKmM]?$/, '').trim())
        .filter(line => line.length > 0)
        .join(', ');
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DanbooruProcessor;
}