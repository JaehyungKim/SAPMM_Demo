/** All scope-item scenarios available in the scenario menu (order = menu order). */
import type { ScenarioId } from '../scenarioContext';
import { useProfile } from '../profile';
import type { ScenarioDef } from './types';
import { J45 } from './j45';
import { BMD } from './bmd/index';
import { BNX } from './bnx/index';
import { BMK } from './bmk/index';
import { BMY } from './bmy/index';
import { SRV } from './22z/index';
import { REQ } from './18j/index';
import { BMR } from './bmr/index';
import { PIP } from './41f/index';
import { RTR } from './1ji/index';
import { SEV } from './sl4/index';
import { RFP } from './1xf/index';

export const SCENARIOS: ScenarioDef[] = [J45, BMD, BNX, REQ, SRV, BMR, BMY, BMK, PIP, RTR, SEV, RFP];
export const scenarioById = (id: ScenarioId) => SCENARIOS.find((s) => s.id === id) ?? J45;

/** Scenarios offered in the current mode: all of them, or only the customer's scope items. */
export function useVisibleScenarios(): ScenarioDef[] {
  const p = useProfile((s) => s.active);
  if (!p) return SCENARIOS;
  const list = SCENARIOS.filter((d) => p.codes.includes(d.code));
  return list.length ? list : SCENARIOS;
}
