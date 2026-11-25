/** BMR – Scheduling Agreements screens (Fiori + SAP GUI from one spec per step). */
import { jo, pc } from '../../josa';
import { addDays, fmtAmt, fmtDate, fmtNum, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { useOrg } from '../types';
import { autoLaunchpad, pair, type KCol } from '../shared/kit';
import { JournalTable, PrintDoc } from '../shared/ui';
import { GR_VALUE, LINES, LINE_QTY, MAT, MAT_TX, PRICE, STEPS, SUP, SUP2, TARGET, useBmr } from './store';

const SUPT = `${SUP.name} (${SUP.no})`;
const use = () => { const s = useBmr(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };
interface Line { no: string; date: string; qty: number; rel: string; gr: number }
const linesOf = (df: ReturnType<typeof useOrg>['dateFormat'], d: (k: string) => boolean): Line[] => LINES.map((off, i) => ({
  no: String(i + 1), date: fmtDate(addDays(todayIso(), off), df), qty: LINE_QTY,
  rel: d('release') ? (i === 0 ? 'JIT · 확정' : 'FRC · 예측') : '', gr: d('gr') && i === 0 ? LINE_QTY : 0,
}));
const lineCols: KCol<Line>[] = [
  { key: 'n', label: '라인', w: 40, render: (r) => r.no },
  { key: 'd', label: '납품일', w: 90, render: (r) => r.date },
  { key: 'q', label: '일정 수량', w: 80, align: 'right', render: (r) => `${fmtNum(r.qty)} PC` },
  { key: 'r', label: '릴리스', w: 100, render: (r) => r.rel },
  { key: 'g', label: '입고 수량', w: 80, align: 'right', render: (r) => fmtNum(r.gr) },
];
const itemRow = { item: '10', material: MAT, text: MAT_TX, qty: LINE_QTY, unit: 'PC', price: PRICE };

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>납품 일정 계약은 <b>계약 생성(ME31L)</b> → <b>일정 라인(ME38)</b> → <b>릴리스(ME84)</b> → <b>입고(MIGO)</b> → <b>송장(MIRO)</b> 순서입니다.</>);

export const [createF, createG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '납품 일정 계약 관리', appId: 'F2179', title: d('create') ? `납품 일정 계약 ${n.sa}` : '새 납품 일정 계약', gtitle: d('create') ? `납품 일정 계약 ${n.sa} 표시` : '납품 일정 계약 생성',
    status: d('create') ? ['Positive', '활성'] : undefined,
    kpis: [{ label: '목표 수량', value: `${fmtNum(TARGET)} PC` }],
    fields: [
      { label: '계약 유형', value: 'LPA 릴리스 문서 사용 납품 일정 계약', help: 'schedAgreement' }, { label: '공급업체', value: SUPT, help: 'supplier' },
      { label: '구매 조직 / 그룹', value: `${c.purchasingOrg} / 001` }, { label: '유효 기간', value: `${fmtDate(todayIso(), c.dateFormat)} ~ ${fmtDate(addDays(todayIso(), 365), c.dateFormat)}`, help: 'validity' },
      { label: '릴리스 유형', value: 'FRC 예측 + JIT 확정', help: 'releaseType' }, { label: '플랜트', value: c.plant, help: 'plant' },
    ],
    tables: [{ title: '품목', rows: [itemRow], rowKey: (r) => r.item, cols: [
      { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 't', label: '내역', w: 220, render: (r) => r.text },
      { key: 'tq', label: '목표 수량', w: 90, align: 'right', render: () => fmtNum(TARGET) }, { key: 'p', label: '순 가격', w: 80, align: 'right', render: (r) => fmtAmt(r.price, c.currency) },
    ] }],
    footer: true, done: d('create'), doneMsg: `납품 일정 계약 ${jo(n.sa, '이')} 생성되었습니다 (목표 ${fmtNum(TARGET)} PC, ${fmtAmt(PRICE, c.currency)}/PC).`,
    actions: [{ label: '생성', gui: '💾 저장', disabled: d('create'), onClick: () => s.mark('create'), toast: `계약 ${n.sa}` }],
  };
});

export const [massF, massG] = pair(() => {
  const { s, n, d } = use();
  return {
    app: '납품 일정 계약 일괄 변경', appId: 'F2668', title: '납품 일정 계약 일괄 변경', gtitle: '납품 일정 계약 일괄 변경',
    fields: [{ label: '변경 필드', value: '초과 납품 허용치 (%)' }, { label: '기존 값', value: '0 %' }, { label: '새 값', value: '10 %' }],
    tables: [{ title: '대상 계약', rows: [itemRow], rowKey: (r) => r.item, select: true, cols: [
      { key: 'sa', label: '납품 일정 계약', w: 110, render: () => n.sa }, { key: 'm', label: '자재', w: 70, render: (r) => r.material },
      { key: 't', label: '초과 납품 허용', w: 100, render: () => (d('mass') ? '10 %' : '0 %') },
    ] }],
    done: d('mass'), doneMsg: `일괄 변경 작업 ${jo(n.job, '이')} 완료되었습니다.`,
    actions: [{ label: '일괄 변경 적용', gui: '▶ 실행 (F8)', disabled: d('mass'), onClick: () => s.mark('mass'), toast: `작업 ${n.job}` }],
  };
});

export const [scheduleF, scheduleG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '납품 일정 라인 유지', appId: 'ME38', title: `납품 일정 계약 ${n.sa} – 품목 10`, gtitle: `납품 일정 계약 ${n.sa} 변경: 납품 일정`,
    kpis: [{ label: '일정 합계', value: `${fmtNum(LINES.length * LINE_QTY)} PC` }],
    fields: [{ label: '자재', value: `${MAT} ${MAT_TX}` }, { label: '공급업체', value: SUPT }, { label: '누적 수량', value: d('schedule') ? fmtNum(LINES.length * LINE_QTY) : '0' }],
    tables: [{ title: '납품 일정 라인', rows: d('schedule') ? linesOf(c.dateFormat, d) : [], rowKey: (r) => r.no, empty: "'라인 생성'을 누르면 주간 일정 라인이 입력됩니다", cols: lineCols }],
    done: d('schedule'), doneMsg: <>일정 라인 {LINES.length}개가 저장되었습니다.<Help k="scheduleLine" /></>,
    actions: [{ label: '라인 생성 및 저장', gui: '💾 저장', disabled: d('schedule'), onClick: () => s.mark('schedule'), toast: '일정 라인 저장' }],
  };
});

export const [quotaF, quotaG] = pair(() => {
  const { s, n, d } = use();
  const rows = [{ k: '1', sup: SUP, pct: 60, kind: `납품 일정 계약 ${n.sa}`, price: PRICE }, { k: '2', sup: SUP2, pct: 40, kind: '정보 레코드', price: SUP2.price }];
  return {
    app: '쿼터 배분 관리', appId: 'F1877', title: `${MAT} 쿼터 배분`, gtitle: '쿼터 배분 유지보수',
    fields: [{ label: '자재', value: MAT }, { label: '쿼터 배분 번호', value: d('quota') ? n.quota : '(신규)', help: 'quota' }],
    tables: [{ title: '공급원별 쿼터', rows, rowKey: (r) => r.k, cols: [
      { key: 's', label: '공급업체', w: 180, render: (r) => `${r.sup.name} (${r.sup.no})` }, { key: 'k', label: '공급원', w: 150, render: (r) => r.kind },
      { key: 'p', label: '단가', w: 70, align: 'right', render: (r) => r.price.toFixed(2) }, { key: 'q', label: '쿼터 %', w: 60, align: 'right', render: (r) => `${r.pct} %` },
    ] }],
    done: d('quota'), doneMsg: `쿼터 배분 ${jo(n.quota, '이')} 저장되었습니다 – MRP가 소요량을 60/40으로 나눠 공급원을 결정합니다.`,
    actions: [{ label: '저장', gui: '💾 저장', disabled: d('quota'), onClick: () => s.mark('quota'), toast: '쿼터 저장' }],
  };
});

export const [mrpF, mrpG] = pair(() => {
  const { s, d, c } = use();
  return {
    app: 'MRP 실행 예약', appId: 'F1339', title: `계획 독립 소요 · MRP – ${MAT}`, gtitle: 'MRP Live',
    fields: [{ label: '자재', value: MAT }, { label: '플랜트', value: c.plant }, { label: '계획 독립 소요', value: `${fmtNum(LINE_QTY)} PC / 주` }, { label: '일정 라인 생성', value: '3 납품 일정 라인' }],
    tables: [{ title: 'MRP 결과', rows: d('mrp') ? linesOf(c.dateFormat, d) : [], rowKey: (r) => r.no, empty: 'MRP를 실행하면 소요량에 맞춰 납품 일정 라인이 생성됩니다', cols: lineCols }],
    done: d('mrp'), doneMsg: 'MRP가 계획 독립 소요를 반영해 납품 일정 라인을 자동 생성·조정했습니다.',
    actions: [{ label: '실행', gui: '▶ 실행', disabled: d('mrp'), onClick: () => s.mark('mrp'), toast: 'MRP 완료' }],
  };
});

export const [releaseF, releaseG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '납품 일정 릴리스 생성', appId: 'ME84', title: `릴리스 생성 – ${n.sa}`, gtitle: '납품 일정 릴리스 생성',
    fields: [{ label: '납품 일정 계약', value: n.sa }, { label: '릴리스 유형', value: 'FRC 예측 일정 + JIT 확정 일정', help: 'releaseType' }, { label: '테스트 실행', value: '☐' }],
    tables: [{ title: '릴리스 대상 일정 라인', rows: linesOf(c.dateFormat, d), rowKey: (r) => r.no, cols: lineCols }],
    done: d('release'), doneMsg: `릴리스 ${jo(n.rel, '이')} 생성되었습니다 – 이번 주 라인은 JIT(확정), 이후는 FRC(예측)로 공급업체에 전달됩니다.`,
    actions: [{ label: '릴리스 생성', gui: '▶ 실행 (F8)', disabled: d('release'), onClick: () => s.mark('release'), toast: `릴리스 ${n.rel}` }],
  };
});

export const [printF, printG] = pair(() => {
  const { n, c } = use();
  return {
    app: '납품 일정 릴리스 출력', appId: 'ME9E', title: `릴리스 ${n.rel} 출력`, gtitle: '메시지 출력: 납품 일정 계약 릴리스',
    tables: [{ title: '출력 메시지', rows: [{ k: 'LPH1' }, { k: 'LPJ1' }], rowKey: (r) => r.k, cols: [
      { key: 't', label: '출력 유형', w: 80, render: (r) => r.k }, { key: 'x', label: '내역', w: 200, render: (r) => (r.k === 'LPH1' ? 'FRC 예측 일정 릴리스' : 'JIT 확정 일정 릴리스') },
      { key: 'p', label: '파트너', w: 90, render: () => SUP.no },
    ] }],
    pdf: { label: '미리보기', title: `납품 일정 릴리스 ${n.rel}`, doc: <PrintDoc title="납품 일정 릴리스" titleEn="Scheduling Agreement Release" partner={SUP} meta={[['납품 일정 계약', n.sa], ['릴리스', n.rel]]}
      items={LINES.map((off, i) => ({ ...itemRow, item: String((i + 1) * 10), extra: `납품일 ${fmtDate(addDays(todayIso(), off), c.dateFormat)} · ${i === 0 ? 'JIT' : 'FRC'}` }))}
      terms={[['릴리스 유형', 'FRC + JIT']]} foot="확정(JIT) 일정은 생산·출하를 준비해 주시고, 예측(FRC) 일정은 자재 계획에 참고해 주십시오." /> },
  };
});

export const [coverageF, coverageG] = pair(() => {
  const { n, d, c } = use();
  const rows = LINES.map((off, i) => ({ k: String(i), date: fmtDate(addDays(todayIso(), off), c.dateFormat), el: `SA 일정 ${n.sa}/10`, rec: LINE_QTY, req: LINE_QTY, avail: d('gr') && i === 0 ? LINE_QTY : 0 }));
  return {
    app: '자재 소요 현황 모니터링', appId: 'F2101A', title: `${MAT} 재고/소요 리스트`, gtitle: `재고/소요 리스트: ${MAT}`,
    kpis: [{ label: '가용 일수', value: '21일' }],
    tables: [{ title: 'MRP 요소', rows, rowKey: (r) => r.k, cols: [
      { key: 'd', label: '일자', w: 90, render: (r) => r.date }, { key: 'e', label: 'MRP 요소', w: 160, render: (r) => r.el },
      { key: 'r', label: '입고 예정', w: 80, align: 'right', render: (r) => fmtNum(r.rec) }, { key: 'q', label: '소요', w: 80, align: 'right', render: (r) => fmtNum(-r.req) },
    ] }],
    info: '납품 일정 라인이 공급 요소로 보이므로, 생산 계획자는 부족 없이 소요가 충족되는지 바로 확인합니다.',
  };
});

export const [grF, grG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 문서 기준 입고 전기', appId: 'F0843', title: `납품 일정 계약 ${n.sa}`, gtitle: `입고 납품 일정 계약 ${n.sa}`,
    fields: [{ label: '구매 문서', value: n.sa }, { label: '공급업체', value: SUPT }, { label: '납품서', value: `LS-${n.sa.slice(-4)}`, help: 'deliveryNote' }, { label: '이동 유형', value: '101', help: 'movementType' }],
    tables: [{ title: '품목 (이번 주 JIT 라인)', rows: [itemRow], rowKey: (r) => r.item, cols: [
      { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 'q', label: '수량', w: 80, align: 'right', render: (r) => `${fmtNum(r.qty)} PC` },
      { key: 's', label: '저장 위치', w: 70, render: () => c.storageLocation }, { key: 'v', label: '금액', w: 90, align: 'right', render: () => fmtAmt(GR_VALUE, c.currency) },
    ] }],
    footer: true, done: d('gr'), doneMsg: `자재 전표 ${jo(n.gr, '이')} 전기되었습니다 – 일정 라인 1의 입고 수량이 갱신되었습니다.`,
    actions: [{ label: '전기', gui: '전기', disabled: d('gr'), onClick: () => s.mark('gr'), toast: `자재 전표 ${n.gr}` }],
    extra: d('gr') ? <JournalTable lines={[{ acc: c.glInventory, text: `재고 ${MAT}`, dc: '차변', amt: GR_VALUE }, { acc: c.glGrir, text: 'GR/IR 청산', dc: '대변', amt: GR_VALUE }]} /> : undefined,
  };
});

export const [invoiceF, invoiceG] = pair(() => {
  const { s, n, d, c } = use();
  const added = !!s.vals.invAdded || d('invoice');
  return {
    app: '공급업체 송장 생성', appId: 'F0859', title: d('invoice') ? `공급업체 송장 ${n.inv}` : '공급업체 송장 생성', gtitle: `수신 송장 입력: 회사 코드 ${c.companyCode}`,
    kpis: [{ label: '총 금액', value: fmtAmt(GR_VALUE, c.currency) }, { label: '잔액', value: fmtAmt(added ? 0 : GR_VALUE, c.currency) }],
    fields: [{ label: '송장 발행처', value: SUPT }, { label: '참조', value: `INV-${n.sa.slice(-4)}`, help: 'reference' }, { label: '구매 문서 참조', value: n.sa }],
    tables: [{ title: '송장 품목', rows: added ? [itemRow] : [], rowKey: (r) => r.item, empty: "납품 일정 계약을 '추가'하면 입고된 수량이 제안됩니다", cols: [
      { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 'q', label: '수량', w: 80, align: 'right', render: (r) => `${fmtNum(r.qty)} PC` },
      { key: 'p', label: '단가', w: 80, align: 'right', render: (r) => fmtAmt(r.price, c.currency) }, { key: 'v', label: '금액', w: 90, align: 'right', render: () => fmtAmt(GR_VALUE, c.currency) },
    ] }],
    done: d('invoice'), doneMsg: `공급업체 송장 ${n.inv}(회계 전표 ${n.invFi})${pc(n.inv, '이')} 전기되었습니다.`,
    actions: [
      { label: '추가', gui: '↵ 적용', disabled: added, onClick: () => s.setVal('invAdded', true) },
      { label: '전기', gui: '💾 전기', disabled: !added || d('invoice'), onClick: () => s.mark('invoice'), toast: `송장 ${n.inv}` },
    ],
  };
});
