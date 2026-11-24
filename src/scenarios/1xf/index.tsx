/** 1XF – Request for Price: scenario definition, guide and briefing. */
import { fmtAmt } from '../../format';
import { useOrg, type Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { BEST, BIDDERS, MAT, OPTS, QTY, STEPS, use1xf } from './store';

function useGuide(id: string) {
  const s = use1xf();
  const n = s.numbers;
  const d = (k: string) => !!s.done[k];
  const cur = useOrg().currency;
  switch (id) {
    case 'rfq': return GX(`${MAT} ${QTY}개를 1년간 사려 합니다. 두 공급업체에 가격을 요청합니다.`, [
      L('후속 문서 유형 MK·입찰자 설명', '낙찰되면 수량 계약이 만들어지고, 입찰자에게 RFQ가 발송됩니다.'),
      B('저장', '💾 저장', `RFQ ${n.rfq}가 저장됩니다.`, !!s.vals.saved || d('rfq')),
      B('게시', '📤 게시', '자동 승인 워크플로 후 입찰자에게 발송됩니다.', d('rfq')),
    ], '견적 요청을 표준화해 공정하고 투명하게 소싱합니다.');
    case 'quotes': return GX('두 공급업체가 이메일로 견적을 보냈습니다. 구매 담당자가 시스템에 입력합니다.', [
      B(`견적 생성·제출 (${BIDDERS[0].no})`, `💾 견적 ${BIDDERS[0].no}`, `단가 ${fmtAmt(BIDDERS[0].price, cur)}`, !!s.vals.q1 || d('quotes')),
      B(`견적 생성·제출 (${BIDDERS[1].no})`, `💾 견적 ${BIDDERS[1].no}`, `단가 ${fmtAmt(BIDDERS[1].price, cur)}`, d('quotes')),
    ], '흩어진 견적을 한 RFQ 아래 모아 비교할 수 있게 합니다.');
    case 'display': return GX('입력한 견적을 RFQ에서 확인합니다.', [
      L('견적 탭 설명', '공급업체별 견적 번호·가격·상태가 한눈에 보입니다.'),
    ], '견적 이력이 RFQ에 남습니다.');
    case 'award': return GX('견적을 나란히 비교해 낙찰자를 정합니다.', [
      L('최저가 품목 설명', `${BEST.name}가 ${fmtAmt(BEST.price, cur)}로 가장 낮습니다.`),
      B('낙찰', '🏆 낙찰', '낙찰 승인 워크플로가 자동으로 처리됩니다.', d('award')),
    ], '근거 있는 공급업체 선정으로 구매 비용을 줄입니다.');
    case 'followon': return GX('낙찰된 견적에서 후속 문서를 만듭니다.', [
      B('구매 계약 생성', '📄 계약 생성', `구매 계약 ${n.contract}가 견적 조건 그대로 생성됩니다.`, d('followon')),
    ], '견적 조건을 다시 입력할 필요가 없습니다.');
    case 'situation': return GX('마감이 가까운데 견적이 적으면 시스템이 알림을 보냅니다.', [
      L('상황 조건 설명', '입찰 비율·마감까지 남은 일수 기준으로 매일 점검합니다.'),
      B('해제 (해결됨)', '✔ 해제', '조치를 마치고 상황을 닫습니다.', d('situation')),
    ], '견적 부족으로 인한 소싱 지연을 미리 막습니다.');
    default: return launchGuide('1xf', STEPS, `${MAT}를 반복 구매하기 위해 공급업체 가격을 비교하려 합니다.`, 'RFQ부터 계약까지 소싱 과정을 시스템 하나로 처리합니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '여러 공급업체에 가격을 요청하고, 견적을 비교해 낙찰한 뒤 계약으로 이어 갑니다.',
    story: <><b>{MAT}</b> {QTY}개에 대해 공급업체 2곳에 RFQ를 보내고, 받은 견적({BIDDERS.map((b) => `${b.price} EUR`).join(' / ')})을 비교해 <b>{BEST.name}</b>를 낙찰, 구매 계약을 만듭니다.</>,
    phases: [
      { icon: 'request', t: 'RFQ', d: '생성 · 게시' },
      { icon: 'documents', t: '견적', d: '입력 · 확인' },
      { icon: 'accept', t: '낙찰', d: '비교 · 낙찰' },
      { icon: 'document', t: '후속 문서', d: '구매 계약 · 상황 알림' },
    ],
    cast: [{ role: 'Purchaser', does: 'RFQ · 견적 · 낙찰 · 계약', steps: '1–6' }],
  };
}

export const RFP = defineChain({
  id: '1xf', code: '1XF', title: '가격 요청 (RFQ)', titleEn: 'Request for Price',
  summary: 'RFQ 게시 → 견적 입력 → 비교·낙찰 → 구매 계약',
  source: '1XF_S4HANA2025-FPS2_BPD', steps: STEPS, load: () => import('./screens'), use: use1xf, opts: OPTS,
  view: ['display'], tcodes: { ME42: 'rfq' },
  summaryOf: (s) => [
    { label: 'RFQ', value: s.done.rfq ? s.numbers.rfq : '–' },
    { label: '낙찰 견적', value: s.done.award ? s.numbers.q1 : '–' },
    { label: '구매 계약', value: s.done.followon ? s.numbers.contract : '–' },
  ],
  useGuide, useBriefing,
});
