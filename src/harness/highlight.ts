/**
 * Finds and outlines the element the guide refers to on the simulated SAP screen.
 * Elements are found by their visible text, so the SAP screens need no special markup.
 */
import { useEffect, useState } from 'react';
import type { ViewMode } from '../store';
import type { GuideAction } from './guide';

const CLICKABLE = 'button, .lp-tile, .f-link, .g-tree-row, .inbox-item, .alp-kpi, tr.is-clickable';
const CLS = { current: 'guide-target', hover: 'guide-hover' } as const;

const norm = (t: string | null) => (t ?? '').replace(/\s+/g, ' ').trim();
const paneOf = (mode: ViewMode) => document.querySelector(`.stage-pane[data-mode="${mode}"]`);
const openDialog = (root: Element) => root.querySelector('ui5-dialog[open]');

/** Exact text match first, otherwise the smallest visible clickable element containing the text. */
export function findTarget(mode: ViewMode, text: string, within?: Element | null): HTMLElement | null {
  const root = within ?? paneOf(mode);
  if (!root) return null;
  const all = Array.from(root.querySelectorAll<HTMLElement>(CLICKABLE)).filter((el) => el.getClientRects().length > 0);
  const want = norm(text);
  const exact = all.find((el) => norm(el.textContent) === want);
  if (exact) return exact;
  const partial = all.filter((el) => norm(el.textContent).includes(want));
  partial.sort((a, b) => norm(a.textContent).length - norm(b.textContent).length);
  return partial[0] ?? null;
}

/** Re-runs `fn` whenever the stage DOM changes (screens re-render, dialogs open/close). */
function useStageWatch(fn: () => void, deps: unknown[]) {
  useEffect(() => {
    let frame = 0;
    const run = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fn); };
    run();
    const root = document.querySelector('.stage-screens');
    const mo = new MutationObserver(run);
    if (root) mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'disabled'] });
    return () => { mo.disconnect(); cancelAnimationFrame(frame); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Index of the action to do next:
 *  1. an open dialog is modal → the pending action whose target is inside it;
 *  2. otherwise the first pending action whose target is on screen;
 *  3. if that target is not on screen yet (e.g. a result list before "실행"), the nearest
 *     earlier action whose target is visible – that is the click that reveals it.
 */
export function useGuideCursor(mode: ViewMode, actions: GuideAction[], enabled: boolean) {
  const [cur, setCur] = useState(-1);
  const sig = actions.map((a) => `${a.target}|${a.done}`).join(';');
  useStageWatch(() => {
    if (!enabled) { setCur(-1); return; }
    const pending = actions.map((a, i) => (a.done === false ? i : -1)).filter((i) => i >= 0);
    if (!pending.length) { setCur(-1); return; }
    const pane = paneOf(mode);
    const dlg = pane && openDialog(pane);
    if (dlg) {
      const inDlg = pending.find((i) => actions[i].target && findTarget(mode, actions[i].target!, dlg));
      if (inDlg !== undefined) { setCur(inDlg); return; }
    }
    const first = pending[0];
    if (!actions[first].target || findTarget(mode, actions[first].target)) { setCur(first); return; }
    for (let i = first - 1; i >= 0; i--) {
      if (actions[i].target && findTarget(mode, actions[i].target!)) { setCur(i); return; }
    }
    setCur(first);
  }, [mode, sig, enabled]);
  return cur;
}

/** Keeps `target` outlined while the screen re-renders. */
export function useHighlight(mode: ViewMode, target: string | undefined, kind: keyof typeof CLS) {
  const cls = CLS[kind];
  useStageWatch(() => {
    const pane = paneOf(mode);
    const dlg = pane && openDialog(pane);
    const el = target ? (dlg && findTarget(mode, target, dlg)) || findTarget(mode, target) : null;
    if (el?.classList.contains(cls)) return;
    document.querySelectorAll('.' + cls).forEach((x) => x.classList.remove(cls));
    el?.classList.add(cls);
  }, [mode, target, cls]);
  useEffect(() => () => document.querySelectorAll('.' + cls).forEach((x) => x.classList.remove(cls)), [cls]);
}
