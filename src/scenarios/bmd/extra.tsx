/**
 * BMD – additional optional steps: contract template & reference contract, expiry alert
 * monitoring, mass change of contracts, PO approval and partial GR reversal.
 */
import { jo, pc } from '../../josa';
import { daysBetween, fmtAmt, fmtDate, todayIso } from '../../format';
import { useOrg } from '../types';
import { pair } from '../shared/kit';
import { JournalTable } from '../shared/ui';
import { CONTRACT_PRICE, MATS, NB_ITEMS, PO_APPROVAL_LIMIT, REF_SUPPLIER, REVERSAL, RV_ITEMS, SUPPLIER, nextYearEnd, useBmd } from './store';

const SUP = `${SUPPLIER.name} (${SUPPLIER.no})`;
const mat = (m: string) => MATS[m as keyof typeof MATS];

export const [referenceF, referenceG] = pair(() => {
  const s = useBmd();
  const c = useOrg();
  const done = !!s.ext.reference;
  const rows = RV_ITEMS.map((r) => ({ ...r, text: mat(r.material) }));
  return {
    app: '구매 계약 관리', appId: 'F1600A', title: done ? `계약 ${s.numbers.refContract} (템플릿 참조)` : `계약 ${s.numbers.contract} → 템플릿으로 저장`, gtitle: done ? `계약 ${s.numbers.refContract} 표시` : '계약 생성: 참조 계약 지정',
    status: done ? ['Positive', '활성'] : ['Information', '템플릿 저장됨'],
    fields: [
      { label: '템플릿 원본', value: `계약 ${s.numbers.contract}`, help: 'template' }, { label: '템플릿 이름', value: 'TG10/TG11 연간 수량 계약' },
      { label: '새 공급업체', value: `${REF_SUPPLIER.name} (${REF_SUPPLIER.no})`, help: 'supplier' }, { label: '단가', value: fmtAmt(REF_SUPPLIER.price, c.currency) },
      { label: '유효 기간', value: `${fmtDate(todayIso(), c.dateFormat)} ~ ${fmtDate(s.contract?.validTo ?? todayIso(), c.dateFormat)}`, help: 'validity' },
    ],
    tables: [{ title: '템플릿에서 복사된 품목', rows, rowKey: (r) => r.item, cols: [
      { key: 'i', label: '품목', w: 40, render: (r) => r.item }, { key: 'm', label: '자재', w: 60, render: (r) => r.material },
      { key: 't', label: '내역', w: 220, render: (r) => r.text }, { key: 'q', label: '목표 수량', w: 80, align: 'right', render: (r) => r.target },
      { key: 'p0', label: '원 계약 단가', w: 90, align: 'right', render: () => fmtAmt(CONTRACT_PRICE, c.currency) },
      { key: 'p', label: '새 단가', w: 80, align: 'right', render: () => fmtAmt(REF_SUPPLIER.price, c.currency) },
    ] }],
    footer: true, done, doneMsg: `계약 ${jo(s.numbers.refContract, '이')} 템플릿을 참조해 생성되었습니다 – 두 번째 공급원이 확보되었습니다.`,
    actions: [{ label: '참조 계약 생성', gui: '💾 저장', disabled: done, onClick: s.createReference, toast: `계약 ${s.numbers.refContract}` }],
  };
});

export const [notifyF, notifyG] = pair(() => {
  const s = useBmd();
  const c = useOrg();
  const to = s.contract?.validTo ?? todayIso();
  const left = daysBetween(todayIso(), to);
  const rows = [
    { k: '1', type: '만료 예정', text: `계약 ${jo(s.numbers.contract, '이')} ${left}일 후 만료됩니다`, sev: left <= 60 ? '높음' : '보통' },
    { k: '2', type: '소진율', text: `TG11 목표 수량의 ${Math.round(((s.contract?.items[1]?.released ?? 0) / RV_ITEMS[1].target) * 100)}% 릴리스됨`, sev: '정보' },
  ];
  return {
    app: '구매 계약 관리 – 알림', appId: 'F1600A', title: '내 계약 알림', gtitle: '아웃라인 계약 분석: 만료 예정',
    kpis: [{ label: '만료까지', value: `${left}일` }, { label: '유효 종료', value: fmtDate(to, c.dateFormat) }],
    tables: [{ title: '알림', rows, rowKey: (r) => r.k, cols: [
      { key: 't', label: '유형', w: 80, render: (r) => r.type }, { key: 'x', label: '내용', w: 320, render: (r) => r.text }, { key: 's', label: '중요도', w: 60, render: (r) => r.sev },
    ] }],
    info: s.ext.mass ? `일괄 변경으로 유효 기간이 ${fmtDate(nextYearEnd(), c.dateFormat)}까지 연장되었습니다.` : '만료가 다가오면 시스템이 알림을 보냅니다 – 다음 단계에서 유효 기간을 일괄 연장할 수 있습니다.',
  };
});

export const [massF, massG] = pair(() => {
  const s = useBmd();
  const c = useOrg();
  const done = !!s.ext.mass;
  const rows = [
    { no: s.numbers.contract, sup: SUP },
    ...(s.ext.reference ? [{ no: s.numbers.refContract, sup: `${REF_SUPPLIER.name} (${REF_SUPPLIER.no})` }] : []),
  ];
  return {
    app: '구매 계약 일괄 변경', appId: 'F2667', title: '구매 계약 일괄 변경', gtitle: '구매 계약 일괄 변경',
    fields: [{ label: '변경 필드', value: '유효 종료일 (EKKO-KDATE)' }, { label: '새 값', value: fmtDate(nextYearEnd(), c.dateFormat) }, { label: '변경 사유', value: '연간 계약 갱신' }],
    tables: [{ title: '대상 계약', rows, rowKey: (r) => r.no, select: true, cols: [
      { key: 'n', label: '계약', w: 100, render: (r) => r.no }, { key: 's', label: '공급업체', w: 220, render: (r) => r.sup },
      { key: 'v', label: '유효 종료', w: 100, render: () => fmtDate(s.contract?.validTo ?? todayIso(), c.dateFormat) },
    ] }],
    done, doneMsg: `일괄 변경 작업 ${jo(s.numbers.job, '이')} 완료되었습니다 – 선택한 계약의 유효 기간이 연장되었습니다.`,
    actions: [{ label: '일괄 변경 적용', gui: '▶ 실행 (F8)', disabled: done, onClick: s.massExtend, toast: `작업 ${s.numbers.job}` }],
  };
});

export const [poapproveF, poapproveG] = pair(() => {
  const s = useBmd();
  const c = useOrg();
  const done = !!s.ext.poapprove;
  const items = NB_ITEMS.map((n) => ({ ...n, text: mat(n.material) }));
  const v = items.reduce((a, i) => a + i.qty * CONTRACT_PRICE, 0);
  return {
    app: '내 받은 편지함', appId: 'F0862', title: `구매 오더 ${s.numbers.po} 승인`, gtitle: 'Business Workplace – PURCHASING_MANAGER',
    status: done ? ['Positive', '승인됨'] : ['Critical', '승인 대기'],
    fields: [{ label: '공급업체', value: SUP }, { label: '순 금액', value: fmtAmt(v, c.currency) }, { label: '승인 규칙', value: `구매 그룹 001 · ${PO_APPROVAL_LIMIT} EUR 초과` }, { label: '참조 계약', value: s.numbers.contract }],
    tables: [{ title: '품목', rows: items, rowKey: (r) => r.item, cols: [
      { key: 'm', label: '자재', w: 60, render: (r) => r.material }, { key: 't', label: '내역', w: 220, render: (r) => r.text },
      { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty }, { key: 'p', label: '계약 단가', w: 80, align: 'right', render: () => fmtAmt(CONTRACT_PRICE, c.currency) },
    ] }],
    done, doneMsg: `구매 오더 ${jo(s.numbers.po, '이')} 승인되어 공급업체에 발송되었습니다 – 입고가 가능합니다.`,
    actions: [{ label: '승인', gui: '✔ 릴리스(승인)', disabled: done, onClick: s.approvePO, toast: '승인 완료' }],
  };
});

export const [reverseF, reverseG] = pair(() => {
  const s = useBmd();
  const c = useOrg();
  const done = !!s.ext.reverse;
  const amt = REVERSAL.qty * CONTRACT_PRICE;
  const rows = NB_ITEMS.map((n) => ({ ...n, posted: n.qty, rev: n.item === REVERSAL.item ? REVERSAL.qty : 0 }));
  return {
    app: '구매 문서 기준 입고 전기', appId: 'F0843', title: `자재 전표 ${s.gr?.docNo ?? ''} 취소`, gtitle: `역분개 자재 전표 ${s.gr?.docNo ?? ''}`,
    fields: [{ label: '자재 전표', value: s.gr?.docNo ?? '–' }, { label: '구매 오더', value: s.numbers.po }, { label: '이동 유형', value: '102 입고 역분개', help: 'reversal' }, { label: '사유', value: '0001 파손 · 오입고' }],
    tables: [{ title: '역분개할 품목 (부분)', rows, rowKey: (r) => r.item, cols: [
      { key: 'm', label: '자재', w: 60, render: (r) => r.material }, { key: 'p', label: '입고 수량', w: 80, align: 'right', render: (r) => r.posted },
      { key: 'r', label: '역분개 수량', w: 90, align: 'right', render: (r) => r.rev }, { key: 'n', label: '순 입고 수량', w: 90, align: 'right', render: (r) => r.posted - (done ? r.rev : 0) },
    ] }],
    footer: true, done, doneMsg: `자재 전표 ${s.numbers.revDoc}(102)${pc(s.numbers.revDoc, '이')} 전기되었습니다 – 송장은 순 입고 수량 기준으로 제안됩니다.`,
    actions: [{ label: '역분개 전기', gui: '전기', disabled: done || !s.gr, onClick: s.reverseGR, toast: `자재 전표 ${s.numbers.revDoc}` }],
    extra: done ? <JournalTable lines={[{ acc: c.glGrir, text: 'GR/IR 청산 (역분개)', dc: '차변', amt }, { acc: c.glInventory, text: `재고 ${REVERSAL.material}`, dc: '대변', amt }]} /> : undefined,
  };
});
