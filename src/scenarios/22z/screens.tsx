/** 22Z – Procurement of Services screens (Fiori + SAP GUI from one spec per step). */
import { addDays, fmtAmt, fmtDate, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { useOrg } from '../types';
import { autoLaunchpad, pair, type KCol } from '../shared/kit';
import { JournalTable } from '../shared/ui';
import { CC, GROUP, LIMIT, PO_VALUE, SES_VALUE, STEPS, SUP, SVC, SVC_VALUE, use22z } from './store';

const SUPT = `${SUP.name} (${SUP.no})`;
const use = () => { const s = use22z(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };
interface Row { item: string; type: string; text: string; qty: string; price: string; value: number; acct: string }
const rowsFor = (cur: string, actual = false): Row[] => [
  { item: SVC.item, type: '서비스', text: `${SVC.material} ${SVC.text}`, qty: `${SVC.qty} ${SVC.unit}`, price: fmtAmt(SVC.price, cur), value: SVC_VALUE, acct: CC.map((c) => `${c.cc} ${c.pct}%`).join(' / ') },
  { item: LIMIT.item, type: 'Limit', text: LIMIT.text, qty: '–', price: actual ? '실적' : `예상 ${fmtAmt(LIMIT.expected, cur)}`, value: actual ? LIMIT.actual : LIMIT.expected, acct: CC[0].cc },
];
const cols = (cur: string): KCol<Row>[] => [
  { key: 'i', label: '품목', w: 40, render: (r) => r.item },
  { key: 't', label: '품목 유형', w: 70, render: (r) => <>{r.type}{r.type === 'Limit' && <Help k="limitItem" />}</> },
  { key: 'x', label: '내역', w: 220, render: (r) => r.text },
  { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty },
  { key: 'p', label: '가격', w: 110, align: 'right', render: (r) => r.price },
  { key: 'v', label: '금액', w: 90, align: 'right', render: (r) => fmtAmt(r.value, cur) },
  { key: 'a', label: '계정 지정 (K)', w: 170, render: (r) => r.acct },
];

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>서비스 조달은 <b>계약</b> → <b>구매 요청(ME51N)</b> → <b>PO</b> → <b>서비스 입력 시트(ML81N)</b> → <b>송장(MIRO)</b> 순서입니다.</>);

export const [contractF, contractG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 계약 관리', appId: 'F1600A', title: d('contract') ? `계약 ${n.contract}` : '새 구매 계약', gtitle: d('contract') ? `가치 계약 ${n.contract} 표시` : '계약 생성: 초기 화면',
    status: d('contract') ? ['Positive', '활성'] : undefined,
    fields: [
      { label: '계약 유형', value: 'WK 가치 계약', help: 'contractType' }, { label: '공급업체', value: SUPT, help: 'supplier' },
      { label: '구매 그룹', value: GROUP, help: 'purchGroup' }, { label: '목표 금액', value: fmtAmt(5000, c.currency), help: 'targetValue' },
      { label: '유효 기간', value: `${fmtDate(todayIso(), c.dateFormat)} ~ ${fmtDate(addDays(todayIso(), 365), c.dateFormat)}`, help: 'validity' },
    ],
    tables: [{ title: '품목', rows: [{ item: '10', m: SVC.material, t: SVC.text, p: SVC.price }], rowKey: (r) => r.item, cols: [
      { key: 'i', label: '품목', w: 40, render: (r) => r.item }, { key: 'm', label: '서비스', w: 70, render: (r) => r.m },
      { key: 't', label: '내역', w: 220, render: (r) => r.t }, { key: 'p', label: '단가 / H', w: 80, align: 'right', render: (r) => fmtAmt(r.p, c.currency) },
    ] }],
    footer: true, done: d('contract'), doneMsg: `서비스 계약 ${n.contract}이(가) 생성되었습니다 – 구매 요청의 공급원으로 자동 결정됩니다.`,
    actions: [{ label: '생성', gui: '💾 저장', disabled: d('contract'), onClick: () => s.mark('contract'), toast: `계약 ${n.contract} 생성` }],
  };
});

export const [prF, prG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 요청 관리 - 전문가용', appId: 'F2229', title: d('pr') ? `구매 요청 ${n.pr}` : '새 구매 요청', gtitle: d('pr') ? `구매 요청 ${n.pr} 표시` : '구매 요청 생성',
    kpis: [{ label: '예상 금액', value: fmtAmt(PO_VALUE, c.currency) }],
    fields: [
      { label: '공급원', value: d('contract') ? `계약 ${n.contract}` : SUPT, help: 'source' }, { label: '구매 그룹', value: GROUP, help: 'purchGroup' },
      { label: '계정 지정 범주', value: 'K 코스트 센터 (다중: 70/30)', help: 'acctAssign' },
      { label: 'Limit 품목 예상 금액', value: fmtAmt(LIMIT.expected, c.currency), help: 'expectedValue' },
      { label: 'Limit 품목 전체 한도', value: fmtAmt(LIMIT.overall, c.currency), help: 'overallLimit' },
      { label: '서비스 기간', value: `${fmtDate(todayIso(), c.dateFormat)} ~ ${fmtDate(addDays(todayIso(), 30), c.dateFormat)}` },
    ],
    tables: [{ title: '품목', rows: rowsFor(c.currency), rowKey: (r) => r.item, cols: cols(c.currency) }],
    footer: true, done: d('pr'), doneMsg: `구매 요청 ${n.pr}이(가) 생성되었습니다. 서비스 품목과 Limit 품목이 함께 요청되었습니다.`,
    actions: [{ label: '생성', gui: '💾 저장', disabled: d('pr'), onClick: () => s.mark('pr'), toast: `구매 요청 ${n.pr}` }],
  };
});

export const [autopoF, autopoG] = pair(() => {
  const { s, n, d } = use();
  return {
    app: '구매 작업 예약 - PO 자동 생성', appId: 'F1702', title: '새 작업: 구매 요청에서 구매 오더 자동 생성', gtitle: '구매 요청에서 구매 오더 자동 생성',
    status: d('autopo') ? ['Positive', '완료'] : undefined,
    fields: [{ label: '작업 템플릿', value: '구매 오더 자동 생성' }, { label: '구매 그룹', value: GROUP }, { label: '구매 요청', value: n.pr }, { label: '실행 시점', value: '즉시 시작' }],
    tables: [{ title: '작업 로그', rows: d('autopo') ? [{ k: '1' }] : [], rowKey: (r) => r.k, empty: '아직 실행된 작업이 없습니다', cols: [
      { key: 'j', label: '작업', w: 80, render: () => n.job }, { key: 'pr', label: '구매 요청', w: 90, render: () => n.pr },
      { key: 'po', label: '생성된 PO', w: 100, render: () => n.po }, { key: 's', label: '상태', w: 80, render: () => '완료' },
    ] }],
    footer: true, done: d('autopo'), doneMsg: `작업 ${n.job}이(가) 완료되었습니다 – 구매 오더 ${n.po}이(가) 자동 생성되었습니다. 다음 단계(PO 생성)는 이미 완료 상태입니다.`,
    actions: [{ label: '예약', gui: '▶ 실행 (F8)', disabled: d('autopo') || d('po'), onClick: () => s.mark(['autopo', 'po']), toast: `작업 ${n.job} 예약` }],
  };
});

export const [poF, poG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 요청 처리', appId: 'F1048A', title: d('po') ? `구매 오더 ${n.po}` : `구매 요청 ${n.pr}`, gtitle: d('po') ? `표준 PO ${n.po} 표시` : '구매 요청 지정 및 처리',
    status: d('po') ? ['Positive', d('autopo') ? '자동 생성됨' : '오더됨'] : ['Information', '공급원 지정됨'],
    kpis: [{ label: 'PO 금액', value: fmtAmt(PO_VALUE, c.currency) }],
    fields: [{ label: '공급업체', value: SUPT }, { label: '구매 그룹', value: GROUP }, { label: '승인 규칙', value: '구매 그룹 003 · 1,000 EUR 초과' }],
    tables: [{ title: '품목', rows: rowsFor(c.currency), rowKey: (r) => r.item, cols: cols(c.currency) }],
    footer: true, done: d('po'), doneMsg: `서비스 구매 오더 ${n.po}이(가) 생성되었습니다. 금액 ${fmtAmt(PO_VALUE, c.currency)}로 승인 워크플로가 시작되었습니다.`,
    actions: [{ label: '구매 오더 생성', gui: '📄 구매 오더 생성', disabled: d('po'), onClick: () => s.mark('po'), toast: `PO ${n.po}` }],
  };
});

export const [approveF, approveG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '내 받은 편지함', appId: 'F0862', title: `구매 오더 ${n.po} 릴리스`, gtitle: 'Business Workplace – PURCHASING_MANAGER',
    status: d('approve') ? ['Positive', '승인됨'] : ['Critical', '승인 대기'],
    fields: [{ label: '작업', value: `구매 오더 ${n.po} 릴리스` }, { label: '공급업체', value: SUPT }, { label: '순 금액', value: fmtAmt(PO_VALUE, c.currency) }],
    tables: [{ title: '품목', rows: rowsFor(c.currency), rowKey: (r) => r.item, cols: cols(c.currency) }],
    done: d('approve'), doneMsg: `구매 오더 ${n.po}이(가) 승인되어 공급업체에 발송되었습니다.`,
    actions: [{ label: '승인', gui: '✔ 릴리스(승인)', disabled: d('approve'), onClick: () => s.mark('approve'), toast: '승인 완료' }],
  };
});

export const [sesF, sesG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '서비스 입력 시트 관리 - Lean Services', appId: 'F2027', title: d('ses') ? `서비스 입력 시트 ${n.ses}` : '새 서비스 입력 시트', gtitle: '서비스 입력 시트 유지보수',
    status: d('ses') ? ['Critical', '승인 대기'] : undefined,
    kpis: [{ label: '실적 금액', value: fmtAmt(SES_VALUE, c.currency) }],
    fields: [{ label: '구매 오더', value: n.po }, { label: '공급업체', value: SUPT }, { label: '서비스 수행 기간', value: `${fmtDate(todayIso(), c.dateFormat)}` }, { label: '내역', value: '1차 유지보수 완료', help: 'ses' }],
    tables: [{ title: '수행된 서비스', rows: rowsFor(c.currency, true), rowKey: (r) => r.item, cols: cols(c.currency) }],
    info: `Limit 품목 실적 ${fmtAmt(LIMIT.actual, c.currency)}은(는) 전체 한도 ${fmtAmt(LIMIT.overall, c.currency)} 안이라 그대로 입력됩니다.`,
    footer: true, done: d('ses'), doneMsg: `서비스 입력 시트 ${n.ses}이(가) 승인 요청되었습니다 (1,000 EUR 초과 → ${'구매 관리자'} 승인).`,
    actions: [{ label: '승인 요청', gui: '💾 저장 · 승인 요청', disabled: d('ses'), onClick: () => s.mark('ses'), toast: `SES ${n.ses}` }],
  };
});

export const [sesapproveF, sesapproveG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '내 받은 편지함', appId: 'F0862', title: `서비스 입력 시트 ${n.ses} 승인`, gtitle: 'Business Workplace – PURCHASING_MANAGER',
    status: d('sesapprove') ? ['Positive', '승인됨'] : ['Critical', '승인 대기'],
    fields: [{ label: '서비스 입력 시트', value: n.ses }, { label: '구매 오더', value: n.po }, { label: '금액', value: fmtAmt(SES_VALUE, c.currency) }],
    tables: [{ title: '수행된 서비스', rows: rowsFor(c.currency, true), rowKey: (r) => r.item, cols: cols(c.currency) }],
    done: d('sesapprove'), doneMsg: `서비스 입력 시트가 승인되었습니다 – 서비스 입고(자재 전표 ${n.gr})가 자동 전기되어 코스트 센터에 비용이 반영되었습니다.`,
    actions: [{ label: '승인', gui: '✔ 승인', disabled: d('sesapprove'), onClick: () => s.mark('sesapprove'), toast: 'SES 승인' }],
    extra: d('sesapprove') ? <JournalTable lines={[
      { acc: '61008000', text: '외부 서비스', dc: '차변', amt: SVC_VALUE * 0.7 + LIMIT.actual, cc: CC[0].cc },
      { acc: '61008000', text: '외부 서비스', dc: '차변', amt: SVC_VALUE * 0.3, cc: CC[1].cc },
      { acc: c.glGrir, text: 'GR/IR 청산', dc: '대변', amt: SES_VALUE },
    ]} /> : undefined,
  };
});

export const [sescheckF, sescheckG] = pair(() => {
  const { n, c } = use();
  const flow = [
    { k: '1', t: '구매 요청', no: n.pr }, { k: '2', t: '구매 오더', no: n.po }, { k: '3', t: '서비스 입력 시트', no: n.ses }, { k: '4', t: '자재 전표 (서비스 입고)', no: n.gr },
  ];
  return {
    app: '서비스 입력 시트 관리 - Lean Services', appId: 'F2027', title: `서비스 입력 시트 ${n.ses}`, gtitle: `서비스 입력 시트 ${n.ses} 표시`,
    status: ['Positive', '승인됨'], kpis: [{ label: '승인 금액', value: fmtAmt(SES_VALUE, c.currency) }, { label: 'Limit 잔여', value: fmtAmt(LIMIT.overall - LIMIT.actual, c.currency) }],
    tables: [{ title: '문서 흐름', rows: flow, rowKey: (r) => r.k, cols: [{ key: 't', label: '문서', w: 200, render: (r) => r.t }, { key: 'n', label: '번호', w: 120, render: (r) => r.no }] }],
    info: 'Limit 품목은 남은 한도 안에서 추가 서비스 입력 시트를 계속 받을 수 있습니다.',
  };
});

export const [invoiceF, invoiceG] = pair(() => {
  const { s, n, d, c } = use();
  const added = !!s.vals.invAdded || d('invoice');
  return {
    app: '공급업체 송장 생성', appId: 'F0859', title: d('invoice') ? `공급업체 송장 ${n.inv}` : '공급업체 송장 생성', gtitle: `수신 송장 입력: 회사 코드 ${c.companyCode}`,
    kpis: [{ label: '총 금액', value: fmtAmt(SES_VALUE, c.currency) }, { label: '잔액', value: fmtAmt(added ? 0 : SES_VALUE, c.currency) }],
    fields: [{ label: '송장 발행처', value: SUPT }, { label: '참조', value: `SRV-${n.po.slice(-4)}`, help: 'reference' }, { label: '구매 오더 참조', value: n.po }, { label: '지급 보류', value: 'R 수동 보류 (서비스 품질 확인)', help: 'paymentBlock' }],
    tables: [{ title: '송장 품목 (서비스 입력 시트 기준)', rows: added ? rowsFor(c.currency, true) : [], rowKey: (r) => r.item, empty: "구매 오더를 '추가'하면 승인된 서비스 입력 시트가 제안됩니다", cols: cols(c.currency) }],
    done: d('invoice'), doneMsg: `송장 ${n.inv}(회계 전표 ${n.invFi})이(가) 지급 보류 상태로 전기되었습니다.`,
    actions: [
      { label: '추가', gui: '↵ 적용', disabled: added, onClick: () => s.setVal('invAdded', true) },
      { label: '전기', gui: '💾 전기', disabled: !added || d('invoice'), onClick: () => s.mark('invoice'), toast: `송장 ${n.inv} 전기` },
    ],
  };
});

export const [releaseF, releaseG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '공급업체 송장 관리', appId: 'F0859A', title: `송장 ${n.inv}`, gtitle: '차단된 송장 릴리스',
    status: d('release') ? ['Positive', '지급 가능'] : ['Negative', '지급 보류'],
    tables: [{ title: '차단된 송장', rows: [{ k: '1' }], rowKey: (r) => r.k, select: true, cols: [
      { key: 'i', label: '송장', w: 100, render: () => n.inv }, { key: 'v', label: '공급업체', w: 160, render: () => SUP.no },
      { key: 'a', label: '금액', w: 90, align: 'right', render: () => fmtAmt(SES_VALUE, c.currency) }, { key: 'b', label: '보류 사유', w: 120, render: () => (d('release') ? '–' : 'R 수동') },
    ] }],
    done: d('release'), doneMsg: '지급 보류가 해제되었습니다 – 다음 지급 실행에 포함됩니다.',
    actions: [{ label: '지급 보류 해제', gui: '✔ 릴리스', disabled: d('release'), onClick: () => s.mark('release'), toast: '보류 해제' }],
  };
});
