/**
 * Presenter harness around the simulated system:
 *   DemoBar (top) · ProcessBar · Sidebar (left) · stage with SAP screen(s) · GuidePanel (right)
 *   + RoleBanner, StepGuard and the ScenarioIntro briefing.
 * The SAP screens themselves live in src/steps and know nothing about the harness.
 */
import { Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo, ViewMode } from '../store';
import { stepById } from '../steps';
import { SCREENS } from '../steps/index';
import { DemoBar } from './DemoBar';
import { ProcessBar } from './ProcessBar';
import { Sidebar } from './Sidebar';
import { RoleBanner } from './RoleBanner';
import { StepGuard } from './StepGuard';
import { GuidePanel } from './GuidePanel';
import { ScenarioIntro } from './ScenarioIntro';
import { useEnabledSteps } from './progress';

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
  const [scenario, setScenario] = useState(false);

  // Like SAP GUI, the status bar message belongs to the screen that produced it.
  useEffect(() => { s.markVisited(st.id); s.setGuiMessage(null); }, [st.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const render = (mode: ViewMode) => {
    if (!ok) return <StepGuard requires={st.requires} />;
    const C = mode === 'fiori' ? screen.fiori : screen.gui;
    return (
      <Suspense fallback={<div className="stage-loading">화면 불러오는 중…</div>}>
        <C step={st} key={`${st.id}-${mode}`} />
      </Suspense>
    );
  };

  return (
    <div className={`demo ${s.sidebarOpen ? '' : 'no-side'} ${s.guideOpen ? 'with-guide' : ''}`}>
      <DemoBar stepId={st.id} onScenario={() => setScenario(true)} />
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
                <div className="stage-pane" data-mode="fiori"><div className="pane-label">Fiori</div>{render('fiori')}</div>
                <div className="stage-pane" data-mode="sapgui"><div className="pane-label">SAP GUI</div>{render('sapgui')}</div>
              </>
            ) : (
              <div className="stage-pane" data-mode={s.viewMode}>{render(s.viewMode)}</div>
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
        <GuidePanel stepId={st.id} />
      </div>
      {(scenario || !s.briefed) && <ScenarioIntro onClose={() => { s.setBriefed(true); setScenario(false); }} />}
    </div>
  );
}
