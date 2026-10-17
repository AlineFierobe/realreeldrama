// CMS pages, in menu order (same keys as server/src/data/pages.js)
// color: tag color of the kit used for the page in the menu and on the dashboard
export const PAGE_LINKS = [
  { key: 'home', name: 'Homepage', path: '/', color: 'pink' },
  { key: 'about', name: 'About', path: '/about', color: 'yellow' },
  { key: 'contact', name: 'Contact', path: '/contact', color: 'aqua' },
  { key: 'legal', name: 'Legal notice', path: '/legal-notice', color: 'peach' },
  { key: 'site', name: 'Site settings', path: null, color: 'slate' },
];

export const pageColor = (key) => PAGE_LINKS.find((p) => p.key === key)?.color ?? 'pink';
