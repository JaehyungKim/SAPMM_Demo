/** BMD – Purchase Contract: Fiori and SAP GUI screens for every step (BMD_DE test script). */
import { jo, pc } from '../../josa';
import { useState } from 'react';
import { Dialog, MessageStrip } from '@ui5/webcomponents-react';
import type { StepProps } from '../../steps/types';
import { addDays, fmtAmt, fmtDate, fmtNum, todayIso } from '../../format';
import {
  AnchorBar, FBtn, FilterBar, FInput, FioriShell, FooterBar, FormGroup, FTable, FVal, PageHeader, Section, Status, showToast, FLink,
} from '../../components/fiori/Fiori';
import { GBtn, GCheck, GField, GGroup, GTable, GTabs, GuiWindow } from '../../components/gui/Gui';
import { Help } from '../../components/Help';
import { useOrg } from '../types';
import {
  GrFiori, GrGui, InboxFiori, InboxGui, InvoiceFiori, InvoiceGui, LaunchpadFiori, LaunchpadGui, PdfDialog, PrintDoc, itemsValue,
  type DocItem, type JournalLine, type MenuNode,
} from '../shared/ui';
import { CONTRACT_PRICE, MATS, NB_ITEMS, RV_ITEMS, SUPPLIER, TRACKING, contractValue, useBmd } from './store';

const SUP = `${SUPPLIER.name} (${SUPPLIER.no})`;
const matText = (m: string) => MATS[m as keyof typeof MATS];

/* ============================================================ 0 Launchpad */
export function LaunchpadF({ step }: StepProps) {
  const s = useBmd();
  return <LaunchpadFiori step={step} spaces={{
    구매: [
      { section: '운영 구매', tiles: [
        { title: '구매 요청 관리 - 전문가용', sub: 'Manage Purchase Requisitions - Professional', icon: 'request', to: 'pr' },
        { title: '구매 요청 처리', sub: 'Process Purchase Requisitions', icon: 'activity-items', to: s.contract ? 'po' : 'contract', kpi: s.prNb === 'Open' ? 2 : 1, foot: '미결' },
        { title: '요구 추적 번호별 구매 문서', sub: 'Purchasing Documents by Requirement Tracking Number', icon: 'search', to: 'tracking' },
      ] },
      { section: '승인', tiles: [{ title: '내 받은 편지함', sub: 'My Inbox - All Items', icon: 'inbox', to: s.po && !s.ext.poapprove ? 'poapprove' : 'approve', kpi: (s.contract?.status === 'Pending' ? 1 : 0) + (s.po && !s.ext.poapprove ? 1 : 0), foot: '작업' }] },
    ],
    '소싱 및 계약': [{ section: '구매 계약', tiles: [
      { title: '구매 계약 관리', sub: 'Manage Purchase Contracts', icon: 'documents', to: 'print', kpi: s.contract ? 1 : 0, foot: '계약' },
      { title: '구매 계약 품목 모니터링', sub: 'Monitor Purchase Contract Items', icon: 'monitor-payments', to: 'monitor' },
      { title: '소스 리스트 관리', sub: 'Manage Source Lists', icon: 'list', to: 'source' },
      { title: '구매 계약 일괄 변경', sub: 'Mass Changes to Purchase Contracts', icon: 'edit', to: 'mass' },
      { title: '계약 템플릿 · 참조 계약', sub: 'Manage Purchase Contracts - Templates', icon: 'copy', to: 'reference' },
      { title: '계약 알림', sub: 'Manage Purchase Contracts - Alerts', icon: 'bell', to: 'notify', kpi: s.contract ? 1 : 0, kpiState: 'crit', foot: '만료 예정' },
    ] }],
    '재고 처리': [{ section: '입고', tiles: [
      { title: '구매 문서에 대한 입고 전기', sub: 'Post Goods Receipt for Purchasing Document', icon: 'shipping-status', to: 'gr' },
      { title: '입고 역분개', sub: 'Post Goods Receipt - Reversal (102)', icon: 'reset', to: 'reverse' },
    ] }],
    매입채무: [{ section: '송장 처리', tiles: [{ title: '공급업체 송장 생성', sub: 'Create Supplier Invoice', icon: 'request', to: 'invoice' }] }],
  }} />;
}

const TREE: MenuNode[] = [{ id: 'sap', label: 'SAP 메뉴', children: [{ id: 'mm', label: '자재 관리 (MM)', children: [
  { id: 'pur', label: '구매', children: [
    { id: 'req', label: '구매 요청', children: [{ id: 'me51n', label: '생성', tcode: 'ME51N', to: 'pr' }, { id: 'me57', label: '지정 및 처리', tcode: 'ME57', to: 'po' }] },
    { id: 'oa', label: '아웃라인 계약 › 계약', children: [
      { id: 'me31k', label: '생성', tcode: 'ME31K', to: 'contract' }, { id: 'me32k', label: '변경', tcode: 'ME32K', to: 'version' },
      { id: 'me33k', label: '표시', tcode: 'ME33K', to: 'print' }, { id: 'me3m', label: '자재별 리스트', tcode: 'ME3M', to: 'monitor' },
      { id: 'ref', label: '참조 생성 (템플릿)', tcode: 'ME31K_REF', to: 'reference' }, { id: 'me80rn', label: '만료 예정 분석', tcode: 'ME80RN', to: 'notify' },
      { id: 'mass', label: '일괄 변경', tcode: 'MEMASSCONTRACT', to: 'mass' },
    ] },
    { id: 'md', label: '마스터 데이터 › 소스 리스트', children: [{ id: 'me05', label: '생성 (일괄)', tcode: 'ME05', to: 'source' }, { id: 'me01', label: '유지보수', tcode: 'ME01', to: 'source' }] },
    { id: 'po', label: '구매 오더 › 리스트', children: [{ id: 'me2n', label: '구매 문서 번호별', tcode: 'ME2N', to: 'tracking' }] },
  ] },
  { id: 'im', label: '재고 관리', children: [{ id: 'migo', label: '자재 이동', tcode: 'MIGO', to: 'gr' }, { id: 'mbst', label: '자재 전표 취소', tcode: 'MBST', to: 'reverse' }] },
  { id: 'liv', label: '물류 송장 검증', children: [{ id: 'miro', label: '수신 송장 입력', tcode: 'MIRO', to: 'invoice' }] },
] }, { id: 'wf', label: '사무실', children: [{ id: 'sbwp', label: '비즈니스 워크플레이스', tcode: 'SBWP', to: 'approve' }, { id: 'sbwppo', label: 'PO 승인 작업', tcode: 'SBWP_PO', to: 'poapprove' }] }] }];

export const LaunchpadG = ({ step }: StepProps) => <LaunchpadGui step={step} tree={TREE} hint={<>트랜잭션을 두 번 클릭하거나 명령 필드에 <b>ME31K</b>, <b>ME57</b>, <b>MIGO</b> 등을 입력하십시오.</>} />;

/* ============================================================ 1 Outline-agreement requisition */
export function PrF({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const done = s.prRv !== 'None';
  return (
    <FioriShell title="구매 요청 관리 - 전문가용" role={step.role}>
      <PageHeader breadcrumb={['구매 요청 관리 - 전문가용']} title={done ? `구매 요청 ${s.numbers.prRv}` : '새 구매 요청'} subtitle="Outline Agrmt. Reqn. (RV)"
        status={done ? <Status state="Positive" text={s.prRv === 'Contracted' ? '계약 생성됨' : '저장됨'} /> : undefined} />
      <div className="f-page-body">
        {done && <MessageStrip design="Positive" hideCloseButton className="f-strip">구매 요청 {s.numbers.prRv}{pc(s.numbers.prRv, '이')} 저장되었습니다. 이 요청을 참조로 구매 계약을 만들 수 있습니다.</MessageStrip>}
        <Section title="일반 정보">
          <FormGroup cols={3} fields={[
            { label: '문서 유형', value: 'Outline Agrmt. Reqn. (RV)', help: 'outlineReq', required: true },
            { label: '자동 소스 결정', value: '✓ 사용' },
            { label: '요청자', value: 'PURCHASER' },
          ]} />
        </Section>
        <Section title="품목">
          <FTable rowKey={(r) => r.item} rows={RV_ITEMS} columns={[
            { key: 'i', label: '품목', render: (r) => r.item },
            { key: 'm', label: '자재', render: (r) => <><b>{matText(r.material)}</b><div className="f-muted">{r.material}</div></> },
            { key: 'p', label: '플랜트', render: () => c.plant },
            { key: 'q', label: '수량', align: 'right', render: (r) => `${r.qty} PC` },
            { key: 'r', label: '릴리스 일자', render: () => fmtDate(todayIso(), c.dateFormat) },
            { key: 't', label: '요구 추적 번호', render: () => <>{TRACKING}<Help k="trackingNo" /></> },
            { key: 'g', label: '구매 그룹', render: () => '001' },
          ]} />
        </Section>
      </div>
      {!done && <FooterBar><FBtn emph onClick={() => { s.createRvPr(); showToast(`구매 요청 ${jo(s.numbers.prRv, '이')} 생성되었습니다`); }}>생성</FBtn><FBtn>초안 저장</FBtn></FooterBar>}
    </FioriShell>
  );
}

export function PrG({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const done = s.prRv !== 'None';
  return (
    <GuiWindow title={done ? `구매 요청 ${s.numbers.prRv} 표시` : '구매 요청 생성'} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>문서 개요 켜기</GBtn><GBtn icon="💾" disabled={done} onClick={s.createRvPr}>저장</GBtn><GBtn>점검</GBtn></>}>
      <div className="g-pad">
        <div className="g-row"><select className="g-select" disabled><option>RV 아웃라인 계약 요청</option></select><Help k="outlineReq" /> <GCheck label="소스 결정" checked /></div>
        <GTable minRows={4} rows={RV_ITEMS} rowKey={(r) => r.item} columns={[
          { key: 'i', label: '품목', w: 40, render: (r) => r.item },
          { key: 'm', label: '자재', w: 70, render: (r) => r.material },
          { key: 't', label: '내역', w: 240, render: (r) => matText(r.material) },
          { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty },
          { key: 'u', label: '단위', w: 40, render: () => 'PC' },
          { key: 'p', label: '플랜트', w: 50, render: () => c.plant },
          { key: 'g', label: '구매 그룹', w: 60, render: () => '001' },
          { key: 'b', label: '요구 추적 번호', w: 110, render: () => TRACKING },
        ]} />
        {done && <div className="g-ok-box">구매 요청 {s.numbers.prRv}{pc(s.numbers.prRv, '이')} 저장되었습니다</div>}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 2 Contract from requisition */
function ContractPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useBmd();
  const c = useOrg();
  const items = RV_ITEMS.map((r) => ({ ...r, price: CONTRACT_PRICE }));
  const value = items.reduce((a, i) => a + i.target * i.price, 0);
  return (
    <Dialog open={open} headerText="구매 계약 미리보기" onClose={onClose} style={{ width: 720 }}
      footer={<div className="f-dialog-footer"><FBtn emph onClick={() => { s.createContract(); onClose(); showToast(`구매 계약 ${jo(s.numbers.contract, '이')} 생성되었습니다`); }}>생성</FBtn><FBtn onClick={onClose}>취소</FBtn></div>}>
      <FormGroup cols={2} fields={[
        { label: '계약 유형', value: 'Quantity Contract (MK)', help: 'contractType' },
        { label: '공급업체', value: SUP, help: 'supplier' },
        { label: '유효 시작', value: fmtDate(todayIso(), c.dateFormat), help: 'validity' },
        { label: '유효 종료', value: fmtDate(`${new Date().getFullYear()}-12-31`, c.dateFormat) },
        { label: '구매 조직 / 그룹', value: `${c.purchasingOrg} / 001` },
        { label: '목표 금액', value: fmtAmt(value, c.currency), help: 'targetValue' },
      ]} />
      <FTable rowKey={(r) => r.item} rows={items} columns={[
        { key: 'i', label: '품목', render: (r) => r.item },
        { key: 'm', label: '자재', render: (r) => `${r.material} – ${matText(r.material)}` },
        { key: 't', label: '목표 수량', align: 'right', render: (r) => <>{r.target} PC<Help k="targetQty" /></> },
        { key: 'p', label: '순 가격', align: 'right', render: (r) => fmtAmt(r.price, c.currency) },
      ]} />
      {value > 2000 && <MessageStrip design="Information" hideCloseButton style={{ marginTop: 10 }}>목표 금액이 2,000 EUR를 넘어 유연한 워크플로가 구매 관리자 승인을 요청합니다.</MessageStrip>}
    </Dialog>
  );
}

function usePrRows() {
  const s = useBmd();
  const status = s.prRv === 'Contracted' ? '계약 생성됨' : '미결';
  return [
    ...(s.prRv !== 'None' ? RV_ITEMS.map((r) => ({ k: `${s.numbers.prRv}/${r.item}`, pr: s.numbers.prRv, item: r.item, material: r.material, qty: r.qty, type: 'RV', status, mine: true })) : []),
    { k: '10000377/10', pr: '10000377', item: '10', material: 'TG12', qty: 20, type: 'NB', status: '미결', mine: false },
  ];
}

export function ContractF({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const rows = usePrRows();
  const [open, setOpen] = useState(false);
  return (
    <FioriShell title="구매 요청 처리" role={step.role}>
      <PageHeader title="구매 요청 처리" subtitle="Process Purchase Requisitions (F1048A)" />
      <FilterBar fields={[
        { label: '구매 조직', value: <FVal v={c.purchasingOrg} /> }, { label: '구매 그룹', value: <FVal v="001" /> },
        { label: '플랜트', value: <FVal v={c.plant} /> }, { label: '자재', value: <FVal v="TG10, TG11" /> },
      ]} />
      <div className="f-page-body">
        {s.contract && <MessageStrip design="Positive" hideCloseButton className="f-strip">
          구매 계약 {s.numbers.contract}{pc(s.numbers.contract, '이')} 생성되었습니다 – 상태: {s.contract.status === 'Pending' ? '승인 대기' : '릴리스됨'}.
        </MessageStrip>}
        <FTable title="구매 요청" count={rows.length} rowKey={(r) => r.k} rows={rows} selected={rows.filter((r) => r.mine).map((r) => r.k)} onSelect={() => undefined}
          toolbar={<><FBtn trans>RFQ 생성</FBtn><FBtn emph disabled={s.prRv !== 'Created'} onClick={() => setOpen(true)}>계약 생성</FBtn></>}
          columns={[
            { key: 'pr', label: '구매 요청', render: (r) => <><FLink>{r.pr}</FLink><div className="f-muted">품목 {r.item} · {r.type}</div></> },
            { key: 'm', label: '자재', render: (r) => <><b>{matText(r.material) ?? 'Trading Good 0012'}</b><div className="f-muted">{r.material}</div></> },
            { key: 'q', label: '수량', align: 'right', render: (r) => `${r.qty} PC` },
            { key: 't', label: '요구 추적 번호', render: (r) => (r.mine ? TRACKING : '') },
            { key: 's', label: '처리 상태', render: (r) => <Status state={r.status === '계약 생성됨' ? 'Positive' : 'None'} text={r.status} /> },
          ]} />
        {s.prRv === 'None' && <p className="f-muted">아웃라인 계약 요청이 아직 없습니다 – 1단계에서 먼저 만드세요.</p>}
      </div>
      <ContractPreview open={open} onClose={() => setOpen(false)} />
    </FioriShell>
  );
}

export function ContractG({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const ct = s.contract;
  return (
    <GuiWindow title={ct ? `수량 계약 ${s.numbers.contract} 표시` : '계약 생성: 초기 화면'} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>참조: 구매 요청</GBtn><GBtn>헤더</GBtn><GBtn icon="💾" disabled={!!ct || s.prRv !== 'Created'} onClick={s.createContract}>저장</GBtn></>}>
      <div className="g-pad">
        <GGroup title="헤더 데이터">
          <div className="g-row"><GField label="공급업체" value={SUP} w={220} lw={90} help="supplier" /><GField label="계약 유형" value="MK" w={40} lw={70} help="contractType" /></div>
          <div className="g-row"><GField label="구매 조직" value={c.purchasingOrg} w={60} lw={90} /><GField label="구매 그룹" value="001" w={40} lw={70} /><GField label="계약 일자" value={fmtDate(todayIso(), c.dateFormat)} w={90} lw={70} /></div>
          <div className="g-row"><GField label="유효 시작" value={fmtDate(todayIso(), c.dateFormat)} w={90} lw={90} help="validity" /><GField label="유효 종료" value={fmtDate(`${new Date().getFullYear()}-12-31`, c.dateFormat)} w={90} lw={70} /></div>
        </GGroup>
        <GTable title="품목 개요 (구매 요청에서 복사)" minRows={4} rows={RV_ITEMS} rowKey={(r) => r.item} columns={[
          { key: 'i', label: '품목', w: 40, render: (r) => r.item },
          { key: 'm', label: '자재', w: 70, render: (r) => r.material },
          { key: 't', label: '내역', w: 230, render: (r) => matText(r.material) },
          { key: 'q', label: '목표 수량', w: 80, align: 'right', render: (r) => r.target },
          { key: 'u', label: 'OUn', w: 40, render: () => 'PC' },
          { key: 'p', label: '순 가격', w: 80, align: 'right', render: () => fmtNum(CONTRACT_PRICE) },
          { key: 'w', label: '플랜트', w: 50, render: () => c.plant },
        ]} />
        {ct && <div className="g-ok-box">수량 계약 {s.numbers.contract}{pc(s.numbers.contract, '이')} 생성되었습니다{ct.status === 'Pending' ? ' (릴리스 대기)' : ''}</div>}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 3 Approve contract */
function useContractTask() {
  const s = useBmd();
  const c = useOrg();
  const ct = s.contract;
  const pending = ct?.status === 'Pending';
  const done = ct && ct.status !== 'Pending' ? `구매 계약 ${s.numbers.contract}: ${ct.status === 'Rejected' ? '반려됨' : '릴리스됨 – 이제 릴리스 오더를 만들 수 있습니다.'}` : undefined;
  return { s, c, ct, pending, done };
}

export function ApproveF({ step }: StepProps) {
  const { s, c, ct, pending, done } = useContractTask();
  return <InboxFiori step={step} done={done} onDecide={(k, n) => { s.decideContract(k === 'approve', n); showToast(k === 'approve' ? '구매 계약이 승인되었습니다' : '구매 계약이 반려되었습니다'); }}
    task={pending && ct ? {
      title: `구매 계약 ${s.numbers.contract} 릴리스`, subtitle: `${SUP} · Quantity Contract (MK)`, icon: 'documents',
      kpiLabel: '목표 금액', kpi: fmtAmt(ct.targetValue, c.currency),
      fields: [
        { label: '유효 기간', value: `${fmtDate(ct.validFrom, c.dateFormat)} – ${fmtDate(ct.validTo, c.dateFormat)}`, help: 'validity' },
        { label: '구매 조직', value: c.purchasingOrg }, { label: '워크플로', value: 'Test Workflow for Purchase Contract (> 2,000 EUR)' },
      ],
      body: <FTable title="계약 품목" rowKey={(i) => i.item} rows={ct.items} columns={[
        { key: 'i', label: '품목', render: (i) => i.item },
        { key: 'm', label: '자재', render: (i) => `${i.material} – ${i.text}` },
        { key: 't', label: '목표 수량', align: 'right', render: (i) => `${i.target} PC` },
        { key: 'p', label: '순 가격', align: 'right', render: (i) => fmtAmt(i.price, c.currency) },
      ]} />,
    } : null} />;
}

export function ApproveG({ step }: StepProps) {
  const { s, c, ct, pending, done } = useContractTask();
  return <InboxGui step={step} done={done} onDecide={(k, n) => s.decideContract(k === 'approve', n)}
    task={pending && ct ? `구매 계약 ${s.numbers.contract} 릴리스 (${fmtAmt(ct.targetValue, c.currency)})` : null}
    preview={ct && <>계약 {s.numbers.contract} · 공급업체 {SUP}<br />{ct.items.map((i) => `${i.material} ${i.target} PC × ${fmtNum(i.price)}`).join(' / ')}</>} />;
}

/* ============================================================ 4 / 11 Contract object page (print · version) */
function ContractDoc() {
  const s = useBmd();
  const c = useOrg();
  const ct = s.contract!;
  return <PrintDoc title="구매 계약" titleEn="Quantity Contract" partner={SUPPLIER}
    meta={[['계약 번호', s.numbers.contract], ['버전', String(ct.version)], ['유효 기간', `${fmtDate(ct.validFrom, c.dateFormat)} – ${fmtDate(ct.validTo, c.dateFormat)}`], ['목표 금액', fmtAmt(ct.targetValue, c.currency)]]}
    items={ct.items.map((i) => ({ item: i.item, material: i.material, text: i.text, qty: i.target, unit: 'PC', price: i.price, extra: `목표 수량 ${i.target} PC · 계약 기간 내 릴리스 오더로 호출` }))}
    terms={[['지급 조건', '0001 – 즉시 지급, 공제 없음'], ['인도 조건', 'EXW – Ex Works'], ['요구 추적 번호', TRACKING]]}
    foot="본 계약을 참조하는 모든 구매 오더(릴리스 오더)에는 계약 가격이 적용됩니다." />;
}

function ContractObject({ step, mode }: StepProps & { mode: 'print' | 'version' }) {
  const s = useBmd();
  const c = useOrg();
  const ct = s.contract!;
  const [tab, setTab] = useState(mode === 'print' ? '출력 관리' : '일반 정보');
  const [edit, setEdit] = useState(false);
  const [target, setTarget] = useState(String(ct.targetValue + 3000));
  const [reason, setReason] = useState('01 문서 오류 (documentation issues)');
  const [pdf, setPdf] = useState(false);
  const [cmp, setCmp] = useState(false);
  const df = c.dateFormat;
  const save = () => { s.changeContract(Number(target) || ct.targetValue, reason); setEdit(false); setTab('버전 이력'); showToast(`구매 계약 ${jo(s.numbers.contract, '이')} 저장되었습니다 – 새 버전 생성`); };
  return (
    <FioriShell title="구매 계약 관리" role={step.role}>
      <PageHeader breadcrumb={['구매 계약 관리']} title={`구매 계약 ${s.numbers.contract}`} subtitle={`Quantity Contract (MK) · ${SUP}`}
        attrs={[{ label: '유효 기간', value: `${fmtDate(ct.validFrom, df)} – ${fmtDate(ct.validTo, df)}`, help: 'validity' }, { label: '버전', value: String(ct.version) }]}
        kpis={[{ label: '목표 금액', value: fmtAmt(ct.targetValue, c.currency) }]}
        status={<Status state={ct.status === 'Released' ? 'Positive' : 'Critical'} text={ct.status === 'Released' ? '릴리스됨' : '승인 중'} />}
        actions={mode === 'version' && !edit ? <FBtn emph onClick={() => { setEdit(true); setTab('일반 정보'); }}>편집</FBtn> : undefined} />
      <AnchorBar tabs={['일반 정보', '품목', '출력 관리', '버전 이력']} active={tab} onChange={setTab} />
      <div className="f-page-body">
        {tab === '일반 정보' && <FormGroup cols={3} fields={[
          { label: '목표 금액', value: edit ? <><FInput value={target} onChange={setTarget} w={120} align="right" /> {c.currency}</> : fmtAmt(ct.targetValue, c.currency), help: 'targetValue' },
          ...(edit ? [{ label: '새 버전 사유', value: <select className="f-select" value={reason} onChange={(e) => setReason(e.target.value)}><option>01 문서 오류 (documentation issues)</option><option>02 법률 변경 (legal changes)</option></select>, help: 'versionReason' }] : []),
          { label: '공급업체', value: SUP, help: 'supplier' },
          { label: '구매 조직 / 그룹', value: `${c.purchasingOrg} / 001` },
          { label: '회사 코드', value: c.companyCode },
          { label: '지급 조건', value: '0001' },
        ]} />}
        {tab === '품목' && <FTable rowKey={(i) => i.item} rows={ct.items} columns={[
          { key: 'i', label: '품목', render: (i) => i.item },
          { key: 'm', label: '자재', render: (i) => <><b>{i.text}</b><div className="f-muted">{i.material}</div></> },
          { key: 't', label: '목표 수량', align: 'right', render: (i) => `${i.target} PC` },
          { key: 'r', label: '릴리스 수량', align: 'right', render: (i) => `${i.released} PC` },
          { key: 'p', label: '순 가격', align: 'right', render: (i) => fmtAmt(i.price, c.currency) },
        ]} />}
        {tab === '출력 관리' && <FTable rowKey={() => 'o'} rows={[1]} columns={[
          { key: 't', label: '출력 유형', render: () => 'PURCHASE_CONTRACT' },
          { key: 'c', label: '채널', render: () => '이메일' },
          { key: 'r', label: '수신인', render: () => SUPPLIER.name },
          { key: 's', label: '상태', render: () => <Status state={s.printed ? 'Positive' : 'Information'} text={s.printed ? '완료됨' : '대기'} /> },
          { key: 'a', label: '미리보기', render: () => <FLink onClick={() => { setPdf(true); s.markPrinted(); }}>문서 표시</FLink> },
        ]} />}
        {tab === '버전 이력' && <Section title="버전 이력" actions={s.versions.length ? <FBtn onClick={() => setCmp(true)}>비교</FBtn> : undefined}>
          <FTable rowKey={(v) => String(v.v)} rows={[{ v: 1, date: ct.createdAt, reason: '최초 생성', field: '', oldValue: '', newValue: '', user: 'PURCHASER' }, ...s.versions]} columns={[
            { key: 'v', label: '버전', render: (v) => <b>{v.v}</b> },
            { key: 'd', label: '일자', render: (v) => fmtDate(v.date, df) },
            { key: 'r', label: '사유', render: (v) => v.reason },
            { key: 'f', label: '변경 필드', render: (v) => (v.field ? `${v.field}: ${fmtNum(Number(v.oldValue))} → ${fmtNum(Number(v.newValue))}` : '–') },
            { key: 's', label: '상태', render: (v) => <Status state={v.v === ct.version ? 'Positive' : 'None'} text={v.v === ct.version ? '활성 문서' : '이력 문서'} /> },
          ]} />
        </Section>}
      </div>
      {edit && <FooterBar><FBtn emph onClick={save}>저장</FBtn><FBtn onClick={() => setEdit(false)}>취소</FBtn></FooterBar>}
      <PdfDialog open={pdf} onClose={() => setPdf(false)} title={`구매 계약 ${s.numbers.contract}`}><ContractDoc /></PdfDialog>
      <Dialog open={cmp} headerText="버전 비교" onClose={() => setCmp(false)} style={{ width: 560 }} footer={<div className="f-dialog-footer"><FBtn onClick={() => setCmp(false)}>닫기</FBtn></div>}>
        <FTable rowKey={(r) => r.f} rows={[{ f: '목표 금액', a: s.versions[0]?.oldValue ?? '', b: String(ct.targetValue) }, { f: '버전 사유', a: '–', b: s.versions[s.versions.length - 1]?.reason ?? '' }]} columns={[
          { key: 'f', label: '필드', render: (r) => r.f },
          { key: 'a', label: '버전 1', render: (r) => <span className="f-old">{r.f === '목표 금액' ? fmtNum(Number(r.a)) : r.a}</span> },
          { key: 'b', label: `버전 ${ct.version}`, render: (r) => <b>{r.f === '목표 금액' ? fmtNum(Number(r.b)) : r.b}</b> },
        ]} />
      </Dialog>
    </FioriShell>
  );
}

export const PrintF = ({ step }: StepProps) => <ContractObject step={step} mode="print" />;
export const VersionF = ({ step }: StepProps) => <ContractObject step={step} mode="version" />;

function ContractGui({ step, mode }: StepProps & { mode: 'print' | 'version' }) {
  const s = useBmd();
  const c = useOrg();
  const ct = s.contract!;
  const [pdf, setPdf] = useState(false);
  const [target, setTarget] = useState(String(ct.targetValue + 3000));
  const [tab, setTab] = useState('품목');
  const edit = mode === 'version';
  return (
    <GuiWindow title={`수량 계약 ${s.numbers.contract} ${edit ? '변경' : '표시'}`} tcode={step.tcode} role={step.role}
      appToolbar={<>
        <GBtn>헤더</GBtn>
        {!edit && <GBtn onClick={() => { setPdf(true); s.markPrinted(); }}>🖨 인쇄 미리보기</GBtn>}
        {edit && <GBtn icon="💾" onClick={() => s.changeContract(Number(target) || ct.targetValue, '01 문서 오류 (documentation issues)')}>저장</GBtn>}
      </>}>
      <div className="g-pad">
        <div className="g-row">
          <GField label="계약" value={s.numbers.contract} w={100} lw={50} /><GField label="공급업체" value={SUP} w={220} lw={60} />
          <GField label="버전" value={ct.version} w={30} lw={40} />
        </div>
        <div className="g-row">
          <GField label="목표 금액" value={edit ? target : fmtNum(ct.targetValue)} onChange={edit ? setTarget : undefined} w={100} lw={90} align="right" suffix={c.currency} help="targetValue" />
          {edit && <GField label="버전 사유" value="01 문서 오류" w={140} lw={70} help="versionReason" />}
        </div>
        <GTabs tabs={['품목', '버전']} active={tab} onChange={setTab}>
          {tab === '품목' && <GTable minRows={3} rows={ct.items} rowKey={(i) => i.item} columns={[
            { key: 'i', label: '품목', w: 40, render: (i) => i.item },
            { key: 'm', label: '자재', w: 70, render: (i) => i.material },
            { key: 't', label: '내역', w: 220, render: (i) => i.text },
            { key: 'q', label: '목표 수량', w: 80, align: 'right', render: (i) => i.target },
            { key: 'r', label: '릴리스 수량', w: 80, align: 'right', render: (i) => i.released },
            { key: 'p', label: '순 가격', w: 70, align: 'right', render: (i) => fmtNum(i.price) },
          ]} />}
          {tab === '버전' && <GTable minRows={3} rows={[{ v: 1, reason: '최초 생성', d: ct.createdAt }, ...s.versions.map((v) => ({ v: v.v, reason: v.reason, d: v.date }))]} rowKey={(v) => String(v.v)} columns={[
            { key: 'v', label: '버전', w: 50, render: (v) => v.v },
            { key: 'd', label: '일자', w: 90, render: (v) => fmtDate(v.d, c.dateFormat) },
            { key: 'r', label: '사유', w: 260, render: (v) => v.reason },
          ]} />}
        </GTabs>
        {edit && s.versions.length > 0 && <div className="g-ok-box">수량 계약 {s.numbers.contract} 버전 {ct.version}{pc(ct.version, '이')} 저장되었습니다</div>}
      </div>
      <PdfDialog open={pdf} onClose={() => setPdf(false)} title={`구매 계약 ${s.numbers.contract}`}><ContractDoc /></PdfDialog>
    </GuiWindow>
  );
}
export const PrintG = ({ step }: StepProps) => <ContractGui step={step} mode="print" />;
export const VersionG = ({ step }: StepProps) => <ContractGui step={step} mode="version" />;

/* ============================================================ 5 Source list */
function useSourceRows() {
  const s = useBmd();
  const c = useOrg();
  return s.sourceList && s.contract ? s.contract.items.map((i) => ({ k: i.material, material: i.material, text: i.text, plant: c.plant, from: s.contract!.validFrom, to: addDays(todayIso(), 7), agreement: `${s.numbers.contract} / ${i.item}` })) : [];
}

export function SourceF({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const rows = useSourceRows();
  const [open, setOpen] = useState(false);
  return (
    <FioriShell title="소스 리스트 관리" role={step.role}>
      <PageHeader title="소스 리스트 관리" subtitle="Manage Source Lists (F1859)" />
      <FilterBar fields={[{ label: '자재', value: <FVal v="TG10, TG11" /> }, { label: '플랜트', value: <FVal v={c.plant} /> }]} />
      <div className="f-page-body">
        <FTable title="소스 리스트 항목" count={rows.length} rowKey={(r) => r.k} rows={rows} empty="현재 기간에 유효한 소스 리스트 항목이 없습니다"
          toolbar={<FBtn emph={!s.sourceList} disabled={s.sourceList} onClick={() => setOpen(true)}>생성</FBtn>} columns={[
            { key: 'm', label: '자재', render: (r) => <><b>{r.text}</b><div className="f-muted">{r.material}</div></> },
            { key: 'p', label: '플랜트', render: (r) => r.plant },
            { key: 'v', label: '유효 기간', render: (r) => `${fmtDate(r.from, c.dateFormat)} – ${fmtDate(r.to, c.dateFormat)}` },
            { key: 's', label: '공급업체', render: () => SUP },
            { key: 'a', label: '계약 / 품목', render: (r) => r.agreement },
            { key: 'f', label: '고정', render: () => <Status state="Positive" text="고정" /> },
            { key: 'r', label: 'MRP', render: () => '1 – 소스 리스트 기록 관련' },
          ]} />
      </div>
      <Dialog open={open} headerText="생성된 소스" onClose={() => setOpen(false)} style={{ width: 640 }}
        footer={<div className="f-dialog-footer"><FBtn emph onClick={() => { s.createSourceList(); setOpen(false); showToast('소스 리스트가 저장되었습니다'); }}>기존 항목에 추가 후 저장</FBtn><FBtn onClick={() => setOpen(false)}>취소</FBtn></div>}>
        <p className="f-dialog-text">유효 기간 {fmtDate(todayIso(), c.dateFormat)} – {fmtDate(addDays(todayIso(), 7), c.dateFormat)}에 유효한 공급원<Help k="sourceList" /></p>
        <FTable rowKey={(i) => i.item} rows={s.contract?.items ?? []} selected={(s.contract?.items ?? []).map((i) => i.item)} onSelect={() => undefined} columns={[
          { key: 'm', label: '자재', render: (i) => i.material },
          { key: 'a', label: '공급원', render: (i) => `계약 ${s.numbers.contract} / ${i.item}` },
          { key: 's', label: '공급업체', render: () => SUPPLIER.no },
          { key: 'p', label: '순 가격', align: 'right', render: (i) => fmtAmt(i.price, c.currency) },
        ]} />
      </Dialog>
    </FioriShell>
  );
}

export function SourceG({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const [run, setRun] = useState(s.sourceList);
  const rows = s.contract?.items ?? [];
  return (
    <GuiWindow title="소스 리스트 생성" tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn onClick={() => setRun(true)}>▶ 실행 (F8)</GBtn><GBtn icon="💾" disabled={!run || s.sourceList} onClick={s.createSourceList}>저장</GBtn></>}>
      <div className="g-pad">
        <div className="g-sel-screen">
          <GField label="자재" value="TG10" w={80} lw={120} suffix="~ TG11" /><GField label="플랜트" value={c.plant} w={60} lw={120} />
          <GCheck label="테스트 실행" checked={false} />
        </div>
        {run && <GTable title="생성할 소스 리스트 레코드" minRows={3} rows={rows} rowKey={(i) => i.item} selected={rows.map((i) => i.item)} columns={[
          { key: 'm', label: '자재', w: 70, render: (i) => i.material },
          { key: 'p', label: '플랜트', w: 50, render: () => c.plant },
          { key: 'v', label: '공급업체', w: 80, render: () => SUPPLIER.no },
          { key: 'a', label: '계약', w: 100, render: () => s.numbers.contract },
          { key: 'i', label: '품목', w: 40, render: (i) => i.item },
          { key: 'f', label: '고정', w: 40, render: () => 'X' },
          { key: 'r', label: 'MRP', w: 40, render: () => '1' },
        ]} />}
        {s.sourceList && <div className="g-ok-box">소스 리스트 레코드 2건이 저장되었습니다</div>}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 6 Requisition → release order */
function PoPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useBmd();
  const c = useOrg();
  const items = NB_ITEMS.map((n) => ({ ...n, text: matText(n.material), unit: 'PC', price: CONTRACT_PRICE })) as DocItem[];
  return (
    <Dialog open={open} headerText="구매 오더 미리보기" onClose={onClose} style={{ width: 640 }}
      footer={<div className="f-dialog-footer"><FBtn emph onClick={() => { s.createPO(); onClose(); showToast(`구매 오더 ${jo(s.numbers.po, '이')} 생성되었습니다`); }}>오더</FBtn><FBtn onClick={onClose}>취소</FBtn></div>}>
      <div className="f-preview-grid">
        <span>구매 오더 유형:</span><b>표준 PO (NB)</b>
        <span>공급업체:</span><b>{SUP}</b>
        <span>참조 계약:</span><b>{s.numbers.contract} (릴리스 오더)</b>
        <span>순 오더 금액:</span><b>{fmtAmt(itemsValue(items), c.currency)}</b>
      </div>
    </Dialog>
  );
}

export function PoF({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const [open, setOpen] = useState(false);
  const src = s.sourceList ? '소스 리스트(고정) → 계약' : '계약 (자동 소스 결정)';
  return (
    <FioriShell title="구매 요청 처리" role={step.role}>
      <PageHeader title="구매 요청 처리" subtitle="Process Purchase Requisitions (F1048)" />
      <FilterBar variant="표준" fields={[{ label: '구매 요청', value: <FVal v={s.numbers.prNb} /> }, { label: '플랜트', value: <FVal v={c.plant} /> }]} />
      <div className="f-page-body">
        {s.po && <MessageStrip design="Positive" hideCloseButton className="f-strip">구매 요청 {s.numbers.prNb}{pc(s.numbers.prNb, '이')} 구매 오더 {s.numbers.po}{pc(s.numbers.po, '로')} 전환되었습니다 – 계약 {s.numbers.contract}의 릴리스 수량이 갱신되었습니다.</MessageStrip>}
        <FTable title="구매 요청" count={NB_ITEMS.length} rowKey={(r) => r.item} rows={NB_ITEMS} selected={NB_ITEMS.map((r) => r.item)} onSelect={() => undefined}
          toolbar={<FBtn emph disabled={!!s.po} onClick={() => setOpen(true)}>구매 오더 생성</FBtn>} columns={[
            { key: 'pr', label: '구매 요청', render: (r) => <><FLink>{s.numbers.prNb}</FLink><div className="f-muted">품목 {r.item} · NB</div></> },
            { key: 'm', label: '자재', render: (r) => <><b>{matText(r.material)}</b><div className="f-muted">{r.material}</div></> },
            { key: 'q', label: '수량', align: 'right', render: (r) => `${r.qty} PC` },
            { key: 's', label: '지정된 공급원', render: (r) => <>{SUP}<div className="f-muted">계약 {s.numbers.contract} / {r.item} · {src}</div></> },
            { key: 'p', label: '계약 가격', align: 'right', render: () => fmtAmt(CONTRACT_PRICE, c.currency) },
            { key: 't', label: '요구 추적 번호', render: () => TRACKING },
            { key: 'st', label: '처리 상태', render: () => <Status state={s.po ? 'Positive' : 'Information'} text={s.po ? 'PO 생성됨' : '소스 지정됨'} /> },
          ]} />
      </div>
      <PoPreview open={open} onClose={() => setOpen(false)} />
    </FioriShell>
  );
}

export function PoG({ step }: StepProps) {
  const s = useBmd();
  return (
    <GuiWindow title="구매 요청 지정 및 처리" tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>소스 지정</GBtn><GBtn disabled={!!s.po} onClick={s.createPO}>지정 개요 → 구매 오더 생성</GBtn></>}>
      <div className="g-pad">
        <GTable title={`구매 요청 – 지정 리스트 (${NB_ITEMS.length})`} rows={NB_ITEMS} rowKey={(r) => r.item} selected={NB_ITEMS.map((r) => r.item)} columns={[
          { key: 'pr', label: '구매 요청', w: 90, render: () => s.numbers.prNb },
          { key: 'i', label: '품목', w: 40, render: (r) => r.item },
          { key: 'm', label: '자재', w: 60, render: (r) => r.material },
          { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty },
          { key: 'v', label: '공급업체', w: 80, render: () => SUPPLIER.no },
          { key: 'a', label: '계약', w: 90, render: () => s.numbers.contract },
          { key: 'ai', label: '품목', w: 40, render: (r) => r.item },
          { key: 'po', label: '구매 오더', w: 90, render: () => (s.po ? s.numbers.po : '') },
        ]} />
        {s.po && <div className="g-ok-box">표준 구매 오더 {s.numbers.po}{pc(s.numbers.po, '이')} 생성되었습니다 (계약 {s.numbers.contract} 참조)</div>}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 7 Documents by tracking number */
function useTrackRows() {
  const s = useBmd();
  const c = useOrg();
  const rows: { k: string; cat: string; no: string; type: string; status: string; value: string }[] = [];
  if (s.prRv !== 'None') rows.push({ k: 'rv', cat: '구매 요청', no: s.numbers.prRv, type: 'RV 아웃라인 계약 요청', status: s.prRv === 'Contracted' ? '계약 생성됨' : '미결', value: '–' });
  if (s.contract) rows.push({ k: 'ct', cat: '구매 계약', no: s.numbers.contract, type: 'MK 수량 계약', status: s.contract.status === 'Released' ? '릴리스됨' : '승인 중', value: fmtAmt(s.contract.targetValue, c.currency) });
  rows.push({ k: 'nb', cat: '구매 요청', no: s.numbers.prNb, type: 'NB 구매 요청', status: s.po ? 'PO 생성됨' : '미결', value: '–' });
  if (s.po) rows.push({ k: 'po', cat: '구매 오더', no: s.numbers.po, type: 'NB 표준 PO (릴리스 오더)', status: s.invoice ? '송장 처리됨' : s.gr ? '입고 완료' : '발송됨', value: fmtAmt(itemsValue(s.po.items), c.currency) });
  return rows;
}

export function TrackingF({ step }: StepProps) {
  const rows = useTrackRows();
  const [run, setRun] = useState(true);
  return (
    <FioriShell title="요구 추적 번호별 구매 문서" role={step.role}>
      <PageHeader title="요구 추적 번호별 구매 문서" subtitle="Purchasing Documents by Requirement Tracking Number (F2905)" />
      <FilterBar onGo={() => setRun(true)} fields={[{ label: '요구 추적 번호', value: <FVal v={TRACKING} /> }]} />
      <div className="f-page-body">
        <FTable title="구매 문서" count={run ? rows.length : 0} rowKey={(r) => r.k} rows={run ? rows : []} columns={[
          { key: 'c', label: '문서 범주', render: (r) => r.cat },
          { key: 'n', label: '문서', render: (r) => <FLink>{r.no}</FLink> },
          { key: 't', label: '유형', render: (r) => r.type },
          { key: 'b', label: '요구 추적 번호', render: () => <>{TRACKING}<Help k="trackingNo" /></> },
          { key: 'v', label: '금액', align: 'right', render: (r) => r.value },
          { key: 's', label: '상태', render: (r) => <Status state="Information" text={r.status} /> },
        ]} />
      </div>
    </FioriShell>
  );
}

export function TrackingG({ step }: StepProps) {
  const rows = useTrackRows();
  const [run, setRun] = useState(false);
  return (
    <GuiWindow title="구매 문서 번호별 구매 문서" tcode={step.tcode} role={step.role} appToolbar={<GBtn onClick={() => setRun(true)}>▶ 실행 (F8)</GBtn>}>
      <div className="g-pad">
        <div className="g-sel-screen"><GField label="요구 추적 번호" value={TRACKING} w={120} lw={140} help="trackingNo" /><GField label="구매 조직" value="1010" w={60} lw={140} /></div>
        {run && <GTable minRows={4} rows={rows} rowKey={(r) => r.k} columns={[
          { key: 'n', label: '구매 문서', w: 100, render: (r) => r.no },
          { key: 'c', label: '범주', w: 80, render: (r) => r.cat },
          { key: 't', label: '유형', w: 200, render: (r) => r.type },
          { key: 's', label: '상태', w: 100, render: (r) => r.status },
          { key: 'v', label: '금액', w: 110, align: 'right', render: (r) => r.value },
        ]} />}
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 8 Monitor contract items */
export function MonitorF({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const ct = s.contract!;
  const released = ct.items.reduce((a, i) => a + i.released * i.price, 0);
  return (
    <FioriShell title="구매 계약 품목 모니터링" role={step.role}>
      <PageHeader title="구매 계약 품목 모니터링" subtitle="Monitor Purchase Contract Items (F2423)"
        kpis={[{ label: '목표 금액', value: fmtAmt(ct.targetValue, c.currency) }, { label: '릴리스 금액', value: fmtAmt(released, c.currency) }, { label: '소진율', value: `${Math.round((released / contractValue(ct.items)) * 100)} %` }]} />
      <FilterBar fields={[{ label: '계약', value: <FVal v={s.numbers.contract} /> }, { label: '표시 통화', value: <FVal v={c.currency} /> }, { label: '공급업체', value: <FVal v={SUPPLIER.no} /> }]} />
      <div className="f-page-body">
        <FTable title="계약 품목" count={ct.items.length} rowKey={(i) => i.item} rows={ct.items} columns={[
          { key: 'n', label: '계약 / 품목', render: (i) => `${s.numbers.contract} / ${i.item}` },
          { key: 'm', label: '자재', render: (i) => <><b>{i.text}</b><div className="f-muted">{i.material}</div></> },
          { key: 't', label: '목표 수량', align: 'right', render: (i) => `${i.target} PC` },
          { key: 'r', label: '릴리스 수량', align: 'right', render: (i) => <>{i.released} PC<Help k="releaseOrder" /></> },
          { key: 'o', label: '잔여 수량', align: 'right', render: (i) => `${i.target - i.released} PC` },
          { key: 'b', label: '소진율', render: (i) => <span className="use-bar" title={`${Math.round((i.released / i.target) * 100)}%`}><i style={{ width: `${(i.released / i.target) * 100}%` }} /></span> },
          { key: 'p', label: '순 가격', align: 'right', render: (i) => fmtAmt(i.price, c.currency) },
          { key: 'v', label: '유효 종료', render: () => fmtDate(ct.validTo, c.dateFormat) },
        ]} />
      </div>
    </FioriShell>
  );
}

export function MonitorG({ step }: StepProps) {
  const s = useBmd();
  const ct = s.contract!;
  return (
    <GuiWindow title="자재별 아웃라인 계약" tcode={step.tcode} role={step.role} appToolbar={<><GBtn>상세 정보</GBtn><GBtn>릴리스 문서</GBtn><GBtn>합계</GBtn></>}>
      <div className="g-pad">
        <GTable minRows={4} rows={ct.items} rowKey={(i) => i.item} columns={[
          { key: 'n', label: '구매 문서', w: 100, render: () => s.numbers.contract },
          { key: 'i', label: '품목', w: 40, render: (i) => i.item },
          { key: 'm', label: '자재', w: 60, render: (i) => i.material },
          { key: 'k', label: '유형', w: 40, render: () => 'MK' },
          { key: 't', label: '목표 수량', w: 80, align: 'right', render: (i) => i.target },
          { key: 'r', label: '릴리스됨', w: 80, align: 'right', render: (i) => i.released },
          { key: 'o', label: '잔여', w: 80, align: 'right', render: (i) => i.target - i.released },
          { key: 'p', label: '순 가격', w: 70, align: 'right', render: (i) => fmtNum(i.price) },
        ]} />
      </div>
    </GuiWindow>
  );
}

/* ============================================================ 9 Goods receipt · 10 Invoice */
export function GrF({ step }: StepProps) {
  const s = useBmd();
  return <GrFiori step={step} po={s.numbers.po} supplier={SUP} items={s.po!.items} posted={s.gr} onPost={s.postGR} />;
}
export function GrG({ step }: StepProps) {
  const s = useBmd();
  return <GrGui step={step} po={s.numbers.po} supplier={SUP} items={s.po!.items} posted={s.gr} onPost={s.postGR} />;
}

function useInvItems() {
  const s = useBmd();
  return s.po!.items.map((i) => ({ ...i, qty: s.gr?.qty[i.item] ?? 0 }));
}
export function InvoiceF({ step }: StepProps) {
  const s = useBmd();
  const c = useOrg();
  const items = useInvItems();
  const v = itemsValue(items);
  const journal: JournalLine[] = [
    { acc: c.glGrir, text: 'GR/IR 청산 – 상품', dc: '차변', amt: v },
    { acc: c.glPayables, text: `공급업체 ${SUPPLIER.no} (매입채무)`, dc: '대변', amt: v },
  ];
  return <InvoiceFiori step={step} po={s.numbers.po} supplier={SUP} items={items} posted={s.invoice} journal={journal} onPost={(r, a) => s.postInvoice(r, a)} />;
}
export function InvoiceG({ step }: StepProps) {
  const s = useBmd();
  return <InvoiceGui step={step} po={s.numbers.po} supplier={SUP} items={useInvItems()} posted={s.invoice} onPost={(r, a) => s.postInvoice(r, a)} />;
}

