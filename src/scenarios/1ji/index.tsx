/** 1JI – Real-Time Reporting, Monitoring and Spend Visibility: definition, guide and briefing. */
import type { Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { APPS, OPTS, STEPS, use1ji } from './store';

const WHY: Record<string, [string, string, string]> = {
  ovp: ['구매 담당자가 아침에 오늘 처리할 일을 한 화면에서 봅니다.', '전역 필터가 모든 카드에 동시에 적용됩니다.', '흩어진 리포트를 열지 않고 우선순위를 바로 정합니다.'],
  contracts: ['만료가 다가오는 계약의 소진 상황을 점검합니다.', '릴리스 금액이 쌓이는 추세로 목표 달성 여부를 봅니다.', '재협상 시점을 데이터로 판단합니다.'],
  rfq: ['진행 중인 견적 요청을 점검합니다.', '마감이 가까운 RFQ만 걸러 봅니다.', '견적 부족으로 인한 소싱 지연을 막습니다.'],
  poitems: ['납기가 늦어진 PO 품목을 찾습니다.', '시각적 필터 한 번으로 지연 품목만 남깁니다.', '생산 차질 전에 공급업체에 대응합니다.'],
  confirm: ['공급업체 확인 회신 상태를 봅니다.', '요청 납기와 확인 납기 차이를 봅니다.', '확인 누락·납기 차이를 조기에 발견합니다.'],
  sa: ['납품 일정 계약의 릴리스 현황을 봅니다.', '공급업체별 릴리스 금액으로 쿼터 준수를 확인합니다.', '반복 조달의 물량 배분을 투명하게 관리합니다.'],
  ppv: ['같은 자재의 가격 차이를 분석합니다.', '플랜트별로 드릴다운해 가격 편차를 찾습니다.', '통합 협상으로 단가를 낮출 기회를 찾습니다.'],
  supplier: ['공급업체 화면에서 바로 지출 분석을 봅니다.', '구매 지출 탭이 자재 그룹별 지출을 보여 줍니다.', '공급업체 미팅 준비가 빨라집니다.'],
  overdue: ['지연 PO의 건수와 금액을 봅니다.', '공급업체별로 지연을 모아 봅니다.', '지연 원인 공급업체를 평가·협의로 연결합니다.'],
  autorate: ['송장 처리 자동화 수준을 봅니다.', '원천(ERS·Network·OCR·수동)별 자동화율을 봅니다.', '자동화 투자 우선순위를 정합니다.'],
};

function useGuide(id: string) {
  const s = use1ji();
  const a = APPS.find((x) => x.id === id);
  if (!a) return launchGuide('1ji', STEPS, '구매 담당자가 아침에 실시간 구매 현황을 점검합니다. 다른 시나리오에서 만든 문서(★ 표시)도 바로 집계됩니다.', '별도 BI 없이 S/4HANA 안에서 실시간 분석을 합니다.');
  const [sit, why, value] = WHY[id];
  return GX(sit, [
    L('KPI·표 설명', '거래 데이터가 그대로 집계되므로 전기 즉시 수치가 바뀝니다 (배치·DW 없음). ★ 표시 행은 이 데모의 다른 시나리오에서 만든 문서입니다.'),
    B(a.action, a.gui, why, !!s.done[id]),
  ], value);
}

function useBriefing(): Briefing {
  return {
    headline: '구매 거래 데이터를 별도 BI 없이 실시간으로 모니터링하고 분석합니다.',
    story: <>구매 개요 페이지의 카드에서 시작해 계약·RFQ·PO·확인·납품 일정 계약·가격 차이·지연·송장 자동화율까지, 다른 시나리오에서 만든 문서가 <b>즉시</b> 분석 앱에 나타납니다.</>,
    phases: [
      { icon: 'grid', t: '개요', d: '구매 개요 페이지 · 전역 필터' },
      { icon: 'monitor-payments', t: '모니터링', d: '계약 · RFQ · PO · 확인 · 일정 계약' },
      { icon: 'expense-report', t: '지출·가격', d: '가격 차이 · 공급업체 지출' },
      { icon: 'receipt', t: '운영 KPI', d: '지연 PO · 송장 자동화율' },
    ],
    cast: [{ role: 'Purchaser', does: '분석 앱 전체', steps: '1–10' }],
  };
}

export const RTR = defineChain({
  id: '1ji', code: '1JI', title: '실시간 구매 분석', titleEn: 'Real-Time Reporting, Monitoring, and Spend Visibility',
  summary: '구매 개요 페이지 → 계약·RFQ·PO·확인 모니터링 → 가격 차이·지연·자동화율',
  source: '1JI_S4HANA2025-FPS2_BPD', steps: STEPS, load: () => import('./screens'), use: use1ji, opts: OPTS,
  summaryOf: (s) => [{ label: '확인한 분석 앱', value: `${APPS.filter((a) => s.done[a.id]).length} / ${APPS.length}` }],
  useGuide, useBriefing,
});
