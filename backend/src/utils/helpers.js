import crypto from 'crypto';

export function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g);
  return matches ? matches.map(tag => tag.slice(1)) : [];
}

export function extractMentions(text) {
  if (!text) return [];
  const matches = text.match(/@[a-zA-Z0-9_.]+/g);
  return matches ? matches.map(mention => mention.slice(1)) : [];
}

export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.trim();
}
