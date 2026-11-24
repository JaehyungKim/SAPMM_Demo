/**
 * In-progress form state shared by the Fiori and SAP GUI renderings of a step, so the
 * presenter can switch UI mode (or use compare mode) mid-transaction without losing entries.
 * Keys embed the document identity (e.g. PO number + number of GRs) so a fresh form
 * appears automatically after posting or after "데모 초기화".
 */
import { create } from 'zustand';

const useShared = create<{ m: Record<string, unknown>; put: (k: string, v: unknown) => void }>((set) => ({
  m: {},
  put: (k, v) => set((s) => ({ m: { ...s.m, [k]: v } })),
}));

/** Subscribe to all in-progress entries (used by the presenter guide to tick off actions). */
export const useSharedMap = () => useShared((s) => s.m);

export function useSharedState<T>(key: string, init: T): [T, (v: T) => void] {
  const has = useShared((s) => key in s.m);
  const value = useShared((s) => s.m[key]) as T | undefined;
  const put = useShared((s) => s.put);
  return [has ? (value as T) : init, (v: T) => put(key, v)];
}
