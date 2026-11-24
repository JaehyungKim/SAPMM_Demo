/**
 * Material Documents Overview (F1077), shared by
 *  Phase 8 Preview Goods Receipt Slip and Label (MB90)  BPD 4.1.10
 *  Phase 9 Check Goods Receipt Details (MB03)            BPD 4.1.11
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo, GrDoc, DemoConfig } from '../store';
import { addDays, fiscalYear, fmtAmt, fmtDate, fmtNum, fmtQty, todayIso } from '../format';
import { AnchorBar, FBtn, FilterBar, FioriShell, FormGroup, FTable, FVal, PageHeader, Section, Status, FLink } from '../components/fiori/Fiori';
import { GBtn, GField, GTable, GTabs, GuiWindow } from '../components/gui/Gui';
import { PdfDialog } from './PurchaseOrder';
import type { StepProps } from './types';

type Focus = 'slip' | 'detail';

const OTHER_DOCS = (c: DemoConfig) => [
  { docNo: '5000003921', mvt: '101', text: 'GR goods receipt', material: 'TG0012', qty: 120, date: addDays(todayIso(), -4), user: 'WAREHOUSE_CLERK', mine: false },
  { docNo: '5000003874', mvt: '201', text: 'GI for cost center', material: c.materialNumber, qty: 5, date: addDays(todayIso(), -9), user: 'INVENTORY_MANAGER', mine: false },
];

/** Accounting lines created by a GR (101): inventory debit vs. GR/IR credit. */
const fiLines = (c: DemoConfig, d: GrDoc) => {
  const amt = d.qty * c.netPrice;
  return [
    { n: '1', key: '89', acc: c.glInventory, text: 'Inventory - Trading Goods', dc: '차변', amt },
    { n: '2', key: '96', acc: c.glGrir, text: 'GR/IR Clearing - Purchased Goods', dc: '대변', amt: -amt },
  ];
};

export function GrSlip({ d }: { d: GrDoc }) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  return (
    <div className="pdf-page">
      <div className="pdf-head">
        <div><div className="pdf-company">{c.companyName}</div><div className="pdf-small">Plant {c.plant} {c.plantName}</div></div>
        <div className="pdf-doc-title">입고 전표<br /><span>Goods Receipt Slip</span></div>
      </div>
      <div className="pdf-cols">
        <div className="pdf-box"><div className="pdf-grid">
          <span>자재 전표</span><b>{d.docNo} / {fiscalYear()}</b>
          <span>전기 일자</span><b>{fmtDate(d.postingDate, df)}</b>
          <span>납품서</span><b>{d.deliveryNote}</b>
        </div></div>
        <div className="pdf-box"><div className="pdf-grid">
          <span>구매 오더</span><b>{s.numbers.poNumber} / 00010</b>
          <span>공급업체</span><b>{c.supplierNumber} {c.supplierName}</b>
          <span>이동 유형</span><b>101 GR goods receipt</b>
        </div></div>
      </div>
      <table className="pdf-table" style={{ marginTop: 16 }}>
        <thead><tr><th>자재</th><th>내역</th><th>저장 위치</th><th className="r">수량</th><th>단위</th></tr></thead>
        <tbody><tr><td>{c.materialNumber}</td><td>{c.materialDescription}</td><td>{d.sloc}</td><td className="r">{fmtQty(d.qty)}</td><td>{c.unit}</td></tr></tbody>
      </table>
      <div className="pdf-sign"><div>수령인 서명</div><div>품질 확인</div></div>
    </div>
  );
}

function GrLabel({ d }: { d: GrDoc }) {
  const c = useDemo((s) => s.config);
  return (
    <div className="pdf-label-sheet">
      <div className="pdf-gr-label">
        <div className="pdf-small">GOODS RECEIPT LABEL</div>
        <div className="pdf-label-mat">{c.materialNumber}</div>
        <div>{c.materialDescription}</div>
        <div className="pdf-barcode">{Array.from({ length: 46 }).map((_, i) => <i key={i} style={{ width: (i * 7) % 3 + 1 }} />)}</div>
        <div className="pdf-grid"><span>수량</span><b>{fmtQty(d.qty)} {c.unit}</b><span>저장 위치</span><b>{c.plant} / {d.sloc}</b><span>자재 전표</span><b>{d.docNo}</b></div>
      </div>
    </div>
  );
}

export function MatDocFiori({ step, focus }: StepProps & { focus: Focus }) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  const nav = useNavigate();
  const [open, setOpen] = useState<string | null>(s.grDocs.length ? s.grDocs[s.grDocs.length - 1].docNo : null);
  const [tab, setTab] = useState(focus === 'slip' ? '출력 관리' : '품목');
  const [pdf, setPdf] = useState<'slip' | 'label' | null>(null);
  const doc = s.grDocs.find((d) => d.docNo === open);

  const listRows = [
    ...s.grDocs.map((d) => ({ docNo: d.docNo, mvt: '101', text: 'GR goods receipt', material: c.materialNumber, qty: d.qty, date: d.postingDate, user: 'WAREHOUSE_CLERK', mine: true })),
    ...OTHER_DOCS(c),
  ];

  if (!doc) {
    return (
      <FioriShell title="자재 전표 개요" role={step.role}>
        <PageHeader title="자재 전표 개요" subtitle="Material Documents Overview" />
        <FilterBar fields={[
          { label: '플랜트', value: <FVal v={c.plant} /> },
          { label: '자재 전표', value: <FVal v={s.grDocs[0]?.docNo ?? ''} /> },
          { label: '자재', value: <FVal v={c.materialNumber} /> },
          { label: '전기 일자', value: <FVal v={`${fmtDate(addDays(todayIso(), -30), df)} – ${fmtDate(todayIso(), df)}`} /> },
        ]} />
        <div className="f-page-body">
          <FTable title="자재 전표" count={listRows.length} rows={listRows} rowKey={(r) => r.docNo} nav
            onRowClick={(r) => r.mine && setOpen(r.docNo)}
            columns={[
              { key: 'd', label: '자재 전표', render: (r) => <><FLink>{r.docNo}</FLink> / {fiscalYear()}</> },
              { key: 'm', label: '이동 유형', render: (r) => `${r.mvt} (${r.text})` },
              { key: 'mat', label: '자재', render: (r) => r.material },
              { key: 'q', label: '수량', align: 'right', render: (r) => `${fmtQty(r.qty)} ${c.unit}` },
              { key: 'p', label: '전기 일자', render: (r) => fmtDate(r.date, df) },
              { key: 'u', label: '생성자', render: (r) => r.user },
            ]} />
        </div>
      </FioriShell>
    );
  }

  const lines = fiLines(c, doc);
  return (
    <FioriShell title="자재 전표 개요" role={step.role}>
      <PageHeader
        breadcrumb={['자재 전표 개요']}
        title={`자재 전표 ${doc.docNo}`}
        subtitle={`${fiscalYear()} · GR goods receipt (101)`}
        actions={<><FBtn onClick={() => setOpen(null)}>리스트로</FBtn><FBtn emph disabled>취소(역분개)</FBtn></>}
        attrs={[
          { label: '전기 일자', value: fmtDate(doc.postingDate, df) },
          { label: '문서 일자', value: fmtDate(doc.postingDate, df) },
          { label: '납품서', value: doc.deliveryNote, help: 'deliveryNote' },
          { label: '생성자', value: 'WAREHOUSE_CLERK' },
        ]}
        kpis={[{ label: '금액', value: <span className="f-amount">{fmtAmt(doc.qty * c.netPrice, c.currency)}</span> }]}
        status={<Status state="Positive" text="전기됨" large />}
      />
      <AnchorBar tabs={['일반 정보', '품목', '프로세스 흐름', '회계 전표', '출력 관리', '첨부 파일']} active={tab} onChange={setTab} />
      <div className="f-page-body">
        {tab === '일반 정보' && <Section title="일반 정보"><FormGroup cols={3} fields={[
          { label: '자재 전표', value: doc.docNo },
          { label: '자재 전표 연도', value: fiscalYear() },
          { label: '트랜잭션 유형', value: '입고 (WE)' },
          { label: '전기 일자', value: fmtDate(doc.postingDate, df) },
          { label: '문서 일자', value: fmtDate(doc.postingDate, df) },
          { label: '납품서', value: doc.deliveryNote, help: 'deliveryNote' },
        ]} /></Section>}
        {tab === '품목' && <Section title="자재 전표 품목">
          <FTable rowKey={() => '1'} rows={[1]} columns={[
            { key: 'i', label: '품목', render: () => '1' },
            { key: 'm', label: '자재', render: () => <><b>{c.materialDescription}</b><div className="f-muted">{c.materialNumber}</div></> },
            { key: 'mv', label: '이동 유형', render: () => '101 – GR goods receipt' },
            { key: 'p', label: '플랜트 / 저장 위치', render: () => `${c.plant} / ${doc.sloc}` },
            { key: 'q', label: '수량', align: 'right', render: () => `${fmtQty(doc.qty)} ${c.unit}` },
            { key: 'st', label: '재고 유형', render: () => '가용 재고' },
            { key: 'po', label: '구매 오더', render: () => <FLink onClick={() => nav('/step/preview-po')}>{s.numbers.poNumber} / 10</FLink> },
            { key: 'a', label: '금액', align: 'right', render: () => fmtAmt(doc.qty * c.netPrice, c.currency) },
          ]} />
        </Section>}
        {tab === '프로세스 흐름' && <Section title="프로세스 흐름">
          <div className="pflow">
            {[
              s.poFromPr && { t: '구매 요청', n: s.numbers.prNumber, st: '완료' },
              { t: '구매 오더', n: s.numbers.poNumber, st: '발송됨' },
              { t: '자재 전표', n: doc.docNo, st: '전기됨', cur: true },
              { t: '분개', n: doc.fiDocNo, st: '전기됨' },
              s.invoice && { t: '공급업체 송장', n: s.numbers.invoiceDocNumber, st: '전기됨' },
            ].filter(Boolean).map((n, i, arr) => {
              const x = n as { t: string; n: string; st: string; cur?: boolean };
              return (
                <div key={x.t} className="pflow-item">
                  <div className={`pflow-node ${x.cur ? 'cur' : ''}`}>
                    <div className="pflow-t">{x.t}</div>
                    <div className="pflow-n">{x.n}</div>
                    <div className="pflow-s"><Icon name="message-success" /> {x.st}</div>
                  </div>
                  {i < arr.length - 1 && <div className="pflow-conn" />}
                </div>
              );
            })}
          </div>
        </Section>}
        {tab === '회계 전표' && <Section title={`분개 ${doc.fiDocNo} (WE)`}>
          <FTable rowKey={(r) => r.n} rows={lines} columns={[
            { key: 'n', label: '품목', render: (r) => r.n },
            { key: 'k', label: '전기 키', render: (r) => r.key },
            { key: 'a', label: 'G/L 계정', render: (r) => <><b>{r.acc}</b><div className="f-muted">{r.text}</div></> },
            { key: 'd', label: '차변/대변', render: (r) => r.dc },
            { key: 'm', label: '회사 코드 통화 금액', align: 'right', render: (r) => <span className={r.amt < 0 ? 'neg' : ''}>{fmtAmt(r.amt, c.currency)}</span> },
          ]} />
        </Section>}
        {tab === '출력 관리' && <Section title="출력 관리">
          <FTable rowKey={(r) => r.t} rows={[{ t: 'GOODS_RECEIPT_PO_SLIP', k: 'slip' as const }, { t: 'GOODS_RECEIPT_LABEL', k: 'label' as const }]} columns={[
            { key: 't', label: '출력 유형', render: (r) => r.t },
            { key: 'c', label: '채널', render: () => '인쇄' },
            { key: 'p', label: '인쇄 대기열', render: () => 'DEFAULT' },
            { key: 's', label: '상태', render: () => <Status state="Positive" text="완료됨" /> },
            { key: 'a', label: '', render: (r) => <FLink onClick={() => setPdf(r.k)}>문서 표시</FLink> },
          ]} />
        </Section>}
        {tab === '첨부 파일' && <p className="f-muted">첨부 파일이 없습니다.</p>}
      </div>
      <PdfDialog open={pdf === 'slip'} onClose={() => setPdf(null)} title={`입고 전표 ${doc.docNo}`}><GrSlip d={doc} /></PdfDialog>
      <PdfDialog open={pdf === 'label'} onClose={() => setPdf(null)} title={`입고 라벨 ${doc.docNo}`}><GrLabel d={doc} /></PdfDialog>
    </FioriShell>
  );
}

export function MatDocGui({ step, focus }: StepProps & { focus: Focus }) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  const doc = s.grDocs[s.grDocs.length - 1];
  const [tab, setTab] = useState('일반');
  const [fi, setFi] = useState(false);
  const [pdf, setPdf] = useState(false);
  if (!doc) return null;
  if (focus === 'slip') {
    return (
      <GuiWindow title="자재 전표 출력" tcode={step.tcode} role={step.role}
        appToolbar={<><GBtn onClick={() => setPdf(true)}>🖨 인쇄 미리보기</GBtn><GBtn>출력</GBtn><GBtn>모두 선택</GBtn></>}>
        <div className="g-pad">
          <GTable title="출력 리스트" minRows={5} rows={[{ t: 'GOODS_RECEIPT_PO_SLIP' }, { t: 'GOODS_RECEIPT_LABEL' }]} rowKey={(r) => r.t} selected={['GOODS_RECEIPT_PO_SLIP']}
            columns={[
              { key: 'st', label: '상태', w: 40, render: () => '●' },
              { key: 'd', label: '자재 전표', w: 100, render: () => doc.docNo },
              { key: 'y', label: '연도', w: 50, render: () => fiscalYear() },
              { key: 't', label: '출력 유형', w: 200, render: (r) => r.t },
              { key: 'm', label: '자재', w: 80, render: () => c.materialNumber },
              { key: 'p', label: '프린터', w: 80, render: () => 'LP01' },
            ]} />
        </div>
        <PdfDialog open={pdf} onClose={() => setPdf(false)} title={`입고 전표 ${doc.docNo}`}><GrSlip d={doc} /></PdfDialog>
      </GuiWindow>
    );
  }
  return (
    <GuiWindow title={`자재 전표 ${doc.docNo} 표시: 상세 ${fi ? '– 회계 전표' : '0001 / 0001'}`} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>헤더</GBtn><GBtn>품목</GBtn><GBtn onClick={() => setFi(!fi)}>FI 전표</GBtn></>}>
      <div className="g-pad">
        {!fi ? <>
          <div className="g-row">
            <GField label="자재 전표" value={doc.docNo} w={100} lw={80} />
            <GField label="연도" value={fiscalYear()} w={50} lw={40} />
          </div>
          <GTabs tabs={['일반', '문서 정보']} active={tab} onChange={setTab}>
            <div className="g-cols">
              <div>
                <GField label="문서 일자" value={fmtDate(doc.postingDate, df)} w={90} lw={90} />
                <GField label="전기 일자" value={fmtDate(doc.postingDate, df)} w={90} lw={90} />
              </div>
              <div>
                <GField label="납품서" value={doc.deliveryNote} w={140} lw={80} help="deliveryNote" />
                <GField label="생성자" value="WAREHOUSE_CLERK" w={140} lw={80} />
              </div>
            </div>
          </GTabs>
          <GTable minRows={3} rows={[doc]} rowKey={(r) => r.docNo} columns={[
            { key: 'i', label: '품목', w: 40, render: () => '1' },
            { key: 'm', label: '자재', w: 80, render: () => c.materialNumber },
            { key: 'tx', label: '자재 내역', w: 200, render: () => c.materialDescription },
            { key: 'q', label: '수량', w: 70, align: 'right', render: (r) => fmtQty(r.qty) },
            { key: 'u', label: 'EUn', w: 40, render: () => c.unit },
            { key: 'p', label: '플랜트', w: 50, render: () => c.plant },
            { key: 'sl', label: 'SLoc', w: 50, render: (r) => r.sloc },
            { key: 'mv', label: 'MvT', w: 40, render: () => '101' },
            { key: 'po', label: '구매 오더', w: 90, render: () => s.numbers.poNumber },
          ]} />
        </> : <>
          <div className="g-row">
            <GField label="전표 번호" value={doc.fiDocNo} w={100} lw={80} />
            <GField label="회사 코드" value={c.companyCode} w={50} lw={70} />
            <GField label="회계 연도" value={fiscalYear()} w={50} lw={70} />
            <GField label="전표 유형" value="WE" w={40} lw={70} />
          </div>
          <GTable minRows={4} rows={fiLines(c, doc)} rowKey={(r) => r.n} columns={[
            { key: 'n', label: '품목', w: 40, render: (r) => r.n },
            { key: 'k', label: 'PK', w: 30, render: (r) => r.key },
            { key: 'a', label: '계정', w: 90, render: (r) => r.acc },
            { key: 't', label: '내역', w: 230, render: (r) => r.text },
            { key: 'm', label: '금액', w: 110, align: 'right', render: (r) => fmtNum(r.amt) },
            { key: 'c', label: '통화', w: 40, render: () => c.currency },
          ]} />
        </>}
      </div>
    </GuiWindow>
  );
}

export const GrSlipFiori = ({ step }: StepProps) => <MatDocFiori step={step} focus="slip" />;
export const GrSlipGui = ({ step }: StepProps) => <MatDocGui step={step} focus="slip" />;
export const GrDetailFiori = ({ step }: StepProps) => <MatDocFiori step={step} focus="detail" />;
export const GrDetailGui = ({ step }: StepProps) => <MatDocGui step={step} focus="detail" />;
