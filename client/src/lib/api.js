// Single entry point to talk to the API (same approach as I Love Verticals).
// Components call these functions rather than fetch directly.

// Event sent when the server answers 401 (not signed in, session expired):
// auth.jsx listens to it and shows the CMS sign-in page
export const UNAUTHORIZED_EVENT = 'rrd:unauthorized';

// The server sends { error: "message" }: it becomes a JavaScript error (err.status = HTTP code)
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  if (res.status === 204) return null; // success without content (deletion)
  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(data?.error || `Error ${res.status}`), { status: res.status, data });
  return data;
}

const json = (method, data) => ({ method, body: JSON.stringify(data) });

// ---------- Public site ----------
// Content of a page: { key, content, seo } (default texts completed by the CMS)
export const pagesApi = {
  get: (key) => request(`/pages/${encodeURIComponent(key)}`),
};

// Contact page form (lands in CMS › Messages)
export const messagesApi = {
  send: (data) => request('/messages', json('POST', data)),
};

// ---------- CMS sign-in (Google, see auth.jsx) ----------
export const authApi = {
  session: () => request('/auth/session'),
  google: (credential) => request('/auth/google', json('POST', { credential })),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// ---------- CMS ----------
export const cmsPagesApi = {
  list: () => request('/cms/pages'),
  // { definition, content, defaults, seo, updatedAt, updatedBy }
  get: (key) => request(`/cms/pages/${encodeURIComponent(key)}`),
  save: (key, data) => request(`/cms/pages/${encodeURIComponent(key)}`, json('PUT', data)),
};

export const cmsMessagesApi = {
  list: () => request('/cms/messages'),
  setRead: (id, read) => request(`/cms/messages/${id}`, json('PATCH', { read })),
  remove: (id) => request(`/cms/messages/${id}`, { method: 'DELETE' }),
};

// Images uploaded in the CMS: the file is sent as is (not as JSON)
export const MAX_IMAGE_MB = 8;
export const cmsMediaApi = {
  list: () => request('/cms/media'),
  upload: (file) =>
    request('/cms/media', {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) },
      body: file,
    }),
  remove: (id) => request(`/cms/media/${id}`, { method: 'DELETE' }),
};
