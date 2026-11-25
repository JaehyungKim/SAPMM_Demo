/** 18J – Requisitioning screens (Fiori + SAP GUI from one spec per step). */
import { jo, pc } from '../../josa';
import { addDays, fmtAmt, fmtDate, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { ROLE_USER } from '../../steps';
import { useOrg } from '../types';
import { autoLaunchpad, pair, type KCol } from '../shared/kit';
import { JournalTable } from '../shared/ui';
import { GROUP, ITEM, SPLIT, STEPS, STOCK, SUP, VALUE, use18j } from './store';

const SUPT = `${SUP.name} (${SUP.no})`;
const use = () => { const s = use18j(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };
const itemCols = (cur: string): KCol<typeof ITEM>[] => [
  { key: 'i', label: '품목', w: 40, render: (r) => r.item },
  { key: 'm', label: '자재', w: 70, render: (r) => r.material },
  { key: 't', label: '내역', w: 200, render: (r) => r.text },
  { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => `${r.qty} ${r.unit}` },
  { key: 'p', label: '가격', w: 80, align: 'right', render: (r) => fmtAmt(r.price, cur) },
  { key: 'a', label: '계정 지정 (K)', w: 170, render: () => SPLIT.map((x) => `${x.cc} ${x.pct}%`).join(' / ') },
];
const prItem = (d: (k: string) => boolean, c: ReturnType<typeof useOrg>) => [{ ...ITEM, deliv: fmtDate(addDays(todayIso(), d('masschange') ? 10 : 7), c.dateFormat) }];

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>현업 직원이 <b>셀프서비스 구매 요청</b>을 만들고, 관리자 승인 → 구매 담당자 PO → <b>요청자 입고 확인</b> → 송장 순서로 처리됩니다.</>);

export const [catalogF, catalogG] = pair(() => {
  const { s, d, c } = use();
  return {
    app: '카탈로그 품목 관리', appId: 'F3149', title: '카탈로그 품목', gtitle: '카탈로그 콘텐츠 관리',
    fields: [{ label: '카탈로그', value: 'OFFICE 사무용품', help: 'catalog' }, { label: '공급업체', value: SUPT }, { label: '구매 그룹', value: GROUP }],
    tables: [{ title: '카탈로그 품목', rows: [ITEM], rowKey: (r) => r.item, cols: [
      { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 't', label: '내역', w: 200, render: (r) => r.text },
      { key: 'p', label: '가격', w: 80, align: 'right', render: (r) => fmtAmt(r.price, c.currency) },
      { key: 's', label: '상태', w: 80, render: () => (d('catalog') ? '게시됨' : '초안') },
    ] }],
    done: d('catalog'), doneMsg: '카탈로그 품목이 게시되었습니다 – 직원들이 셀프서비스 구매 요청에서 바로 고를 수 있습니다.',
    actions: [{ label: '게시', gui: '📤 게시', disabled: d('catalog'), onClick: () => s.mark('catalog'), toast: '카탈로그 게시' }],
  };
});

export const [prF, prG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 요청 생성', appId: 'F1643A', title: d('pr') ? `구매 요청 ${n.pr}` : '장바구니', gtitle: d('pr') ? `구매 요청 ${n.pr} 표시` : '구매 요청 생성',
    sub: `${ROLE_USER.Employee.name} · 셀프서비스`,
    status: d('pr') ? ['Critical', '승인 대기'] : undefined,
    kpis: [{ label: '장바구니 금액', value: fmtAmt(VALUE, c.currency) }],
    fields: [
      { label: '요청자', value: ROLE_USER.Employee.name }, { label: '납품 주소', value: `${c.plant} ${c.plantName}` },
      { label: '계정 지정', value: 'K 코스트 센터 – 40 / 60 배분', help: 'distribution' }, { label: '공급업체 (카탈로그)', value: SUPT },
    ],
    tables: [{ title: '장바구니', rows: [ITEM], rowKey: (r) => r.item, cols: itemCols(c.currency) }],
    footer: true, done: d('pr'), doneMsg: `구매 요청 ${jo(n.pr, '이')} 주문되었습니다 – 금액이 승인 한도를 넘어 부서 관리자에게 승인 요청이 갔습니다.`,
    actions: [{ label: '주문', gui: '💾 저장', disabled: d('pr'), onClick: () => s.mark('pr'), toast: `구매 요청 ${n.pr}` }],
  };
});

export const [masschangeF, masschangeG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 요청 일괄 변경', appId: 'F2594', title: '구매 요청 일괄 변경', gtitle: '구매 요청 일괄 변경',
    fields: [{ label: '변경 필드', value: '납품일' }, { label: '새 값', value: fmtDate(addDays(todayIso(), 10), c.dateFormat) }, { label: '대상', value: `구매 요청 ${n.pr} 외 미결 요청` }],
    tables: [{ title: '대상 구매 요청 품목', rows: prItem(d, c), rowKey: (r) => r.item, select: true, cols: [
      { key: 'pr', label: '구매 요청', w: 90, render: () => n.pr }, { key: 'm', label: '자재', w: 70, render: (r) => r.material },
      { key: 'dl', label: '납품일', w: 90, render: (r) => r.deliv },
    ] }],
    done: d('masschange'), doneMsg: `일괄 변경 작업 ${jo(n.job, '이')} 완료되었습니다 – 납품일이 변경되었습니다.`,
    actions: [{ label: '일괄 변경 적용', gui: '▶ 실행 (F8)', disabled: d('masschange'), onClick: () => s.mark('masschange'), toast: `작업 ${n.job}` }],
  };
});

export const [prmonitorF, prmonitorG] = pair(() => {
  const { n, d, c } = use();
  const st = d('po') ? 'PO 생성됨' : d('prapprove') ? '승인됨' : '승인 대기';
  return {
    app: '구매 요청 품목 모니터링', appId: 'F2422', title: '구매 요청 품목', gtitle: '구매 요청 목록',
    tables: [{ title: '구매 요청 품목', rows: prItem(d, c), rowKey: (r) => r.item, cols: [
      { key: 'pr', label: '구매 요청 / 품목', w: 110, render: () => `${n.pr} / 10` }, { key: 'm', label: '자재', w: 70, render: (r) => r.material },
      { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty }, { key: 'dl', label: '납품일', w: 90, render: (r) => r.deliv },
      { key: 's', label: '처리 상태', w: 110, render: () => st }, { key: 'v', label: '금액', w: 90, align: 'right', render: () => fmtAmt(VALUE, c.currency) },
    ] }],
    info: '구매 담당자는 승인 대기·처리 지연된 요청을 여기서 찾아 요청자와 조율합니다.',
  };
});

export const [prapproveF, prapproveG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '내 받은 편지함 - 구매 요청 승인', appId: 'F0401', title: `구매 요청 ${n.pr} 승인`, gtitle: '구매 요청 릴리스',
    sub: `${ROLE_USER.Manager.name} · 부서 관리자`,
    status: d('prapprove') ? ['Positive', '승인됨'] : ['Critical', '승인 대기'],
    fields: [{ label: '요청자', value: ROLE_USER.Employee.name }, { label: '금액', value: fmtAmt(VALUE, c.currency) }, { label: '코스트 센터', value: SPLIT.map((x) => x.cc).join(', ') }],
    tables: [{ title: '품목', rows: [ITEM], rowKey: (r) => r.item, cols: itemCols(c.currency) }],
    done: d('prapprove'), doneMsg: `구매 요청 ${jo(n.pr, '이')} 승인되었습니다 – 구매 부서의 작업 목록에 나타납니다.`,
    actions: [{ label: '승인', gui: '✔ 릴리스', disabled: d('prapprove'), onClick: () => s.mark('prapprove'), toast: '승인 완료' }],
  };
});

export const [workloadF, workloadG] = pair(() => {
  const { s, n, d } = use();
  const rows = [
    { g: '001', name: '구매 그룹 001', open: d('workload') ? 41 : 42, mine: !d('workload') },
    { g: GROUP, name: '구매 그룹 003', open: d('workload') ? 13 : 12, mine: d('workload') },
  ];
  return {
    app: '구매 담당자 업무량 관리', appId: 'F2504', title: '구매 그룹별 미결 업무량', gtitle: '구매 요청 재배정',
    tables: [{ title: '구매 그룹', rows, rowKey: (r) => r.g, cols: [
      { key: 'g', label: '구매 그룹', w: 120, render: (r) => r.name }, { key: 'o', label: '미결 구매 요청', w: 100, align: 'right', render: (r) => r.open },
      { key: 'm', label: `구매 요청 ${n.pr}`, w: 120, render: (r) => (r.mine ? '● 배정됨' : '') },
    ] }],
    warn: d('workload') ? undefined : '구매 그룹 001에 미결 요청이 몰려 있습니다.',
    done: d('workload'), doneMsg: `구매 요청 ${jo(n.pr, '이')} 구매 그룹 003으로 재배분되었습니다.`,
    actions: [{ label: '재배분', gui: '↪ 재배정', disabled: d('workload'), onClick: () => s.mark('workload'), toast: '재배분 완료',
      confirm: { title: '구매 요청 재배분', label: '재배분 확정', fields: [{ label: '구매 요청', value: n.pr }, { label: '현재', value: '001' }, { label: '새 구매 그룹', value: GROUP }] } }],
  };
});

export const [poF, poG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 요청 처리', appId: 'F1048A', title: d('po') ? `구매 오더 ${n.po}` : `구매 요청 ${n.pr}`, gtitle: d('po') ? `표준 PO ${n.po} 표시` : '구매 요청 지정 및 처리',
    status: d('po') ? ['Positive', '오더됨'] : ['Information', '공급원 지정됨 (카탈로그)'],
    kpis: [{ label: 'PO 금액', value: fmtAmt(VALUE, c.currency) }],
    fields: [{ label: '공급업체', value: SUPT }, { label: '구매 그룹', value: GROUP }, { label: '요청자', value: ROLE_USER.Employee.name }],
    tables: [{ title: '품목', rows: [ITEM], rowKey: (r) => r.item, cols: itemCols(c.currency) }],
    footer: true, done: d('po'), doneMsg: `구매 오더 ${jo(n.po, '이')} 생성되었습니다.`,
    actions: [{ label: '구매 오더 생성', gui: '📄 구매 오더 생성', disabled: d('po'), onClick: () => s.mark('po'), toast: `PO ${n.po}` }],
  };
});

export const [poapproveF, poapproveG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '내 받은 편지함', appId: 'F0862', title: `구매 오더 ${n.po} 릴리스`, gtitle: 'Business Workplace – PURCHASING_MANAGER',
    status: d('poapprove') ? ['Positive', '승인됨'] : ['Critical', '승인 대기'],
    fields: [{ label: '공급업체', value: SUPT }, { label: '금액', value: fmtAmt(VALUE, c.currency) }],
    tables: [{ title: '품목', rows: [ITEM], rowKey: (r) => r.item, cols: itemCols(c.currency) }],
    done: d('poapprove'), doneMsg: `구매 오더 ${jo(n.po, '이')} 승인되어 공급업체에 발송되었습니다.`,
    actions: [{ label: '승인', gui: '✔ 릴리스(승인)', disabled: d('poapprove'), onClick: () => s.mark('poapprove'), toast: '승인 완료' }],
  };
});

export const [confirmF, confirmG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '물품·서비스 수령 확인', appId: 'F4489', title: '내 구매 요청 – 수령 확인', gtitle: '입고 확인',
    sub: `${ROLE_USER.Employee.name} · 셀프서비스`,
    tables: [{ title: '수령 대기 품목', rows: [ITEM], rowKey: (r) => r.item, cols: [
      ...itemCols(c.currency).slice(1, 4), { key: 'po', label: '구매 오더', w: 90, render: () => n.po },
      { key: 's', label: '상태', w: 90, render: () => (d('confirm') ? '수령 확인됨' : '배송 중') },
    ] }],
    done: d('confirm'), doneMsg: `수령이 확인되었습니다 – 입고(자재 전표 ${n.gr})가 자동 전기되어 코스트 센터에 비용이 반영되었습니다.`,
    actions: [{ label: '확인', gui: '✔ 수령 확인', disabled: d('confirm'), onClick: () => s.mark('confirm'), toast: `자재 전표 ${n.gr}` }],
    extra: d('confirm') ? <JournalTable lines={[
      ...SPLIT.map((x) => ({ acc: '61002000', text: '사무용품 비용', dc: '차변' as const, amt: VALUE * x.pct / 100, cc: x.cc })),
      { acc: c.glGrir, text: 'GR/IR 청산', dc: '대변', amt: VALUE },
    ]} /> : undefined,
  };
});

export const [invoiceF, invoiceG] = pair(() => {
  const { s, n, d, c } = use();
  const added = !!s.vals.invAdded || d('invoice');
  return {
    app: '공급업체 송장 생성', appId: 'F0859', title: d('invoice') ? `공급업체 송장 ${n.inv}` : '공급업체 송장 생성', gtitle: `수신 송장 입력: 회사 코드 ${c.companyCode}`,
    kpis: [{ label: '총 금액', value: fmtAmt(VALUE, c.currency) }, { label: '잔액', value: fmtAmt(added ? 0 : VALUE, c.currency) }],
    fields: [{ label: '송장 발행처', value: SUPT }, { label: '참조', value: `INV-${n.po.slice(-4)}`, help: 'reference' }, { label: '구매 오더 참조', value: n.po }],
    tables: [{ title: '송장 품목', rows: added ? [ITEM] : [], rowKey: (r) => r.item, empty: "구매 오더를 '추가'하면 입고된 품목이 제안됩니다", cols: itemCols(c.currency) }],
    done: d('invoice'), doneMsg: `공급업체 송장 ${n.inv}(회계 전표 ${n.invFi})${pc(n.inv, '이')} 전기되었습니다.`,
    actions: [
      { label: '추가', gui: '↵ 적용', disabled: added, onClick: () => s.setVal('invAdded', true) },
      { label: '전기', gui: '💾 전기', disabled: !added || d('invoice'), onClick: () => s.mark('invoice'), toast: `송장 ${n.inv}` },
    ],
  };
});

export const [reserveF, reserveG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 요청 생성', appId: 'F1643A', title: d('reserve') ? `예약 ${n.rsv}` : '장바구니 – 재고 자재', gtitle: '예약 생성',
    sub: `${ROLE_USER.Employee.name} · 셀프서비스`,
    fields: [{ label: '자재', value: `${STOCK.material} ${STOCK.text}`, help: 'material' }, { label: '수량', value: `${STOCK.qty} ${STOCK.unit}` }, { label: '코스트 센터', value: SPLIT[0].cc, help: 'costCenter' }, { label: '공급 방식', value: '창고 재고 (예약)', help: 'reservation' }],
    tables: [{ title: '장바구니', rows: [STOCK], rowKey: (r) => r.material, cols: [
      { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 't', label: '내역', w: 200, render: (r) => r.text },
      { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => `${r.qty} ${r.unit}` }, { key: 'a', label: '가용 재고', w: 80, align: 'right', render: () => '250 PC' },
      { key: 'r', label: '예약', w: 80, render: () => (d('reserve') ? n.rsv : '') },
    ] }],
    footer: true, done: d('reserve'), doneMsg: `창고에 재고가 있어 구매 요청 대신 예약 ${jo(n.rsv, '이')} 자동 생성되었습니다.`,
    actions: [{ label: '주문', gui: '💾 저장', disabled: d('reserve'), onClick: () => s.mark('reserve'), toast: `예약 ${n.rsv} (${c.plant})` }],
  };
});

export const [giF, giG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '재고 이동 전기', appId: 'F0843', title: `예약 ${n.rsv} 출고`, gtitle: `출고 예약 ${n.rsv}`,
    fields: [{ label: '예약', value: n.rsv }, { label: '이동 유형', value: '201 코스트 센터 출고', help: 'movementType' }, { label: '코스트 센터', value: SPLIT[0].cc }, { label: '저장 위치', value: c.storageLocation, help: 'sloc' }],
    tables: [{ title: '품목', rows: [STOCK], rowKey: (r) => r.material, cols: [
      { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => `${r.qty} ${r.unit}` },
      { key: 'ok', label: '품목 OK', w: 60, render: () => '✓' },
    ] }],
    footer: true, done: d('gi'), doneMsg: <>자재 전표 {n.gi}{pc(n.gi, '이')} 전기되었습니다 – 재고가 줄고 코스트 센터 {SPLIT[0].cc}에 비용이 전기되었습니다.<Help k="reservation" /></>,
    actions: [{ label: '전기', gui: '전기', disabled: d('gi'), onClick: () => s.mark('gi'), toast: `자재 전표 ${n.gi}` }],
  };
});
