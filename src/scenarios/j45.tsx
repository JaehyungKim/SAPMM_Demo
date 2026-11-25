/** J45 – Procurement of Direct Materials, adapted to the scenario contract (screens unchanged). */
import { pc } from '../josa';
import { useDemo, netValue } from '../store';
import { STEPS, TCODE_MAP, type Requirement } from '../steps';
import { SCREENS } from '../steps/index';
import { useSharedMap } from '../sharedState';
import { buildGuide } from '../harness/guide';
import { REQ_TEXT, stepDone } from '../harness/progress';
import { fmtAmt, fmtDate, fmtQty } from '../format';
import type { Briefing, Runtime, ScenarioDef } from './types';

function useRuntime(): Runtime {
  const s = useDemo();
  return {
    done: (id) => stepDone(id, s),
    meets: (req) => s.meets(req as Requirement),
    autoComplete: (req) => s.autoComplete(req as Requirement),
    reqText: REQ_TEXT,
    summary: [
      { label: 'PR', value: s.numbers.prNumber },
      { label: 'PO', value: s.poStatus === 'None' ? '–' : s.numbers.poNumber },
      { label: '자재 전표', value: s.grDocs[0]?.docNo ?? '–' },
      { label: '송장', value: s.invoice ? s.numbers.invoiceDocNumber : '–' },
      { label: '순 금액', value: fmtAmt(netValue(s.config), s.config.currency) },
    ],
    reset: s.resetDemo,
    briefed: s.briefed,
    setBriefed: s.setBriefed,
    markVisited: s.markVisited,
  };
}

function useGuide(stepId: string) {
  const s = useDemo();
  return buildGuide(stepId, s, useSharedMap());
}

function useBriefing(): Briefing {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  return {
    headline: '재고가 바닥나기 전에, 발주부터 지급 준비까지',
    story: (
      <>
        <b>{c.companyName}</b>의 <b>{c.plantName} ({c.plant})</b>에서 판매용 상품 <b>{c.materialNumber}</b>의 재고가
        안전 재고 아래로 떨어졌습니다. 야간 MRP 실행 결과 구매 요청 <b>{s.numbers.prNumber}</b>
        (<b>{fmtQty(c.quantity)} {c.unit}</b>, 납기 <b>{fmtDate(c.deliveryDate, df)}</b>){pc(s.numbers.prNumber, '이')} 자동으로 만들어졌습니다.
        <br />
        오늘 우리는 이 요청을 공급업체 <b>{c.supplierName}</b>에 발주(약 <b>{fmtAmt(netValue(c), c.currency)}</b>)하고,
        물품을 받고, 송장을 처리해 지급을 준비하기까지 <b>네 명의 담당자</b>가 하나의 시스템에서 일하는 모습을 따라갑니다.
      </>
    ),
    phases: [
      { icon: 'activity-items', t: '구매', d: '구매 요청 → 구매 오더 → 승인' },
      { icon: 'shipping-status', t: '입고', d: '물품 도착 → 재고·회계 반영' },
      { icon: 'request', t: '송장', d: '3-way match → 매입채무' },
      { icon: 'accounting-document-verification', t: '결산', d: 'GR/IR 청산' },
    ],
    cast: [
      { role: 'Purchaser', does: '구매 요청을 발주로 전환하고 PO를 관리합니다', steps: '0–2 · 4–6' },
      { role: 'Purchasing Manager', does: '금액이 큰 PO를 승인합니다', steps: '3' },
      { role: 'Warehouse Clerk', does: '물품을 받고 입고를 전기합니다', steps: '7–9' },
      { role: 'Accounts Payable Accountant', does: '송장을 검증하고 GR/IR을 정리합니다', steps: '10–12' },
    ],
  };
}

export const J45: ScenarioDef = {
  id: 'j45',
  code: 'J45',
  title: '직접 자재 조달',
  titleEn: 'Procurement of Direct Materials',
  summary: '재고 자재: 구매 요청 → PO → 승인 → 입고 → 송장 → GR/IR 청산',
  source: 'J45_S4CLD2608_BPD',
  steps: STEPS,
  screens: SCREENS,
  tcodes: TCODE_MAP,
  useRuntime,
  useGuide,
  useBriefing,
};
