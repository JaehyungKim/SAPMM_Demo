/**
 * Contract between the presenter harness and a scope-item scenario (J45, BMD, BNX …).
 * A scenario brings its own steps, screens, document-chain store, guide texts and briefing;
 * the harness (stepper, sidebar, guide panel, scenario menu) works on any of them.
 */
import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import type { Role, StepDef } from '../steps';
import type { StepProps } from '../steps/types';
import type { StepGuide } from '../harness/guide';
import type { ScenarioId } from '../scenarioContext';
import { useDemo } from '../store';

export type Screen = LazyExoticComponent<ComponentType<StepProps>>;

/** Lazily loads named export `name` from a screen module (one chunk per module). */
export const pick = (load: () => Promise<unknown>, name: string): Screen =>
  lazy(() => load().then((m) => ({ default: (m as Record<string, ComponentType<StepProps>>)[name] })));

/** Live state of a scenario's document chain, as seen by the harness. */
export interface Runtime {
  done: (stepId: string) => boolean;
  meets: (req: string) => boolean;
  autoComplete: (req: string) => void;
  reqText: Record<string, { text: string; goto: string }>;
  /** Document numbers shown at the bottom of the sidebar. */
  summary: { label: string; value: string }[];
  reset: () => void;
  briefed: boolean;
  setBriefed: (b: boolean) => void;
  markVisited: (id: string) => void;
}

export interface Briefing {
  headline: string;
  story: ReactNode;
  phases: { icon: string; t: string; d: string }[];
  cast: { role: Role; does: string; steps: string }[];
}

export interface ScenarioDef {
  id: ScenarioId;
  code: string;
  title: string;
  titleEn: string;
  /** One line for the scenario menu. */
  summary: string;
  source: string;
  steps: StepDef[];
  screens: Record<string, { fiori: Screen; gui: Screen }>;
  tcodes: Record<string, string>;
  useRuntime: () => Runtime;
  useGuide: (stepId: string) => StepGuide;
  useBriefing: () => Briefing;
}

/** Key under which a step's on/off switch is stored (J45 keeps its original keys). */
export const optKey = (scn: ScenarioId, stepId: string) => (scn === 'j45' ? stepId : `${scn}:${stepId}`);

/** Optional steps are on unless the presenter switched them off. */
export const isOptOn = (scn: ScenarioId, stepId: string) => useDemo.getState().optionalEnabled[optKey(scn, stepId)] !== false;

/** Organisation data shared by all scenarios (edited on the setup page). */
export const useOrg = () => useDemo((s) => s.config);
