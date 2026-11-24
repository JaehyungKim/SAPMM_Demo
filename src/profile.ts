/**
 * Customer profile ("고객 맞춤 데모"): the admin picks scope items for a customer and sends a
 * link. Everything the customer page needs travels inside the link (#/c/<token>), so the
 * static site needs no server: scope-item codes, customer name, a greeting, and the setup
 * values that differ from the defaults (company name, person names …).
 *
 * Opening a link stores the profile in the browser; from then on the scenario menu only shows
 * the customer's scope items and the admin entry points are hidden. "전체 모드" removes it.
 */
import { create } from 'zustand';
import { demoStorage, rawGet, rawSet } from './persistStorage';
import { persist } from 'zustand/middleware';
import { defaultConfig, useDemo, type DemoConfig } from './store';

export interface CustomerProfile {
  v: 1;
  /** Customer (company) name shown on the customer page. */
  customer: string;
  /** Greeting / purpose shown on the customer page. */
  message: string;
  /** Scope-item codes of the implemented scenarios to show (scenario menu order applies). */
  codes: string[];
  /** Setup values that differ from the defaults. */
  cfg: Partial<DemoConfig>;
  createdAt: string;
}

interface ProfileState {
  active: CustomerProfile | null;
  setActive: (p: CustomerProfile | null) => void;
}

export const useProfile = create<ProfileState>()(
  persist((set) => ({ active: null, setActive: (active) => set({ active }) }), { name: 'j45-demo-profile', storage: demoStorage, version: 1 }),
);

/* ---------- link token: JSON → UTF-8 → base64url ---------- */
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export const encodeProfile = (p: CustomerProfile) => b64url(new TextEncoder().encode(JSON.stringify(p)));

export function decodeProfile(token: string): CustomerProfile | null {
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64url(token))) as CustomerProfile;
    if (p?.v !== 1 || !Array.isArray(p.codes)) return null;
    return { ...p, cfg: p.cfg ?? {}, message: p.message ?? '', customer: p.customer ?? '' };
  } catch {
    return null;
  }
}

/** Setup values that differ from the defaults (keeps links short). */
export function configDiff(c: DemoConfig): Partial<DemoConfig> {
  const d = defaultConfig();
  const out: Partial<DemoConfig> = {};
  (Object.keys(c) as (keyof DemoConfig)[]).forEach((k) => {
    if (k === 'deliveryDate') return; // always relative to the day the demo is opened
    if (k === 'userNames') {
      const names = Object.fromEntries(Object.entries(c.userNames ?? {}).filter(([, v]) => v.trim()));
      if (Object.keys(names).length) out.userNames = names;
      return;
    }
    if (JSON.stringify(c[k]) !== JSON.stringify(d[k])) (out as Record<string, unknown>)[k] = c[k];
  });
  return out;
}

/** Link to the customer page, based on the address the demo is currently served from. */
export function customerLink(p: CustomerProfile) {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/c/${encodeProfile(p)}`;
}

const BACKUP = 'j45-demo-config-backup';

/** Activates a profile: customer mode on, setup values applied on top of the defaults. */
export function applyProfile(p: CustomerProfile) {
  // First switch into customer mode: keep the presenter's own setup so "전체 모드" can restore it.
  if (!useProfile.getState().active && !rawGet(BACKUP)) rawSet(BACKUP, JSON.stringify(useDemo.getState().config));
  const d = defaultConfig();
  useDemo.getState().setConfig({ ...d, ...p.cfg, deliveryDate: d.deliveryDate, userNames: { ...(p.cfg.userNames ?? {}) } });
  useDemo.getState().finishSetup();
  useProfile.getState().setActive(p);
}

/** Back to the presenter's full demo (all scenarios, admin visible) with the original setup. */
export function leaveCustomerMode() {
  const b = rawGet(BACKUP);
  if (b) { try { useDemo.getState().setConfig(JSON.parse(b)); } catch { /* ignore */ } rawSet(BACKUP, null); }
  useProfile.getState().setActive(null);
}
