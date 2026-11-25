/** 41F – Procurement of Pipeline Materials: scenario definition, guide and briefing. */
import { jo } from '../../josa';
import { fmtAmt } from '../../format';
import { useOrg, type Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { MAT, OPTS, PRICE, QTY, STEPS, SUP, UNIT, VALUE, use41f } from './store';

function useGuide(id: string) {
  const s = use41f();
  const n = s.numbers;
  const d = (k: string) => !!s.done[k];
  const cur = useOrg().currency;
  switch (id) {
    case 'inforecord': return GX(`공정 용수 ${jo(MAT, '은')} 배관으로 들어와 언제든 원하는 만큼 씁니다. 공급업체 ${jo(SUP.name, '와')} 단가를 정보 레코드로 정합니다.`, [
      L("정보 범주 '파이프라인' 설명", '파이프라인 정보 레코드가 있으면 PO 없이 출고만으로 공급업체 채무가 생깁니다.'),
      B('저장', '💾 저장', `정보 레코드 ${n.info} (${fmtAmt(PRICE, cur)}/${UNIT})가 저장됩니다.`, d('inforecord')),
    ], '반복적인 유틸리티 구매에서 발주 작업을 없앱니다.');
    case 'consume': return GX(`생산 라인이 ${MAT} ${QTY} ${jo(UNIT, '을')} 사용했습니다. ${jo('창고 담당자', '이')} 사용량을 기록합니다.`, [
      L('이동 유형 201P와 코스트 센터 설명', '재고를 거치지 않고 바로 코스트 센터 비용이 됩니다.'),
      B('전기', '전기', `자재 전표 ${jo(n.md, '이')} 전기되고 파이프라인 채무 ${jo(fmtAmt(VALUE, cur), '이')} 생깁니다.`, d('consume')),
    ], '실제 사용량 기준으로 비용과 채무가 정확히 기록됩니다.');
    case 'settle': return GX('월말, 매입채무 담당자가 파이프라인 사용분을 정산합니다.', [
      B('점검', '✔ 점검', '파라미터를 점검합니다 – 파이프라인 ☑, 미정산 출고만 ☑.', !!s.vals.checked || d('settle')),
      B('정산 예약', '▶ 예약', '작업이 즉시 실행되어 정산 문서와 회계 전표가 생성됩니다.', d('settle')),
    ], '공급업체 송장 없이 사용량만으로 정산해 처리 비용을 줄입니다.');
    case 'result': return GX('작업 결과를 확인합니다.', [
      L('문서 번호 설명', `정산 문서 ${jo(n.inv, '와')} 회계 전표 ${jo(n.invFi, '이')} 출고 전표 ${n.md}에 연결됩니다.`),
    ], '정산 근거를 문서 흐름으로 추적합니다.');
    default: return launchGuide('41f', STEPS, `공장은 배관으로 공급되는 공정 용수 ${jo(MAT, '을')} 사용합니다.`, '파이프라인 자재는 발주·입고 없이 사용량만으로 조달·정산합니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '배관·전력처럼 늘 공급되는 자재를 사용량만큼 기록하고 자동 정산합니다.',
    story: <>공정 용수 <b>{MAT}</b>는 <b>{SUP.name}</b>에서 배관으로 들어옵니다. 사용한 만큼(201P) 기록하면 공급업체 채무가 생기고, 정산 작업이 송장 없이 지급을 처리합니다.</>,
    phases: [
      { icon: 'document', t: '조건', d: '파이프라인 정보 레코드' },
      { icon: 'outbox', t: '사용', d: '소비 기록 201P · 코스트 센터' },
      { icon: 'receipt', t: '정산', d: '정산 작업 · 결과 확인' },
      { icon: 'monitor-payments', t: '효과', d: '발주·입고·송장 입력 없음' },
    ],
    cast: [
      { role: 'Purchaser', does: '정보 레코드', steps: '1' },
      { role: 'Warehouse Clerk', does: '소비 기록', steps: '2' },
      { role: 'Accounts Payable Accountant', does: '정산 작업 · 결과', steps: '3–4' },
    ],
  };
}

export const PIP = defineChain({
  id: '41f', code: '41F', title: '파이프라인 자재 조달', titleEn: 'Procurement of Pipeline Materials',
  summary: '정보 레코드 → 소비 기록 201P → 파이프라인 정산',
  source: '41F_S4HANA2025-FPS2_BPD', steps: STEPS, load: () => import('./screens'), use: use41f, opts: OPTS,
  view: ['result'], tcodes: { ME12: 'inforecord', MB1A: 'consume' },
  summaryOf: (s) => [
    { label: '정보 레코드', value: s.done.inforecord ? s.numbers.info : '–' },
    { label: '자재 전표', value: s.done.consume ? s.numbers.md : '–' },
    { label: '정산 문서', value: s.done.settle ? s.numbers.inv : '–' },
  ],
  useGuide, useBriefing,
});
