/** Helpers to declare a chain scenario (steps → screens, runtime, guide) with little boilerplate. */
import type { StepDef } from '../../steps';
import type { StepGuide, GuideAction } from '../../harness/guide';
import type { ScenarioId } from '../../scenarioContext';
import { isOptOn, pick, type Briefing, type ScenarioDef } from '../types';
import { chainRuntime, tcodesOf, type ChainOpts, type ChainState, type makeChain } from './chain';

/** Guide action: what to click, why, the button text to outline, and whether it is done. */
export const A = (text: string, why: string, target?: string, done?: boolean): GuideAction => ({ text, why, target, done });
export const G = (situation: string, fiori: GuideAction[], gui: GuideAction[], value: string): StepGuide => ({ situation, fiori, gui, value });

/**
 * One guide line for both UIs. `{b}` in the text is replaced by the button of the UI
 * (f = Fiori target, g = SAP GUI target; g defaults to f). `only` restricts the line to one UI.
 */
export interface GLine { t: string; why: string; f?: string; g?: string; done?: boolean; only?: 'f' | 'g' }
export function GX(situation: string, lines: GLine[], value: string): StepGuide {
  const conv = (l: GLine, ui: 'f' | 'g') => {
    const b = ui === 'f' ? l.f : l.g ?? l.f;
    return A(l.t.replace('{b}', b ?? ''), l.why, b, l.done);
  };
  return G(situation,
    lines.filter((l) => l.only !== 'g').map((l) => conv(l, 'f')),
    lines.filter((l) => l.only !== 'f').map((l) => conv(l, 'g')),
    value);
}
/** Explanation-only line (no button). */
export const L = (t: string, why: string, only?: 'f' | 'g'): GLine => ({ t, why, only });
/** Button line: `'{b}' 클릭` with Fiori label f and GUI label g. */
export const B = (f: string, g: string | undefined, why: string, done?: boolean, t = "'{b}' 클릭"): GLine => ({ t, why, f, g: g ?? f, done });

export function defineChain(o: {
  id: ScenarioId; code: string; title: string; titleEn: string; summary: string; source: string;
  steps: StepDef[]; load: () => Promise<unknown>; use: ReturnType<typeof makeChain>; opts: ChainOpts;
  summaryOf: (s: ChainState) => { label: string; value: string }[]; view?: string[]; tcodes?: Record<string, string>;
  useGuide: (id: string) => StepGuide; useBriefing: () => Briefing;
}): ScenarioDef {
  return {
    id: o.id, code: o.code, title: o.title, titleEn: o.titleEn, summary: o.summary, source: o.source, steps: o.steps,
    screens: Object.fromEntries(o.steps.map((s) => [s.id, { fiori: pick(o.load, `${s.id}F`), gui: pick(o.load, `${s.id}G`) }])),
    tcodes: tcodesOf(o.steps, o.tcodes),
    useRuntime: chainRuntime(o.id, o.steps, o.use, o.opts, o.summaryOf, o.view),
    useGuide: o.useGuide,
    useBriefing: o.useBriefing,
  };
}

/** Standard launchpad guide: open the first app of the scenario. */
export function launchGuide(scn: ScenarioId, steps: StepDef[], situation: string, value: string): StepGuide {
  const first = steps.find((s) => s.appId !== 'Shell' && (!s.optional || isOptOn(scn, s.id)))!;
  return G(situation,
    [A(`'${first.title}' 타일 클릭`, `첫 업무 앱(${first.appName})을 엽니다. 공간(스페이스)은 역할별로 나뉘어 있습니다.`, first.title, false)],
    [A(`'${first.tcode} - ${first.title}' 더블클릭`, `SAP Easy Access 메뉴에서 ${first.tcode} 트랜잭션을 실행합니다. 명령 필드에 직접 입력해도 됩니다.`, `${first.tcode} - ${first.title}`, false)],
    value);
}
