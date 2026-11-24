/**
 * Customer pages.
 *  - CustomerLink (#/c/<token>): opens a link from the admin, activates the customer profile
 *    and continues to the customer home.
 *  - Portal (#/portal): customer home with the greeting and the chosen scope items.
 */
import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { SapLogo } from '../components/fiori/Fiori';
import { stepPath } from '../scenarioContext';
import { useVisibleScenarios } from '../scenarios/index';
import { applyProfile, decodeProfile, useProfile } from '../profile';
import { isPreview } from '../persistStorage';
import { ScenarioGrid } from './ScenarioGrid';

export function CustomerLink() {
  const { token = '' } = useParams();
  const nav = useNavigate();
  const p = decodeProfile(token);
  useEffect(() => { if (p) { applyProfile(p); nav('/portal', { replace: true }); } }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  if (p) return null;
  return (
    <div className="portal">
      <div className="portal-body"><div className="portal-error"><Icon name="alert" /> 링크가 올바르지 않습니다. 받은 링크 전체가 복사되었는지 확인해 주세요.</div></div>
    </div>
  );
}

export function Portal() {
  const p = useProfile((s) => s.active);
  const list = useVisibleScenarios();
  const nav = useNavigate();
  if (!p) return <Navigate to="/" replace />;
  return (
    <div className="portal">
      <header className="portal-head">
        <SapLogo h={30} />
        <div>
          <h1>{p.customer} 맞춤 SAP S/4HANA Cloud 조달 데모</h1>
          <p>{p.message || '귀사의 업무에 맞춰 선정한 SAP 조달 Scope Item을 직접 체험해 보십시오.'}</p>
        </div>
      </header>
      <div className="portal-body">
        <div className="portal-how">
          <b>이용 방법</b>
          <span><Icon name="grid" /> 아래 시나리오를 고르면 SAP 화면이 열립니다.</span>
          <span><Icon name="hint" /> 오른쪽 <b>진행 가이드</b>가 다음에 클릭할 곳을 파란 테두리로 안내합니다.</span>
          <span><Icon name="show" /> 상단에서 <b>Fiori ↔ SAP GUI</b> 를 바꿔 같은 업무를 두 UI로 비교할 수 있습니다.</span>
        </div>
        <ScenarioGrid list={list} onPick={(d) => nav(stepPath(d.id, 'launchpad'))} />
      </div>
      <footer className="portal-foot">
        <span>선정 Scope Item {list.length}개 · 모든 데이터는 이 브라우저 안에서만 동작하는 시연용 데이터입니다.</span>
        {isPreview && <span className="portal-preview">미리보기 (이 탭에서만 적용)</span>}
      </footer>
    </div>
  );
}
