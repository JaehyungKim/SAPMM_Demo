/** 1XF – Request for Price screens (Fiori + SAP GUI from one spec per step). */
import { addDays, fmtAmt, fmtDate, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { useOrg } from '../types';
import { autoLaunchpad, pair, type KCol } from '../shared/kit';
import { BEST, BIDDERS, MAT, MAT_TX, QTY, STEPS, TARGET, use1xf } from './store';

type Bidder = (typeof BIDDERS)[number];
const use = () => { const s = use1xf(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };
const itemRow = { k: '10', material: MAT, text: MAT_TX, qty: QTY };

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>가격 요청은 <b>RFQ 생성·게시</b> → <b>견적 입력</b> → <b>비교·낙찰</b> → <b>후속 문서(계약)</b> 순서입니다.</>);

export const [rfqF, rfqG] = pair(() => {
  const { s, n, d, c } = use();
  const saved = !!s.vals.saved || d('rfq');
  return {
    app: 'RFQ 관리', appId: 'F2049', title: saved ? `RFQ ${n.rfq} – Request for Price (1XF)` : '새 RFQ (Int. Sourcing Req.)', gtitle: saved ? `RFQ ${n.rfq} 변경` : 'RFQ 생성',
    status: d('rfq') ? ['Positive', '게시됨'] : saved ? ['Information', '저장됨'] : undefined,
    kpis: [{ label: '목표 금액', value: fmtAmt(TARGET, c.currency) }],
    fields: [
      { label: 'RFQ 내역', value: 'Request for Price (1XF)', help: 'rfq' }, { label: '견적 마감일', value: fmtDate(todayIso(), c.dateFormat) },
      { label: '구매 조직 / 그룹', value: `${c.purchasingOrg} / 001` }, { label: '후속 문서 유형', value: 'MK 수량 계약' },
      { label: '유효 기간', value: `${fmtDate(todayIso(), c.dateFormat)} ~ ${fmtDate(addDays(todayIso(), 30), c.dateFormat)}` },
      { label: '납품일', value: fmtDate(addDays(todayIso(), 60), c.dateFormat) },
    ],
    tables: [
      { title: '품목', rows: [itemRow], rowKey: (r) => r.k, cols: [
        { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 't', label: '내역', w: 240, render: (r) => r.text },
        { key: 'p', label: '플랜트', w: 60, render: () => c.plant }, { key: 'q', label: '요청 수량', w: 80, align: 'right', render: (r) => `${r.qty} PC` },
      ] },
      { title: '입찰자', rows: BIDDERS, rowKey: (r) => r.no, cols: [
        { key: 'n', label: '공급업체', w: 90, render: (r) => r.no }, { key: 'nm', label: '이름', w: 200, render: (r) => r.name },
      ] },
    ],
    footer: true, done: d('rfq'), doneMsg: `RFQ ${n.rfq}이(가) 게시되었습니다 – 자동 승인 워크플로를 거쳐 두 공급업체에 이메일로 발송되었습니다.`,
    actions: [
      { label: '저장', gui: '💾 저장', disabled: saved, onClick: () => s.setVal('saved', true), toast: `RFQ ${n.rfq} 저장` },
      { label: '게시', gui: '📤 게시', disabled: !saved || d('rfq'), onClick: () => s.mark('rfq'), toast: '게시 완료' },
    ],
  };
});

const qCols = (cur: string, nums: Record<string, string>, entered: (b: Bidder) => boolean): KCol<Bidder>[] => [
  { key: 'n', label: '입찰자', w: 200, render: (r) => `${r.name} (${r.no})` },
  { key: 'q', label: '견적', w: 100, render: (r) => (entered(r) ? (r === BIDDERS[0] ? nums.q1 : nums.q2) : '–') },
  { key: 'p', label: '순 가격', w: 80, align: 'right', render: (r) => (entered(r) ? fmtAmt(r.price, cur) : '') },
  { key: 'v', label: '견적 금액', w: 100, align: 'right', render: (r) => (entered(r) ? fmtAmt(r.price * QTY, cur) : '') },
  { key: 's', label: '상태', w: 80, render: (r) => (entered(r) ? '제출됨' : '대기') },
];

export const [quotesF, quotesG] = pair(() => {
  const { s, n, d, c } = use();
  const q1 = !!s.vals.q1 || d('quotes');
  const q2 = d('quotes');
  const entered = (b: Bidder) => (b === BIDDERS[0] ? q1 : q2);
  return {
    app: 'RFQ 관리', appId: 'F2049', title: `RFQ ${n.rfq} – 입찰자`, gtitle: `견적 유지보수: RFQ ${n.rfq}`,
    status: ['Positive', '게시됨'],
    fields: [{ label: '견적 제출일', value: fmtDate(todayIso(), c.dateFormat) }, { label: '자재 / 수량', value: `${MAT} / ${QTY} PC` }],
    tables: [{ title: '입찰자 · 견적', rows: BIDDERS, rowKey: (r) => r.no, cols: qCols(c.currency, n, entered) }],
    done: d('quotes'), doneMsg: '두 공급업체의 견적이 입력·제출되었습니다 – 이제 비교할 수 있습니다.',
    actions: [
      { label: `견적 생성·제출 (${BIDDERS[0].no})`, gui: `💾 견적 ${BIDDERS[0].no}`, disabled: q1, onClick: () => s.setVal('q1', true), toast: `견적 ${n.q1} 제출` },
      { label: `견적 생성·제출 (${BIDDERS[1].no})`, gui: `💾 견적 ${BIDDERS[1].no}`, disabled: !q1 || q2, onClick: () => s.mark('quotes'), toast: `견적 ${n.q2} 제출` },
    ],
  };
});

export const [displayF, displayG] = pair(() => {
  const { n, c } = use();
  return {
    app: 'RFQ 관리', appId: 'F2049', title: `RFQ ${n.rfq} – 견적`, gtitle: `RFQ ${n.rfq} 표시: 견적`,
    tables: [{ title: '견적 탭', rows: BIDDERS, rowKey: (r) => r.no, cols: qCols(c.currency, n, () => true) }],
    info: '이메일·우편으로 받은 견적을 RFQ에 직접 입력해 한곳에서 관리합니다.',
  };
});

export const [awardF, awardG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '공급업체 견적 비교', appId: 'F2324', title: `RFQ ${n.rfq} 견적 비교`, gtitle: '가격 비교 리스트',
    kpis: [{ label: '최저가', value: `${fmtAmt(BEST.price, c.currency)} (${BEST.no})` }, { label: '절감액', value: fmtAmt((BIDDERS[1].price - BEST.price) * QTY, c.currency) }],
    tables: [{ title: '견적 비교', rows: BIDDERS, rowKey: (r) => r.no, cols: [
      ...qCols(c.currency, n, () => true).slice(0, 4),
      { key: 'b', label: '평가', w: 110, render: (r) => (r === BEST ? <>★ 최저가 품목<Help k="award" /></> : '') },
      { key: 'a', label: '낙찰', w: 70, render: (r) => (d('award') && r === BEST ? '✔ 낙찰' : '') },
    ] }],
    done: d('award'), doneMsg: `견적 ${n.q1}이(가) 낙찰되었습니다 (자동 승인 워크플로). 다른 견적은 거절 처리됩니다.`,
    actions: [{ label: '낙찰', gui: '🏆 낙찰', disabled: d('award'), onClick: () => s.mark('award'), toast: '낙찰 완료' }],
  };
});

export const [followonF, followonG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '공급업체 견적 관리', appId: 'F1991', title: d('followon') ? `구매 계약 ${n.contract}` : `공급업체 견적 ${n.q1}`, gtitle: d('followon') ? `계약 ${n.contract} 표시` : '후속 문서 생성',
    status: d('followon') ? ['Positive', '계약 생성됨'] : ['Positive', '낙찰됨'],
    fields: [{ label: '공급업체', value: `${BEST.name} (${BEST.no})`, help: 'quotation' }, { label: '후속 문서', value: 'MK 수량 계약' }, { label: '단가', value: fmtAmt(BEST.price, c.currency) }, { label: '목표 수량', value: `${QTY} PC` }],
    tables: [{ title: '품목', rows: [itemRow], rowKey: (r) => r.k, cols: [
      { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 'q', label: '수량', w: 70, align: 'right', render: (r) => r.qty },
      { key: 'p', label: '계약 단가', w: 90, align: 'right', render: () => fmtAmt(BEST.price, c.currency) },
    ] }],
    footer: true, done: d('followon'), doneMsg: `구매 계약 ${n.contract}이(가) 견적 ${n.q1}을 참조해 생성되었습니다 – 이후 발주는 계약 단가로 처리됩니다.`,
    actions: [{ label: '구매 계약 생성', gui: '📄 계약 생성', disabled: d('followon'), onClick: () => s.mark('followon'), toast: `계약 ${n.contract}` }],
  };
});

export const [situationF, situationG] = pair(() => {
  const { s, n, d } = use();
  return {
    app: '내 상황', appId: 'F4154', title: `RFQ ${n.rfq} – 상황`, gtitle: '상황 처리: 견적 부족',
    status: d('situation') ? ['Positive', '해결됨'] : ['Critical', '열림'],
    tables: [{ title: '상황', rows: [{ k: '1' }], rowKey: (r) => r.k, cols: [
      { key: 't', label: '알림', w: 380, render: () => `RFQ ${n.rfq}이(가) 제출 마감일에 가깝습니다 – 받은 견적 수가 적습니다` },
      { key: 'r', label: '입찰 비율', w: 80, render: () => '50 %' },
    ] }],
    warn: d('situation') ? undefined : '조건: 입찰 비율 50% 미만 · 마감까지 30일 미만 → 구매 그룹 001 담당자에게 알림',
    done: d('situation'), doneMsg: '상황이 해결됨으로 닫혔습니다 – 같은 RFQ에 대해 다시 알림이 오지 않습니다.',
    actions: [{ label: '해제 (해결됨)', gui: '✔ 해제', disabled: d('situation'), onClick: () => s.mark('situation'), toast: '상황 해제' }],
  };
});
