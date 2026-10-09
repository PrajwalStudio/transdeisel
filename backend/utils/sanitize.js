const sanitizeHtml = require('sanitize-html');

const stripHtml = (value = '') =>
  sanitizeHtml(String(value), {
    allowedTags: [],
    allowedAttributes: {},
  });

const normalizeWhitespace = (value = '') => stripHtml(value).replace(/\s+/g, ' ').trim();

module.exports = { stripHtml, normalizeWhitespace };
