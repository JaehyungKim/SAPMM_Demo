/**
 * BNX – additional optional steps: redistribute workload, limit item, invoicing plan and
 * invoice reduction.
 */
import { jo, pc } from '../../josa';
import { addDays, fmtAmt, fmtDate, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { useOrg } from '../types';
import { pair } from '../shared/kit';
import { JournalTable } from '../shared/ui';
import { ITEM10, LIMIT_ITEM, PLAN, PURCH_GROUP, SUPPLIER, useBnx } from './store';

const SUP = `${SUPPLIER.name} (${SUPPLIER.no})`;

export const [workloadF, workloadG] = pair(() => {
  const s = useBnx();
  const done = !!s.ext.workload;
  const rows = [
    { g: '001', open: done ? 37 : 38, mine: !done },
    { g: PURCH_GROUP, open: done ? 10 : 9, mine: done },
  ];
  return {
    app: '구매 담당자 업무량 관리', appId: 'F2504', title: '구매 그룹별 미결 구매 요청', gtitle: '구매 요청 재배정',
    tables: [{ title: '구매 그룹', rows, rowKey: (r) => r.g, cols: [
      { key: 'g', label: '구매 그룹', w: 100, render: (r) => r.g }, { key: 'o', label: '미결 구매 요청', w: 110, align: 'right', render: (r) => r.open },
      { key: 'm', label: `구매 요청 ${s.numbers.pr}`, w: 140, render: (r) => (r.mine ? '● 배정됨' : '') },
    ] }],
    warn: done ? undefined : '구매 그룹 001 담당자가 휴가 중이라 미결 요청이 쌓여 있습니다.',
    done, doneMsg: `구매 요청 ${jo(s.numbers.pr, '이')} 구매 그룹 ${jo(PURCH_GROUP, '로')} 재배분되었습니다.`,
    actions: [{ label: '재배분', gui: '↪ 재배정', disabled: done, onClick: () => s.markExt('workload', `구매 요청이 구매 그룹 ${jo(PURCH_GROUP, '로')} 재배정되었습니다`), toast: '재배분 완료',
      confirm: { title: '업무량 재배분', label: '재배분 확정', fields: [{ label: '구매 요청', value: s.numbers.pr }, { label: '현재 그룹', value: '001' }, { label: '새 그룹', value: PURCH_GROUP }] } }],
  };
});

export const [limitF, limitG] = pair(() => {
  const s = useBnx();
  const c = useOrg();
  const done = !!s.ext.limit;
  const rows = [
    ...(s.po?.items ?? [ITEM10]).map((i) => ({ item: i.item, type: '표준', text: i.text, val: i.qty * i.price, acct: i.acct })),
    ...(done ? [{ item: LIMIT_ITEM.item, type: 'Limit', text: LIMIT_ITEM.text, val: LIMIT_ITEM.expected, acct: `K · ${LIMIT_ITEM.cc}` }] : []),
  ];
  return {
    app: '구매 오더 관리', appId: 'F0842A', title: `구매 오더 ${s.numbers.po}`, gtitle: `표준 PO ${s.numbers.po} 변경`,
    fields: [
      { label: '품목 유형', value: 'Limit 품목 (Lean Services)', help: 'limitItem' },
      { label: '예상 금액', value: fmtAmt(LIMIT_ITEM.expected, c.currency), help: 'expectedValue' },
      { label: '전체 한도', value: fmtAmt(LIMIT_ITEM.overall, c.currency), help: 'overallLimit' },
      { label: '계정 지정', value: `K 코스트 센터 ${LIMIT_ITEM.cc}`, help: 'acctAssign' },
    ],
    tables: [{ title: '품목', rows, rowKey: (r) => r.item, cols: [
      { key: 'i', label: '품목', w: 40, render: (r) => r.item }, { key: 't', label: '유형', w: 60, render: (r) => <>{r.type}{r.type === 'Limit' && <Help k="limitItem" />}</> },
      { key: 'x', label: '내역', w: 240, render: (r) => r.text }, { key: 'v', label: '금액', w: 90, align: 'right', render: (r) => fmtAmt(r.val, c.currency) },
      { key: 'a', label: '계정 지정', w: 150, render: (r) => r.acct },
    ] }],
    footer: true, done, doneMsg: `Limit 품목 ${jo(LIMIT_ITEM.item, '이')} 추가되었습니다 – 내용을 미리 알 수 없는 비용을 한도 ${fmtAmt(LIMIT_ITEM.overall, c.currency)} 안에서 허용합니다.`,
    actions: [{ label: 'Limit 품목 추가 및 저장', gui: '💾 저장', disabled: done || !s.po, onClick: () => s.markExt('limit', `표준 PO ${jo(s.numbers.po, '이')} 변경되었습니다`), toast: 'Limit 품목 추가' }],
  };
});

export const [invplanF, invplanG] = pair(() => {
  const s = useBnx();
  const c = useOrg();
  const saved = !!s.ext.invplanPo;
  const done = !!s.ext.invplan;
  const dates = Array.from({ length: PLAN.months }, (_, i) => ({ k: String(i + 1), date: fmtDate(addDays(todayIso(), i * 30), c.dateFormat), st: done && i === 0 ? `송장 ${s.numbers.planInv}` : i === 0 ? '정산 대상' : '예정' }));
  return {
    app: '구매 오더 관리', appId: 'F0842A', title: saved ? `구매 오더 ${s.numbers.planPo} – 송장 계획` : '새 구매 오더 – 송장 계획', gtitle: '송장 계획 정산 (MRIS)',
    kpis: [{ label: '월 금액', value: fmtAmt(PLAN.monthly, c.currency) }, { label: '연 금액', value: fmtAmt(PLAN.monthly * PLAN.months, c.currency) }],
    fields: [
      { label: '품목', value: PLAN.text }, { label: '공급업체', value: SUP },
      { label: '송장 계획 유형', value: '01 정기 송장 계획 (월)', help: 'invoicingPlan' }, { label: '계정 지정', value: `K 코스트 센터 ${PLAN.cc}` },
    ],
    tables: [{ title: '송장 계획 일정', rows: saved ? dates : [], rowKey: (r) => r.k, empty: '저장하면 월별 송장 일정이 만들어집니다', cols: [
      { key: 'n', label: '회차', w: 40, render: (r) => r.k }, { key: 'd', label: '정산일', w: 90, render: (r) => r.date },
      { key: 'v', label: '금액', w: 80, align: 'right', render: () => fmtAmt(PLAN.monthly, c.currency) }, { key: 's', label: '상태', w: 120, render: (r) => r.st },
    ] }],
    footer: true, done, doneMsg: `정산 실행으로 송장 ${s.numbers.planInv}(1회차 ${fmtAmt(PLAN.monthly, c.currency)})${pc(s.numbers.planInv, '이')} 자동 생성되었습니다 – 공급업체 송장 없이 매달 자동 처리됩니다 (ERS).`,
    actions: [
      { label: '저장', gui: '💾 저장', disabled: saved, onClick: () => s.markExt('invplanPo', `표준 PO ${jo(s.numbers.planPo, '이')} 생성되었습니다`), toast: `PO ${s.numbers.planPo}` },
      { label: '정산 실행', gui: '▶ 정산 실행 (MRIS)', disabled: !saved || done, onClick: () => s.markExt('invplan', `송장 계획 정산: 송장 ${jo(s.numbers.planInv, '이')} 생성되었습니다`), toast: `송장 ${s.numbers.planInv}` },
    ],
  };
});

export const [reduceF, reduceG] = pair(() => {
  const s = useBnx();
  const c = useOrg();
  const added = !!s.ext.reduceAdded || !!s.ext.reduce;
  const done = !!s.ext.reduce;
  const over = LIMIT_ITEM.billed - LIMIT_ITEM.overall;
  const rows = added ? [{ k: LIMIT_ITEM.item, text: LIMIT_ITEM.text, billed: LIMIT_ITEM.billed, ok: LIMIT_ITEM.overall }] : [];
  return {
    app: '공급업체 송장 생성', appId: 'F0859', title: done ? `공급업체 송장 ${s.numbers.inv2}` : '공급업체 송장 생성 – Limit 품목', gtitle: `수신 송장 입력: 회사 코드 ${c.companyCode}`,
    kpis: [{ label: '청구 금액', value: fmtAmt(LIMIT_ITEM.billed, c.currency) }, { label: '허용 한도', value: fmtAmt(LIMIT_ITEM.overall, c.currency) }],
    fields: [{ label: '송장 발행처', value: SUP }, { label: '구매 오더', value: `${s.numbers.po} / ${LIMIT_ITEM.item}` }, { label: '송장 축소', value: added ? '✓ 한도 초과분 축소' : '–', help: 'invReduction' }],
    tables: [{ title: '송장 품목', rows, rowKey: (r) => r.k, empty: "구매 오더를 '추가'하면 Limit 품목이 제안됩니다", cols: [
      { key: 't', label: '내역', w: 240, render: (r) => r.text }, { key: 'b', label: '공급업체 청구', w: 100, align: 'right', render: (r) => fmtAmt(r.billed, c.currency) },
      { key: 'o', label: '정확한 금액', w: 100, align: 'right', render: (r) => fmtAmt(r.ok, c.currency) }, { key: 'r', label: '축소 금액', w: 90, align: 'right', render: () => fmtAmt(over, c.currency) },
    ] }],
    warn: added && !done ? `청구 금액이 전체 한도를 ${fmtAmt(over, c.currency)} 초과합니다 – 송장 축소로 한도 금액만 전기하고 초과분은 대변 메모로 공급업체에 통지합니다.` : undefined,
    done, doneMsg: `송장 ${s.numbers.inv2}(${fmtAmt(LIMIT_ITEM.overall, c.currency)})${pc(s.numbers.inv2, '와')} 자동 대변 메모 ${s.numbers.cm}(${fmtAmt(over, c.currency)})${pc(s.numbers.cm, '이')} 전기되었습니다.`,
    actions: [
      { label: '추가', gui: '↵ 적용', disabled: added, onClick: () => s.markExt('reduceAdded', `한도 초과 ${over} ${c.currency} – 송장 축소가 제안되었습니다`) },
      { label: '전기', gui: '💾 전기', disabled: !added || done, onClick: () => s.markExt('reduce', `전표 ${s.numbers.inv2} 및 대변 메모 ${jo(s.numbers.cm, '이')} 생성되었습니다`), toast: `송장 ${s.numbers.inv2}` },
    ],
    extra: added ? <JournalTable lines={[
      { acc: LIMIT_ITEM.gl, text: '기타 서비스 비용', dc: '차변', amt: LIMIT_ITEM.overall, cc: LIMIT_ITEM.cc },
      { acc: c.glPayables, text: `공급업체 ${SUPPLIER.no}`, dc: '대변', amt: LIMIT_ITEM.overall },
    ]} /> : undefined,
  };
});
