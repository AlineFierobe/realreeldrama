import { useEffect, useState } from 'react';
import { pagesApi } from './api.js';

// Page contents, kept in memory during the visit: coming back to a page shows it
// right away (then the server's version replaces it if it changed).
const cache = new Map();

export function usePage(key) {
  const [state, setState] = useState(() => ({ data: cache.get(key) ?? null, error: null }));

  useEffect(() => {
    let cancelled = false;
    setState({ data: cache.get(key) ?? null, error: null });
    pagesApi
      .get(key)
      .then((data) => {
        cache.set(key, data);
        if (!cancelled) setState({ data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((prev) => ({ data: prev.data, error }));
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}

// Tab title: SEO title (CMS, otherwise the page default)
export function useDocumentTitle(title) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
