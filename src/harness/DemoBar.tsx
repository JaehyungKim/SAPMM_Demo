/** Top presenter bar: UI mode, compare, help, scenario, guide, role, edit data, reset. */
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo } from '../store';
import { stepById, ROLE_KO, ROLE_USER } from '../steps';

export function DemoBar({ stepId, onScenario }: { stepId: string; onScenario: () => void }) {
  const s = useDemo();
  const nav = useNavigate();
  const st = stepById(stepId);
  const u = ROLE_USER[st.role];
  const mode = (m: 'fiori' | 'sapgui') => { s.setViewMode(m); if (s.compare) s.toggleCompare(); };
  return (
    <div className="dbar">
      <button className="dbar-icon" onClick={s.toggleSidebar} title="사이드바 열기/닫기"><Icon name="menu2" /></button>
      <span className="dbar-brand">J45 · 직접 자재 조달 <small>Click-Through Demo · 2608</small></span>
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
      <button className="dbar-btn" onClick={() => nav('/setup')}><Icon name="edit" /> 데모 데이터 편집</button>
      <button className="dbar-btn" onClick={() => { if (confirm('모든 문서(PR/PO/입고/송장)를 초기화하고 새 문서 번호를 생성할까요?')) { s.resetDemo(); nav('/step/launchpad'); } }}><Icon name="reset" /> 데모 초기화</button>
    </div>
  );
}
