/** Left step list with optional-step switches and the scenario's current document numbers. */
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo } from '../store';
import { stepPath } from '../scenarioContext';
import { optKey, type Runtime, type ScenarioDef } from '../scenarios/types';

export function Sidebar({ def, rt, current }: { def: ScenarioDef; rt: Runtime; current: string }) {
  const s = useDemo();
  const nav = useNavigate();
  if (!s.sidebarOpen) return null;
  return (
    <aside className="side">
      <div className="side-head">
        <span>{def.code} 프로세스 단계</span>
        <button className="side-x" onClick={s.toggleSidebar} title="프로세스 단계 패널 닫기"><Icon name="decline" /></button>
      </div>
      {def.steps.map((st) => {
        const done = rt.done(st.id);
        const key = optKey(def.id, st.id);
        const enabled = !st.optional || s.optionalEnabled[key] !== false;
        return (
          <div key={st.id} className={`side-step ${st.id === current ? 'cur' : ''} ${done ? 'done' : ''} ${enabled ? '' : 'disabled'}`}>
            <button className="side-step-main" onClick={() => nav(stepPath(def.id, st.id))}>
              <span className="side-dot">{done ? <Icon name="accept" /> : st.no}</span>
              <span className="side-txt">
                <span className="side-title">{st.title}</span>
                <span className="side-meta">{st.appId !== 'Shell' ? `${st.appId} · ${st.tcode}` : 'Fiori Launchpad · Easy Access'}{st.optional && ' · (선택 사항)'}</span>
              </span>
            </button>
            {st.optional && (
              <label className="side-switch" title="선택 단계 포함/제외">
                <input type="checkbox" checked={enabled} onChange={(e) => s.setOptional(key, e.target.checked)} />
                <span />
              </label>
            )}
          </div>
        );
      })}
      <div className="side-summary">
        {rt.summary.map((x) => <div key={x.label}><span>{x.label}</span><b>{x.value}</b></div>)}
      </div>
    </aside>
  );
}
