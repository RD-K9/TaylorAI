import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'fashion-app-draft';

export function useSessionDraft(filters, generateCount, onRestore) {
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        if (draft.filters) onRestore(draft.filters, draft.generateCount);
      } catch {
        /* ignore */
      }
    }
    restored.current = true;
  }, [onRestore]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ filters, generateCount, savedAt: Date.now() })
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [filters, generateCount]);
}
