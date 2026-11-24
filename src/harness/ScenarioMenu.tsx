/**
 * Scenario picker (opened from the scenario name in the top bar). Implemented scenarios are
 * grouped by the SAP procurement scope-item map (`scenarios/catalog.ts`), in map order;
 * categories without an implemented scenario are not shown.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { stepPath } from '../scenarioContext';
import { SCENARIOS } from '../scenarios/index';
import { groupByCatalog } from '../scenarios/catalog';
import type { ScenarioDef } from '../scenarios/types';

function Card({ def, current, onPick }: { def: ScenarioDef; current: boolean; onPick: () => void }) {
  const rt = def.useRuntime();
  const done = def.steps.filter((st) => st.id !== 'launchpad' && rt.done(st.id)).length;
  const total = def.steps.length - 1;
  return (
    <button className={`smenu-card ${current ? 'cur' : ''}`} onClick={onPick} title={def.summary}>
      <span className="smenu-code">{def.code}</span>
      <span className="smenu-txt">
        <b>{def.title}</b>
        <small className="smenu-en">{def.titleEn}</small>
        <span className="smenu-prog"><i style={{ width: `${(done / total) * 100}%` }} /></span>
        <small>{done} / {total} 단계 완료</small>
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
  const groups = groupByCatalog(SCENARIOS);
  const pick = (d: ScenarioDef) => { onClose(); if (d.id !== current) nav(stepPath(d.id, 'launchpad')); };
  return (
    <div className="smenu-backdrop" onClick={onClose}>
      <div className="smenu" onClick={(e) => e.stopPropagation()} role="menu" aria-label="시나리오 선택">
        <div className="smenu-head">
          <Icon name="list" /> 시나리오 선택 <small>SAP S/4HANA Cloud 조달 Scope Item · {SCENARIOS.length}개 시연 가능</small>
          <span className="dbar-spacer" />
          <button className="smenu-x" onClick={onClose} title="닫기"><Icon name="decline" /></button>
        </div>
        <div className="smenu-cols">
          {groups.map(({ group, items }) => (
            <section key={group.id} className={`smenu-col ${items.length > 3 ? 'wide' : ''}`}>
              <h3 className="smenu-cat">{group.title}<small>{group.titleKo}</small></h3>
              <div className="smenu-list">
                {items.map((d) => <Card key={d.id} def={d} current={d.id === current} onPick={() => pick(d)} />)}
              </div>
            </section>
          ))}
        </div>
        <div className="smenu-foot">
          <button className="dbar-btn smenu-setup" onClick={() => { onClose(); nav('/setup'); }}><Icon name="edit" /> 데모 환경 설정 (회사·플랜트·담당자 이름 – 전 시나리오 공통)</button>
        </div>
      </div>
    </div>
  );
}
