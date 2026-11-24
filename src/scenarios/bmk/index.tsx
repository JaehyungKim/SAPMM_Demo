/** BMK – Return to Supplier: scenario definition, presenter guide and briefing. */
import { fmtAmt } from '../../format';
import { ROLE_KO } from '../../steps';
import { useOrg, type Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { ITEMS, OPTS, PRICE, RET_QTY, STEPS, SUP, useBmk } from './store';

function useGuide(id: string) {
  const s = useBmk();
  const n = s.numbers;
  const d = (k: string) => !!s.done[k];
  const cur = useOrg().currency;
  switch (id) {
    case 'stock': return GX(`공급업체 ${SUP.no}에서 받은 TG12 중 ${RET_QTY} PC를 돌려보내야 합니다. 먼저 재고 상황을 봅니다.`, [
      L('저장 위치별 가용 재고 설명', '101A에 반품 대상 재고가 있고, 반품 전용 저장 위치 101R이 따로 있습니다.'),
      L('재주문점 설명', '반품해도 재주문점 아래로 떨어지지 않아 추가 발주가 필요 없습니다.'),
    ], '반품 결정 전에 재고·계획 영향을 한 화면에서 판단합니다.');
    case 'transfer': return GX('반품할 물품을 일반 재고와 섞이지 않도록 반품 저장 위치로 옮깁니다.', [
      B('전기', '💾 전기', `101A → 101R, 이동 유형 311로 ${RET_QTY} PC를 이전합니다.`, d('transfer')),
    ], '반품 대기 물품이 따로 관리되어 잘못 출고·사용되는 일을 막습니다.');
    case 'retpo': return GX(`반품 사유는 두 가지입니다 – 품목 10은 잘못 납품된 자재(대변 메모), 품목 20은 품질 불합격(대체 자재).`, [
      L("오더 유형 NB2와 '반품 품목' 표시 설명", '고급 반품 관리(Advanced Returns)용 PO 유형입니다. 입고 대신 출고, 송장 대신 대변 메모가 발생합니다.'),
      L('품목별 반품 사유·후속 처리 설명', '같은 반품 PO 안에서 품목마다 환불 또는 대체를 고를 수 있습니다.'),
      B('저장', '💾 저장', `반품 PO ${n.retpo}가 생성됩니다 (금액 ${fmtAmt(RET_QTY * PRICE, cur)}).`, d('retpo')),
    ], '반품도 PO로 관리되어 출고·환불·대체 전 과정이 추적됩니다.');
    case 'delivery': return GX(`${ROLE_KO['Shipping Specialist']}가 반품 PO를 출하 대상 목록에서 확인합니다.`, [
      L('출하 지점 101R과 구매 문서 설명', '반품 PO는 영업 오더처럼 아웃바운드 납품의 기준 문서가 됩니다.'),
      B('백그라운드에서 납품 생성', '⚙ 백그라운드', `납품 ${n.dlv}가 생성됩니다.`, d('delivery')),
    ], '창고는 평소의 출하 프로세스 그대로 반품을 처리합니다.');
    case 'pgi': return GX(`납품 ${n.dlv}의 물품을 피킹하고 공급업체로 출고합니다.`, [
      L('피킹 수량 = 납품 수량 확인', '피킹이 끝나야 출고를 전기할 수 있습니다.'),
      B('출고 전기', '🚚 출고 전기', '이동 유형 161로 재고가 줄고, GR/IR 계정이 차변 처리됩니다.', d('pgi')),
    ], '재고와 회계가 출고 순간 함께 정정됩니다.');
    case 'monitor': return GX('구매 담당자가 반품 PO 진행 상황을 점검합니다.', [
      L('출고 완료·대변 메모 수량 열 설명', '반품도 일반 PO와 같은 모니터에서 진행 단계를 볼 수 있습니다.'),
    ], '반품 미결 건을 놓치지 않고 공급업체와 협의할 수 있습니다.');
    case 'credit': return GX(`공급업체가 품목 10(${ITEMS[0].qty} PC)에 대한 대변 메모를 보냈습니다.`, [
      B('추가', '↵ 적용', `반품 PO ${n.retpo}를 참조하면 대변 메모 대상 품목만 제안됩니다.`, !!s.vals.creditAdded || d('credit')),
      L('분개 미리보기 설명', '차변 매입채무 / 대변 GR/IR – 출고 때 생긴 GR/IR 잔액이 청산됩니다.'),
      B('전기', '💾 전기', `대변 메모 ${n.credit}가 전기됩니다.`, d('credit')),
    ], '환불 금액이 PO·출고와 자동 대조되어 정확합니다.');
    case 'replace': return GX(`품목 20(${ITEMS[1].qty} PC)은 공급업체가 대체 자재를 보내기로 했습니다.`, [
      L('대체 수량과 재고 유형(보류) 설명', '대체 자재는 품질 검사를 위해 보류 재고로 받습니다.'),
      B('저장', '💾 저장', `대체 PO ${n.replpo}와 인바운드 납품 ${n.ibd}가 자동 생성됩니다.`, d('replace')),
    ], '대체 발주를 사람이 따로 만들 필요가 없습니다.');
    case 'replgr': return GX(`대체 자재가 도착했습니다. 인바운드 납품 ${n.ibd}로 입고합니다.`, [
      B('입고 전기', '📥 입고 전기', '보류 재고로 입고되고, 금액 0의 송장 검증 문서가 자동 생성됩니다.', d('replgr')),
    ], '대체분은 추가 비용 없이 재고로 들어옵니다.');
    case 'followup': return GX('품질 검사를 통과한 대체 자재를 사용 가능한 재고로 돌립니다.', [
      B('저장 및 확인', '💾 저장 및 확인', '후속 조치 0011로 보류 재고 → 가용 재고 이전이 실행됩니다.', d('followup')),
    ], '반품-대체 과정의 마지막 정리까지 시스템이 안내합니다.');
    case 'invdoc': return GX('반품 PO에 연결된 모든 문서를 한 번에 확인합니다.', [
      L('반품 개요의 문서 흐름 설명', '출고 → 대변 메모 → 대체 입고 → 금액 0 송장 문서가 한 줄로 이어집니다.'),
      B('반품 오더 출력', '🖨 인쇄 미리보기', '공급업체에 보내는 반품 오더 문서입니다.'),
    ], '감사·클레임 대응에 필요한 근거가 한 곳에 모입니다.');
    default: return launchGuide('bmk', STEPS, `입고 검사에서 공급업체 ${SUP.name}의 TG12 일부가 잘못 납품되었거나 불량으로 판정되었습니다.`, '반품은 구매·출하·회계가 함께 움직이는 프로세스입니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '잘못 오거나 불량인 물품을 공급업체로 돌려보내고, 환불(대변 메모) 또는 대체 자재로 마무리합니다.',
    story: <>공급업체 <b>{SUP.name}</b>가 보낸 TG12 중 {ITEMS[0].qty} PC는 잘못된 자재, {ITEMS[1].qty} PC는 품질 불량입니다. 반품 PO 하나로 출고·환불·대체 입고까지 처리합니다.</>,
    phases: [
      { icon: 'inventory', t: '재고 준비', d: '반품 저장 위치로 이전' },
      { icon: 'outbox', t: '반품 출고', d: '반품 PO → 납품 → 출고(161)' },
      { icon: 'receipt', t: '대변 메모', d: '환불 금액 정산' },
      { icon: 'shipping-status', t: '대체 자재', d: '대체 PO · 입고 · 후속 조치' },
    ],
    cast: [
      { role: 'Inventory Manager', does: '재고 분석', steps: '1' },
      { role: 'Warehouse Clerk', does: '재고 이전', steps: '2' },
      { role: 'Purchaser', does: '반품 PO · 모니터링', steps: '3, 6, 11' },
      { role: 'Shipping Specialist', does: '납품 · 출고', steps: '4–5' },
      { role: 'Accounts Payable Accountant', does: '대변 메모', steps: '7' },
      { role: 'Receiving Specialist', does: '대체 자재 수령', steps: '8–10' },
    ],
  };
}

export const BMK = defineChain({
  id: 'bmk', code: 'BMK', title: '공급업체 반품', titleEn: 'Return to Supplier',
  summary: '반품 PO → 출고 → 대변 메모 / 대체 자재 입고',
  source: 'BMK_S4CLD2502_BPD_EN_DE', steps: STEPS, load: () => import('./screens'), use: useBmk, opts: OPTS,
  view: ['stock', 'monitor', 'invdoc'],
  tcodes: { MIGO: 'replgr', ME22N: 'retpo', ME23N: 'invdoc' },
  summaryOf: (s) => [
    { label: '반품 PO', value: s.done.retpo ? s.numbers.retpo : '–' },
    { label: '납품', value: s.done.delivery ? s.numbers.dlv : '–' },
    { label: '대변 메모', value: s.done.credit ? s.numbers.credit : '–' },
    { label: '대체 PO', value: s.done.replace ? s.numbers.replpo : '–' },
  ],
  useGuide, useBriefing,
});
