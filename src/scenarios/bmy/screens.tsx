/** BMY – Subcontracting screens (Fiori + SAP GUI from one spec per step). */
import { jo, pc } from '../../josa';
import { addDays, fmtAmt, fmtDate, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { useOrg } from '../types';
import { autoLaunchpad, pair, type KCol } from '../shared/kit';
import { JournalTable, PrintDoc } from '../shared/ui';
import { COMPS, COMP_VALUE, MAT, MAT_TX, PRICE, QTY, STEPS, SUP, VALUE, useBmy } from './store';

type Comp = (typeof COMPS)[number];
const SUPT = `${SUP.name} (${SUP.no})`;
const use = () => { const s = useBmy(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };
const compCols: KCol<Comp>[] = [
  { key: 'i', label: '구성품 품목', w: 70, render: (r) => r.item },
  { key: 'm', label: '자재', w: 60, render: (r) => r.material },
  { key: 't', label: '내역', w: 180, render: (r) => r.text },
  { key: 'q', label: '소요량', w: 80, align: 'right', render: (r) => `${r.qty} ${r.unit}` },
];
const poRow = { item: '10', material: MAT, text: MAT_TX, qty: QTY, unit: 'PC', price: PRICE };
const poCols = (cur: string): KCol<typeof poRow>[] => [
  { key: 'i', label: '품목', w: 40, render: (r) => r.item },
  { key: 'c', label: '품목 범주', w: 70, render: () => <>L 외주<Help k="itemCatL" /></> },
  { key: 'm', label: '자재', w: 60, render: (r) => r.material },
  { key: 't', label: '내역', w: 200, render: (r) => r.text },
  { key: 'q', label: '수량', w: 70, align: 'right', render: (r) => `${r.qty} PC` },
  { key: 'p', label: '가공비 단가', w: 80, align: 'right', render: (r) => fmtAmt(r.price, cur) },
];

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>외주 가공은 <b>MRP(MD03)</b> → <b>외주 PO(ME57)</b> → <b>구성품 출고(ME2ON/VL02N)</b> → <b>입고(MIGO)</b> → <b>송장(MIRO)</b> 순서입니다.</>);

export const [mrpF, mrpG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: 'MRP 실행 예약', appId: 'F1339', title: `MRP 실행 – ${MAT}`, gtitle: 'MRP 실행: 단일 품목, 단일 레벨',
    fields: [{ label: '자재', value: MAT, help: 'material' }, { label: '플랜트', value: `${c.plant} ${c.plantName}`, help: 'plant' }, { label: '조달 유형', value: 'F 외부 조달 / 특별 조달 30 외주' }, { label: '처리 키', value: 'NETCH 순변경' }, { label: '구매 요청 생성', value: '1 구매 요청' }],
    tables: [{ title: 'MRP 결과', rows: d('mrp') ? [poRow] : [], rowKey: (r) => r.item, empty: 'MRP를 실행하면 부족 수량에 대한 구매 요청이 생성됩니다', cols: [
      { key: 'pr', label: '구매 요청', w: 90, render: () => n.pr }, { key: 'm', label: '자재', w: 60, render: (r) => r.material },
      { key: 'c', label: '품목 범주', w: 70, render: () => 'L 외주' }, { key: 'q', label: '수량', w: 70, align: 'right', render: (r) => `${r.qty} PC` },
      { key: 'd', label: '납품일', w: 90, render: () => fmtDate(addDays(todayIso(), 14), c.dateFormat) },
    ] }],
    done: d('mrp'), doneMsg: `외주 구매 요청 ${jo(n.pr, '이')} 생성되었습니다 – 구성품 RM13·RM14 소요량도 BOM에서 함께 계산되었습니다.`,
    actions: [{ label: '실행', gui: '▶ 실행', disabled: d('mrp'), onClick: () => s.mark('mrp'), toast: `구매 요청 ${n.pr} 생성` }],
  };
});

export const [poF, poG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 요청 처리', appId: 'F1048A', title: d('po') ? `구매 오더 ${n.po}` : `구매 요청 ${n.pr}`, gtitle: d('po') ? `표준 PO ${n.po} 표시` : '구매 요청 지정 및 처리',
    status: d('po') ? ['Positive', '오더됨'] : ['Information', '공급원 지정됨'],
    kpis: [{ label: '가공비', value: fmtAmt(VALUE, c.currency) }, { label: '구성품 가치', value: fmtAmt(COMP_VALUE, c.currency) }],
    fields: [{ label: '공급업체(외주처)', value: SUPT, help: 'supplier' }, { label: '구매 조직 / 그룹', value: `${c.purchasingOrg} / 001` }, { label: '정보 레코드', value: '외주 (Subcontracting)' }, { label: '플랜트', value: c.plant, help: 'plant' }],
    tables: [
      { title: '품목', rows: [poRow], rowKey: (r) => r.item, cols: poCols(c.currency) },
      { title: '구성품 (자재 제공 – BOM)', rows: COMPS, rowKey: (r) => r.item, cols: compCols },
    ],
    footer: true, done: d('po'), doneMsg: `외주 구매 오더 ${jo(n.po, '이')} 생성되었습니다. 금액이 500 EUR를 넘어 승인 워크플로가 시작되었습니다.`,
    actions: [{ label: '구매 오더 생성', gui: '📄 구매 오더 생성', disabled: d('po'), onClick: () => s.mark('po'), toast: `PO ${n.po} 생성` }],
  };
});

export const [monitorF, monitorG] = pair(() => {
  const { n, d, c } = use();
  return {
    app: '구매 오더 품목 모니터링', appId: 'F2358', title: '외주 구매 오더 품목', gtitle: '자재별 구매 문서',
    fields: [{ label: '품목 범주', value: 'L 외주' }, { label: '공급업체', value: SUPT }],
    tables: [{ title: '구매 오더 품목', rows: [poRow], rowKey: (r) => r.item, cols: [
      { key: 'po', label: '구매 오더 / 품목', w: 120, render: () => `${n.po} / 10` }, { key: 'm', label: '자재', w: 60, render: (r) => r.material },
      { key: 's', label: '상태', w: 110, render: () => (d('approve') ? '릴리스됨' : '승인 대기') },
      { key: 'cp', label: '구성품 출고', w: 90, render: () => (d('pgi') ? '완료' : '미결') },
      { key: 'g', label: '입고 미결', w: 80, align: 'right', render: (r) => (d('gr') ? 0 : r.qty) },
      { key: 'v', label: '순 금액', w: 90, align: 'right', render: () => fmtAmt(VALUE, c.currency) },
    ] }],
    info: '외주 PO는 구성품 출고 상태까지 함께 보여 주어, 외주처가 작업을 시작할 수 있는지 바로 알 수 있습니다.',
  };
});

export const [approveF, approveG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '내 받은 편지함', appId: 'F0862', title: `구매 오더 ${n.po} 릴리스`, gtitle: 'Business Workplace – PURCHASING_MANAGER',
    status: d('approve') ? ['Positive', '승인됨'] : ['Critical', '승인 대기'],
    fields: [{ label: '작업', value: `구매 오더 ${n.po} 릴리스` }, { label: '공급업체', value: SUPT }, { label: '순 금액', value: fmtAmt(VALUE, c.currency) }, { label: '승인 규칙', value: '구매 그룹 001 · 500 EUR 초과' }],
    tables: [{ title: '품목', rows: [poRow], rowKey: (r) => r.item, cols: poCols(c.currency) }],
    done: d('approve'), doneMsg: `구매 오더 ${jo(n.po, '이')} 승인되어 외주처에 발송되었습니다.`,
    actions: [{ label: '승인', gui: '✔ 릴리스(승인)', disabled: d('approve'), onClick: () => s.mark('approve'), toast: '승인 완료' }],
  };
});

export const [deliveryF, deliveryG] = pair(() => {
  const { s, n, d } = use();
  return {
    app: '외주 콕핏', appId: 'F2948', title: '외주처에 제공할 구성품', gtitle: '외주 자재 제공 개요',
    fields: [{ label: '외주처', value: SUPT, help: 'supplier' }, { label: '구매 오더', value: n.po }, { label: '플랜트', value: useOrg().plant }],
    tables: [{ title: '제공 대상 구성품', rows: COMPS, rowKey: (r) => r.item, select: true, cols: [
      ...compCols, { key: 'av', label: '가용 재고', w: 80, align: 'right', render: () => '5,000 PC' },
      { key: 'dl', label: '납품', w: 90, render: () => (d('delivery') ? n.dlv : '') },
    ] }],
    done: d('delivery'), doneMsg: `아웃바운드 납품 ${jo(n.dlv, '이')} 생성되었습니다 – 구성품 RM13·RM14를 외주처로 보냅니다.`,
    actions: [{ label: '납품 생성', gui: '🚚 납품 생성', disabled: d('delivery'), onClick: () => s.mark('delivery'), toast: `납품 ${n.dlv} 생성` }],
  };
});

export const [pgiF, pgiG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '아웃바운드 납품 변경', appId: 'VL02N', title: `납품 ${n.dlv}`, gtitle: `외주 납품 ${n.dlv} 변경: 개요`,
    status: d('pgi') ? ['Positive', '출고 완료'] : ['Critical', '출고 대기'],
    fields: [{ label: '수취인(외주처)', value: SUPT }, { label: '이동 유형', value: '541 외주처로 이전', help: 'movementType' }, { label: '출하 지점', value: c.plant, help: 'shippingPoint' }],
    tables: [{ title: '피킹', rows: COMPS, rowKey: (r) => r.item, cols: [...compCols, { key: 'p', label: '피킹 수량', w: 70, align: 'right', render: (r) => <>{r.qty}<Help k="pickedQty" /></> }] }],
    done: d('pgi'), doneMsg: <>출고가 전기되었습니다 – 자재 전표 {n.pgi}. 구성품은 <b>외주처 재고(공급업체에 제공된 자재)</b>로 이동했고, 회사 재고 가치는 그대로입니다.<Help k="subconStock" /></>,
    actions: [{ label: '출고 전기', gui: '🚚 출고 전기', disabled: d('pgi'), onClick: () => s.mark('pgi'), toast: `출고 ${n.pgi} 전기` }],
  };
});

export const [grF, grG] = pair(() => {
  const { s, n, d, c } = use();
  const rows = [
    { k: '1', mv: '101', mat: MAT, text: '완제품 입고', qty: QTY, val: COMP_VALUE + VALUE },
    ...COMPS.map((x) => ({ k: x.item, mv: '543', mat: x.material, text: '외주처 재고 소비', qty: x.qty, val: x.qty * x.price })),
  ];
  return {
    app: '구매 문서 기준 입고 전기', appId: 'F0843', title: `구매 오더 ${n.po}`, gtitle: `입고 구매 오더 ${n.po}`,
    fields: [{ label: '구매 오더', value: n.po }, { label: '공급업체', value: SUPT }, { label: '납품서', value: `LS-${n.po.slice(-4)}`, help: 'deliveryNote' }, { label: '저장 위치', value: '101A', help: 'sloc' }],
    tables: [{ title: '품목 (자동 생성된 구성품 소비 포함)', rows, rowKey: (r) => r.k, cols: [
      { key: 'mv', label: '이동 유형', w: 60, render: (r) => <>{r.mv}{r.mv === '543' && <Help k="movementType" />}</> }, { key: 'm', label: '자재', w: 60, render: (r) => r.mat },
      { key: 't', label: '내역', w: 160, render: (r) => r.text }, { key: 'q', label: '수량', w: 70, align: 'right', render: (r) => `${r.qty} PC` },
      { key: 'v', label: '금액', w: 90, align: 'right', render: (r) => fmtAmt(r.val, c.currency) },
    ] }],
    footer: true, done: d('gr'), doneMsg: `자재 전표 ${jo(n.gr, '이')} 전기되었습니다 – SG23 ${QTY} PC 입고, 외주처의 RM13·RM14가 자동 소비(543)되었습니다.`,
    actions: [{ label: '전기', gui: '전기', disabled: d('gr'), onClick: () => s.mark('gr'), toast: `자재 전표 ${n.gr}` }],
    extra: d('gr') ? <JournalTable lines={[
      { acc: c.glInventory, text: `재고 ${MAT}`, dc: '차변', amt: COMP_VALUE + VALUE },
      { acc: '500000', text: '구성품 소비', dc: '대변', amt: COMP_VALUE },
      { acc: c.glGrir, text: 'GR/IR – 외주 가공비', dc: '대변', amt: VALUE },
    ]} /> : undefined,
  };
});

export const [reviewF, reviewG] = pair(() => {
  const { n, d, c } = use();
  const rows = COMPS.map((x) => ({ ...x, given: d('pgi') ? x.qty : 0, used: d('gr') ? x.qty : 0 }));
  return {
    app: '재고 - 다중 자재', appId: 'F1595', title: `외주처 ${SUP.no} 제공 자재 재고`, gtitle: '외주처에 제공된 자재 재고',
    tables: [{ title: '외주 재고', rows, rowKey: (r) => r.item, cols: [
      { key: 'm', label: '자재', w: 60, render: (r) => r.material }, { key: 'g', label: '제공(541)', w: 80, align: 'right', render: (r) => r.given },
      { key: 'u', label: '소비(543)', w: 80, align: 'right', render: (r) => r.used }, { key: 'b', label: '외주처 잔량', w: 90, align: 'right', render: (r) => r.given - r.used },
    ] }],
    info: `문서 흐름: PO ${n.po} → 납품 ${n.dlv} → 출고 ${n.pgi} → 입고 ${n.gr}. 외주처 재고가 0이 되어 정산이 맞습니다 (구성품 가치 ${fmtAmt(COMP_VALUE, c.currency)}).`,
    pdf: { label: '외주 PO 출력', title: `구매 오더 ${n.po}`, doc: <PrintDoc title="외주 구매 오더" titleEn="Subcontracting Purchase Order" partner={SUP} meta={[['구매 오더', n.po], ['납품', n.dlv]]} items={[{ ...poRow, extra: '구성품: RM13 1000 PC, RM14 1000 PC (제공)' }]} terms={[['품목 범주', 'L 외주']]} foot="제공된 구성품으로 가공하여 납기 내 납품해 주십시오." /> },
  };
});

export const [invoiceF, invoiceG] = pair(() => {
  const { s, n, d, c } = use();
  const added = !!s.vals.invAdded || d('invoice');
  return {
    app: '공급업체 송장 생성', appId: 'F0859', title: d('invoice') ? `공급업체 송장 ${n.inv}` : '공급업체 송장 생성', gtitle: `수신 송장 입력: 회사 코드 ${c.companyCode}`,
    kpis: [{ label: '총 금액', value: fmtAmt(VALUE, c.currency) }, { label: '잔액', value: fmtAmt(added ? 0 : VALUE, c.currency) }],
    fields: [{ label: '송장 발행처', value: SUPT, help: 'supplier' }, { label: '참조', value: `RE-${n.po.slice(-4)}`, help: 'reference' }, { label: '구매 오더 참조', value: n.po }, { label: '세금 코드', value: 'V0', help: 'taxCode' }],
    tables: [{ title: '송장 품목', rows: added ? [poRow] : [], rowKey: (r) => r.item, empty: "구매 오더를 '추가'하면 입고된 품목이 제안됩니다", cols: poCols(c.currency) }],
    done: d('invoice'), doneMsg: `공급업체 송장 ${n.inv}(회계 전표 ${n.invFi})${pc(n.inv, '이')} 전기되었습니다 – 외주 가공비만 청구되고 구성품 비용은 포함되지 않습니다.`,
    actions: [
      { label: '추가', gui: '↵ 적용', disabled: added, onClick: () => s.setVal('invAdded', true) },
      { label: '전기', gui: '💾 전기', disabled: !added || d('invoice'), onClick: () => s.mark('invoice'), toast: `송장 ${n.inv} 전기` },
    ],
    extra: added ? <JournalTable lines={[{ acc: c.glGrir, text: 'GR/IR 청산', dc: '차변', amt: VALUE }, { acc: c.glPayables, text: `공급업체 ${SUP.no}`, dc: '대변', amt: VALUE }]} /> : undefined,
  };
});
