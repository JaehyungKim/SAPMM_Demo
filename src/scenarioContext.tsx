/**
 * Which scenario (J45 / BMD / BNX) the SAP screens are running in. Shared building blocks
 * (Fiori shell home button, SAP GUI command field) use it to stay inside the scenario.
 * J45 keeps its original routes (/step/:id) so its screens need no changes.
 */
import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { TCODE_MAP } from './steps';

export type ScenarioId = 'j45' | 'bmd' | 'bnx' | 'bmk' | 'bmy' | '22z' | '18j' | 'bmr';

export const stepPath = (scn: ScenarioId, stepId: string) => (scn === 'j45' ? `/step/${stepId}` : `/${scn}/step/${stepId}`);

const Ctx = createContext<{ id: ScenarioId; tcodes: Record<string, string> }>({ id: 'j45', tcodes: TCODE_MAP });
export const ScenarioProvider = Ctx.Provider;

export function useScenarioNav() {
  const { id, tcodes } = useContext(Ctx);
  const nav = useNavigate();
  return { id, tcodes, go: (stepId: string) => nav(stepPath(id, stepId)) };
}
