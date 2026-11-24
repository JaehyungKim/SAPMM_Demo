/** 18J – Requisitioning: scenario definition, presenter guide and briefing. */
import { fmtAmt } from '../../format';
import { ROLE_KO, ROLE_USER } from '../../steps';
import { useOrg, type Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { GROUP, ITEM, OPTS, SPLIT, STEPS, STOCK, VALUE, use18j } from './store';

function useGuide(id: string) {
  const s = use18j();
  const n = s.numbers;
  const d = (k: string) => !!s.done[k];
  const cur = useOrg().currency;
  const emp = ROLE_USER.Employee.name;
  switch (id) {
    case 'catalog': return GX('구매 부서가 자주 사는 사무용품을 카탈로그로 직원들에게 제공합니다.', [
      L('카탈로그·가격·공급업체 설명', '직원은 공급업체나 가격을 몰라도 카탈로그에서 고르기만 하면 됩니다.'),
      B('게시', '📤 게시', '카탈로그 품목이 셀프서비스 앱에 나타납니다.', d('catalog')),
    ], '구매 정책(지정 공급업체·가격)을 직원 주문에 자연스럽게 적용합니다.');
    case 'pr': return GX(`${emp}이(가) 팀에 필요한 모니터 거치대 ${ITEM.qty}개를 주문합니다.`, [
      L('장바구니와 40/60 비용 배분 설명', `두 부서(${SPLIT[0].cc} ${SPLIT[0].pct}% · ${SPLIT[1].cc} ${SPLIT[1].pct}%)가 비용을 나눕니다.`),
      B('주문', '💾 저장', `구매 요청 ${n.pr} (${fmtAmt(VALUE, cur)})가 생성됩니다.`, d('pr')),
    ], '쇼핑몰처럼 쉬운 주문이지만 뒤에서는 표준 구매 요청이 만들어집니다.');
    case 'masschange': return GX('공급업체 사정으로 납품일을 미뤄야 합니다. 관련 미결 요청을 한 번에 바꿉니다.', [
      B('일괄 변경 적용', '▶ 실행 (F8)', '선택한 구매 요청의 납품일이 일괄 변경됩니다.', d('masschange')),
    ], '요청 하나하나를 열지 않고 대량으로 수정합니다.');
    case 'prmonitor': return GX('구매 담당자가 구매 요청의 처리 상태를 점검합니다.', [
      L('처리 상태·납품일 열 설명', '승인 대기, PO 생성 여부 등을 한 화면에서 추적합니다.'),
    ], '요청자 문의에 바로 답할 수 있습니다.');
    case 'prapprove': return GX(`${ROLE_KO.Manager} ${ROLE_USER.Manager.name}에게 승인 요청이 도착했습니다.`, [
      B('승인', '✔ 릴리스', '승인된 요청만 구매 부서로 넘어갑니다.', d('prapprove')),
    ], '부서 예산 책임자가 지출을 사전에 통제합니다.');
    case 'workload': return GX('구매 그룹 001에 업무가 몰려 있어 구매 관리자가 업무를 재배분합니다.', [
      B('재배분', '↪ 재배정', `구매 요청 ${n.pr}를 구매 그룹 ${GROUP}로 옮깁니다.`, d('workload')),
    ], '구매 담당자 간 업무 균형을 맞춰 처리 속도를 높입니다.');
    case 'po': return GX(`승인된 구매 요청 ${n.pr}에 카탈로그 공급원이 지정되어 있습니다.`, [
      B('구매 오더 생성', '📄 구매 오더 생성', `구매 오더 ${n.po}가 생성됩니다.`, d('po')),
    ], '카탈로그 가격·공급업체가 그대로 PO에 반영됩니다.');
    case 'poapprove': return GX(`PO ${n.po}가 승인 규칙에 걸렸습니다.`, [
      B('승인', '✔ 릴리스(승인)', '승인 후 공급업체에 발송됩니다.', d('poapprove')),
    ], '구매 부서 차원의 2차 통제입니다.');
    case 'confirm': return GX(`물품이 ${emp}의 사무실에 도착했습니다. 창고를 거치지 않고 요청자가 직접 수령 확인합니다.`, [
      B('확인', '✔ 수령 확인', '수령 확인과 동시에 입고가 전기되고 비용이 40/60으로 나뉘어 반영됩니다.', d('confirm')),
    ], '실제 받은 사람이 확인하므로 입고 정보가 정확합니다.');
    case 'invoice': return GX('공급업체 송장이 도착했습니다.', [
      B('추가', '↵ 적용', '수령 확인 수량 × PO 가격으로 품목이 채워집니다.', !!s.vals.invAdded || d('invoice')),
      B('전기', '💾 전기', `송장 ${n.inv}가 전기됩니다.`, d('invoice')),
    ], '요청자의 수령 확인이 3-way 매칭의 근거가 됩니다.');
    case 'reserve': return GX(`${emp}이(가) 이번에는 창고에 재고가 있는 ${STOCK.material}을(를) 요청합니다.`, [
      L('공급 방식 = 창고 재고(예약) 설명', '재고가 있으면 구매 요청 대신 예약이 자동으로 만들어집니다.'),
      B('주문', '💾 저장', `예약 ${n.rsv}가 생성됩니다.`, d('reserve')),
    ], '불필요한 구매를 막고 재고를 먼저 씁니다.');
    case 'gi': return GX(`${ROLE_KO['Warehouse Clerk']}가 예약 ${n.rsv}에 따라 물품을 내어 줍니다.`, [
      B('전기', '전기', '이동 유형 201로 출고되어 코스트 센터에 비용이 전기됩니다.', d('gi')),
    ], '재고 소비가 요청 부서 비용으로 정확히 귀속됩니다.');
    default: return launchGuide('18j', STEPS, `${emp}(${ROLE_KO.Employee})의 팀에 사무용품이 필요합니다.`, '현업 직원도 쉽게 주문하고, 구매 통제는 그대로 유지됩니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '현업 직원이 셀프서비스로 주문하고, 승인·발주·수령 확인·송장까지 이어지는 요청 프로세스입니다.',
    story: <><b>{ROLE_USER.Employee.name}</b>이(가) 카탈로그에서 사무용품을 주문하면, 부서 관리자 승인 후 구매 부서가 PO를 만들고, 물품이 오면 요청자가 직접 수령을 확인합니다. 재고가 있는 자재는 예약으로 창고에서 출고됩니다.</>,
    phases: [
      { icon: 'cart', t: '셀프서비스 주문', d: '카탈로그 · 비용 배분' },
      { icon: 'inbox', t: '승인 · 배분', d: '관리자 승인 · 업무량 재배분' },
      { icon: 'paper-plane', t: '발주', d: 'PO 생성 · 승인' },
      { icon: 'checklist-item', t: '수령 · 송장', d: '요청자 수령 확인 · 송장 · 예약 출고' },
    ],
    cast: [
      { role: 'Employee', does: '주문 · 수령 확인 · 재고 요청', steps: '2, 9, 11' },
      { role: 'Manager', does: '구매 요청 승인', steps: '5' },
      { role: 'Purchaser', does: '카탈로그 · 일괄 변경 · 모니터링 · PO', steps: '1, 3–4, 7' },
      { role: 'Purchasing Manager', does: '업무량 재배분 · PO 승인', steps: '6, 8' },
      { role: 'Accounts Payable Accountant', does: '송장', steps: '10' },
      { role: 'Warehouse Clerk', does: '예약 출고', steps: '12' },
    ],
  };
}

export const REQ = defineChain({
  id: '18j', code: '18J', title: '현업 구매 요청', titleEn: 'Requisitioning',
  summary: '셀프서비스 주문 → 관리자 승인 → PO → 요청자 수령 확인 → 송장 / 예약 출고',
  source: '18J_S4CLD2502_BPD_EN_DE', steps: STEPS, load: () => import('./screens'), use: use18j, opts: OPTS,
  view: ['prmonitor'],
  tcodes: { ME21N: 'po', ME55: 'prapprove', MB21: 'reserve', MIGO_GI: 'gi' },
  summaryOf: (s) => [
    { label: '구매 요청', value: s.done.pr ? s.numbers.pr : '–' },
    { label: 'PO', value: s.done.po ? s.numbers.po : '–' },
    { label: '입고', value: s.done.confirm ? s.numbers.gr : '–' },
    { label: '송장', value: s.done.invoice ? s.numbers.inv : '–' },
    { label: '예약', value: s.done.reserve ? s.numbers.rsv : '–' },
  ],
  useGuide, useBriefing,
});
