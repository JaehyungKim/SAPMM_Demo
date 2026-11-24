/**
 * Opening briefing shown when a scenario starts (and after "데모 초기화"): the business story,
 * the cast of roles, the four phases, and how to drive the demo. Re-open via "시나리오".
 */
import { Icon } from '@ui5/webcomponents-react';
import { useDemo } from '../store';
import { ROLE_KO, ROLE_USER } from '../steps';
import { fmtDate, todayIso } from '../format';
import type { ScenarioDef } from '../scenarios/types';

export function ScenarioIntro({ def, onClose }: { def: ScenarioDef; onClose: () => void }) {
  const df = useDemo((s) => s.config.dateFormat);
  const b = def.useBriefing();
  return (
    <div className="scn-backdrop" onClick={onClose}>
      <div className="scn" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="오늘의 시나리오">
        <div className="scn-head">
          <span className="scn-tag">{def.code} · {def.title} · 오늘의 시나리오 · {fmtDate(todayIso(), df)}</span>
          <h1>{b.headline}</h1>
          <p className="scn-sub">SAP S/4HANA Cloud · {def.code} {def.titleEn}</p>
        </div>

        <div className="scn-story">
          <Icon name="factory" className="scn-story-icon" />
          <p>{b.story}</p>
        </div>

        <div className="scn-phases">
          {b.phases.map((p, i) => (
            <div key={p.t} className="scn-phase">
              <Icon name={p.icon} />
              <b>{i + 1}. {p.t}</b>
              <span>{p.d}</span>
            </div>
          ))}
        </div>

        <h3>등장인물</h3>
        <div className="scn-cast">
          {b.cast.map((x) => (
            <div key={x.role} className="scn-person">
              <span className="guide-avatar">{ROLE_USER[x.role].initials}</span>
              <div>
                <b>{ROLE_USER[x.role].name}</b> <small>{ROLE_KO[x.role]}</small>
                <span>{x.does}</span>
              </div>
              <em>단계 {x.steps}</em>
            </div>
          ))}
        </div>

        <h3>진행 방법</h3>
        <ul className="scn-how">
          <li><b>오른쪽 '진행 가이드'</b>가 단계별 상황과 각 클릭의 의미를 알려 줍니다. <span className="scn-outline">파란 테두리</span>가 다음에 클릭할 곳입니다.</li>
          <li>상단 <b>Fiori | SAP GUI | 비교</b>로 같은 업무를 두 UI에서 보여 줄 수 있습니다. 입력하던 값은 유지됩니다.</li>
          <li>상단 바 왼쪽의 <b>시나리오 이름 ⌄</b>을 눌러 다른 시나리오로 언제든 전환할 수 있습니다. 시나리오마다 진행 상태가 따로 저장됩니다. 맨 왼쪽 <b>☰</b>은 프로세스 단계 패널을 열고 닫습니다.</li>
          <li>모든 날짜는 <b>오늘({fmtDate(todayIso(), df)})</b>을 기준으로 자동 계산됩니다.</li>
        </ul>

        <div className="scn-foot">
          <span className="dbar-spacer" />
          <button className="f-btn f-btn-emph f-btn-lg" onClick={onClose}><Icon name="play" /> 데모 시작</button>
        </div>
      </div>
    </div>
  );
}
