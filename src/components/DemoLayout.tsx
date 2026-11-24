/**
 * Presenter chrome around the simulated system: demo control bar (mode toggle, compare,
 * help, reset, edit data), horizontal process bar, left step sidebar, role-switch banner,
 * prerequisite guard and previous/next footer. The SAP screens render inside `.demo-stage`.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo, netValue, DemoState } from '../store';
import { STEPS, stepById, ROLE_KO, ROLE_USER, Requirement } from '../steps';
import { SCREENS } from '../steps/index';
import { fmtAmt } from '../format';

const REQ_TEXT: Record<Requirement, { text: string; goto: string }> = {
  none: { text: '', goto: 'launchpad' },
  'pr-assigned': { text: '구매 요청에 소스가 지정되어야 합니다.', goto: 'process-pr' },
  po: { text: '구매 오더가 아직 생성되지 않았습니다.', goto: 'create-po' },
  'po-released': { text: '구매 오더가 생성되고 승인(릴리스)되어야 합니다.', goto: 'approve-po' },
  gr: { text: '입고가 아직 전기되지 않았습니다.', goto: 'post-gr' },
  invoice: { text: '공급업체 송장이 아직 전기되지 않았습니다.', goto: 'create-invoice' },
};

/** Whether a step counts as done for the stepper. */
export function stepDone(id: string, s: DemoState) {
  switch (id) {
    case 'launchpad': return s.visited.includes('launchpad');
    case 'process-pr': return s.prStatus === 'Closed';
    case 'create-po': return s.poStatus !== 'None';
    case 'approve-po': return ['Approved', 'Goods Received', 'Invoiced'].includes(s.poStatus);
    case 'change-po': return s.changeLog.length > 0;
    case 'post-gr': return s.grDocs.length > 0;
    case 'create-invoice': return s.invoiceStatus === 'Posted';
    case 'clear-grir': return s.cleared;
    default: return s.visited.includes(id);
  }
}

function useEnabledSteps() {
  const opt = useDemo((s) => s.optionalEnabled);
  return STEPS.filter((st) => !st.optional || opt[st.id]);
}

function ProcessBar({ current }: { current: string }) {
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

function Sidebar({ current }: { current: string }) {
  const s = useDemo();
  const nav = useNavigate();
  if (!s.sidebarOpen) return null;
  return (
    <aside className="side">
      <div className="side-head">J45 프로세스 단계</div>
      {STEPS.map((st) => {
        const done = stepDone(st.id, s);
        const enabled = !st.optional || s.optionalEnabled[st.id];
        return (
          <div key={st.id} className={`side-step ${st.id === current ? 'cur' : ''} ${done ? 'done' : ''} ${enabled ? '' : 'disabled'}`}>
            <button className="side-step-main" onClick={() => nav(`/step/${st.id}`)}>
              <span className="side-dot">{done ? <Icon name="accept" /> : st.no}</span>
              <span className="side-txt">
                <span className="side-title">{st.title}</span>
                <span className="side-meta">{st.appId !== 'Shell' ? `${st.appId} · ${st.tcode}` : 'Fiori Launchpad · Easy Access'}{st.optional && ' · (선택 사항)'}</span>
              </span>
            </button>
            {st.optional && (
              <label className="side-switch" title="선택 단계 포함/제외">
                <input type="checkbox" checked={enabled} onChange={(e) => s.setOptional(st.id, e.target.checked)} />
                <span />
              </label>
            )}
          </div>
        );
      })}
      <div className="side-summary">
        <div><span>PR</span><b>{s.numbers.prNumber}</b></div>
        <div><span>PO</span><b>{s.poStatus === 'None' ? '–' : s.numbers.poNumber}</b></div>
        <div><span>자재 전표</span><b>{s.grDocs[0]?.docNo ?? '–'}</b></div>
        <div><span>송장</span><b>{s.invoice ? s.numbers.invoiceDocNumber : '–'}</b></div>
        <div><span>순 금액</span><b>{fmtAmt(netValue(s.config), s.config.currency)}</b></div>
      </div>
    </aside>
  );
}

function DemoBar({ stepId }: { stepId: string }) {
  const s = useDemo();
  const nav = useNavigate();
  const st = stepById(stepId);
  const u = ROLE_USER[st.role];
  return (
    <div className="dbar">
      <button className="dbar-icon" onClick={s.toggleSidebar} title="사이드바 열기/닫기"><Icon name="menu2" /></button>
      <span className="dbar-brand">J45 · 직접 자재 조달 <small>Click-Through Demo · 2608</small></span>
      <span className="dbar-step">{st.no}. {st.title} <small>{st.appId !== 'Shell' ? `${st.appName} (${st.appId}) · ${st.tcode}` : ''}</small></span>
      <span className="dbar-spacer" />
      <div className="seg" role="group" aria-label="UI 모드">
        <button className={s.viewMode === 'fiori' && !s.compare ? 'on' : ''} onClick={() => { s.setViewMode('fiori'); if (s.compare) s.toggleCompare(); }}>Fiori</button>
        <button className={s.viewMode === 'sapgui' && !s.compare ? 'on' : ''} onClick={() => { s.setViewMode('sapgui'); if (s.compare) s.toggleCompare(); }}>SAP GUI</button>
        <button className={s.compare ? 'on' : ''} onClick={s.toggleCompare}>비교</button>
      </div>
      <button className={`dbar-btn ${s.showHelp ? 'on' : ''}`} onClick={s.toggleHelp} title="필드 설명(?) 표시"><Icon name="sys-help" /> 설명</button>
      <span className="dbar-role" title={u.roleId}><span className="dbar-avatar">{u.initials}</span>{ROLE_KO[st.role]}</span>
      <button className="dbar-btn" onClick={() => nav('/setup')}><Icon name="edit" /> 데모 데이터 편집</button>
      <button className="dbar-btn" onClick={() => { if (confirm('모든 문서(PR/PO/입고/송장)를 초기화하고 새 문서 번호를 생성할까요?')) { s.resetDemo(); nav('/step/launchpad'); } }}><Icon name="reset" /> 데모 초기화</button>
    </div>
  );
}

function RoleBanner({ stepId }: { stepId: string }) {
  const role = stepById(stepId).role;
  const prev = useRef(role);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (prev.current !== role) {
      prev.current = role;
      setShow(true);
      const t = setTimeout(() => setShow(false), 2800);
      return () => clearTimeout(t);
    }
  }, [role]);
  if (!show) return null;
  return (
    <div className="role-banner">
      ⚡ 역할 전환 중: <b>{ROLE_KO[role]}</b> <span>({ROLE_USER[role].roleId})</span>
    </div>
  );
}

export function DemoLayout() {
  const { id = 'launchpad' } = useParams();
  const nav = useNavigate();
  const s = useDemo();
  const st = stepById(id);
  const steps = useEnabledSteps();
  const idx = steps.findIndex((x) => x.id === st.id);
  const prevStep = idx > 0 ? steps[idx - 1] : undefined;
  const nextStep = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : undefined;
  const ok = s.meets(st.requires);
  const screen = SCREENS[st.id];

  // Like SAP GUI, the status bar message belongs to the screen that produced it.
  useEffect(() => { s.markVisited(st.id); s.setGuiMessage(null); }, [st.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const render = (mode: 'fiori' | 'sapgui') => {
    if (!ok) {
      const r = REQ_TEXT[st.requires];
      return (
        <div className="guard">
          <Icon name="process" className="guard-icon" />
          <h2>선행 단계가 필요합니다</h2>
          <p>{r.text}</p>
          <div className="guard-btns">
            <button className="f-btn f-btn-emph" onClick={() => nav(`/step/${r.goto}`)}>선행 단계로 이동</button>
            <button className="f-btn" onClick={() => s.autoComplete(st.requires)}>선행 단계 자동 완료</button>
          </div>
        </div>
      );
    }
    const C = mode === 'fiori' ? screen.fiori : screen.gui;
    return <C step={st} key={`${st.id}-${mode}`} />;
  };

  return (
    <div className={`demo ${s.sidebarOpen ? '' : 'no-side'}`}>
      <DemoBar stepId={st.id} />
      <ProcessBar current={st.id} />
      <div className="demo-main">
        <Sidebar current={st.id} />
        <div className="demo-stage">
          <RoleBanner stepId={st.id} />
          {st.optional && !s.optionalEnabled[st.id] && (
            <div className="opt-note">이 선택 단계는 현재 데모 흐름에서 제외되어 있습니다 (사이드바 스위치로 포함 가능).</div>
          )}
          <div className={`stage-screens ${s.compare ? 'compare' : ''}`}>
            {s.compare ? (
              <>
                <div className="stage-pane"><div className="pane-label">Fiori</div>{render('fiori')}</div>
                <div className="stage-pane"><div className="pane-label">SAP GUI</div>{render('sapgui')}</div>
              </>
            ) : (
              <div className="stage-pane">{render(s.viewMode)}</div>
            )}
          </div>
          <div className="stage-footer">
            <button className="nav-btn" disabled={!prevStep} onClick={() => prevStep && nav(`/step/${prevStep.id}`)}>
              <Icon name="navigation-left-arrow" /> {prevStep ? `${prevStep.no}. ${prevStep.title}` : '이전'}
            </button>
            <span className="stage-footer-info">BPD {st.bpd} · {st.titleEn}</span>
            <button className="nav-btn nav-next" disabled={!nextStep} onClick={() => nextStep && nav(`/step/${nextStep.id}`)}>
              {nextStep ? `${nextStep.no}. ${nextStep.title}` : '데모 완료'} <Icon name="navigation-right-arrow" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
