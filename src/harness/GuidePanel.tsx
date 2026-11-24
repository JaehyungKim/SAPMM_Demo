/**
 * Right-hand presenter guide: the business situation of the current step, each click with
 * its meaning (the next one is outlined on the SAP screen), and the value to emphasise.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo } from '../store';
import { stepById, ROLE_KO, ROLE_USER } from '../steps';
import { useSharedMap } from '../sharedState';
import { buildGuide } from './guide';
import { findTarget, useGuideCursor, useHighlight } from './highlight';
import { stepDone, useEnabledSteps } from './progress';

export function GuidePanel({ stepId }: { stepId: string }) {
  const s = useDemo();
  const shared = useSharedMap();
  const nav = useNavigate();
  const st = stepById(stepId);
  const steps = useEnabledSteps();
  const pos = steps.findIndex((x) => x.id === stepId);
  const next = pos >= 0 ? steps[pos + 1] : undefined;
  const mode = s.viewMode;
  const g = buildGuide(stepId, s, shared);
  const actions = mode === 'fiori' ? g.fiori : g.gui;
  const [hover, setHover] = useState<string | undefined>();

  const cur = useGuideCursor(mode, actions, s.guideOpen);
  const tracked = actions.some((a) => a.done !== undefined);
  const allDone = tracked ? actions.every((a) => a.done !== false) : stepDone(stepId, s);
  useHighlight(mode, s.guideOpen && cur >= 0 ? actions[cur].target : undefined, 'current');
  useHighlight(mode, s.guideOpen ? hover : undefined, 'hover');

  if (!s.guideOpen) return null;
  const u = ROLE_USER[st.role];

  return (
    <aside className="guide">
      <div className="guide-head">
        <Icon name="lightbulb" />
        <b>진행 가이드</b>
        <span className="guide-pos">{pos >= 0 ? `${pos + 1} / ${steps.length}` : ''}</span>
        <button className="guide-x" onClick={s.toggleGuide} title="가이드 닫기"><Icon name="decline" /></button>
      </div>
      <div className="guide-body">
        <div className="guide-who">
          <span className="guide-avatar">{u.initials}</span>
          <div><b>{u.name}</b><small>{ROLE_KO[st.role]} · {st.appId !== 'Shell' ? (mode === 'fiori' ? `${st.appName}` : st.tcode) : 'Home'}</small></div>
        </div>

        <h4><Icon name="flag" /> 상황</h4>
        <p className="guide-situation">{g.situation}</p>

        <h4><Icon name="cursor-arrow" /> 클릭 순서와 의미 <small>({mode === 'fiori' ? 'Fiori' : 'SAP GUI'})</small></h4>
        <ol className="guide-actions">
          {actions.map((a, i) => (
            <li
              key={i}
              className={`${a.done ? 'done' : ''} ${i === cur ? 'cur' : ''} ${a.target ? 'has-target' : ''}`}
              onMouseEnter={() => a.target && setHover(a.target)}
              onMouseLeave={() => setHover(undefined)}
              onClick={() => a.target && findTarget(mode, a.target)?.scrollIntoView({ block: 'center', behavior: 'smooth' })}
            >
              <span className="guide-num">{a.done ? <Icon name="accept" /> : i + 1}</span>
              <div>
                <div className="guide-text">{a.text}</div>
                <div className="guide-why">{a.why}</div>
              </div>
            </li>
          ))}
        </ol>
        <p className="guide-tip">항목에 마우스를 올리면 화면의 해당 위치가 표시됩니다. 파란 테두리는 다음에 클릭할 곳입니다.</p>

        <h4><Icon name="hint" /> 업무 효과</h4>
        <p className="guide-value">{g.value}</p>
      </div>
      <div className={`guide-foot ${allDone ? 'ready' : ''}`}>
        {allDone && <span><Icon name="message-success" /> 이 단계 완료</span>}
        {next
          ? <button className="nav-btn nav-next" onClick={() => nav(`/step/${next.id}`)}>다음: {next.title} <Icon name="navigation-right-arrow" /></button>
          : <span className="guide-end">마지막 단계입니다 – 데모 완료 🎉</span>}
      </div>
    </aside>
  );
}
