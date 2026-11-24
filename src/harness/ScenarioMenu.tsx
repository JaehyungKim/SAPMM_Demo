/**
 * Scenario picker (opened from the scenario name in the top bar). Implemented scenarios are
 * grouped by the SAP procurement scope-item map (`scenarios/catalog.ts`); in customer mode only
 * the scope items chosen for the customer are listed. The admin page has no button – open #/admin.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { stepPath } from '../scenarioContext';
import { useVisibleScenarios } from '../scenarios/index';
import { useProfile } from '../profile';
import { ScenarioGrid } from './ScenarioGrid';

export function ScenarioMenu({ current, onClose }: { current: string; onClose: () => void }) {
  const nav = useNavigate();
  const profile = useProfile((s) => s.active);
  const list = useVisibleScenarios();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const go = (path: string) => { onClose(); nav(path); };
  return (
    <div className="smenu-backdrop" onClick={onClose}>
      <div className="smenu" onClick={(e) => e.stopPropagation()} role="menu" aria-label="시나리오 선택">
        <div className="smenu-head">
          <Icon name="list" /> {profile ? `${profile.customer} 맞춤 시나리오` : '시나리오 선택'}
          <small>SAP S/4HANA Cloud 조달 Scope Item · {list.length}개</small>
          <span className="dbar-spacer" />
          <button className="smenu-x" onClick={onClose} title="닫기"><Icon name="decline" /></button>
        </div>
        <ScenarioGrid list={list} current={current} onPick={(d) => { onClose(); if (d.id !== current) nav(stepPath(d.id, 'launchpad')); }} />
        <div className="smenu-foot">
          {profile && <button className="dbar-btn smenu-setup" onClick={() => go('/portal')}><Icon name="home" /> 고객 홈</button>}
          <button className="dbar-btn smenu-setup" onClick={() => go('/setup')}><Icon name="edit" /> 데모 환경 설정 (회사·플랜트·담당자 이름 – 전 시나리오 공통)</button>
        </div>
      </div>
    </div>
  );
}
