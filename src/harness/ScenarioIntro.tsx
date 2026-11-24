/**
 * Opening briefing shown when a demo starts (and after "데모 초기화"): the business story,
 * the cast of roles, the four phases, and how to drive the demo. Re-open via "시나리오".
 */
import { Icon } from '@ui5/webcomponents-react';
import { useDemo, netValue } from '../store';
import { ROLE_KO, ROLE_USER, Role } from '../steps';
import { fmtAmt, fmtDate, fmtQty, todayIso } from '../format';

const CAST: { role: Role; does: string; steps: string }[] = [
  { role: 'Purchaser', does: '구매 요청을 발주로 전환하고 PO를 관리합니다', steps: '0–2 · 4–6' },
  { role: 'Purchasing Manager', does: '금액이 큰 PO를 승인합니다', steps: '3' },
  { role: 'Warehouse Clerk', does: '물품을 받고 입고를 전기합니다', steps: '7–9' },
  { role: 'Accounts Payable Accountant', does: '송장을 검증하고 GR/IR을 정리합니다', steps: '10–12' },
];

const PHASES = [
  { icon: 'activity-items', t: '구매', d: '구매 요청 → 구매 오더 → 승인' },
  { icon: 'shipping-status', t: '입고', d: '물품 도착 → 재고·회계 반영' },
  { icon: 'request', t: '송장', d: '3-way match → 매입채무' },
  { icon: 'accounting-document-verification', t: '결산', d: 'GR/IR 청산' },
];

export function ScenarioIntro({ onClose }: { onClose: () => void }) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  return (
    <div className="scn-backdrop" onClick={onClose}>
      <div className="scn" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="오늘의 시나리오">
        <div className="scn-head">
          <span className="scn-tag">오늘의 시나리오 · {fmtDate(todayIso(), df)}</span>
          <h1>재고가 바닥나기 전에, 발주부터 지급 준비까지</h1>
          <p className="scn-sub">SAP S/4HANA Cloud Public Edition · J45 직접 자재 조달</p>
        </div>

        <div className="scn-story">
          <Icon name="factory" className="scn-story-icon" />
          <p>
            <b>{c.companyName}</b>의 <b>{c.plantName} ({c.plant})</b>에서 판매용 상품 <b>{c.materialNumber}</b>의 재고가
            안전 재고 아래로 떨어졌습니다. 야간 MRP 실행 결과 구매 요청 <b>{s.numbers.prNumber}</b>
            (<b>{fmtQty(c.quantity)} {c.unit}</b>, 납기 <b>{fmtDate(c.deliveryDate, df)}</b>)이(가) 자동으로 만들어졌습니다.
            <br />
            오늘 우리는 이 요청을 공급업체 <b>{c.supplierName}</b>에 발주(약 <b>{fmtAmt(netValue(c), c.currency)}</b>)하고,
            물품을 받고, 송장을 처리해 지급을 준비하기까지 <b>네 명의 담당자</b>가 하나의 시스템에서 일하는 모습을 따라갑니다.
          </p>
        </div>

        <div className="scn-phases">
          {PHASES.map((p, i) => (
            <div key={p.t} className="scn-phase">
              <Icon name={p.icon} />
              <b>{i + 1}. {p.t}</b>
              <span>{p.d}</span>
            </div>
          ))}
        </div>

        <h3>등장인물</h3>
        <div className="scn-cast">
          {CAST.map((x) => (
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
          <li>단계 완료 후 <b>다음</b> 버튼(가이드 하단 또는 화면 맨 아래)으로 넘어갑니다. 왼쪽 사이드바로 어떤 단계든 바로 갈 수 있습니다.</li>
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
