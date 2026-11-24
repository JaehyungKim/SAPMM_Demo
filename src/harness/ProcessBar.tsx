/** Horizontal stepper across the top of the stage. */
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo } from '../store';
import { stepDone, useEnabledSteps } from './progress';

export function ProcessBar({ current }: { current: string }) {
  const s = useDemo();
  const nav = useNavigate();
  const steps = useEnabledSteps();
  return (
    <div className="pbar">
      {steps.map((st, i) => {
        const done = stepDone(st.id, s);
        const cur = st.id === current;
        return (
          <div key={st.id} className="pbar-item">
            {i > 0 && <span className={`pbar-line ${done || cur ? 'on' : ''}`} />}
            <button className={`pbar-dot ${done ? 'done' : ''} ${cur ? 'cur' : ''} ${st.optional ? 'opt' : ''}`} onClick={() => nav(`/step/${st.id}`)} title={`${st.no}. ${st.title}`}>
              {done ? <Icon name="accept" /> : st.no}
            </button>
            <span className={`pbar-label ${cur ? 'cur' : ''}`}>{st.title}</span>
          </div>
        );
      })}
    </div>
  );
}
