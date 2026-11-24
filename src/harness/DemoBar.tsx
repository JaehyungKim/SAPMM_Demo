/** Top presenter bar: scenario menu, sidebar, UI mode, compare, scenario briefing, guide, help, role, edit data, reset. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo } from '../store';
import { ROLE_KO, ROLE_USER, type StepDef } from '../steps';
import { stepPath } from '../scenarioContext';
import type { Runtime, ScenarioDef } from '../scenarios/types';
import { ScenarioMenu } from './ScenarioMenu';

export function DemoBar({ def, rt, st, onScenario }: { def: ScenarioDef; rt: Runtime; st: StepDef; onScenario: () => void }) {
  const s = useDemo();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const u = ROLE_USER[st.role];
  const mode = (m: 'fiori' | 'sapgui') => { s.setViewMode(m); if (s.compare) s.toggleCompare(); };
  return (
    <div className="dbar">
      <button className={`dbar-icon ${s.sidebarOpen ? 'on' : ''}`} onClick={s.toggleSidebar} title="프로세스 단계 패널 열기/닫기"><Icon name="menu2" /></button>
      <button className="dbar-brand dbar-brand-btn" onClick={() => setMenu(true)} title="시나리오 선택">
        {def.code} · {def.title} <Icon name="slim-arrow-down" />
      </button>
      <span className="dbar-step">{st.no}. {st.title} <small>{st.appId !== 'Shell' ? `${st.appName} (${st.appId}) · ${st.tcode}` : ''}</small></span>
      <span className="dbar-spacer" />
      <div className="seg" role="group" aria-label="UI 모드">
        <button className={s.viewMode === 'fiori' && !s.compare ? 'on' : ''} onClick={() => mode('fiori')}>Fiori</button>
        <button className={s.viewMode === 'sapgui' && !s.compare ? 'on' : ''} onClick={() => mode('sapgui')}>SAP GUI</button>
        <button className={s.compare ? 'on' : ''} onClick={s.toggleCompare}>비교</button>
      </div>
      <button className="dbar-btn" onClick={onScenario} title="오늘의 시나리오 다시 보기"><Icon name="play" /> 시나리오</button>
      <button className={`dbar-btn ${s.guideOpen ? 'on' : ''}`} onClick={s.toggleGuide} title="진행 가이드 패널"><Icon name="lightbulb" /> 가이드</button>
      <button className={`dbar-btn ${s.showHelp ? 'on' : ''}`} onClick={s.toggleHelp} title="필드 설명(?) 표시"><Icon name="sys-help" /> 설명</button>
      <span className="dbar-role" title={u.roleId}><span className="dbar-avatar">{u.initials}</span>{ROLE_KO[st.role]}</span>
      <button className="dbar-btn" onClick={() => nav('/setup')} title="데모 데이터 편집"><Icon name="edit" /> 데이터</button>
      <button className="dbar-btn" title={`${def.code} 문서를 모두 지우고 새 번호로 다시 시작`}
        onClick={() => { if (confirm(`${def.code} 시나리오의 모든 문서를 초기화하고 새 문서 번호로 다시 시작할까요?`)) { rt.reset(); nav(stepPath(def.id, 'launchpad')); } }}>
        <Icon name="reset" /> 초기화
      </button>
      {menu && <ScenarioMenu current={def.id} onClose={() => setMenu(false)} />}
    </div>
  );
}
