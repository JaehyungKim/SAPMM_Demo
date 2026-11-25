/** 22Z – Procurement of Services: scenario definition, presenter guide and briefing. */
import { jo } from '../../josa';
import { fmtAmt } from '../../format';
import { ROLE_KO } from '../../steps';
import { useOrg, type Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { CC, LIMIT, OPTS, PO_VALUE, SES_VALUE, STEPS, SUP, SVC, use22z } from './store';

function useGuide(id: string) {
  const s = use22z();
  const n = s.numbers;
  const d = (k: string) => !!s.done[k];
  const cur = useOrg().currency;
  switch (id) {
    case 'contract': return GX(`유지보수 서비스를 정기적으로 ${SUP.name}에서 받기로 했습니다. 시간당 단가를 계약으로 고정합니다.`, [
      L('계약 유형 WK(가치 계약)·목표 금액 설명', '목표 금액까지 여러 번 발주할 수 있고 사용액이 자동 집계됩니다.'),
      B('생성', '💾 저장', `서비스 계약 ${jo(n.contract, '이')} 생성됩니다.`, d('contract')),
    ], '계약 단가가 이후 요청·PO에 자동 적용됩니다.');
    case 'pr': return GX(`시설팀이 유지보수 ${SVC.qty}시간과, 금액만 정해 둔 예비 부품·기타 서비스를 요청합니다.`, [
      L('서비스 품목의 다중 계정 지정 설명', `비용을 ${CC[0].cc} ${CC[0].pct}% / ${CC[1].cc} ${CC[1].pct}%로 나눕니다.`),
      L('Limit 품목의 예상 금액·전체 한도 설명', `정확한 내용을 모르는 서비스는 예상 ${fmtAmt(LIMIT.expected, cur)}, 최대 ${fmtAmt(LIMIT.overall, cur)}까지 허용합니다.`),
      B('생성', '💾 저장', `구매 요청 ${jo(n.pr, '이')} 저장됩니다.`, d('pr')),
    ], '불확실한 서비스도 한도를 정해 통제된 방식으로 요청합니다.');
    case 'autopo': return GX('공급원이 확정된 구매 요청은 백그라운드 작업이 PO로 바꿀 수 있습니다.', [
      B('예약', '▶ 실행 (F8)', `작업 ${jo(n.job, '이')} 구매 오더 ${jo(n.po, '을')} 자동 생성합니다.`, d('autopo') || d('po')),
    ], '반복적인 PO 생성을 사람 손 없이 처리합니다.');
    case 'po': return GX(`구매 요청 ${n.pr}에 공급원이 지정되어 있습니다.`, [
      B('구매 오더 생성', '📄 구매 오더 생성', `서비스 PO ${jo(n.po, '이')} 생성됩니다 (${fmtAmt(PO_VALUE, cur)}).`, d('po')),
    ], '요청 정보가 그대로 PO로 이어집니다.');
    case 'approve': return GX(`PO ${jo(n.po, '이')} ${ROLE_KO['Purchasing Manager']}에게 승인 요청되었습니다.`, [
      B('승인', '✔ 릴리스(승인)', '승인 후 공급업체에 PO가 발송됩니다.', d('approve')),
    ], '서비스 발주도 금액 기준으로 통제합니다.');
    case 'ses': return GX('공급업체가 유지보수 작업을 마쳤습니다. 실제 수행된 서비스를 입력합니다.', [
      L('Limit 품목 실적 설명', `예비 부품 등 실제 사용액 ${jo(fmtAmt(LIMIT.actual, cur), '을')} 입력합니다. 한도를 넘으면 오류가 납니다.`),
      B('승인 요청', '💾 저장 · 승인 요청', `서비스 입력 시트 ${n.ses} (${fmtAmt(SES_VALUE, cur)})가 승인 요청됩니다.`, d('ses')),
    ], '서비스 입력 시트가 서비스의 "입고" 역할을 합니다.');
    case 'sesapprove': return GX(`서비스 입력 시트 금액이 1,000 EUR를 넘어 ${ROLE_KO['Purchasing Manager']} 승인이 필요합니다.`, [
      B('승인', '✔ 승인', '승인과 동시에 서비스 입고가 전기되고 코스트 센터에 비용이 반영됩니다.', d('sesapprove')),
    ], '실제 수행 확인 후에만 비용·지급이 발생합니다.');
    case 'sescheck': return GX('승인된 서비스 입력 시트와 문서 흐름을 확인합니다.', [
      L('문서 흐름과 Limit 잔여 금액 설명', '요청 → PO → 서비스 입력 시트 → 입고가 연결되고, 남은 한도로 추가 서비스를 받을 수 있습니다.'),
    ], '서비스 비용의 근거를 언제든 추적할 수 있습니다.');
    case 'invoice': return GX('공급업체 송장이 도착했습니다.', [
      B('추가', '↵ 적용', '승인된 서비스 입력 시트 금액으로 품목이 채워집니다.', !!s.vals.invAdded || d('invoice')),
      L('지급 보류 R 설명', '서비스 품질 최종 확인 전까지 지급을 막아 둡니다.'),
      B('전기', '💾 전기', `송장 ${jo(n.inv, '이')} 지급 보류 상태로 전기됩니다.`, d('invoice')),
    ], '3-way 매칭(PO·SES·송장)으로 서비스 지급을 통제합니다.');
    case 'release': return GX('품질 확인이 끝났습니다. 송장 지급 보류를 해제합니다.', [
      B('지급 보류 해제', '✔ 릴리스', '다음 지급 실행에 포함됩니다.', d('release')),
    ], '지급 전 마지막 통제를 남깁니다.');
    default: return launchGuide('22z', STEPS, `시설팀이 설비 유지보수 서비스를 외부 업체 ${SUP.name}에 맡기려 합니다.`, '서비스도 자재처럼 요청 → 발주 → 수행 확인 → 송장으로 관리합니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '유지보수 서비스를 계약 단가로 발주하고, 서비스 입력 시트로 수행을 확인한 뒤 지급합니다.',
    story: <>시설팀이 <b>{SUP.name}</b>에 유지보수 {SVC.qty}시간과 금액 한도만 정한 <b>Limit 품목</b>을 요청합니다. 수행 후 서비스 입력 시트를 승인해야 비용이 인식되고 송장을 처리할 수 있습니다.</>,
    phases: [
      { icon: 'official-service', t: '계약 · 요청', d: '서비스 계약 · Limit 품목 요청' },
      { icon: 'cart', t: '발주', d: '자동 / 수동 PO · 승인' },
      { icon: 'checklist-item', t: '수행 확인', d: '서비스 입력 시트 · 승인' },
      { icon: 'receipt', t: '송장', d: '3-way 매칭 · 보류 해제' },
    ],
    cast: [
      { role: 'Purchaser', does: '계약 · 요청 · PO · 서비스 입력 시트', steps: '1–4, 6, 8' },
      { role: 'Purchasing Manager', does: 'PO · SES 승인', steps: '5, 7' },
      { role: 'Accounts Payable Accountant', does: '송장 · 보류 해제', steps: '9–10' },
    ],
  };
}

export const SRV = defineChain({
  id: '22z', code: '22Z', title: '서비스 조달', titleEn: 'Procurement of Services',
  summary: '서비스 계약 → Limit 품목 요청 → PO → 서비스 입력 시트 → 송장',
  source: '22Z_S4CLD2502_BPD_EN_DE', steps: STEPS, load: () => import('./screens'), use: use22z, opts: OPTS,
  view: ['sescheck'],
  tcodes: { ME32K: 'contract', ME21N: 'po', ML82: 'sescheck', ML81N: 'ses' },
  summaryOf: (s) => [
    { label: '구매 요청', value: s.done.pr ? s.numbers.pr : '–' },
    { label: 'PO', value: s.done.po ? s.numbers.po : '–' },
    { label: '서비스 입력 시트', value: s.done.ses ? s.numbers.ses : '–' },
    { label: '송장', value: s.done.invoice ? s.numbers.inv : '–' },
  ],
  useGuide, useBriefing,
});
