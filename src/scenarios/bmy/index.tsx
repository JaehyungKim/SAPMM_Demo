/** BMY – Subcontracting: scenario definition, presenter guide and briefing. */
import { fmtAmt } from '../../format';
import { ROLE_KO } from '../../steps';
import { useOrg, type Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { MAT, OPTS, QTY, STEPS, SUP, VALUE, useBmy } from './store';

function useGuide(id: string) {
  const s = useBmy();
  const n = s.numbers;
  const d = (k: string) => !!s.done[k];
  const cur = useOrg().currency;
  switch (id) {
    case 'mrp': return GX(`반제품 ${MAT}의 재고가 부족합니다. ${MAT}은 외주처에 원자재를 보내 가공해 오는 품목입니다.`, [
      L('조달 유형·특별 조달 30(외주) 설명', '자재 마스터의 설정 덕분에 MRP가 일반 구매 요청이 아닌 외주 구매 요청(품목 범주 L)을 만듭니다.'),
      B('실행', '▶ 실행', `구매 요청 ${n.pr}가 생성되고 BOM 구성품 RM13·RM14 소요량도 계산됩니다.`, d('mrp')),
    ], '외주 품목도 MRP가 자동으로 계획해 누락을 막습니다.');
    case 'po': return GX(`외주 구매 요청에 공급원(외주처 ${SUP.no}, 정보 레코드)이 지정되어 있습니다.`, [
      L("품목 범주 'L'과 구성품 표 설명", 'PO에는 가공비만 가격으로 들어가고, 외주처에 보낼 구성품이 BOM에서 자동으로 붙습니다.'),
      B('구매 오더 생성', '📄 구매 오더 생성', `외주 PO ${n.po}가 생성됩니다 (가공비 ${fmtAmt(VALUE, cur)}).`, d('po')),
    ], '가공비와 제공 자재가 한 문서에 묶여 외주 원가를 정확히 관리합니다.');
    case 'monitor': return GX('외주 PO의 진행 상황을 확인합니다.', [
      L('구성품 출고·입고 미결 열 설명', '외주처가 가공을 시작할 수 있는지(구성품 도착 여부)를 한눈에 봅니다.'),
    ], '외주 공정의 병목을 빨리 찾습니다.');
    case 'approve': return GX(`PO ${n.po}가 승인 규칙(500 EUR 초과)에 걸려 ${ROLE_KO['Purchasing Manager']}에게 도착했습니다.`, [
      B('승인', '✔ 릴리스(승인)', '승인되면 PO가 외주처에 발송되고 구성품 출고가 가능해집니다.', d('approve')),
    ], '외주 발주도 금액 기준으로 통제됩니다.');
    case 'delivery': return GX('외주 콕핏에서 외주처에 보낼 구성품을 확인합니다.', [
      L('가용 재고 확인', '구성품 재고가 충분하면 바로 납품을 만들 수 있습니다.'),
      B('납품 생성', '🚚 납품 생성', `구성품 납품 ${n.dlv}가 생성됩니다.`, d('delivery')),
    ], '어느 외주처에 무엇을 보내야 하는지 한 화면에서 관리합니다.');
    case 'pgi': return GX(`납품 ${n.dlv}의 구성품을 외주처로 출고합니다.`, [
      L('이동 유형 541 설명', '재고가 사라지는 것이 아니라 외주처 재고(회사 소유)로 이동합니다.'),
      B('출고 전기', '🚚 출고 전기', '구성품이 외주처 재고로 이동합니다.', d('pgi')),
    ], '외주처에 있는 회사 자재를 정확히 추적합니다.');
    case 'gr': return GX(`외주처가 가공을 끝내고 ${MAT} ${QTY} PC를 납품했습니다.`, [
      L('101 / 543 두 줄 설명', '완제품 입고(101)와 동시에 외주처 재고의 구성품 소비(543)가 자동 전기됩니다.'),
      B('전기', '전기', '입고 가치 = 구성품 가치 + 외주 가공비.', d('gr')),
    ], '입고 한 번으로 재고·원가·외주 재고가 모두 정리됩니다.');
    case 'review': return GX('외주처 재고와 문서 흐름을 확인합니다.', [
      L('제공 / 소비 / 잔량 설명', '외주처에 남은 회사 자재가 0이면 정산이 맞습니다. 남으면 회수·추가 소비를 협의합니다.'),
      B('외주 PO 출력', '🖨 인쇄 미리보기', '외주처에 보내는 PO에는 구성품 목록이 함께 인쇄됩니다.'),
    ], '외주처 재고 실사·정산 근거가 됩니다.');
    case 'invoice': return GX('외주처가 가공비 송장을 보냈습니다.', [
      B('추가', '↵ 적용', '입고 수량 × 가공비 단가로 품목이 제안됩니다.', !!s.vals.invAdded || d('invoice')),
      B('전기', '💾 전기', `송장 ${n.inv}가 전기됩니다.`, d('invoice')),
    ], '가공비만 청구·지급되어 구성품 비용이 중복되지 않습니다.');
    default: return launchGuide('bmy', STEPS, `반제품 ${MAT} 재고가 부족합니다. 외주처 ${SUP.name}에 원자재를 보내 가공을 맡깁니다.`, '외주 가공은 구매·생산·창고·회계가 함께 하는 프로세스입니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '원자재를 외주처에 제공하고, 가공된 반제품을 받아 가공비만 정산합니다.',
    story: <>반제품 <b>{MAT}</b> {QTY} PC를 외주처 <b>{SUP.name}</b>에 맡깁니다. 구성품 RM13·RM14를 보내고(541), 입고 시 자동 소비(543)되며, 송장은 가공비만 청구됩니다.</>,
    phases: [
      { icon: 'calendar', t: '계획', d: 'MRP가 외주 구매 요청 생성' },
      { icon: 'cart', t: '외주 발주', d: '품목 범주 L · 구성품 BOM · 승인' },
      { icon: 'outbox', t: '구성품 제공', d: '콕핏 → 납품 → 출고 541' },
      { icon: 'receipt', t: '입고 · 송장', d: '101/543 · 가공비 송장' },
    ],
    cast: [
      { role: 'Production Planner', does: 'MRP 실행', steps: '1' },
      { role: 'Purchaser', does: '외주 PO · 모니터링', steps: '2–3' },
      { role: 'Purchasing Manager', does: 'PO 승인', steps: '4' },
      { role: 'Shipping Specialist', does: '구성품 납품 · 출고', steps: '5–6' },
      { role: 'Warehouse Clerk', does: '입고', steps: '7' },
      { role: 'Inventory Manager', does: '외주 재고 확인', steps: '8' },
      { role: 'Accounts Payable Accountant', does: '송장', steps: '9' },
    ],
  };
}

export const BMY = defineChain({
  id: 'bmy', code: 'BMY', title: '외주 가공', titleEn: 'Subcontracting',
  summary: 'MRP → 외주 PO(L) → 구성품 출고 541 → 입고 101/543 → 가공비 송장',
  source: 'BMY_S4CLD2502_BPD_EN_DE', steps: STEPS, load: () => import('./screens'), use: useBmy, opts: OPTS,
  view: ['monitor', 'review'],
  tcodes: { ME51N: 'mrp', ME21N: 'po', ME23N: 'monitor', ME2O: 'delivery', MBLB: 'review', MD04: 'mrp' },
  summaryOf: (s) => [
    { label: '구매 요청', value: s.done.mrp ? s.numbers.pr : '–' },
    { label: '외주 PO', value: s.done.po ? s.numbers.po : '–' },
    { label: '납품', value: s.done.delivery ? s.numbers.dlv : '–' },
    { label: '자재 전표', value: s.done.gr ? s.numbers.gr : '–' },
    { label: '송장', value: s.done.invoice ? s.numbers.inv : '–' },
  ],
  useGuide, useBriefing,
});
