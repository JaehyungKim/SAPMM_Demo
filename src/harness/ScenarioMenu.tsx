/** Scenario picker (opened from the scenario name in the top bar): lists every scope item with its progress and switches the demo to it. */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { stepPath } from '../scenarioContext';
import { SCENARIOS } from '../scenarios/index';
import type { ScenarioDef } from '../scenarios/types';

function Card({ def, current, onPick }: { def: ScenarioDef; current: boolean; onPick: () => void }) {
  const rt = def.useRuntime();
  const done = def.steps.filter((st) => st.id !== 'launchpad' && rt.done(st.id)).length;
  const total = def.steps.length - 1;
  return (
    <button className={`smenu-card ${current ? 'cur' : ''}`} onClick={onPick}>
      <span className="smenu-code">{def.code}</span>
      <span className="smenu-txt">
        <b>{def.title} <small>{def.titleEn}</small></b>
        <span>{def.summary}</span>
        <span className="smenu-prog"><i style={{ width: `${(done / total) * 100}%` }} /></span>
        <small>{done} / {total} 단계 완료 · 출처 {def.source}</small>
      </span>
      {current ? <span className="smenu-cur">진행 중</span> : <Icon name="navigation-right-arrow" />}
    </button>
  );
}

export function ScenarioMenu({ current, onClose }: { current: string; onClose: () => void }) {
  const nav = useNavigate();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="smenu-backdrop" onClick={onClose}>
      <div className="smenu" onClick={(e) => e.stopPropagation()} role="menu" aria-label="시나리오 선택">
        <div className="smenu-head"><Icon name="list" /> 시나리오 선택 <small>SAP S/4HANA Cloud 조달 Scope Item</small></div>
        {SCENARIOS.map((d) => (
          <Card key={d.id} def={d} current={d.id === current} onPick={() => { onClose(); if (d.id !== current) nav(stepPath(d.id, 'launchpad')); }} />
        ))}
        <div className="smenu-foot">
          <button className="dbar-btn smenu-setup" onClick={() => { onClose(); nav('/setup'); }}><Icon name="edit" /> 데모 환경 설정 (회사·플랜트·날짜 형식 – 전 시나리오 공통)</button>
        </div>
      </div>
    </div>
  );
}
