/**
 * Where the demo keeps its state. Normally localStorage (survives refresh, one state per browser).
 * A customer-link preview opened from the admin page (`#/c/<token>?preview=1`) uses the tab's
 * sessionStorage instead, so previewing never touches the presenter's own demo data.
 * Must be imported before any store is created (store.ts imports it first).
 */
import { createJSONStorage } from 'zustand/middleware';

const KEY = 'j45-demo-preview';

export const isPreview: boolean = (() => {
  try {
    if (/[?&]preview=1/.test(location.hash)) sessionStorage.setItem(KEY, '1');
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();

const backing = (): Storage => (isPreview ? sessionStorage : localStorage);
export const demoStorage = createJSONStorage(backing);

/** Raw access for small extras (config backup); failures (private mode …) are ignored. */
export const rawGet = (k: string) => { try { return backing().getItem(k); } catch { return null; } };
export const rawSet = (k: string, v: string | null) => { try { if (v === null) backing().removeItem(k); else backing().setItem(k, v); } catch { /* ignore */ } };
