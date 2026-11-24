/**
 * Phase 11 – Check Supplier Invoice List (F1060A / MIR4)   BPD 4.1.20
 * Phase 12 – Clear GR / IR (MR11, WebGUI in Fiori)           BPD 4.1.23
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, MessageStrip } from '@ui5/webcomponents-react';
import { useDemo, grQty } from '../store';
import { addDays, fiscalYear, fmtAmt, fmtDate, fmtNum, fmtQty, todayIso } from '../format';
import { AnchorBar, FBtn, FilterBar, FioriShell, FormGroup, FTable, FVal, PageHeader, Section, Status, FLink } from '../components/fiori/Fiori';
import { GBtn, GField, GTable, GuiWindow, GCheck } from '../components/gui/Gui';
import { payTermText } from './PurchaseOrder';
import type { StepProps } from './types';

/* ===================================================================== Phase 11 */
const otherInvoices = () => [
  { doc: '5105600212', ref: 'R-88213', supplier: 'Domestic 10 Supplier 1', date: addDays(todayIso(), -5), amount: 3300, status: '전기됨', pay: '지급 보류', mine: false },
  { doc: '5105600207', ref: 'R-88104', supplier: 'Domestic 10 Supplier 2', date: addDays(todayIso(), -12), amount: 1750, status: '전기됨', pay: '지급됨', mine: false },
];

export function DisplayInvoiceFiori({ step }: StepProps) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  const nav = useNavigate();
  const inv = s.invoice!;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('품목');
  const rows = [
    { doc: s.numbers.invoiceDocNumber, ref: inv.reference, supplier: c.supplierName, date: inv.postingDate, amount: inv.amount, status: '전기됨', pay: '지급 대상', mine: true },
    ...otherInvoices(),
  ];
  const dueDisc = addDays(inv.postingDate, 14);
  const due = addDays(inv.postingDate, 45);

  if (!open) {
    return (
      <FioriShell title="공급업체 송장 리스트" role={step.role}>
        <PageHeader title="공급업체 송장 리스트" subtitle="Supplier Invoices List" />
        <FilterBar fields={[
          { label: '회사 코드', value: <FVal v={c.companyCode} /> },
          { label: '송장 발행처', value: <FVal v="" /> },
          { label: '전기 일자', value: <FVal v={`${fmtDate(addDays(todayIso(), -30), df)} – ${fmtDate(todayIso(), df)}`} /> },
          { label: '상태', value: <FVal v="전기됨" /> },
        ]} />
        <div className="f-page-body">
          <div className="f-icon-tabs">
            <span className="active">전기됨 ({rows.length})</span><span>역분개 (0)</span><span>파킹됨 (0)</span><span>초안 (0)</span>
          </div>
          <FTable title="공급업체 송장" count={rows.length} rows={rows} rowKey={(r) => r.doc} nav onRowClick={(r) => r.mine && setOpen(true)}
            columns={[
              { key: 'd', label: '송장 전표', render: (r) => <><FLink>{r.doc}</FLink>{r.mine && <span className="mine-tag">데모</span>}<div className="f-muted">{fiscalYear()}</div></> },
              { key: 'r', label: '참조', render: (r) => r.ref },
              { key: 's', label: '송장 발행처', render: (r) => r.supplier },
              { key: 'p', label: '전기 일자', render: (r) => fmtDate(r.date, df) },
              { key: 'a', label: '총 금액', align: 'right', render: (r) => fmtAmt(r.amount, c.currency) },
              { key: 'st', label: '상태', render: (r) => <Status state="Positive" text={r.status} /> },
              { key: 'py', label: '지급 상태', render: (r) => <Status state={r.pay === '지급 보류' ? 'Negative' : r.pay === '지급됨' ? 'Positive' : 'Information'} text={r.pay} /> },
            ]} />
        </div>
      </FioriShell>
    );
  }

  return (
    <FioriShell title="공급업체 송장 리스트" role={step.role}>
      <PageHeader
        breadcrumb={['공급업체 송장 리스트']}
        title={`공급업체 송장 ${s.numbers.invoiceDocNumber}`}
        subtitle={`${c.supplierName} (${c.supplierNumber}) · 참조 ${inv.reference}`}
        actions={<><FBtn onClick={() => setOpen(false)}>리스트로</FBtn><FBtn>역분개</FBtn><FBtn trans icon="copy">복사</FBtn></>}
        attrs={[
          { label: '회사 코드', value: c.companyCode },
          { label: '송장 일자', value: fmtDate(inv.invoiceDate, df) },
          { label: '전기 일자', value: fmtDate(inv.postingDate, df) },
          { label: '지급 조건', value: `${c.paymentTerms} – ${payTermText(c.paymentTerms)}`, help: 'paymentTerms' },
        ]}
        kpis={[
          { label: '총 송장 금액', value: <span className="f-amount">{fmtAmt(inv.amount, c.currency)}</span> },
          { label: '분개', value: <FLink>{s.numbers.accountingDocNumber}</FLink> },
        ]}
        status={<Status state="Positive" text="전기됨" large />}
      />
      <AnchorBar tabs={['품목', '세금', '타임라인', '프로세스 흐름', '노트']} active={tab} onChange={setTab} />
      <div className="f-page-body">
        {tab === '품목' && <Section title="구매 오더 참조 품목">
          <FTable rowKey={() => '1'} rows={[1]} columns={[
            { key: 'po', label: '구매 오더', render: () => <FLink onClick={() => nav('/step/preview-po')}>{s.numbers.poNumber} / 10</FLink> },
            { key: 'gr', label: '입고 참조', render: () => <FLink onClick={() => nav('/step/gr-detail')}>{s.grDocs.map((d) => d.docNo).join(', ')}</FLink> },
            { key: 'm', label: '자재', render: () => `${c.materialNumber} – ${c.materialDescription}` },
            { key: 'q', label: '수량', align: 'right', render: () => `${fmtQty(inv.qty)} ${c.unit}` },
            { key: 'a', label: '금액', align: 'right', render: () => fmtAmt(inv.amount, c.currency) },
            { key: 'g', label: 'G/L 계정', render: () => `${c.glGrir} (GR/IR)` },
            { key: 't', label: '세금 코드', render: () => c.taxCode },
          ]} />
        </Section>}
        {tab === '세금' && <Section title="세금"><FormGroup cols={3} fields={[
          { label: '세금 코드', value: `${c.taxCode} (매입세 0%)` }, { label: '세금 기준 금액', value: fmtAmt(inv.amount, c.currency) }, { label: '세액', value: fmtAmt(0, c.currency) },
        ]} /></Section>}
        {tab === '타임라인' && <Section title="송장 타임라인">
          <div className="timeline">
            {[
              { d: inv.invoiceDate, t: '송장 일자', i: 'document' },
              { d: inv.postingDate, t: '전기 일자', i: 'accept' },
              { d: dueDisc, t: '현금 할인 기한 (3%)', i: 'lead' },
              { d: due, t: '순 지급 기한', i: 'appointment' },
            ].map((e) => (
              <div key={e.t} className="timeline-item"><Icon name={e.i} /><b>{fmtDate(e.d, df)}</b><span>{e.t}</span></div>
            ))}
          </div>
        </Section>}
        {tab === '프로세스 흐름' && <Section title="프로세스 흐름">
          <div className="pflow">
            {[
              ['구매 오더', s.numbers.poNumber], ['입고', s.grDocs[0]?.docNo ?? ''], ['공급업체 송장', s.numbers.invoiceDocNumber], ['분개', s.numbers.accountingDocNumber],
            ].map(([t, n], i, arr) => (
              <div key={t} className="pflow-item">
                <div className={`pflow-node ${t === '공급업체 송장' ? 'cur' : ''}`}><div className="pflow-t">{t}</div><div className="pflow-n">{n}</div><div className="pflow-s"><Icon name="message-success" /> 완료</div></div>
                {i < arr.length - 1 && <div className="pflow-conn" />}
              </div>
            ))}
          </div>
        </Section>}
        {tab === '노트' && <p className="f-muted">노트가 없습니다.</p>}
      </div>
    </FioriShell>
  );
}

export function DisplayInvoiceGui({ step }: StepProps) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  const inv = s.invoice!;
  const [fi, setFi] = useState(false);
  return (
    <GuiWindow title={`송장 전표 ${s.numbers.invoiceDocNumber} ${fiscalYear()} 표시`} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn onClick={() => setFi(!fi)}>후속 전표</GBtn><GBtn>역분개</GBtn><GBtn>메시지</GBtn></>}>
      <div className="g-pad">
        {fi ? <>
          <div className="g-row">
            <GField label="전표 번호" value={s.numbers.accountingDocNumber} w={100} lw={80} />
            <GField label="회사 코드" value={c.companyCode} w={50} lw={70} />
            <GField label="전표 유형" value="RE" w={40} lw={70} />
          </div>
          <GTable minRows={4} rows={[
            { n: '1', pk: '31', acc: c.supplierNumber, t: c.supplierName, a: -inv.amount },
            { n: '2', pk: '86', acc: c.glGrir, t: 'GR/IR Clearing - Purchased Goods', a: inv.amount },
          ]} rowKey={(r) => r.n} columns={[
            { key: 'n', label: '품목', w: 40, render: (r) => r.n },
            { key: 'pk', label: 'PK', w: 30, render: (r) => r.pk },
            { key: 'a', label: '계정', w: 90, render: (r) => r.acc },
            { key: 't', label: '내역', w: 230, render: (r) => r.t },
            { key: 'm', label: '금액', w: 110, align: 'right', render: (r) => fmtNum(r.a) },
            { key: 'c', label: '통화', w: 40, render: () => c.currency },
          ]} />
        </> : <>
          <div className="g-cols">
            <div>
              <GField label="송장 일자" value={fmtDate(inv.invoiceDate, df)} w={90} lw={100} />
              <GField label="참조" value={inv.reference} w={150} lw={100} />
              <GField label="전기 일자" value={fmtDate(inv.postingDate, df)} w={90} lw={100} />
              <GField label="금액" value={fmtNum(inv.amount)} w={110} lw={100} align="right" suffix={c.currency} />
              <GField label="지급 조건" value={c.paymentTerms} w={50} lw={100} suffix={payTermText(c.paymentTerms)} />
            </div>
            <div className="g-vendor-box"><b>공급업체 {c.supplierNumber}</b><br />{c.supplierName}<br />{c.supplierCity}</div>
          </div>
          <GTable minRows={3} rows={[1]} rowKey={() => '1'} columns={[
            { key: 'i', label: '품목', w: 40, render: () => '1' },
            { key: 'a', label: '금액', w: 100, align: 'right', render: () => fmtNum(inv.amount) },
            { key: 'q', label: '수량', w: 70, align: 'right', render: () => fmtQty(inv.qty) },
            { key: 'po', label: '구매 오더', w: 90, render: () => s.numbers.poNumber },
            { key: 'it', label: '품목', w: 40, render: () => '10' },
            { key: 't', label: 'PO 텍스트', w: 220, render: () => c.materialDescription },
            { key: 'tc', label: '세금 코드', w: 50, render: () => c.taxCode },
          ]} />
        </>}
      </div>
    </GuiWindow>
  );
}

/* ===================================================================== Phase 12 */
function useClearingRows() {
  const s = useDemo();
  const c = s.config;
  const grVal = grQty(s) * c.netPrice;
  const irVal = s.invoice?.amount ?? 0;
  return [
    { po: s.numbers.poNumber, item: '10', supplier: c.supplierNumber, material: c.materialNumber, grQ: grQty(s), irQ: s.invoice?.qty ?? 0, grV: grVal, irV: irVal, diff: Math.round((grVal - irVal) * 100) / 100, mine: true },
    { po: '4500000411', item: '10', supplier: '10300001', material: 'TG0012', grQ: 120, irQ: 110, grV: 3600, irV: 3300, diff: 300, mine: false },
  ];
}

function ClearingBody({ webgui }: { webgui?: boolean }) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  const rows = useClearingRows();
  const [executed, setExecuted] = useState(s.cleared);
  const [sel, setSel] = useState<string[]>(['4500000411']);
  return !executed ? (
    <div className="g-pad">
      <div className="g-sel-screen">
        <div className="g-sel-title">구매 문서에 대한 선택</div>
        <GField label="회사 코드" value={c.companyCode} w={60} lw={170} required help="companyCode" />
        <GField label="플랜트" value={c.plant} w={60} lw={170} />
        <GField label="구매 문서" value="" w={110} lw={170} suffix="~" />
        <GField label="구매 오더 일자 끝" value={fmtDate(todayIso(), df)} w={90} lw={170} />
        <div className="g-sel-title">처리</div>
        <GCheck label="자동 청산" checked={false} />
        <GCheck label="전기 전 미리 보기" checked />
        <div style={{ marginTop: 10 }}><GBtn onClick={() => setExecuted(true)}>▶ 실행 (F8)</GBtn></div>
        {webgui && <p className="g-dim" style={{ marginTop: 8 }}>Clear GR/IR Clearing Account (MR11)은 S/4HANA Cloud에서 SAP GUI for HTML 앱으로 제공됩니다.</p>}
      </div>
    </div>
  ) : (
    <div className="g-pad">
      {s.cleared && <div className="g-ok-box">계정 유지보수 전표 {s.numbers.clearingDocNumber} / {fiscalYear()}이(가) 전기되었습니다.</div>}
      <GTable title={`GR/IR 청산 계정 유지보수 – 회사 코드 ${c.companyCode}`} minRows={5} rows={rows} rowKey={(r) => r.po}
        selected={sel} onSelect={(k) => setSel((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))}
        columns={[
          { key: 'po', label: '구매 문서', w: 90, render: (r) => r.po },
          { key: 'it', label: '품목', w: 40, render: (r) => r.item },
          { key: 'su', label: '공급업체', w: 80, render: (r) => r.supplier },
          { key: 'm', label: '자재', w: 70, render: (r) => r.material },
          { key: 'gq', label: 'GR 수량', w: 70, align: 'right', render: (r) => fmtQty(r.grQ) },
          { key: 'iq', label: 'IR 수량', w: 70, align: 'right', render: (r) => fmtQty(r.irQ) },
          { key: 'gv', label: 'GR 금액', w: 90, align: 'right', render: (r) => fmtNum(r.grV) },
          { key: 'iv', label: 'IR 금액', w: 90, align: 'right', render: (r) => fmtNum(r.irV) },
          { key: 'd', label: '차이', w: 90, align: 'right', render: (r) => <b className={r.diff !== 0 ? 'neg' : ''}>{fmtNum(r.diff)}</b> },
          { key: 'cl', label: '상태', w: 80, render: (r) => (r.diff === 0 ? '균형' : s.cleared && sel.includes(r.po) ? '청산됨' : '미결') },
        ]} />
      <div className="g-row" style={{ marginTop: 6 }}>
        <GBtn disabled={s.cleared || !sel.length || rows.filter((r) => sel.includes(r.po)).every((r) => r.diff === 0)} onClick={() => s.clearGRIR()}>청산 전기 (Ctrl+F12)</GBtn>
        <GBtn onClick={() => setExecuted(false)}>선택 화면</GBtn>
        <span className="g-dim">데모 PO의 GR/IR 차이: {fmtAmt(rows[0].diff, c.currency)} {rows[0].diff === 0 ? '(3-way match 완료 – 청산 불필요)' : ''}</span>
      </div>
    </div>
  );
}

export function ClearGRIRFiori({ step }: StepProps) {
  return (
    <FioriShell title="GR/IR 청산 계정 유지보수" role={step.role}>
      <div className="webgui-host">
        <MessageStrip design="Information" hideCloseButton className="f-strip">
          GR/IR 청산 계정 유지보수(MR11)는 Fiori Launchpad 안에서 SAP GUI for HTML로 실행됩니다.
        </MessageStrip>
        <GuiWindow title={step.guiTitle} tcode={step.tcode} role={step.role} webgui>
          <ClearingBody webgui />
        </GuiWindow>
      </div>
    </FioriShell>
  );
}

export function ClearGRIRGui({ step }: StepProps) {
  return (
    <GuiWindow title={step.guiTitle} tcode={step.tcode} role={step.role}>
      <ClearingBody />
    </GuiWindow>
  );
}
