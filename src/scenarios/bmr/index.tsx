/** BMR – Scheduling Agreements in Procurement: scenario definition, guide and briefing. */
import { fmtAmt, fmtNum } from '../../format';
import { useOrg, type Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { GR_VALUE, LINE_QTY, MAT, OPTS, PRICE, STEPS, SUP, SUP2, TARGET, useBmr } from './store';

function useGuide(id: string) {
  const s = useBmr();
  const n = s.numbers;
  const d = (k: string) => !!s.done[k];
  const cur = useOrg().currency;
  switch (id) {
    case 'create': return GX(`원자재 ${MAT}은(는) 매주 일정량이 필요합니다. 매번 PO를 만드는 대신 ${SUP.name}와(과) 납품 일정 계약을 맺습니다.`, [
      L('계약 유형 LPA·릴리스 유형 설명', 'LPA는 릴리스 문서(FRC 예측 / JIT 확정)로 공급업체에 일정을 전달하는 유형입니다.'),
      L('목표 수량·단가 설명', `1년간 ${fmtNum(TARGET)} PC, 단가 ${fmtAmt(PRICE, cur)}로 고정합니다.`),
      B('생성', '💾 저장', `납품 일정 계약 ${n.sa}가 생성됩니다.`, d('create')),
    ], '반복 조달을 한 문서로 묶어 PO 작업을 없앱니다.');
    case 'mass': return GX('여러 납품 일정 계약의 초과 납품 허용치를 한 번에 조정합니다.', [
      B('일괄 변경 적용', '▶ 실행 (F8)', '선택한 계약에 10%가 반영됩니다.', d('mass')),
    ], '공급업체 조건 변경을 대량으로 신속하게 반영합니다.');
    case 'schedule': return GX('이번 주부터 3주 동안 매주 1,000 PC씩 받기로 했습니다.', [
      B('라인 생성 및 저장', '💾 저장', '날짜별 일정 라인이 계약 품목에 저장됩니다.', d('schedule')),
    ], '일정 라인이 곧 "발주"입니다 – PO 없이 일정만으로 공급이 진행됩니다.');
    case 'quota': return GX(`공급 위험을 나누기 위해 두 번째 공급업체 ${SUP2.name}(단가 ${SUP2.price})도 쓰기로 했습니다.`, [
      L('쿼터 % 설명', 'MRP가 소요량을 60/40으로 나눠 각 공급원에 배분합니다.'),
      B('저장', '💾 저장', `쿼터 배분 ${n.quota}가 저장됩니다.`, d('quota')),
    ], '복수 공급원을 규칙으로 운영해 공급 안정성을 높입니다.');
    case 'mrp': return GX('생산 계획자가 계획 독립 소요(주 1,000 PC)를 입력하고 MRP를 돌립니다.', [
      B('실행', '▶ 실행', 'MRP가 소요에 맞춰 납품 일정 라인을 자동으로 만들고 조정합니다.', d('mrp')),
    ], '구매 담당자가 일정을 수작업으로 관리할 필요가 줄어듭니다.');
    case 'release': return GX('공급업체에 일정을 공식 전달합니다.', [
      L('JIT / FRC 구분 설명', '가까운 일정은 확정(JIT), 먼 일정은 예측(FRC)으로 보내 공급업체가 준비할 수 있게 합니다.'),
      B('릴리스 생성', '▶ 실행 (F8)', `릴리스 ${n.rel}가 생성됩니다.`, d('release')),
    ], '공급업체와 일정 변경을 이력으로 관리합니다.');
    case 'print': return GX('공급업체에 보낼 릴리스 문서를 확인합니다.', [
      B('미리보기', '🖨 인쇄 미리보기', 'LPH1(FRC)·LPJ1(JIT) 출력 내용을 확인합니다.'),
    ], '전자 문서(EDI) 대신 PDF로도 보낼 수 있습니다.');
    case 'coverage': return GX('생산 계획자가 자재 소요 현황을 확인합니다.', [
      L('납품 일정 라인 = 입고 예정 설명', '일정 라인이 공급 요소로 반영되어 소요가 충족되는지 바로 보입니다.'),
    ], '부족·과잉을 미리 발견해 일정을 조정합니다.');
    case 'gr': return GX(`이번 주 JIT 라인 ${fmtNum(LINE_QTY)} PC가 도착했습니다.`, [
      B('전기', '전기', `입고 ${fmtAmt(GR_VALUE, cur)}이(가) 일정 라인에 반영됩니다.`, d('gr')),
    ], '입고가 일정 라인과 자동 대조됩니다.');
    case 'invoice': return GX('공급업체가 이번 주 납품분 송장을 보냈습니다.', [
      B('추가', '↵ 적용', '입고 수량 × 계약 단가로 품목이 채워집니다.', !!s.vals.invAdded || d('invoice')),
      B('전기', '💾 전기', `송장 ${n.inv}가 전기됩니다.`, d('invoice')),
    ], '반복 납품도 표준 3-way 매칭으로 정산됩니다.');
    default: return launchGuide('bmr', STEPS, `원자재 ${MAT}은(는) 매주 꾸준히 필요한 품목입니다.`, '반복 조달을 계약 + 일정으로 자동화합니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '매주 필요한 원자재를 납품 일정 계약과 일정 라인·릴리스로 조달합니다.',
    story: <>원자재 <b>{MAT}</b>을(를) <b>{SUP.name}</b>와(과) 1년 납품 일정 계약으로 묶고, 주간 일정 라인을 FRC/JIT 릴리스로 전달합니다. 두 번째 공급업체와 쿼터로 공급을 나누고, 입고·송장은 일정 라인 기준으로 처리합니다.</>,
    phases: [
      { icon: 'document', t: '계약', d: 'LPA 납품 일정 계약 · 일괄 변경' },
      { icon: 'calendar', t: '일정', d: '일정 라인 · 쿼터 · MRP' },
      { icon: 'paper-plane', t: '릴리스', d: 'FRC 예측 / JIT 확정 · 출력' },
      { icon: 'receipt', t: '입고 · 송장', d: '일정 라인 기준 입고 · 송장' },
    ],
    cast: [
      { role: 'Purchaser', does: '계약 · 일정 · 쿼터 · 릴리스', steps: '1–4, 6–7' },
      { role: 'Production Planner', does: 'MRP · 소요 현황', steps: '5, 8' },
      { role: 'Warehouse Clerk', does: '입고', steps: '9' },
      { role: 'Accounts Payable Accountant', does: '송장', steps: '10' },
    ],
  };
}

export const BMR = defineChain({
  id: 'bmr', code: 'BMR', title: '납품 일정 계약', titleEn: 'Scheduling Agreements in Procurement',
  summary: '납품 일정 계약 → 일정 라인 · 쿼터 · MRP → FRC/JIT 릴리스 → 입고 → 송장',
  source: 'BMR_S4CLD2502_BPD_EN_DE', steps: STEPS, load: () => import('./screens'), use: useBmr, opts: OPTS,
  view: ['print', 'coverage'],
  tcodes: { ME32L: 'create', ME33L: 'create', MD04: 'coverage', MD01: 'mrp' },
  summaryOf: (s) => [
    { label: '납품 일정 계약', value: s.done.create ? s.numbers.sa : '–' },
    { label: '릴리스', value: s.done.release ? s.numbers.rel : '–' },
    { label: '자재 전표', value: s.done.gr ? s.numbers.gr : '–' },
    { label: '송장', value: s.done.invoice ? s.numbers.inv : '–' },
  ],
  useGuide, useBriefing,
});
