/**
 * 1JI – Real-Time Reporting screens. Every app is an analytical list page with KPIs and a
 * table; the step's interaction (filter / view / drilldown) switches the table to its result.
 */
import { addDays, fmtAmt, fmtDate, todayIso } from '../../format';
import { useOrg } from '../types';
import { autoLaunchpad, pair, type KCol, type KSpec } from '../shared/kit';
import { APPS, STEPS, use1ji } from './store';

type Row = Record<string, string | number> & { k: string };
interface View { kpis: [string, string][]; title: string; cols: [string, string, boolean?][]; rows: Row[] }

const use = () => { const s = use1ji(); return { s, d: (id: string) => !!s.done[id], c: useOrg() }; };
const cols = (v: View): KCol<Row>[] => v.cols.map(([key, label, right]) => ({ key, label, w: right ? 90 : 160, align: right ? 'right' : undefined, render: (r) => r[key] }));

function analytic(id: (typeof APPS)[number]['id'], views: (c: ReturnType<typeof useOrg>) => { before: View; after: View; info: string }) {
  const a = APPS.find((x) => x.id === id)!;
  return pair((): KSpec => {
    const { s, d, c } = use();
    const v = views(c);
    const cur = d(id) ? v.after : v.before;
    return {
      app: a.app, appId: a.appId, title: a.app, gtitle: a.en,
      kpis: cur.kpis.map(([label, value]) => ({ label, value })),
      tables: [{ title: cur.title, rows: cur.rows, rowKey: (r) => r.k, cols: cols(cur) }],
      info: d(id) ? v.info : undefined,
      actions: [{ label: a.action, gui: a.gui, disabled: d(id), onClick: () => s.mark(id) }],
    };
  });
}

const D = (n: number, df: ReturnType<typeof useOrg>['dateFormat']) => fmtDate(addDays(todayIso(), n), df);

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>실시간 구매 분석 앱 모음입니다. 각 앱은 <b>필터 → 차트/표 → 드릴다운</b> 방식으로 같은 데이터를 다양한 관점에서 봅니다.</>);

export const [ovpF, ovpG] = analytic('ovp', (c) => ({
  before: { kpis: [['구매 지출 (YTD)', fmtAmt(1284500, c.currency)], ['관리되지 않은 지출', '12 %'], ['계약 외 지출', '8 %']], title: '카드', cols: [['card', '카드'], ['val', '핵심 수치', true], ['st', '상태']],
    rows: [
      { k: '1', card: '구매 계약 모니터링', val: '3건 만료 예정', st: '주의' }, { k: '2', card: '구매 요청 품목 (공급원 없음)', val: '7', st: '열림' },
      { k: '3', card: '구매 오더 품목 (지연 / 승인 중)', val: '5 / 2', st: '주의' }, { k: '4', card: 'RFQ 모니터링', val: '2건 마감 임박', st: '열림' },
      { k: '5', card: '공급업체 확인 (누락)', val: '4', st: '주의' }, { k: '6', card: '공급업체 성과', val: '평균 84점', st: '양호' },
    ] },
  after: { kpis: [['구매 지출 (10300001)', fmtAmt(412300, c.currency)], ['관리되지 않은 지출', '4 %'], ['계약 외 지출', '2 %']], title: '카드 – 공급업체 10300001', cols: [['card', '카드'], ['val', '핵심 수치', true], ['st', '상태']],
    rows: [
      { k: '1', card: '구매 계약 모니터링', val: '1건 만료 예정', st: '주의' }, { k: '3', card: '구매 오더 품목 (지연 / 승인 중)', val: '1 / 0', st: '양호' },
      { k: '5', card: '공급업체 확인 (누락)', val: '0', st: '양호' }, { k: '6', card: '공급업체 성과', val: '93점 (A)', st: '양호' },
    ] },
  info: '전역 필터가 모든 카드에 적용되었습니다. 카드 머리글을 누르면 필터가 유지된 채 해당 앱(예: 계약 품목 모니터링)으로 이동합니다.',
}));

export const [contractsF, contractsG] = analytic('contracts', (c) => ({
  before: { kpis: [['활성 계약 품목', '24'], ['만료 예정 (30일)', '3']], title: '계약 품목', cols: [['ct', '계약 / 품목'], ['m', '자재'], ['tv', '목표 금액', true], ['rel', '릴리스 금액', true], ['to', '유효 종료']],
    rows: [
      { k: '1', ct: '4600000412 / 10', m: 'TG10', tv: fmtAmt(5000, c.currency), rel: fmtAmt(500, c.currency), to: D(37, c.dateFormat) },
      { k: '2', ct: '4600000412 / 20', m: 'TG11', tv: fmtAmt(1000, c.currency), rel: fmtAmt(300, c.currency), to: D(37, c.dateFormat) },
      { k: '3', ct: '4600000377 / 10', m: 'RM129', tv: fmtAmt(120000, c.currency), rel: fmtAmt(84000, c.currency), to: D(210, c.dateFormat) },
    ] },
  after: { kpis: [['TG11 소진율', '30 %'], ['월 평균 릴리스', fmtAmt(100, c.currency)]], title: '계약 소진 추세 – 4600000412 / 20 (TG11)', cols: [['mo', '월'], ['rel', '릴리스 금액', true], ['cum', '누적 소진율', true]],
    rows: [{ k: '1', mo: 'M-2', rel: fmtAmt(100, c.currency), cum: '10 %' }, { k: '2', mo: 'M-1', rel: fmtAmt(100, c.currency), cum: '20 %' }, { k: '3', mo: '이번 달', rel: fmtAmt(100, c.currency), cum: '30 %' }] },
  info: '소진율 추세로 계약 만료 전 목표 수량 달성 여부를 예측하고 재협상 시점을 판단합니다.',
}));

export const [rfqF, rfqG] = analytic('rfq', (c) => ({
  before: { kpis: [['진행 중 RFQ 품목', '6'], ['낙찰 견적 금액', fmtAmt(3000, c.currency)]], title: 'RFQ 품목', cols: [['r', 'RFQ / 품목'], ['m', '자재'], ['dl', '견적 마감'], ['st', '견적 상태']],
    rows: [
      { k: '1', r: '7000000142 / 10', m: 'TG0011', dl: D(0, c.dateFormat), st: '2 / 2 제출' }, { k: '2', r: '7000000150 / 10', m: 'RM13', dl: D(3, c.dateFormat), st: '1 / 3 제출' },
      { k: '3', r: '7000000151 / 10', m: 'RM14', dl: D(12, c.dateFormat), st: '0 / 2 제출' },
    ] },
  after: { kpis: [['마감 7일 이내', '2']], title: 'RFQ 품목 – 마감 임박', cols: [['r', 'RFQ / 품목'], ['m', '자재'], ['dl', '견적 마감'], ['st', '견적 상태']],
    rows: [{ k: '1', r: '7000000142 / 10', m: 'TG0011', dl: D(0, c.dateFormat), st: '2 / 2 제출' }, { k: '2', r: '7000000150 / 10', m: 'RM13', dl: D(3, c.dateFormat), st: '1 / 3 제출' }] },
  info: '도넛 차트(견적 마감 상태)를 시각적 필터로 사용했습니다. 견적이 부족한 RFQ에 바로 대응합니다.',
}));

export const [poitemsF, poitemsG] = analytic('poitems', (c) => ({
  before: { kpis: [['미결 PO 품목', '41'], ['PO 금액', fmtAmt(186400, c.currency)]], title: 'PO 품목', cols: [['po', 'PO / 품목'], ['s', '공급업체'], ['nd', '다음 납품'], ['st', '납품 상태']],
    rows: [
      { k: '1', po: '4500000559 / 10', s: '10300003', nd: D(14, c.dateFormat), st: '정상' }, { k: '2', po: '4500001540 / 10', s: '10300007', nd: D(-3, c.dateFormat), st: '지연' },
      { k: '3', po: '4500001609 / 10', s: '10300001', nd: D(5, c.dateFormat), st: '정상' }, { k: '4', po: '4500001721 / 10', s: '10300002', nd: D(-1, c.dateFormat), st: '지연' },
    ] },
  after: { kpis: [['지연 PO 품목', '2'], ['지연 금액', fmtAmt(1590, c.currency)]], title: 'PO 품목 – 납기 지연', cols: [['po', 'PO / 품목'], ['s', '공급업체'], ['nd', '다음 납품'], ['st', '납품 상태']],
    rows: [{ k: '2', po: '4500001540 / 10', s: '10300007', nd: D(-3, c.dateFormat), st: '지연' }, { k: '4', po: '4500001721 / 10', s: '10300002', nd: D(-1, c.dateFormat), st: '지연' }] },
  info: '도넛 차트(다음 납품 상태)에서 "지연"을 눌러 표가 바로 걸러졌습니다. 행을 누르면 PO로 이동해 공급업체에 독촉합니다.',
}));

export const [confirmF, confirmG] = analytic('confirm', (c) => ({
  before: { kpis: [['확인 누락 품목', '4']], title: '확인 누락', cols: [['po', 'PO / 품목'], ['s', '공급업체'], ['dd', '요청 납기']],
    rows: [{ k: '1', po: '4500001609 / 10', s: '10300001', dd: D(5, c.dateFormat) }, { k: '2', po: '4500001721 / 20', s: '10300002', dd: D(9, c.dateFormat) }] },
  after: { kpis: [['납기 차이 품목', '2'], ['평균 차이', '+3 일']], title: '납기 차이', cols: [['po', 'PO / 품목'], ['s', '공급업체'], ['dd', '요청 납기'], ['cd', '확인 납기'], ['df', '차이', true]],
    rows: [{ k: '1', po: '4500001540 / 10', s: '10300007', dd: D(-3, c.dateFormat), cd: D(2, c.dateFormat), df: '+5 일' }, { k: '2', po: '4500000559 / 10', s: '10300003', dd: D(14, c.dateFormat), cd: D(15, c.dateFormat), df: '+1 일' }] },
  info: '공급업체가 회신한 확인 납기와 요청 납기 차이를 미리 파악해 생산 계획에 반영합니다.',
}));

export const [saF, saG] = analytic('sa', (c) => ({
  before: { kpis: [['활성 납품 일정 계약 품목', '5']], title: '납품 일정 계약 품목', cols: [['sa', '계약 / 품목'], ['m', '자재'], ['nd', '다음 납품'], ['rs', '릴리스 상태']],
    rows: [{ k: '1', sa: '5500000142 / 10', m: 'RM129', nd: D(0, c.dateFormat), rs: 'JIT 확정' }, { k: '2', sa: '5500000108 / 10', m: 'RM130', nd: D(7, c.dateFormat), rs: 'FRC 예측' }] },
  after: { kpis: [['총 릴리스 금액', fmtAmt(70200, c.currency)]], title: '공급업체별 릴리스 금액', cols: [['s', '공급업체'], ['v', '릴리스 금액', true]],
    rows: [{ k: '1', s: '10300001 Inlandslieferant DE 1', v: fmtAmt(52650, c.currency) }, { k: '2', s: '10300002 Inlandslieferant DE 2', v: fmtAmt(17550, c.currency) }] },
  info: '쿼터 배분대로 공급업체별 릴리스 금액이 나뉘었는지 확인합니다.',
}));

export const [ppvF, ppvG] = analytic('ppv', (c) => ({
  before: { kpis: [['가격 차이 (송장–PO)', fmtAmt(1240, c.currency)]], title: '자재별 가격 차이', cols: [['m', '자재'], ['po', 'PO 가격', true], ['iv', '송장 가격', true], ['df', '차이', true]],
    rows: [{ k: '1', m: 'TG0011', po: fmtAmt(25, c.currency), iv: fmtAmt(25.4, c.currency), df: '+1.6 %' }, { k: '2', m: 'RM129', po: fmtAmt(17.55, c.currency), iv: fmtAmt(17.55, c.currency), df: '0 %' }] },
  after: { kpis: [['플랜트 수', '2']], title: '플랜트별 순 가격 (TG0011)', cols: [['p', '플랜트'], ['np', '순 가격', true], ['ch', '정보 레코드 변경', true]],
    rows: [{ k: '1', p: `${c.plant} ${c.plantName}`, np: fmtAmt(25, c.currency), ch: '2' }, { k: '2', p: '1710 Plant 2', np: fmtAmt(26.2, c.currency), ch: '1' }] },
  info: '같은 자재라도 플랜트·계약·정보 레코드별 가격 차이를 찾아 통합 협상 대상을 정합니다.',
}));

export const [supplierF, supplierG] = analytic('supplier', (c) => ({
  before: { kpis: [['공급업체', '10300001 Domestic 10 Supplier 1']], title: '개요', cols: [['f', '항목'], ['v', '값']],
    rows: [{ k: '1', f: '국가 / 도시', v: 'DE / Hamburg' }, { k: '2', f: '활성 계약', v: '2' }, { k: '3', f: '평가 점수', v: '93 (A)' }] },
  after: { kpis: [['구매 지출 (YTD)', fmtAmt(412300, c.currency)], ['계약 지출 비중', '86 %']], title: '구매 지출 탭', cols: [['g', '자재 그룹'], ['v', '지출', true], ['s', '비중', true]],
    rows: [{ k: '1', g: 'L001 상품', v: fmtAmt(298000, c.currency), s: '72 %' }, { k: '2', g: 'YBMM01 소모품', v: fmtAmt(114300, c.currency), s: '28 %' }] },
  info: '공급업체 화면 안에서 지출·계약 지출·요청 유형·평가 점수 탭을 바로 볼 수 있습니다 (Embedded Analytics).',
}));

export const [overdueF, overdueG] = analytic('overdue', (c) => ({
  before: { kpis: [['지연 품목 수', '5'], ['지연 금액', fmtAmt(8240, c.currency)]], title: '지연 PO 품목', cols: [['po', 'PO / 품목'], ['d', '지연 일수', true], ['v', '금액', true]],
    rows: [{ k: '1', po: '4500001540 / 10', d: '3', v: fmtAmt(590, c.currency) }, { k: '2', po: '4500001721 / 10', d: '1', v: fmtAmt(1000, c.currency) }] },
  after: { kpis: [['공급업체 수', '3']], title: '공급업체별 지연', cols: [['s', '공급업체'], ['n', '지연 품목', true], ['v', '지연 금액', true]],
    rows: [{ k: '1', s: '10300007', n: '2', v: fmtAmt(1180, c.currency) }, { k: '2', s: '10300002', n: '2', v: fmtAmt(5060, c.currency) }, { k: '3', s: '10300003', n: '1', v: fmtAmt(2000, c.currency) }] },
  info: '지연이 집중된 공급업체를 찾아 공급업체 평가·협의로 연결합니다.',
}));

export const [autorateF, autorateG] = analytic('autorate', () => ({
  before: { kpis: [['송장 자동화율', '68 %']], title: '월별 자동화율', cols: [['m', '월'], ['r', '자동화율', true]],
    rows: [{ k: '1', m: 'M-2', r: '61 %' }, { k: '2', m: 'M-1', r: '65 %' }, { k: '3', m: '이번 달', r: '68 %' }] },
  after: { kpis: [['원천 수', '4']], title: '원천별 자동화율', cols: [['o', '원천'], ['n', '송장 수', true], ['r', '자동화율', true]],
    rows: [{ k: '1', o: '자동 정산 (ERS·파이프라인)', n: '120', r: '100 %' }, { k: '2', o: 'Business Network', n: '210', r: '92 %' }, { k: '3', o: 'OCR 스캔', n: '180', r: '55 %' }, { k: '4', o: '수동 입력', n: '90', r: '0 %' }] },
  info: '어느 경로의 송장이 수작업을 만드는지 보고 자동화 투자 우선순위를 정합니다.',
}));
