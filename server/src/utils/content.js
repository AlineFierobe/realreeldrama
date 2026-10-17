// Tools around the page definitions (data/pages.js):
//   defaultsOf(page)        default content (mock-up texts)
//   mergeContent(page, db)  saved content completed with the default values
//   cleanContent(page, in)  content received from the CMS, reduced to known fields and validated
// A validation error has status 400: the error handler sends it back as is.

const MAX_LENGTH = { text: 300, url: 500, image: 300, textarea: 6000, select: 100 };
const MAX_ITEMS = 60;

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

// Accepted links: https://…, http://…, mailto:…, site path (/about) or anchor (#unscripted)
export function isAllowedUrl(value) {
  if (value === '') return true;
  if (/^(\/(?!\/)|#)/.test(value)) return true;
  return /^(https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+)$/i.test(value);
}

// Accepted images: a mock-up photo (/images/name.jpg) or an image uploaded in the CMS (/api/media/<id>)
export function isAllowedImage(value) {
  if (value === '') return true;
  return /^\/images\/[\w.-]+\.(jpe?g|png|webp|gif|svg)$/i.test(value) || /^\/api\/media\/[a-f0-9]{24}$/.test(value);
}

const fieldDefault = (field) => structuredClone(field.default ?? (field.type === 'list' ? [] : ''));

// List item: each field takes the saved value, otherwise an empty value
function mergeItem(fields, item = {}) {
  return Object.fromEntries(
    fields.map((f) => {
      if (f.type === 'list') return [f.key, Array.isArray(item[f.key]) ? item[f.key].map((i) => mergeItem(f.fields, i)) : []];
      if (f.type === 'select') return [f.key, f.options.some((o) => o.value === item[f.key]) ? item[f.key] : f.default];
      return [f.key, typeof item[f.key] === 'string' ? item[f.key] : ''];
    })
  );
}

export function defaultsOf(page) {
  return Object.fromEntries(page.sections.map((s) => [s.key, Object.fromEntries(s.fields.map((f) => [f.key, fieldDefault(f)]))]));
}

export function mergeContent(page, stored = {}) {
  return Object.fromEntries(
    page.sections.map((s) => [
      s.key,
      Object.fromEntries(
        s.fields.map((f) => {
          const value = stored?.[s.key]?.[f.key];
          if (value === undefined || value === null) return [f.key, fieldDefault(f)];
          if (f.type === 'list') return [f.key, Array.isArray(value) ? value.map((i) => mergeItem(f.fields, i)) : fieldDefault(f)];
          return [f.key, value];
        })
      ),
    ])
  );
}

function cleanValue(field, value, path) {
  if (field.type === 'list') {
    if (value === undefined) return [];
    if (!Array.isArray(value)) throw badRequest(`${path} must be a list.`);
    if (value.length > MAX_ITEMS) throw badRequest(`${path}: ${MAX_ITEMS} items maximum.`);
    return value.map((item, i) => {
      if (!item || typeof item !== 'object') throw badRequest(`${path} #${i + 1} is invalid.`);
      return Object.fromEntries(field.fields.map((f) => [f.key, cleanValue(f, item[f.key], `${path} #${i + 1} › ${f.label}`)]));
    });
  }
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw badRequest(`${path} must be text.`);
  // Consistent line endings; extra spaces removed at the start and end
  const clean = value.replace(/\r\n?/g, '\n').trim();
  if (clean.length > MAX_LENGTH[field.type]) throw badRequest(`${path}: ${MAX_LENGTH[field.type]} characters maximum.`);
  if (field.type === 'url' && !isAllowedUrl(clean)) throw badRequest(`${path}: enter a full link (https://…), an email (mailto:…), a page (/about) or an anchor (#unscripted).`);
  if (field.type === 'image' && !isAllowedImage(clean)) throw badRequest(`${path}: choose an image from the library or upload one.`);
  if (field.type === 'select' && !field.options.some((o) => o.value === clean)) throw badRequest(`${path}: invalid choice.`);
  return clean;
}

export function cleanContent(page, input) {
  if (!input || typeof input !== 'object') throw badRequest('Missing content.');
  return Object.fromEntries(
    page.sections.map((s) => [
      s.key,
      Object.fromEntries(s.fields.map((f) => [f.key, cleanValue(f, input[s.key]?.[f.key], `${s.label} › ${f.label}`)])),
    ])
  );
}

// SEO of a page: title and description (optional)
export function cleanSeo(input = {}) {
  const seo = {};
  for (const [key, max] of [['title', 70], ['description', 200]]) {
    const value = input?.[key] ?? '';
    if (typeof value !== 'string') throw badRequest(`SEO ${key} must be text.`);
    const clean = value.replace(/\s+/g, ' ').trim();
    if (clean.length > max) throw badRequest(`SEO ${key}: ${max} characters maximum.`);
    seo[key] = clean;
  }
  return seo;
}

// Images used by the saved pages (to warn before deleting one from the library)
export function imagesIn(page, content) {
  const found = [];
  const walk = (fields, value) => {
    for (const f of fields) {
      if (f.type === 'image' && value?.[f.key]) found.push(value[f.key]);
      if (f.type === 'list') (value?.[f.key] ?? []).forEach((item) => walk(f.fields, item));
    }
  };
  page.sections.forEach((s) => walk(s.fields, content?.[s.key]));
  return found;
}
