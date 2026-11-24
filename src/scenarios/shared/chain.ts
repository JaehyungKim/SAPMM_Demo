/**
 * Generic document-chain store for scenarios whose steps form a simple chain:
 * every step is "done" once on a given date, may carry values (document numbers, quantities …),
 * and requires one earlier step. Optional steps that the presenter switched off are skipped
 * transparently (their own prerequisite is used instead).
 */
import { create } from 'zustand';
import { demoStorage } from '../../persistStorage';
import { persist } from 'zustand/middleware';
import { todayIso } from '../../format';
import { useDemo } from '../../store';
import type { StepDef } from '../../steps';
import type { ScenarioId } from '../../scenarioContext';
import { isOptOn, type Runtime } from '../types';
import { anchoredMerge } from './persist';

export interface ChainState {
  anchorDate: string;
  briefed: boolean;
  visited: string[];
  numbers: Record<string, string>;
  /** stepId → ISO date when the step was completed. */
  done: Record<string, string>;
  /** free values written by the screens (posted documents, chosen quantities …). */
  vals: Record<string, unknown>;
  setBriefed: (b: boolean) => void;
  markVisited: (id: string) => void;
  reset: () => void;
  /** Completes one or more steps, stores values and shows the step's SAP GUI status message. */
  mark: (ids: string | string[], vals?: Record<string, unknown>) => void;
  setVal: (k: string, v: unknown) => void;
}

export interface ChainOpts {
  scn: ScenarioId;
  numbers: () => Record<string, string>;
  /** SAP GUI status-bar text per step. */
  msgs?: Record<string, (n: Record<string, string>) => string>;
  /** Values stored when a step is completed automatically ("선행 단계 자동 완료"). */
  auto?: Record<string, (n: Record<string, string>, v: Record<string, unknown>) => Record<string, unknown>>;
}

export function makeChain(opts: ChainOpts) {
  const fresh = () => ({ anchorDate: todayIso(), briefed: false, visited: [] as string[], numbers: opts.numbers(), done: {} as Record<string, string>, vals: {} as Record<string, unknown> });
  return create<ChainState>()(
    persist(
      (set, get) => ({
        ...fresh(),
        setBriefed: (briefed) => set({ briefed }),
        markVisited: (id) => set((s) => (s.visited.includes(id) ? s : { visited: [...s.visited, id] })),
        reset: () => set(fresh()),
        mark: (ids, vals) => {
          const list = Array.isArray(ids) ? ids : [ids];
          const d = { ...get().done };
          list.forEach((i) => { d[i] = d[i] ?? todayIso(); });
          set({ done: d, vals: { ...get().vals, ...(vals ?? {}) } });
          const m = opts.msgs?.[list[0]];
          if (m) useDemo.getState().setGuiMessage({ type: 'S', text: m(get().numbers) });
        },
        setVal: (k, v) => set({ vals: { ...get().vals, [k]: v } }),
      }),
      {
        name: `j45-demo-${opts.scn}`, storage: demoStorage,
        version: 1,
        merge: (p, c) => {
          const m = anchoredMerge(p, c);
          return { ...m, numbers: { ...c.numbers, ...m.numbers }, done: m.done ?? {}, vals: m.vals ?? {} };
        },
      },
    ),
  );
}

type ChainHook = ReturnType<typeof makeChain>;

/** Runtime (done / prerequisites / auto-complete / summary) for a chain scenario. */
export function chainRuntime(
  scn: ScenarioId, steps: StepDef[], use: ChainHook, opts: ChainOpts,
  summary: (s: ChainState) => { label: string; value: string }[], view: string[] = [],
) {
  const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
  /** A switched-off optional step is replaced by its own prerequisite. */
  const resolve = (req: string): string => {
    const st = byId[req];
    if (!st || req === 'none') return 'none';
    return st.optional && !isOptOn(scn, req) ? resolve(st.requires) : req;
  };
  const reqText = Object.fromEntries(steps.map((s) => [s.id, { text: `'${s.no}. ${s.title}' 단계가 아직 완료되지 않았습니다.`, goto: s.id }]));
  return function useRuntime(): Runtime {
    const s = use();
    const isDone = (id: string) => !!s.done[id] || ((view.includes(id) || id === 'launchpad') && s.visited.includes(id));
    return {
      done: isDone,
      meets: (req) => { const r = resolve(req); return r === 'none' || !!use.getState().done[r] || (view.includes(r) && use.getState().visited.includes(r)); },
      autoComplete: (req) => {
        const run = (id: string) => {
          const r = resolve(id);
          if (r === 'none' || use.getState().done[r]) return;
          run(byId[r].requires);
          const st = use.getState();
          st.mark(r, opts.auto?.[r]?.(st.numbers, st.vals));
        };
        run(req);
        useDemo.getState().setGuiMessage({ type: 'I', text: '선행 단계가 자동으로 완료되었습니다' });
      },
      reqText: { ...reqText, none: { text: '', goto: 'launchpad' } },
      summary: summary(s),
      reset: s.reset, briefed: s.briefed, setBriefed: s.setBriefed, markVisited: s.markVisited,
    };
  };
}

/** Compact StepDef builder used by the chain scenarios. */
export const step = (no: number, id: string, title: string, titleEn: string, bpd: string, appName: string, appId: string, tcode: string,
  role: StepDef['role'], optional: boolean, requires: string): StepDef =>
  ({ id, no, title, titleEn, bpd, appName, appId, tcode, guiTitle: title, role, optional, requires });

/** T-code → step map built from the step list (plus extra aliases). */
export const tcodesOf = (steps: StepDef[], extra: Record<string, string> = {}) =>
  ({ S000: 'launchpad', ...Object.fromEntries(steps.filter((s) => s.appId !== 'Shell').map((s) => [s.tcode, s.id])), ...extra });
