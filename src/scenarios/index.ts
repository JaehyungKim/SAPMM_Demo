/** All scope-item scenarios available in the scenario menu (order = menu order). */
import type { ScenarioId } from '../scenarioContext';
import type { ScenarioDef } from './types';
import { J45 } from './j45';
import { BMD } from './bmd/index';
import { BNX } from './bnx/index';
import { BMK } from './bmk/index';
import { BMY } from './bmy/index';
import { SRV } from './22z/index';
import { REQ } from './18j/index';
import { BMR } from './bmr/index';

export const SCENARIOS: ScenarioDef[] = [J45, BMD, BNX, REQ, SRV, BMR, BMY, BMK];
export const scenarioById = (id: ScenarioId) => SCENARIOS.find((s) => s.id === id) ?? J45;
