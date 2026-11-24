/** Shown instead of a screen whose prerequisite document does not exist yet. */
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { stepPath } from '../scenarioContext';
import type { Runtime, ScenarioDef } from '../scenarios/types';

export function StepGuard({ def, rt, requires }: { def: ScenarioDef; rt: Runtime; requires: string }) {
  const nav = useNavigate();
  const r = rt.reqText[requires] ?? { text: '선행 단계가 완료되지 않았습니다.', goto: 'launchpad' };
  return (
    <div className="guard">
      <Icon name="process" className="guard-icon" />
      <h2>선행 단계가 필요합니다</h2>
      <p>{r.text}</p>
      <div className="guard-btns">
        <button className="f-btn f-btn-emph" onClick={() => nav(stepPath(def.id, r.goto))}>선행 단계로 이동</button>
        <button className="f-btn" onClick={() => rt.autoComplete(requires)}>선행 단계 자동 완료</button>
      </div>
    </div>
  );
}
