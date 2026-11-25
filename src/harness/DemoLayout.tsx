/**
 * Presenter harness around the simulated system, for any scenario (J45 / BMD / BNX):
 *   DemoBar (top: ☰ step panel, scenario name → picker) · ProcessBar · Sidebar (left) · stage with SAP screen(s) · GuidePanel (right)
 *   + RoleBanner, StepGuard and the ScenarioIntro briefing.
 * The SAP screens live in src/steps (J45) and src/scenarios/* and know nothing about the harness.
 */
import { Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo, ViewMode } from '../store';
import { ScenarioProvider, stepPath, type ScenarioId } from '../scenarioContext';
import { scenarioById } from '../scenarios/index';
import { optKey, type ScenarioDef } from '../scenarios/types';
import { DemoBar } from './DemoBar';
import { ProcessBar } from './ProcessBar';
import { Sidebar } from './Sidebar';
import { RoleBanner } from './RoleBanner';
import { StepGuard } from './StepGuard';
import { GuidePanel } from './GuidePanel';
import { ScenarioIntro } from './ScenarioIntro';
import { useEnabledSteps } from './progress';
import { isFioriOnly } from '../steps';
import { jo } from '../josa';
import { BusyDialog } from '../components/fiori/Busy';

/** Route entry: picks the scenario and remounts the harness when it changes (hooks differ per scenario). */
export function ScenarioRoute({ scn }: { scn?: ScenarioId }) {
  const params = useParams();
  const id = (scn ?? params.scn ?? 'j45') as ScenarioId;
  const def = scenarioById(id);
  return (
    <ScenarioProvider value={{ id: def.id, tcodes: def.tcodes }}>
      <DemoLayout key={def.id} def={def} />
    </ScenarioProvider>
  );
}

function DemoLayout({ def }: { def: ScenarioDef }) {
  const { id = 'launchpad' } = useParams();
  const nav = useNavigate();
  const s = useDemo();
  const rt = def.useRuntime();
  const st = def.steps.find((x) => x.id === id) ?? def.steps[0];
  const steps = useEnabledSteps(def);
  const idx = steps.findIndex((x) => x.id === st.id);
  const prevStep = idx > 0 ? steps[idx - 1] : undefined;
  const nextStep = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : undefined;
  const ok = rt.meets(st.requires);
  const screen = def.screens[st.id];
  const [scenario, setScenario] = useState(false);

  // Like SAP GUI, the status bar message belongs to the screen that produced it.
  useEffect(() => { rt.markVisited(st.id); s.setGuiMessage(null); }, [st.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scope items whose apps all exist only in Fiori (e.g. SL4, 1JI) / single Fiori-only apps.
  const allFiori = def.steps.filter((x) => x.appId !== 'Shell').every(isFioriOnly);
  const fioriOnly = allFiori || isFioriOnly(st);
  const fioriNote = fioriOnly && (
    <div className="fiori-only">
      <Icon name="information" />
      <span>
        {allFiori
          ? <><b>{def.code} Scope Item의 앱은 모두 SAP Fiori 전용 앱입니다.</b> SAP GUI 트랜잭션이 없으므로, 아래는 같은 데이터를 GUI 형식으로 옮긴 비교용 참고 화면입니다.</>
          : <><b>{jo(`${st.appName} (${st.appId})`, '은')} SAP Fiori 전용 앱입니다.</b> SAP GUI 트랜잭션이 없으므로, 아래는 같은 데이터를 GUI 형식으로 옮긴 비교용 참고 화면입니다.</>}
      </span>
      {!s.compare && <button onClick={() => s.setViewMode('fiori')}>Fiori 화면으로 보기</button>}
    </div>
  );

  const render = (mode: ViewMode) => {
    if (!ok) return <StepGuard def={def} rt={rt} requires={st.requires} />;
    const C = mode === 'fiori' ? screen.fiori : screen.gui;
    return (
      <>
        {mode === 'sapgui' && fioriNote}
        <Suspense fallback={<div className="stage-loading">화면 불러오는 중…</div>}>
          <C step={st} key={`${st.id}-${mode}`} />
        </Suspense>
      </>
    );
  };

  return (
    <div className={`demo ${s.sidebarOpen ? '' : 'no-side'} ${s.guideOpen ? 'with-guide' : ''}`}>
      <DemoBar def={def} rt={rt} st={st} onScenario={() => setScenario(true)} />
      <ProcessBar def={def} rt={rt} current={st.id} />
      <div className="demo-main">
        <Sidebar def={def} rt={rt} current={st.id} />
        <div className="demo-stage">
          <RoleBanner stepId={st.id} role={st.role} />
          {st.optional && s.optionalEnabled[optKey(def.id, st.id)] === false && (
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
            <button className="nav-btn" disabled={!prevStep} onClick={() => prevStep && nav(stepPath(def.id, prevStep.id))}>
              <Icon name="navigation-left-arrow" /> {prevStep ? `${prevStep.no}. ${prevStep.title}` : '이전'}
            </button>
            <span className="stage-footer-info">{def.code} · BPD {st.bpd} · {st.titleEn}</span>
            <button className="nav-btn nav-next" disabled={!nextStep} onClick={() => nextStep && nav(stepPath(def.id, nextStep.id))}>
              {nextStep ? `${nextStep.no}. ${nextStep.title}` : '데모 완료'} <Icon name="navigation-right-arrow" />
            </button>
          </div>
        </div>
        <GuidePanel def={def} rt={rt} st={st} />
      </div>
      <BusyDialog />
      {(scenario || !rt.briefed) && <ScenarioIntro def={def} onClose={() => { rt.setBriefed(true); setScenario(false); }} />}
    </div>
  );
}
