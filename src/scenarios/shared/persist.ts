/**
 * Persistence helpers for scenario stores: random document numbers and re-anchoring every
 * stored ISO date to the day the demo is opened (same rule as the J45 store).
 */
import { daysBetween, shiftIso, todayIso } from '../../format';

export const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));

const ISO = /^\d{4}-\d{2}-\d{2}($|T)/;

/** Shifts every ISO date string inside `v` by `days`. */
function shiftDeep<T>(v: T, days: number): T {
  if (typeof v === 'string') return (ISO.test(v) ? shiftIso(v, days) : v) as T;
  if (Array.isArray(v)) return v.map((x) => shiftDeep(x, days)) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shiftDeep(x, days)])) as T;
  return v;
}

/** zustand `persist` merge: keeps intervals, moves the whole chain so it was built "today". */
export function anchoredMerge<S extends { anchorDate: string }>(persisted: unknown, current: S): S {
  const p = persisted as Partial<S> | undefined;
  const merged = { ...current, ...(p ?? {}) } as S;
  const d = daysBetween(merged.anchorDate ?? todayIso(), todayIso());
  const out = d ? shiftDeep(merged, d) : merged;
  return { ...out, anchorDate: todayIso() };
}

export const yearEnd = () => `${new Date().getFullYear()}-12-31`;
