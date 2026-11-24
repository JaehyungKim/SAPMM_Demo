/** BNX – Consumable Purchasing: Fiori and SAP GUI screens for every step (BNX_DE test script). */
import { useState } from 'react';
import { Dialog, MessageStrip } from '@ui5/webcomponents-react';
import type { StepProps } from '../../steps/types';
import { ROLE_USER } from '../../steps';
import { useScenarioNav } from '../../scenarioContext';
import { fmtAmt, fmtDate, fmtNum } from '../../format';
import {
  FBtn, FilterBar, FioriShell, FooterBar, FormGroup, FTable, FVal, PageHeader, Section, Status, showToast, FLink,
} from '../../components/fiori/Fiori';
import { GBtn, GField, GGroup, GTable, GuiWindow } from '../../components/gui/Gui';
import { Help } from '../../components/Help';
import { isOptOn, useOrg } from '../types';
import {
  GrFiori, GrGui, GrSlipDoc, InboxFiori, InboxGui, InvoiceFiori, InvoiceGui, JournalTable, LaunchpadFiori, LaunchpadGui, MatDocFiori, MatDocGui, itemsValue,
  type JournalLine, type MenuNode,
} from '../shared/ui';
import { ITEM10, ITEM20, PURCH_GROUP, SUPPLIER, useBnx, type BnxItem } from './store';

const SUP = `${SUPPLIER.name} (${SUPPLIER.no})`;

/** Expense posting per account-assignment line (consumables are not stocked). */
function useJournal(kind: 'gr' | 'inv'): JournalLine[] {
  const s = useBnx();
  const c = useOrg();
  const items = s.po?.items ?? [];
  const qty = (i: BnxItem) => s.gr?.qty[i.item] ?? i.qty;
  const total = items.reduce((a, i) => a + qty(i) * i.price, 0);
  if (kind === 'inv') return [
    { acc: c.glGrir, text: 'GR/IR 청산', dc: '차변', amt: total },
    { acc: c.glPayables, text: `공급업체 ${SUPPLIER.no} (매입채무)`, dc: '대변', amt: total },
  ];
  return [
    ...items.flatMap((i) => i.split.map((x) => ({ acc: i.gl, text: i.gl === '51600000' ? '소모품 비용 (자재 번호)' : '사무용품 비용 (자재 그룹 YBMM00)', dc: '차변' as const, amt: Math.round(qty(i) * i.price * x.pct) / 100, cc: x.cc }))),
    { acc: c.glGrir, text: 'GR/IR 청산', dc: '대변', amt: total },
  ];
}

/* ============================================================ 0 Launchpad */
export function LaunchpadF({ step }: StepProps) {
  const s = useBnx();
  return <LaunchpadFiori step={step} spaces={{
    구매: [
      { section: '운영 구매', tiles: [
        { title: '구매 요청 관리 - 전문가용', sub: 'Manage Purchase Requisitions - Professional', icon: 'request', to: 'pr' },
        { title: '구매 요청 처리', sub: 'Process Purchase Requisitions', icon: 'activity-items', to: 'po', kpi: s.pr === 'Created' ? 1 : 0, foot: '미결' },
        { title: '구매 오더 관리', sub: 'Manage Purchase Orders', icon: 'sales-document', to: 'additem' },
        { title: '구매 오더 일괄 변경', sub: 'Mass Changes to Purchase Orders', icon: 'edit', to: 'mass' },
        { title: '업무량 재배분', sub: 'Manage Workload of Purchasers', icon: 'org-chart', to: 'workload' },
        { title: 'Limit 품목 추가', sub: 'Manage Purchase Orders - Limit Item', icon: 'expense-report', to: 'limit' },
        { title: '송장 계획', sub: 'Manage Purchase Orders - Invoicing Plan', icon: 'calendar', to: 'invplan' },
      ] },
      { section: '승인', tiles: [{ title: '내 받은 편지함', sub: 'My Inbox - All Items', icon: 'inbox', to: s.invoice?.blocked ? 'release' : 'approve', kpi: (s.po?.status === 'Pending' ? 1 : 0) + (s.invoice?.blocked ? 1 : 0), foot: '작업' }] },
    ],
    '재고 처리': [{ section: '입고', tiles: [
      { title: '구매 문서에 대한 입고 전기', sub: 'Post Goods Receipt for Purchasing Document', icon: 'shipping-status', to: 'gr' },
      { title: '자재 전표 개요', sub: 'Material Documents Overview', icon: 'documents', to: 'slip' },
    ] }],
    매입채무: [{ section: '송장 처리', tiles: [
      { title: '공급업체 송장 생성', sub: 'Create Supplier Invoice', icon: 'request', to: 'invoice' },
      { title: '송장 축소 (Limit 품목)', sub: 'Create Supplier Invoice - Reduction', icon: 'receipt', to: 'reduce' },
      { title: '계정 지정별 구매 오더 품목', sub: 'Purchase Order Items by Account Assignment', icon: 'monitor-payments', to: 'monitor' },
    ] }],
  }} />;
}

const TREE: MenuNode[] = [{ id: 'sap', label: 'SAP 메뉴', children: [{ id: 'mm', label: '자재 관리 (MM)', children: [
  { id: 'pur', label: '구매', children: [
    { id: 'req', label: '구매 요청', children: [{ id: 'me51n', label: '생성', tcode: 'ME51N', to: 'pr' }, { id: 'me57', label: '지정 및 처리', tcode: 'ME57', to: 'po' }] },
    { id: 'po', label: '구매 오더', children: [
      { id: 'me22n', label: '변경', tcode: 'ME22N', to: 'additem' }, { id: 'mass', label: '일괄 변경', tcode: 'MEMASSPO', to: 'mass' },
      { id: 'me2k', label: '계정 지정별 리스트', tcode: 'ME2K', to: 'monitor' },
      { id: 'lim', label: 'Limit 품목 추가', tcode: 'ME22N_LIM', to: 'limit' }, { id: 'mris', label: '송장 계획 정산', tcode: 'MRIS', to: 'invplan' },
      { id: 'me5w', label: '구매 요청 재배정', tcode: 'ME5W', to: 'workload' },
    ] },
  ] },
  { id: 'im', label: '재고 관리', children: [{ id: 'migo', label: '자재 이동', tcode: 'MIGO', to: 'gr' }, { id: 'mb90', label: '자재 전표 출력', tcode: 'MB90', to: 'slip' }] },
  { id: 'liv', label: '물류 송장 검증', children: [{ id: 'miro', label: '수신 송장 입력', tcode: 'MIRO', to: 'invoice' }, { id: 'mrbr', label: '차단된 송장 릴리스', tcode: 'MRBR', to: 'release' }, { id: 'red', label: '송장 축소', tcode: 'MIRO_RED', to: 'reduce' }] },
] }, { id: 'wf', label: '사무실', children: [{ id: 'sbwp', label: '비즈니스 워크플레이스', tcode: 'SBWP', to: 'approve' }] }] }];

export const LaunchpadG = ({ step }: StepProps) => <LaunchpadGui step={step} tree={TREE} hint={<>소모품은 계정 지정 <b>K</b>(코스트 센터)로 구매해 재고 없이 바로 비용 처리됩니다. 예: <b>ME51N</b>, <b>MIGO</b>, <b>MIRO</b>.</>} />;

/* ============================================================ 1 Purchase requisition */
const itemCols = (c: ReturnType<typeof useOrg>) => [
  { key: 'i', label: '품목', render: (i: BnxItem) => i.item },
  { key: 'm', label: '자재 / 내역', render: (i: BnxItem) => <><b>{i.text}</b><div className="f-muted">{i.material || `자재 그룹 ${i.matGroup}`}</div></> },
  { key: 'q', label: '수량', align: 'right' as const, render: (i: BnxItem) => `${i.qty} ${i.unit}` },
  { key: 'p', label: '순 가격', align: 'right' as const, render: (i: BnxItem) => fmtAmt(i.price, c.currency) },
  { key: 'a', label: '계정 지정', render: (i: BnxItem) => <>{i.acct}<Help k="acctAssign" /></> },
  { key: 'g', label: 'G/L 계정', render: (i: BnxItem) => <>{i.gl}<Help k="glAccount" /></> },
];

export function PrF({ step }: StepProps) {
  const s = useBnx();
  const c = useOrg();
  const done = s.pr !== 'None';
  return (
    <FioriShell title="구매 요청 관리 - 전문가용" role={step.role}>
      <PageHeader breadcrumb={['구매 요청 관리 - 전문가용']} title={done ? `구매 요청 ${s.numbers.pr}` : '새 구매 요청'} subtitle="Pur. Requisition (NB)"
        status={done ? <Status state="Positive" text={s.pr === 'Ordered' ? 'PO 생성됨' : '저장됨'} /> : undefined} />
      <div className="f-page-body">
        {done && <MessageStrip design="Positive" hideCloseButton className="f-strip">구매 요청 {s.numbers.pr}이(가) 생성되었습니다 – 공급원으로 계약 {s.numbers.contract}이(가) 자동 결정되었습니다.</MessageStrip>}
        <Section title="일반 정보"><FormGroup cols={3} fields={[
          { label: '문서 유형', value: 'Pur. Requisition (NB)' }, { label: '자동 소스 결정', value: '✓ 사용', help: 'source' }, { label: '요청자', value: 'PURCHASER' },
        ]} /></Section>
        <Section title="품목">
          <FTable rowKey={(i) => i.item} rows={[ITEM10]} columns={[
            ...itemCols(c),
            { key: 'cc', label: '코스트 센터', render: (i) => <>{i.split[0].cc}<Help k="costCenter" /></> },
            { key: 's', label: '공급원', render: () => `계약 ${s.numbers.contract} / 10` },
          ]} />
          <p className="f-muted">구매 조직 {c.purchasingOrg} · 구매 그룹 {PURCH_GROUP} · 플랜트 {c.plant}. 계정 지정 K는 재고가 아니라 코스트 센터 비용으로 처리됩니다.</p>
        </Section>
      </div>
      {!done && <FooterBar><FBtn emph onClick={() => { s.createPR(); showToast(`구매 요청 ${s.numbers.pr}이(가) 생성되었습니다`); }}>생성</FBtn><FBtn>초안 저장</FBtn></FooterBar>}
    </FioriShell>
  );
}

export function PrG({ step }: StepProps) {
  const s = useBnx();
  const done = s.pr !== 'None';
  return (
    <GuiWindow title={done ? `구매 요청 ${s.numbers.pr} 표시` : '구매 요청 생성'} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>문서 개요 켜기</GBtn><GBtn icon="💾" disabled={done} onClick={s.createPR}>저장</GBtn></>}>
      <div className="g-pad">
        <div className="g-row"><select className="g-select" disabled><option>NB 구매 요청</option></select></div>
        <GTable minRows={3} rows={[ITEM10]} rowKey={(i) => i.item} columns={[
          { key: 'i', label: '품목', w: 40, render: (i) => i.item },
          { key: 'a', label: 'A', w: 25, render: () => 'K' },
          { key: 'm', label: '자재', w: 70, render: (i) => i.material },
          { key: 't', label: '내역', w: 200, render: (i) => i.text },
          { key: 'q', label: '수량', w: 50, align: 'right', render: (i) => i.qty },
          { key: 'g', label: '구매 그룹', w: 60, render: () => PURCH_GROUP },
          { key: 'cc', label: '코스트 센터', w: 80, render: (i) => i.split[0].cc },
          { key: 'gl', label: 'G/L 계정', w: 80, render: (i) => i.gl },
          { key: 'o', label: '계약', w: 90, render: () => s.numbers.contract },
        ]} />
        {done && <div className="g-ok-box">구매 요청 {s.numbers.pr}이(가) 생성되었습니다</div>}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 2 Requisition → PO */
export function PoF({ step }: StepProps) {
  const s = useBnx();
  const c = useOrg();
  const [open, setOpen] = useState(false);
  const order = () => { s.createPO(); setOpen(false); showToast(`구매 오더 ${s.numbers.po}이(가) 생성되었습니다`); };
  return (
    <FioriShell title="구매 요청 처리" role={step.role}>
      <PageHeader title="구매 요청 처리" subtitle="Process Purchase Requisitions (V2) (F1048A)" />
      <FilterBar fields={[{ label: '구매 요청', value: <FVal v={s.numbers.pr} /> }]} />
      <div className="f-page-body">
        {s.po && <MessageStrip design="Positive" hideCloseButton className="f-strip">구매 요청 {s.numbers.pr}이(가) 구매 오더 {s.numbers.po}(으)로 전환되었습니다{s.po.status === 'Pending' ? ' – 구매 관리자 승인 대기' : ''}.</MessageStrip>}
        <FTable title="구매 요청" count={1} rowKey={(i) => i.item} rows={[ITEM10]} selected={['10']} onSelect={() => undefined}
          toolbar={<><FBtn trans>RFQ 생성</FBtn><FBtn emph disabled={!!s.po} onClick={() => setOpen(true)}>구매 오더 생성</FBtn></>} columns={[
            { key: 'pr', label: '구매 요청', render: () => <FLink>{s.numbers.pr}</FLink> },
            ...itemCols(c).slice(1),
            { key: 's', label: '공급원', render: () => <>{SUP}<div className="f-muted">계약 {s.numbers.contract}</div></> },
            { key: 'st', label: '처리 상태', render: () => <Status state={s.po ? 'Positive' : 'Information'} text={s.po ? 'PO 생성됨' : '소스 지정됨'} /> },
          ]} />
      </div>
      <Dialog open={open} headerText="구매 오더 미리보기" onClose={() => setOpen(false)} style={{ width: 620 }}
        footer={<div className="f-dialog-footer"><FBtn emph onClick={order}>오더</FBtn><FBtn onClick={() => setOpen(false)}>취소</FBtn></div>}>
        <div className="f-preview-grid">
          <span>구매 오더 유형:</span><b>표준 PO (NB)</b><span>공급업체:</span><b>{SUP}</b>
          <span>구매 그룹:</span><b>{PURCH_GROUP}</b><span>순 오더 금액:</span><b>{fmtAmt(itemsValue([ITEM10]), c.currency)}</b>
        </div>
        {isOptOn('bnx', 'approve') && <MessageStrip design="Information" hideCloseButton style={{ marginTop: 12 }}>구매 그룹 003 · 500 EUR 초과 → 유연한 워크플로가 구매 관리자 승인을 요청합니다.</MessageStrip>}
      </Dialog>
    </FioriShell>
  );
}

export function PoG({ step }: StepProps) {
  const s = useBnx();
  return (
    <GuiWindow title="구매 요청 지정 및 처리" tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>소스 지정</GBtn><GBtn disabled={!!s.po} onClick={s.createPO}>지정 개요 → 구매 오더 생성</GBtn></>}>
      <div className="g-pad">
        <GTable title="구매 요청 – 지정 리스트 (1)" rows={[ITEM10]} rowKey={(i) => i.item} selected={['10']} columns={[
          { key: 'pr', label: '구매 요청', w: 90, render: () => s.numbers.pr },
          { key: 'm', label: '자재', w: 70, render: (i) => i.material },
          { key: 'q', label: '수량', w: 50, align: 'right', render: (i) => i.qty },
          { key: 'a', label: 'A', w: 25, render: () => 'K' },
          { key: 'v', label: '공급업체', w: 80, render: () => SUPPLIER.no },
          { key: 'c', label: '계약', w: 90, render: () => s.numbers.contract },
          { key: 'po', label: '구매 오더', w: 90, render: () => (s.po ? s.numbers.po : '') },
        ]} />
        {s.po && <div className="g-ok-box">표준 구매 오더 {s.numbers.po}이(가) 생성되었습니다</div>}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 3 Text item with multiple account assignment */
function SplitTable({ item }: { item: BnxItem }) {
  const c = useOrg();
  return <FTable title={`품목 ${item.item} 계정 지정`} rowKey={(x) => x.cc} rows={item.split} columns={[
    { key: 'n', label: '계정 지정 번호', render: (x) => String(item.split.indexOf(x) + 1) },
    { key: 'c', label: '코스트 센터', render: (x) => <>{x.cc}<Help k="costCenter" /></> },
    { key: 'p', label: '배분 (%)', align: 'right', render: (x) => <>{x.pct}<Help k="distribution" /></> },
    { key: 'g', label: 'G/L 계정', render: () => item.gl },
    { key: 'v', label: '금액', align: 'right', render: (x) => fmtAmt((item.qty * item.price * x.pct) / 100, c.currency) },
  ]} />;
}

export function AddItemF({ step }: StepProps) {
  const s = useBnx();
  const c = useOrg();
  const po = s.po!;
  const added = po.items.length > 1;
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(false);
  const rows = draft && !added ? [...po.items, ITEM20] : po.items;
  const save = () => { s.addTextItem(); setEdit(false); setDraft(false); showToast(`구매 오더 ${s.numbers.po}이(가) 저장되었습니다`); };
  return (
    <FioriShell title="구매 오더 관리" role={step.role}>
      <PageHeader breadcrumb={['구매 오더 관리']} title={`구매 오더 ${s.numbers.po}`} subtitle={`${SUP} · 구매 그룹 ${PURCH_GROUP}`}
        kpis={[{ label: '순 금액', value: fmtAmt(itemsValue(rows), c.currency) }]}
        status={<Status state={po.status === 'Pending' ? 'Critical' : 'Positive'} text={po.status === 'Pending' ? '승인 중' : '발송됨'} />}
        actions={!edit && !added ? <FBtn emph onClick={() => setEdit(true)}>편집</FBtn> : undefined} />
      <div className="f-page-body">
        {added && <MessageStrip design="Positive" hideCloseButton className="f-strip">품목 20(자재 번호 없는 사무용품)이 코스트 센터 2곳에 20/80으로 배분되어 저장되었습니다.</MessageStrip>}
        <Section title="품목">
          <FTable rowKey={(i) => i.item} rows={rows} toolbar={edit && !draft ? <FBtn emph onClick={() => setDraft(true)}>품목 추가</FBtn> : undefined} columns={[
            ...itemCols(c),
            { key: 'mg', label: '자재 그룹', render: (i) => <>{i.matGroup}{!i.material && <Help k="matGroup" />}</> },
          ]} />
        </Section>
        {(draft || added) && <Section title="품목 20 – 다중 계정 지정"><SplitTable item={ITEM20} /></Section>}
      </div>
      {edit && <FooterBar><FBtn emph disabled={!draft} onClick={save}>오더</FBtn><FBtn onClick={() => { setEdit(false); setDraft(false); }}>취소</FBtn></FooterBar>}
    </FioriShell>
  );
}

export function AddItemG({ step }: StepProps) {
  const s = useBnx();
  const po = s.po!;
  const added = po.items.length > 1;
  const [draft, setDraft] = useState(false);
  const rows = draft && !added ? [...po.items, ITEM20] : po.items;
  return (
    <GuiWindow title={`표준 PO ${s.numbers.po} 변경`} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn disabled={added || draft} onClick={() => setDraft(true)}>＋ 품목 추가</GBtn><GBtn icon="💾" disabled={!draft || added} onClick={s.addTextItem}>저장</GBtn></>}>
      <div className="g-pad">
        <GTable minRows={4} rows={rows} rowKey={(i) => i.item} columns={[
          { key: 'i', label: '품목', w: 40, render: (i) => i.item },
          { key: 'a', label: 'A', w: 25, render: () => 'K' },
          { key: 'm', label: '자재', w: 70, render: (i) => i.material },
          { key: 't', label: '내역', w: 190, render: (i) => i.text },
          { key: 'q', label: '수량', w: 50, align: 'right', render: (i) => i.qty },
          { key: 'p', label: '순 가격', w: 70, align: 'right', render: (i) => fmtNum(i.price) },
          { key: 'g', label: '자재 그룹', w: 70, render: (i) => i.matGroup },
        ]} />
        {(draft || added) && <GGroup title="품목 20 계정 지정 – 다중 계정 지정 (배분 %)">
          <GTable minRows={2} rows={ITEM20.split} rowKey={(x) => x.cc} columns={[
            { key: 'g', label: 'G/L 계정', w: 90, render: () => ITEM20.gl },
            { key: 'c', label: '코스트 센터', w: 90, render: (x) => x.cc },
            { key: 'p', label: '%', w: 50, align: 'right', render: (x) => x.pct },
          ]} />
        </GGroup>}
        {added && <div className="g-ok-box">표준 PO {s.numbers.po}이(가) 변경되었습니다</div>}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 4 Mass changes */
export function MassF({ step }: StepProps) {
  const s = useBnx();
  const c = useOrg();
  const [open, setOpen] = useState(false);
  const rows = [
    { po: s.numbers.po, item: '10', text: ITEM10.text, terms: s.po!.payTerms, mine: true },
    { po: '4500000431', item: '10', text: '청소 용품', terms: '0001', mine: false },
    { po: '4500000433', item: '10', text: '프린터 토너', terms: '0002', mine: false },
  ];
  return (
    <FioriShell title="구매 오더 일괄 변경" role={step.role}>
      <PageHeader title="구매 오더 일괄 변경" subtitle="Mass Changes to Purchase Orders (F2593)" />
      <FilterBar fields={[{ label: '자재 그룹', value: <FVal v="YBMM01, YBMM00" /> }, { label: '구매 조직', value: <FVal v={c.purchasingOrg} /> }, { label: '구매 그룹', value: <FVal v={PURCH_GROUP} /> }]} />
      <div className="f-page-body">
        {s.massChanged && <MessageStrip design="Positive" hideCloseButton className="f-strip">일괄 변경 작업 {s.numbers.job}이(가) 성공적으로 완료되었습니다 – 지급 조건 0001 → 0003.</MessageStrip>}
        <FTable title="구매 오더 품목" count={rows.length} rowKey={(r) => r.po} rows={rows} selected={[s.numbers.po]} onSelect={() => undefined}
          toolbar={<FBtn emph disabled={s.massChanged} onClick={() => setOpen(true)}>일괄 편집</FBtn>} columns={[
            { key: 'po', label: '구매 오더', render: (r) => <><FLink>{r.po}</FLink>{r.mine && <span className="mine-tag">데모</span>}</> },
            { key: 'i', label: '품목', render: (r) => r.item },
            { key: 't', label: '내역', render: (r) => r.text },
            { key: 'p', label: '지급 조건', render: (r) => <>{r.terms}<Help k="paymentTerms" /></> },
          ]} />
      </div>
      <Dialog open={open} headerText="일괄 편집" onClose={() => setOpen(false)} style={{ width: 520 }}
        footer={<div className="f-dialog-footer"><FBtn emph onClick={() => { s.massChange(); setOpen(false); showToast('일괄 변경이 적용되었습니다'); }}>일괄 변경 적용</FBtn><FBtn onClick={() => setOpen(false)}>취소</FBtn></div>}>
        <p className="f-dialog-text">헤더 필드 · 품목 필드 · 파트너 필드 중 변경할 값을 지정합니다 (선택 1건).</p>
        <FormGroup cols={1} fields={[{ label: '지급 조건', value: <select className="f-select" defaultValue="0003"><option value="0003">&lt;필드 값 교체&gt; 0003</option></select>, help: 'paymentTerms' }]} />
      </Dialog>
    </FioriShell>
  );
}

export function MassG({ step }: StepProps) {
  const s = useBnx();
  return (
    <GuiWindow title="구매 오더 일괄 변경" tcode={step.tcode} role={step.role} appToolbar={<GBtn disabled={s.massChanged} onClick={s.massChange}>▶ 실행 (F8)</GBtn>}>
      <div className="g-pad">
        <div className="g-sel-screen">
          <GField label="구매 문서" value={s.numbers.po} w={100} lw={140} />
          <GField label="테이블 / 필드" value="EKKO – ZTERM 지급 조건" w={220} lw={140} />
          <GField label="새 값" value="0003" w={60} lw={140} help="paymentTerms" />
        </div>
        {s.massChanged && <div className="g-ok-box">구매 문서 1건이 변경되었습니다 (지급 조건 0003)</div>}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 5 Approve PO */
function usePoTask() {
  const s = useBnx();
  const c = useOrg();
  const po = s.po!;
  const pending = po.status === 'Pending';
  const done = !pending ? `구매 오더 ${s.numbers.po}: ${po.status === 'Rejected' ? '반려됨' : '승인 완료 – 공급업체에 발송되었습니다.'}` : undefined;
  return { s, c, po, pending, done };
}

export function ApproveF({ step }: StepProps) {
  const { s, c, po, pending, done } = usePoTask();
  return <InboxFiori step={step} done={done} onDecide={(k, n) => { s.decidePO(k === 'approve', n); showToast(k === 'approve' ? '구매 오더가 승인되었습니다' : '구매 오더가 반려되었습니다'); }}
    task={pending ? {
      title: `구매 오더 ${s.numbers.po} 릴리스`, subtitle: `${SUP} · 소모품 (계정 지정 K)`, kpiLabel: '순 금액', kpi: fmtAmt(itemsValue(po.items), c.currency),
      fields: [{ label: '구매 그룹', value: PURCH_GROUP, help: 'purchGroup' }, { label: '지급 조건', value: po.payTerms, help: 'paymentTerms' }, { label: '워크플로', value: 'Test Workflow for Purchase Order (003, > 500 EUR)' }],
      body: <>
        <FTable title="품목" rowKey={(i) => i.item} rows={po.items} columns={itemCols(c)} />
        {po.items.length > 1 && <SplitTable item={po.items[1]} />}
      </>,
    } : null} />;
}

export function ApproveG({ step }: StepProps) {
  const { s, c, po, pending, done } = usePoTask();
  return <InboxGui step={step} done={done} onDecide={(k, n) => s.decidePO(k === 'approve', n)}
    task={pending ? `구매 오더 ${s.numbers.po} 릴리스 (${fmtAmt(itemsValue(po.items), c.currency)})` : null}
    preview={<>PO {s.numbers.po} · 구매 그룹 {PURCH_GROUP} · {po.items.map((i) => `${i.item}: ${i.acct}`).join(' / ')}</>} />;
}

/* ============================================================ 6 PO items by account assignment */
function useAcctRows() {
  const s = useBnx();
  return (s.po?.items ?? []).flatMap((i) => i.split.map((x) => ({
    k: `${i.item}-${x.cc}`, item: i.item, text: i.text, cc: x.cc, pct: x.pct, gl: i.gl, value: (i.qty * i.price * x.pct) / 100,
    open: s.gr ? 0 : i.qty, inv: s.invoice ? (i.qty * i.price * x.pct) / 100 : 0,
  })));
}

export function MonitorF({ step }: StepProps) {
  const s = useBnx();
  const c = useOrg();
  const rows = useAcctRows();
  return (
    <FioriShell title="계정 지정별 구매 오더 품목" role={step.role}>
      <PageHeader title="계정 지정별 구매 오더 품목" subtitle="Purchase Order Items by Account Assignment (F2420)" />
      <FilterBar fields={[{ label: '계정 지정 범주', value: <FVal v="K 코스트 센터" /> }, { label: '코스트 센터', value: <FVal v={`${rows.map((r) => r.cc).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`} /> }, { label: '공급업체', value: <FVal v={SUPPLIER.no} /> }]} />
      <div className="f-page-body">
        <FTable title="구매 오더 품목" count={rows.length} rowKey={(r) => r.k} rows={rows} nav columns={[
          { key: 'po', label: '구매 오더 / 품목', render: (r) => `${s.numbers.po} / ${r.item}` },
          { key: 't', label: '내역', render: (r) => r.text },
          { key: 'cc', label: '코스트 센터', render: (r) => <>{r.cc}<Help k="costCenter" /></> },
          { key: 'p', label: '배분', align: 'right', render: (r) => `${r.pct} %` },
          { key: 'g', label: 'G/L 계정', render: (r) => r.gl },
          { key: 'v', label: '순 금액', align: 'right', render: (r) => fmtAmt(r.value, c.currency) },
          { key: 'o', label: '입고 미결 수량', align: 'right', render: (r) => r.open },
          { key: 'i', label: '송장 금액', align: 'right', render: (r) => fmtAmt(r.inv, c.currency) },
        ]} />
      </div>
    </FioriShell>
  );
}

export function MonitorG({ step }: StepProps) {
  const s = useBnx();
  const rows = useAcctRows();
  return (
    <GuiWindow title="계정 지정별 구매 문서" tcode={step.tcode} role={step.role} appToolbar={<><GBtn>상세 정보</GBtn><GBtn>합계</GBtn></>}>
      <div className="g-pad">
        <GTable minRows={4} rows={rows} rowKey={(r) => r.k} columns={[
          { key: 'po', label: '구매 문서', w: 100, render: () => s.numbers.po },
          { key: 'i', label: '품목', w: 40, render: (r) => r.item },
          { key: 'a', label: 'A', w: 25, render: () => 'K' },
          { key: 'cc', label: '코스트 센터', w: 90, render: (r) => r.cc },
          { key: 'g', label: 'G/L 계정', w: 90, render: (r) => r.gl },
          { key: 'p', label: '%', w: 40, align: 'right', render: (r) => r.pct },
          { key: 'v', label: '순 금액', w: 90, align: 'right', render: (r) => fmtNum(r.value) },
        ]} />
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 7 GR · 8 GR slip */
export function GrF({ step }: StepProps) {
  const s = useBnx();
  const { go } = useScenarioNav();
  return <GrFiori step={step} po={s.numbers.po} supplier={SUP} items={s.po!.items} posted={s.gr} consumption onPost={s.postGR} onShowDoc={() => go('slip')} />;
}
export function GrG({ step }: StepProps) {
  const s = useBnx();
  return <GrGui step={step} po={s.numbers.po} supplier={SUP} items={s.po!.items} posted={s.gr} consumption onPost={s.postGR} />;
}

export function SlipF({ step }: StepProps) {
  const s = useBnx();
  const journal = useJournal('gr');
  return <MatDocFiori step={step} doc={s.gr!} items={s.po!.items} journal={journal} po={s.numbers.po} focusOutput
    slip={<GrSlipDoc doc={s.gr!} items={s.po!.items} po={s.numbers.po} supplier={SUPPLIER} />} />;
}
export function SlipG({ step }: StepProps) {
  const s = useBnx();
  const journal = useJournal('gr');
  return <MatDocGui step={step} doc={s.gr!} items={s.po!.items} journal={journal} slip={<GrSlipDoc doc={s.gr!} items={s.po!.items} po={s.numbers.po} supplier={SUPPLIER} />} />;
}

/* ============================================================ 9 Invoice · 10 Release blocked invoice */
function useInvItems() {
  const s = useBnx();
  return s.po!.items.map((i) => ({ ...i, qty: s.gr?.qty[i.item] ?? 0 }));
}
export function InvoiceF({ step }: StepProps) {
  const s = useBnx();
  const { go } = useScenarioNav();
  const on = isOptOn('bnx', 'release');
  return <InvoiceFiori step={step} po={s.numbers.po} supplier={SUP} items={useInvItems()} posted={s.invoice} journal={useJournal('inv')}
    blockOption blockDefault={on} onPost={s.postInvoice}
    onShowNext={s.invoice?.blocked ? <FLink onClick={() => go('release')}>릴리스 작업 보기</FLink> : undefined} />;
}
export function InvoiceG({ step }: StepProps) {
  const s = useBnx();
  return <InvoiceGui step={step} po={s.numbers.po} supplier={SUP} items={useInvItems()} posted={s.invoice} blockOption blockDefault={isOptOn('bnx', 'release')} onPost={s.postInvoice} />;
}

export function ReleaseF({ step }: StepProps) {
  const s = useBnx();
  const c = useOrg();
  const inv = s.invoice!;
  return <InboxFiori step={step} approveLabel="릴리스"
    done={s.released ? `송장 ${inv.doc}이(가) 릴리스되어 지급 대상이 되었습니다.` : !inv.blocked ? `송장 ${inv.doc}은(는) 보류되지 않았습니다 – 릴리스할 작업이 없습니다.` : undefined}
    onDecide={(k) => { if (k === 'approve') { s.releaseInvoice(); showToast('송장이 릴리스되었습니다'); } }}
    task={inv.blocked ? {
      title: `차단된 송장 ${inv.doc} 릴리스`, subtitle: `${SUP} · 참조 ${inv.ref} · 코스트 센터 책임자 승인`, icon: 'customer-financial-fact-sheet',
      kpiLabel: '총 금액', kpi: fmtAmt(inv.amount, c.currency),
      fields: [
        { label: '보류 사유', value: '수동 보류 (Manual)', help: 'paymentBlock' },
        { label: '구매 오더', value: s.numbers.po }, { label: '코스트 센터 책임자', value: `${ROLE_USER['Purchasing Manager'].name} (PURCHASING_MANAGER)` },
      ],
      body: <JournalTable lines={journalStatic(inv.amount, c.glGrir, c.glPayables)} />,
    } : null} />;
}
const journalStatic = (amt: number, grir: string, ap: string): JournalLine[] => [
  { acc: grir, text: 'GR/IR 청산', dc: '차변', amt }, { acc: ap, text: `공급업체 ${SUPPLIER.no} (지급 보류 해제 대상)`, dc: '대변', amt },
];

export function ReleaseG({ step }: StepProps) {
  const s = useBnx();
  const c = useOrg();
  const inv = s.invoice!;
  return (
    <GuiWindow title="차단된 송장 릴리스" tcode={step.tcode} role={step.role}
      appToolbar={<GBtn disabled={!inv.blocked} onClick={s.releaseInvoice}>✔ 릴리스</GBtn>}>
      <div className="g-pad">
        <GTable minRows={3} rows={[inv]} rowKey={(i) => i.doc} selected={inv.blocked ? [inv.doc] : []} columns={[
          { key: 'd', label: '송장 전표', w: 100, render: (i) => i.doc },
          { key: 'y', label: '연도', w: 50, render: (i) => i.date.slice(0, 4) },
          { key: 'v', label: '공급업체', w: 80, render: () => SUPPLIER.no },
          { key: 'a', label: '금액', w: 90, align: 'right', render: (i) => fmtNum(i.amount) },
          { key: 'r', label: '보류 사유', w: 120, render: (i) => (i.blocked ? 'M 수동 보류' : '–') },
          { key: 's', label: '상태', w: 90, render: (i) => (i.blocked ? '보류' : '릴리스됨') },
          { key: 'dt', label: '전기 일자', w: 90, render: (i) => fmtDate(i.date, c.dateFormat) },
        ]} />
        {s.released && <div className="g-ok-box">송장 {inv.doc}이(가) 릴리스되었습니다</div>}
      </div>
    </GuiWindow>
  );
}

