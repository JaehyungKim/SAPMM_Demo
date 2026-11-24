/** BMK – Return to Supplier screens (Fiori + SAP GUI from one spec per step). */
import { fmtAmt, fmtDate, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { useOrg } from '../types';
import { autoLaunchpad, pair, type KCol } from '../shared/kit';
import { JournalTable, PrintDoc } from '../shared/ui';
import { ITEMS, MAT, MAT_TX, PRICE, RET_QTY, STEPS, SUP, useBmk } from './store';

type It = (typeof ITEMS)[number];
const SUPT = `${SUPPLIER()}`;
function SUPPLIER() { return `${SUP.name} (${SUP.no})`; }
const itemCols = (cur: string): KCol<It>[] => [
  { key: 'i', label: '품목', w: 40, render: (r) => r.item },
  { key: 'm', label: '자재', w: 70, render: (r) => r.material },
  { key: 't', label: '내역', w: 220, render: (r) => r.text },
  { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => `${r.qty} PC` },
  { key: 'p', label: '순 가격', w: 80, align: 'right', render: (r) => fmtAmt(r.price, cur) },
  { key: 'r', label: '반품 사유', w: 140, render: (r) => r.reason },
];
const use = () => { const s = useBmk(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>반품은 <b>반품 PO(ME21N)</b> → <b>납품(VL10B)</b> → <b>출고(VL02N)</b> → <b>대변 메모(MIRO)</b> 순서로 처리합니다.</>);

export const [stockF, stockG] = pair(() => {
  const { d, c } = use();
  const moved = d('transfer') ? RET_QTY : 0;
  const rows = [
    { sl: '101A', name: 'Std. storage 1', unr: 120 - moved, blk: 0 },
    { sl: '101R', name: 'Storage Location Returns', unr: moved, blk: 0 },
  ];
  return {
    app: '재고 - 단일 자재', appId: 'F1076', title: `${MAT} – ${MAT_TX}`, gtitle: '재고 개요: 기본 리스트',
    kpis: [{ label: '플랜트 가용 재고', value: '120 PC' }],
    fields: [{ label: '자재', value: MAT, help: 'material' }, { label: '플랜트', value: `${c.plant} ${c.plantName}`, help: 'plant' }, { label: '재주문점', value: '40 PC' }],
    tables: [{ title: '저장 위치별 재고', rows, rowKey: (r) => r.sl, cols: [
      { key: 's', label: '저장 위치', render: (r) => `${r.sl} ${r.name}` },
      { key: 'u', label: '가용 재고', align: 'right', render: (r) => `${r.unr} PC` },
      { key: 'b', label: '보류 재고', align: 'right', render: (r) => `${r.blk} PC` },
    ] }],
    info: '재주문점(40 PC)보다 재고가 충분하므로 반품 후 긴급 발주는 필요하지 않습니다.',
  };
});

export const [transferF, transferG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '재고 이전 - 플랜트 내', appId: 'F1061', title: `${MAT} 재고 이전`, gtitle: '이전 전기: 이동 유형 311',
    fields: [{ label: '자재', value: MAT, help: 'material' }, { label: '플랜트', value: c.plant }, { label: '보낸 곳', value: '101A Std. storage 1', help: 'sloc' }, { label: '받는 곳', value: '101R Storage Location Returns' }, { label: '수량', value: `${RET_QTY} PC` }],
    done: d('transfer'), doneMsg: `자재 전표 ${n.tr}이(가) 생성되었습니다 – 반품할 ${RET_QTY} PC가 반품 저장 위치 101R로 이동했습니다.`,
    footer: true,
    actions: [{ label: '전기', gui: '💾 전기', disabled: d('transfer'), onClick: () => s.mark('transfer'), toast: `자재 전표 ${n.tr} 생성`,
      confirm: { title: '재고 이전', label: '전기', fields: [{ label: '보낸 곳', value: '101A 가용 재고' }, { label: '받는 곳', value: '101R 가용 재고' }, { label: '수량', value: `${RET_QTY} PC` }, { label: '이동 유형', value: '311' }] } }],
  };
});

export const [retpoF, retpoG] = pair(() => {
  const { s, n, d, c } = use();
  const v = ITEMS.reduce((a, i) => a + i.qty * i.price, 0);
  return {
    app: '구매 오더 생성 - 고급', appId: 'ME21N', title: d('retpo') ? `반품 구매 오더 ${n.retpo}` : '구매 오더 생성', gtitle: d('retpo') ? `Enh.Ret.to Supplier ${n.retpo} 표시` : '구매 오더 생성',
    status: d('retpo') ? ['Positive', '저장됨'] : undefined, kpis: [{ label: '반품 금액', value: fmtAmt(v, c.currency) }],
    fields: [
      { label: '오더 유형', value: 'NB2 Enh.Ret.to Supplier', help: 'docType' }, { label: '공급업체', value: SUPT, help: 'supplier' },
      { label: '구매 조직 / 그룹', value: `${c.purchasingOrg} / 001` }, { label: '회사 코드', value: c.companyCode },
      { label: '플랜트 / 저장 위치', value: `${c.plant} / 101R`, help: 'sloc' }, { label: '반품 품목', value: '✓ 모든 품목', help: 'returnsItem' },
    ],
    tables: [{ title: '품목 개요', rows: ITEMS, rowKey: (r) => r.item, cols: [...itemCols(c.currency), { key: 'f', label: '후속 처리', w: 110, render: (r) => r.follow }] }],
    footer: true, done: d('retpo'), doneMsg: `반품 구매 오더 ${n.retpo}이(가) 생성되었습니다. 출하 담당자의 '납기 도래 구매 오더'에 바로 나타납니다.`,
    actions: [{ label: '저장', gui: '💾 저장', disabled: d('retpo'), onClick: () => s.mark('retpo'), toast: `반품 PO ${n.retpo} 생성` }],
  };
});

export const [deliveryF, deliveryG] = pair(() => {
  const { s, n, d } = use();
  return {
    app: '내 구매 오더 - 납기 도래', appId: 'VL10B', title: '납품 대상 구매 오더', gtitle: '납기 도래 활동: 구매 오더, 빠른 표시',
    fields: [{ label: '출하 지점', value: '101R', help: 'shippingPoint' }, { label: '납품 생성일', value: `~ ${fmtDate(todayIso(), useOrg().dateFormat)}` }, { label: '계산 규칙', value: '2' }, { label: '구매 문서', value: n.retpo }],
    tables: [{ title: '납기 도래 구매 오더', rows: ITEMS, rowKey: (r) => r.item, select: true, cols: [
      { key: 'po', label: '구매 문서', w: 90, render: () => n.retpo }, { key: 'i', label: '품목', w: 40, render: (r) => r.item },
      { key: 'm', label: '자재', w: 60, render: (r) => r.material }, { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => `${r.qty} PC` },
      { key: 'r', label: '수취인', w: 160, render: () => SUP.no }, { key: 'dl', label: '납품', w: 90, render: () => (d('delivery') ? n.dlv : '') },
    ] }],
    done: d('delivery'), doneMsg: `아웃바운드 납품 ${n.dlv}이(가) 생성되었습니다 (납품 생성 로그 → 문서).`,
    actions: [{ label: '백그라운드에서 납품 생성', gui: '⚙ 백그라운드', disabled: d('delivery'), onClick: () => s.mark('delivery'), toast: `납품 ${n.dlv} 생성` }],
  };
});

export const [pgiF, pgiG] = pair(() => {
  const { s, n, d, c } = use();
  const rows = ITEMS.map((i) => ({ ...i, picked: i.qty }));
  return {
    app: '아웃바운드 납품 변경', appId: 'VL02N', title: `반품(구매 오더) ${n.dlv}`, gtitle: `반품(구매 오더) ${n.dlv} 변경: 개요`,
    status: d('pgi') ? ['Positive', '출고 완료'] : ['Critical', '피킹 완료 · 출고 대기'],
    fields: [{ label: '납품', value: n.dlv }, { label: '수취인(공급업체)', value: SUPT, help: 'supplier' }, { label: '출하 지점', value: '101R', help: 'shippingPoint' }, { label: '이동 유형', value: '161 반품 (구매 오더)', help: 'movementType' }],
    tables: [{ title: '피킹', rows, rowKey: (r) => r.item, cols: [
      { key: 'i', label: '품목', w: 40, render: (r) => r.item }, { key: 'm', label: '자재', w: 60, render: (r) => r.material },
      { key: 'q', label: '납품 수량', w: 70, align: 'right', render: (r) => r.qty }, { key: 'p', label: '피킹 수량', w: 70, align: 'right', render: (r) => <>{r.picked}<Help k="pickedQty" /></> },
      { key: 's', label: '저장 위치', w: 60, render: () => '101R' },
    ] }],
    done: d('pgi'), doneMsg: <>출고가 전기되었습니다 – 자재 전표 {n.pgi}. 회계: <b>차변 GR/IR {fmtAmt(RET_QTY * PRICE, c.currency)} / 대변 재고</b>.</>,
    actions: [{ label: '출고 전기', gui: '🚚 출고 전기', disabled: d('pgi'), onClick: () => s.mark('pgi'), toast: `반품 ${n.dlv} 출고 전기` }],
    extra: d('pgi') ? <JournalTable lines={[{ acc: c.glGrir, text: 'GR/IR 청산 (반품)', dc: '차변', amt: RET_QTY * PRICE }, { acc: c.glInventory, text: `재고 ${MAT} (101R)`, dc: '대변', amt: RET_QTY * PRICE }]} /> : undefined,
  };
});

export const [monitorF, monitorG] = pair(() => {
  const { n, d, c } = use();
  const rows = ITEMS.map((i) => ({ ...i, out: d('pgi') ? i.qty : 0, cr: d('credit') && i.item === '10' ? i.qty : 0 }));
  return {
    app: '구매 오더 품목 모니터링', appId: 'F2358', title: '구매 오더 품목', gtitle: '자재별 구매 문서',
    fields: [{ label: '구매 오더', value: n.retpo }, { label: '표시 통화', value: c.currency }],
    tables: [{ title: '반품 PO 품목', rows, rowKey: (r) => r.item, cols: [
      { key: 'po', label: '구매 오더 / 품목', w: 120, render: (r) => `${n.retpo} / ${r.item}` }, { key: 'm', label: '자재', w: 60, render: (r) => r.material },
      { key: 'q', label: '반품 수량', w: 70, align: 'right', render: (r) => r.qty }, { key: 'o', label: '출고 완료', w: 70, align: 'right', render: (r) => r.out },
      { key: 'c', label: '대변 메모 수량', w: 80, align: 'right', render: (r) => r.cr }, { key: 'f', label: '후속', w: 100, render: (r) => r.follow },
    ] }],
    info: '반품 품목은 일반 PO와 같은 모니터에서 출고·대변 메모 진행 상황을 함께 확인합니다.',
  };
});

export const [creditF, creditG] = pair(() => {
  const { s, n, d, c } = use();
  const it = ITEMS[0];
  const amt = it.qty * it.price;
  const added = !!s.vals.creditAdded || d('credit');
  return {
    app: '공급업체 송장 생성', appId: 'F0859', title: d('credit') ? `대변 메모 ${n.credit}` : '공급업체 송장 생성', gtitle: '수신 대변 메모 입력: 회사 코드 ' + c.companyCode,
    kpis: [{ label: '총 금액', value: fmtAmt(amt, c.currency) }, { label: '잔액', value: fmtAmt(added ? 0 : amt, c.currency) }],
    fields: [
      { label: '거래', value: '대변 메모 (Credit Memo)', help: 'creditMemo' }, { label: '회사 코드', value: c.companyCode },
      { label: '송장 발행처', value: SUPT, help: 'supplier' }, { label: '참조', value: `CM-${n.retpo.slice(-4)}`, help: 'reference' },
      { label: '구매 오더 참조', value: n.retpo }, { label: '세금 코드', value: 'V0', help: 'taxCode' },
    ],
    tables: [{ title: '송장 품목', rows: added ? [it] : [], rowKey: (r) => r.item, empty: "구매 오더를 '추가'하면 반품 품목이 제안됩니다", cols: itemCols(c.currency) }],
    done: d('credit'), doneMsg: <>대변 메모 {n.credit}(회계 전표 {n.creditFi})이(가) 전기되었습니다 – 공급업체 채무가 {fmtAmt(amt, c.currency)} 줄었습니다.</>,
    actions: [
      { label: '추가', gui: '↵ 적용', disabled: added, onClick: () => s.setVal('creditAdded', true) },
      { label: '전기', gui: '💾 전기', disabled: !added || d('credit'), onClick: () => s.mark('credit'), toast: `대변 메모 ${n.credit} 전기` },
    ],
    extra: added ? <JournalTable lines={[{ acc: c.glPayables, text: `공급업체 ${SUP.no}`, dc: '차변', amt }, { acc: c.glGrir, text: 'GR/IR 청산 (반품)', dc: '대변', amt }]} /> : undefined,
  };
});

export const [replaceF, replaceG] = pair(() => {
  const { s, n, d } = use();
  const it = ITEMS[1];
  return {
    app: '대체 자재 수령 - 공급업체로부터', appId: 'MSR_VRM_GR', title: '공급업체 대체 자재 – 문서 선택', gtitle: '공급업체 대체 자재 수령',
    fields: [{ label: '반품 PO 유형', value: 'NB2' }, { label: '반품 구매 오더', value: n.retpo }, { label: '대체 수량', value: `${it.qty} PC` }, { label: '입고 저장 위치 / 재고 유형', value: '101A / S 보류 재고', help: 'stockType' }],
    tables: [{ title: '공급업체 / 구매 오더 / 품목', rows: [it], rowKey: (r) => r.item, select: true, cols: [
      { key: 'v', label: '공급업체', w: 80, render: () => SUP.no }, { key: 'po', label: '반품 PO / 품목', w: 120, render: (r) => `${n.retpo} / ${r.item}` },
      { key: 'q', label: '반품 수량', w: 70, align: 'right', render: (r) => r.qty }, { key: 'rq', label: '대체 수량', w: 70, align: 'right', render: (r) => r.qty },
      { key: 'rp', label: '대체 PO', w: 90, render: () => (d('replace') ? n.replpo : '') }, { key: 'ib', label: '인바운드 납품', w: 90, render: () => (d('replace') ? n.ibd : '') },
    ] }],
    done: d('replace'), doneMsg: `대체 구매 오더 ${n.replpo}이(가) 생성되었고 인바운드 납품 ${n.ibd}이(가) 자동 생성되었습니다 (반품 개요).`,
    actions: [{ label: '저장', gui: '💾 저장', disabled: d('replace'), onClick: () => s.mark('replace'), toast: `대체 PO ${n.replpo} 생성` }],
  };
});

export const [replgrF, replgrG] = pair(() => {
  const { s, n, d } = use();
  const it = ITEMS[1];
  return {
    app: '인바운드 납품 변경', appId: 'VL32N', title: `인바운드 납품 ${n.ibd}`, gtitle: `인바운드 납품 ${n.ibd} 변경: 개요`,
    status: d('replgr') ? ['Positive', '입고 완료'] : ['Information', '입고 대기'],
    fields: [{ label: '대체 구매 오더', value: n.replpo }, { label: '공급업체', value: SUPT }, { label: '저장 위치', value: '101A', help: 'sloc' }, { label: '재고 유형', value: 'S 보류 재고', help: 'stockType' }],
    tables: [{ title: '품목 개요', rows: [it], rowKey: (r) => r.item, cols: [
      { key: 'm', label: '자재', w: 60, render: (r) => r.material }, { key: 'q', label: '납품 수량', w: 70, align: 'right', render: (r) => r.qty },
      { key: 'p', label: '입고 처리 수량', w: 90, align: 'right', render: (r) => r.qty },
    ] }],
    done: d('replgr'), doneMsg: `인바운드 납품 ${n.ibd}에 대한 입고가 전기되었습니다 – 자재 전표 ${n.replgr} (보류 재고).`,
    actions: [{ label: '입고 전기', gui: '📥 입고 전기', disabled: d('replgr'), onClick: () => s.mark('replgr'), toast: `입고 ${n.replgr} 전기` }],
  };
});

export const [followupF, followupG] = pair(() => {
  const { s, n, d } = use();
  return {
    app: '내 후속 조치 - 대체 자재', appId: 'MSR_VRM_LFU', title: '인바운드 납품 문서 선택', gtitle: '물류 후속 조치: 대체 자재',
    fields: [{ label: '후속 조치 미확인 납품', value: '✓ 선택' }, { label: '납품', value: n.ibd }, { label: '후속 조치', value: '0011 가용 재고로 이전' }],
    tables: [{ title: '납품 품목', rows: [ITEMS[1]], rowKey: (r) => r.item, cols: [
      { key: 'd', label: '납품', w: 90, render: () => n.ibd }, { key: 'm', label: '자재', w: 60, render: (r) => r.material },
      { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty }, { key: 'f', label: '후속 조치', w: 160, render: () => (d('followup') ? '0011 가용 재고로 이전 ✓' : '–') },
    ] }],
    done: d('followup'), doneMsg: '물류 후속 조치가 저장되었습니다 – 검사 후 대체 자재가 가용 재고로 이전됩니다.',
    actions: [{ label: '저장 및 확인', gui: '💾 저장 및 확인', disabled: d('followup'), onClick: () => s.mark('followup'), toast: '후속 조치 저장' }],
  };
});

export const [invdocF, invdocG] = pair(() => {
  const { s, n, c } = use();
  const rows = [
    { k: '1', type: '출고 (161)', doc: n.pgi, qty: RET_QTY, val: RET_QTY * PRICE },
    ...(s.done.credit ? [{ k: '2', type: '대변 메모', doc: n.credit, qty: ITEMS[0].qty, val: ITEMS[0].qty * PRICE }] : []),
    { k: '3', type: '대체 입고 (101)', doc: n.replgr, qty: ITEMS[1].qty, val: ITEMS[1].qty * PRICE },
    { k: '4', type: '송장 검증 문서 (금액 0)', doc: n.ivdoc, qty: ITEMS[1].qty, val: 0 },
  ];
  return {
    app: '구매 오더 관리', appId: 'F0842A', title: `반품 구매 오더 ${n.retpo} – 반품 개요`, gtitle: `반품 개요: 반품 구매 오더 ${n.retpo}`,
    tables: [{ title: '반품 개요', rows, rowKey: (r) => r.k, cols: [
      { key: 't', label: '문서 유형', w: 160, render: (r) => r.type }, { key: 'd', label: '문서 번호', w: 100, render: (r) => r.doc },
      { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty }, { key: 'v', label: '금액', w: 100, align: 'right', render: (r) => fmtAmt(r.val, c.currency) },
    ] }],
    info: `대체 입고 시 시스템이 금액 0의 송장 검증 문서(${n.ivdoc})를 자동 생성해 반품 PO의 대변 메모와 대체 PO의 송장을 동시에 처리하고 GR/IR을 맞춥니다.`,
    pdf: { label: '반품 오더 출력', title: `반품 구매 오더 ${n.retpo}`, doc: <PrintDoc title="반품 구매 오더" titleEn="Returns Purchase Order" partner={SUP} meta={[['반품 PO', n.retpo], ['납품', n.dlv]]} items={ITEMS} terms={[['반품 사유', '잘못된 자재 / 품질 불합격']]} foot="반품 물품을 수령한 뒤 대변 메모 또는 대체 자재를 보내 주십시오." /> },
  };
});
