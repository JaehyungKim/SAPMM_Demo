/** Horizontal stepper across the top of the stage. */
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { stepPath } from '../scenarioContext';
import type { Runtime, ScenarioDef } from '../scenarios/types';
import { useEnabledSteps } from './progress';

export function ProcessBar({ def, rt, current }: { def: ScenarioDef; rt: Runtime; current: string }) {
  const nav = useNavigate();
  const steps = useEnabledSteps(def);
  return (
    <div className="pbar">
      {steps.map((st, i) => {
        const done = rt.done(st.id);
        const cur = st.id === current;
        return (
          <div key={st.id} className="pbar-item">
            {i > 0 && <span className={`pbar-line ${done || cur ? 'on' : ''}`} />}
            <button className={`pbar-dot ${done ? 'done' : ''} ${cur ? 'cur' : ''} ${st.optional ? 'opt' : ''}`} onClick={() => nav(stepPath(def.id, st.id))} title={`${st.no}. ${st.title}`}>
              {done ? <Icon name="accept" /> : st.no}
            </button>
            <span className={`pbar-label ${cur ? 'cur' : ''}`}>{st.title}</span>
          </div>
        );
      })}
    </div>
  );
}
