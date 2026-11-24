/** 1JI – Real-Time Reporting, Monitoring and Spend Visibility: steps and state. */
import { makeChain, step, type ChainOpts } from '../shared/chain';

/** Analytical apps of the scope item; each step has one interaction (filter, view, drilldown). */
export const APPS = [
  { id: 'ovp', title: '구매 개요 페이지 (OVP)', en: 'Procurement Overview Page', app: 'Procurement Overview', appId: 'F1990', opt: false, action: '전역 필터: 공급업체 10300001', gui: '🔎 필터 적용' },
  { id: 'contracts', title: '구매 계약 품목 모니터링', en: 'Monitor Purchase Contract Items', app: 'Monitor Purchase Contract Items', appId: 'F2423', opt: false, action: '계약 소진 추세', gui: '📈 소진 추세' },
  { id: 'rfq', title: 'RFQ 품목 모니터링', en: 'Monitor RFQ Items', app: 'Monitor RFQ Items', appId: 'F2425', opt: true, action: '시각적 필터: 마감 임박', gui: '🔎 마감 임박' },
  { id: 'poitems', title: '구매 오더 품목 모니터링', en: 'Monitor Purchase Order Items', app: 'Monitor Purchase Order Items', appId: 'F2358', opt: false, action: '시각적 필터: 납기 지연', gui: '🔎 납기 지연' },
  { id: 'confirm', title: '공급업체 확인 모니터링', en: 'Monitor Supplier Confirmations', app: 'Monitor Supplier Confirmations', appId: 'F2359', opt: true, action: '보기: 납기 차이', gui: '↔ 납기 차이' },
  { id: 'sa', title: '납품 일정 계약 품목 모니터링', en: 'Monitor Scheduling Agreement Items', app: 'Monitor Purchase Scheduling Agreement Items', appId: 'F3143', opt: true, action: '공급업체별 릴리스 금액', gui: '📊 공급업체별' },
  { id: 'ppv', title: '자재 가격 차이 분석', en: 'Material Price Variance', app: 'Material Price Variance', appId: 'F3294', opt: true, action: '드릴다운: 플랜트', gui: '⤵ 플랜트별' },
  { id: 'supplier', title: '공급업체 개체 페이지 분석', en: 'Embedded Analytics in Supplier Object Page', app: 'Supplier', appId: 'F0354', opt: true, action: '탭: 구매 지출', gui: '📑 구매 지출' },
  { id: 'overdue', title: '지연 구매 오더 품목 (건수·금액)', en: 'Overdue Purchase Order Items', app: 'Overdue Purchase Order Items - Number and Value', appId: 'F0343', opt: true, action: '차원: 공급업체', gui: '⤵ 공급업체별' },
  { id: 'autorate', title: '공급업체 송장 자동화율', en: 'Supplier Invoice Inbound Automation Rate', app: 'Supplier Invoice Inbound Automation Rate - By Origin', appId: 'F4518', opt: true, action: '차원: 원천별', gui: '⤵ 원천별' },
] as const;

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  ...APPS.map((a, i) => step(i + 1, a.id, a.title, a.en, `4.${i + 1}`, a.app, a.appId, a.appId, 'Purchaser', a.opt, 'none')),
];

export const OPTS: ChainOpts = {
  scn: '1ji',
  numbers: () => ({}),
  msgs: Object.fromEntries(APPS.map((a) => [a.id, () => `${a.action} – 결과가 갱신되었습니다`])),
};

export const use1ji = makeChain(OPTS);
