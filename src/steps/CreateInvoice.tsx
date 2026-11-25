/** Phase 10 – Create Supplier Invoice with PO/GR relation (F0859 / MIRO). BPD 4.1.16.1 Option A */
import { pc } from '../josa';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Icon, MessageStrip } from '@ui5/webcomponents-react';
import { useDemo, grQty } from '../store';
import { fiscalYear, fmtAmt, fmtDate, fmtNum, fmtQty, todayIso } from '../format';
import { FBtn, FInput, FioriShell, FooterBar, FormGroup, FTable, PageHeader, Section, Status, FLink } from '../components/fiori/Fiori';
import { GBtn, GCheck, GField, GLight, GTable, GTabs, GuiWindow } from '../components/gui/Gui';
import { Help } from '../components/Help';
import { payTermText } from './PurchaseOrder';
import { useSharedState } from '../sharedState';
import type { StepProps } from './types';

function useInvoiceForm() {
  const s = useDemo();
  const c = s.config;
  const gr = grQty(s);
  const expected = Math.round(gr * c.netPrice * 100) / 100;
  const k = `inv:${s.numbers.invoiceDocNumber}:${s.grDocs.length}:`;
  const [reference, setReference] = useSharedState(k + 'ref', `INV-${fiscalYear()}-001`);
  const [gross, setGross] = useSharedState(k + 'gross', String(expected.toFixed(2)));
  const [poRef, setPoRef] = useSharedState(k + 'po', s.numbers.poNumber);
  const [added, setAdded] = useSharedState(k + 'added', false);
  const [qty, setQty] = useSharedState(k + 'qty', gr);
  const [amount, setAmount] = useSharedState(k + 'amount', expected);
  const [selected, setSelected] = useSharedState(k + 'sel', true);
  const grossNum = Number(gross.replace(/,/g, '')) || 0;
  const items = added && selected ? amount : 0;
  const tax = 0; // V0
  const balance = Math.round((grossNum - items - tax) * 100) / 100;
  const addRef = () => {
    if (poRef.trim() === s.numbers.poNumber) { setAdded(true); setQty(gr); setAmount(expected); return true; }
    return false;
  };
  return { s, c, gr, expected, reference, setReference, gross, setGross, grossNum, poRef, setPoRef, added, addRef, qty, setQty, amount, setAmount, selected, setSelected, items, tax, balance };
}

function SimDialog({ open, onClose, f }: { open: boolean; onClose: () => void; f: ReturnType<typeof useInvoiceForm> }) {
  const { c } = f;
  return (
    <Dialog open={open} headerText="시뮬레이션" onClose={onClose} style={{ width: 760 }}
      footer={<div className="f-dialog-footer"><FBtn onClick={onClose}>닫기</FBtn></div>}>
      <FTable rowKey={(r) => r.n} rows={[
        { n: '1', key: '31', acc: `${c.supplierNumber}`, text: c.supplierName, gl: c.glPayables, amt: -f.items },
        { n: '2', key: '86', acc: c.glGrir, text: 'GR/IR Clearing - Purchased Goods', gl: c.glGrir, amt: f.items },
      ]} columns={[
        { key: 'n', label: '품목', render: (r) => r.n },
        { key: 'k', label: '전기 키', render: (r) => r.key },
        { key: 'a', label: '계정', render: (r) => <><b>{r.acc}</b><div className="f-muted">{r.text}</div></> },
        { key: 'g', label: 'G/L 계정', render: (r) => r.gl },
        { key: 't', label: '세금 코드', render: () => c.taxCode },
        { key: 'm', label: '금액', align: 'right', render: (r) => <span className={r.amt < 0 ? 'neg' : ''}>{fmtAmt(r.amt, c.currency)}</span> },
      ]} />
    </Dialog>
  );
}

export function CreateInvoiceFiori({ step }: StepProps) {
  const f = useInvoiceForm();
  const { s, c } = f;
  const df = c.dateFormat;
  const nav = useNavigate();
  const [sim, setSim] = useState(false);
  const [done, setDone] = useState(false);
  const [refErr, setRefErr] = useState(false);
  const posted = s.invoiceStatus === 'Posted';
  const post = () => {
    s.postInvoice({ reference: f.reference, amount: f.items, qty: f.qty, invoiceDate: todayIso(), postingDate: todayIso() });
    setDone(true);
  };
  const balOk = f.added && f.balance === 0;
  return (
    <FioriShell title="공급업체 송장 생성" role={step.role}>
      <PageHeader
        title={posted ? `공급업체 송장 ${s.numbers.invoiceDocNumber}` : '공급업체 송장 생성'}
        subtitle={`송장 발행처: ${c.supplierName} (${c.supplierNumber})`}
        kpis={[
          { label: '총 송장 금액', value: <span className="f-amount">{fmtAmt(f.grossNum, c.currency)}</span> },
          { label: '잔액', value: <span className={`f-balance ${balOk ? 'ok' : 'bad'}`}><Icon name={balOk ? 'status-positive' : 'status-negative'} /> {fmtAmt(f.balance, c.currency)}<Help k="balance" /></span> },
        ]}
        status={posted ? <Status state="Positive" text="전기됨" large /> : <Status state="None" text="초안" large />}
      />
      <div className="f-page-body">
        {posted && (
          <MessageStrip design="Positive" hideCloseButton className="f-strip">
            공급업체 송장 {s.numbers.invoiceDocNumber} / {fiscalYear()}{pc(fiscalYear(), '이')} 전기되었습니다 (분개 {s.numbers.accountingDocNumber}). <FLink onClick={() => nav('/step/display-invoice')}>송장 리스트에서 확인</FLink>
          </MessageStrip>
        )}
        <Section title="일반 정보">
          <FormGroup cols={3} fields={[
            { label: '트랜잭션', value: <select className="f-select" disabled={posted}><option>송장</option><option>대변 메모</option></select>, required: true },
            { label: '회사 코드', value: `${c.companyName} (${c.companyCode})`, required: true, help: 'companyCode' },
            { label: '송장 발행처', value: `${c.supplierName} (${c.supplierNumber})`, required: true, help: 'supplier' },
            { label: '총 송장 금액', value: <><FInput value={posted ? fmtNum(s.invoice!.amount) : f.gross} onChange={posted ? undefined : f.setGross} w={120} align="right" /> {c.currency}</>, required: true, help: 'grossAmount' },
            { label: '송장 일자', value: fmtDate(todayIso(), df), required: true },
            { label: '전기 일자', value: fmtDate(todayIso(), df), required: true },
            { label: '참조', value: <FInput value={posted ? s.invoice!.reference : f.reference} onChange={posted ? undefined : f.setReference} w={160} />, help: 'reference' },
            { label: '지급 조건', value: `${c.paymentTerms} – ${payTermText(c.paymentTerms)}`, help: 'paymentTerms' },
            { label: '기준일', value: fmtDate(todayIso(), df) },
          ]} />
        </Section>
        <Section title="구매 문서 참조">
          {!posted && (
            <div className="inv-ref">
              <label>참조 문서 범주:</label><span className="f-input-ro">구매 오더/일정 계약</span>
              <label>구매 오더:</label><FInput value={f.poRef} onChange={(v) => { f.setPoRef(v); setRefErr(false); }} w={130} />
              <FBtn emph={!f.added} onClick={() => setRefErr(!f.addRef())}>추가</FBtn>
              {refErr && <span className="f-error-text">구매 오더 {f.poRef}에 대해 송장 처리할 미결 입고가 없습니다.</span>}
            </div>
          )}
          <FTable title="송장 품목" count={f.added || posted ? 1 : 0} rowKey={() => '1'} rows={f.added || posted ? [1] : []}
            empty="구매 오더를 참조로 추가하십시오"
            selected={f.selected ? ['1'] : []} onSelect={posted ? undefined : () => f.setSelected(!f.selected)}
            columns={[
              { key: 'po', label: '구매 오더', render: () => <FLink onClick={() => nav('/step/preview-po')}>{s.numbers.poNumber} / 10</FLink> },
              { key: 'm', label: '자재', render: () => <><b>{c.materialDescription}</b><div className="f-muted">{c.materialNumber}</div></> },
              { key: 'gr', label: '입고 수량', align: 'right', render: () => `${fmtQty(f.gr)} ${c.unit}` },
              { key: 'q', label: '수량', align: 'right', render: () => posted ? `${fmtQty(s.invoice!.qty)} ${c.unit}` : <span onClick={(e) => e.stopPropagation()}><FInput value={f.qty} w={70} align="right" onChange={(v) => { const q = Number(v) || 0; f.setQty(q); f.setAmount(Math.round(q * c.netPrice * 100) / 100); }} /> {c.unit}</span> },
              { key: 'a', label: '금액', align: 'right', render: () => posted ? fmtAmt(s.invoice!.amount, c.currency) : <span onClick={(e) => e.stopPropagation()}><FInput value={f.amount} w={100} align="right" onChange={(v) => f.setAmount(Number(v) || 0)} /> {c.currency}</span> },
              { key: 't', label: '세금 코드', render: () => <>{c.taxCode}<Help k="taxCode" /></> },
              { key: 'ref', label: '입고 참조', render: () => s.grDocs.map((d) => d.docNo).join(', ') },
            ]} />
        </Section>
        <Section title="세금">
          <FTable rowKey={() => 't'} rows={[1]} columns={[
            { key: 'c', label: '세금 코드', render: () => `${c.taxCode} (매입세 0%)` },
            { key: 'b', label: '세금 기준 금액', align: 'right', render: () => fmtAmt(posted ? s.invoice!.amount : f.items, c.currency) },
            { key: 'a', label: '세액', align: 'right', render: () => fmtAmt(0, c.currency) },
            { key: 'd', label: '세금 일자', render: () => fmtDate(todayIso(), df) },
          ]} />
        </Section>
      </div>
      {!posted && (
        <FooterBar message={f.added && f.balance !== 0 ? <span className="f-error-text">잔액이 0이 아닙니다. 총 송장 금액 또는 품목 금액을 확인하십시오.</span> : undefined}>
          <FBtn emph disabled={!balOk} onClick={post}>전기</FBtn>
          <FBtn disabled={!f.added} onClick={() => setSim(true)}>시뮬레이트</FBtn>
          <FBtn disabled={!f.added}>세금 제안</FBtn>
          <FBtn>초안 저장</FBtn>
          <FBtn onClick={() => nav('/step/launchpad')}>폐기</FBtn>
        </FooterBar>
      )}
      <SimDialog open={sim} onClose={() => setSim(false)} f={f} />
      <Dialog open={done} headerText="성공" onClose={() => setDone(false)} style={{ width: 460 }}
        footer={<div className="f-dialog-footer"><FBtn emph onClick={() => { setDone(false); nav('/step/display-invoice'); }}>송장 표시</FBtn><FBtn onClick={() => setDone(false)}>닫기</FBtn></div>}>
        <div className="f-success"><Icon name="message-success" /> 공급업체 송장 {s.numbers.invoiceDocNumber}{pc(s.numbers.invoiceDocNumber, '이')} 전기되었습니다.</div>
        <p className="f-dialog-text">분개: {s.numbers.accountingDocNumber} (RE) · 회계 연도 {fiscalYear()}</p>
      </Dialog>
    </FioriShell>
  );
}

export function CreateInvoiceGui({ step }: StepProps) {
  const f = useInvoiceForm();
  const { s, c } = f;
  const df = c.dateFormat;
  const [tab, setTab] = useState('기본 데이터');
  const [sim, setSim] = useState(false);
  const posted = s.invoiceStatus === 'Posted';
  const light = !f.added ? 'yellow' : f.balance === 0 ? 'green' : 'red';
  return (
    <GuiWindow title={`${step.guiTitle} ${c.companyCode}`} tcode={step.tcode} role={step.role}
      appToolbar={<>
        <GBtn>작업 영역 표시</GBtn><GBtn>보류</GBtn>
        <GBtn disabled={!f.added} onClick={() => setSim(true)}>시뮬레이트</GBtn>
        <GBtn>메시지</GBtn>
        <GBtn icon="💾" disabled={posted || f.balance !== 0 || !f.added}
          onClick={() => s.postInvoice({ reference: f.reference, amount: f.items, qty: f.qty, invoiceDate: todayIso(), postingDate: todayIso() })}>전기</GBtn>
      </>}>
      <div className="g-pad">
        <div className="g-row">
          <div className="g-field"><label style={{ width: 80 }}>트랜잭션</label><select className="g-select"><option>1 송장</option><option>2 대변 메모</option></select></div>
          <GField label="잔액" value={fmtNum(posted ? 0 : f.balance)} w={100} lw={50} align="right" help="balance" suffix={<GLight state={posted ? 'green' : light} />} />
        </div>
        <div className="g-miro">
          <GTabs tabs={['기본 데이터', '지급', '세부사항', '세금', '노트']} active={tab} onChange={setTab}>
            {tab === '기본 데이터' && <>
              <GField label="송장 일자" value={fmtDate(todayIso(), df)} w={90} lw={110} required />
              <GField label="참조" value={posted ? s.invoice!.reference : f.reference} onChange={posted ? undefined : f.setReference} w={160} lw={110} help="reference" />
              <GField label="전기 일자" value={fmtDate(todayIso(), df)} w={90} lw={110} />
              <GField label="금액" value={posted ? fmtNum(s.invoice!.amount) : f.gross} onChange={posted ? undefined : f.setGross} w={110} lw={110} align="right" required suffix={c.currency} help="grossAmount" />
              <div className="g-row" style={{ paddingLeft: 110 }}><GCheck label="세금 계산" checked /></div>
              <GField label="세금 코드" value={c.taxCode} w={40} lw={110} suffix="매입세 0%" help="taxCode" />
              <GField label="텍스트" value="" w={260} lw={110} />
              <GField label="지급 조건" value={c.paymentTerms} w={50} lw={110} suffix={payTermText(c.paymentTerms)} />
            </>}
            {tab === '지급' && <>
              <GField label="기준일" value={fmtDate(todayIso(), df)} w={90} lw={110} />
              <GField label="지급 조건" value={c.paymentTerms} w={50} lw={110} suffix={payTermText(c.paymentTerms)} />
            </>}
            {tab === '세금' && <GTable minRows={2} rows={[1]} rowKey={() => 't'} columns={[
              { key: 'a', label: '세액', w: 90, align: 'right', render: () => '0.00' },
              { key: 'c', label: '세금 코드', w: 70, render: () => c.taxCode },
              { key: 'b', label: '세금 기준 금액', w: 120, align: 'right', render: () => fmtNum(f.items) },
            ]} />}
            {(tab === '세부사항' || tab === '노트') && <div className="g-dim">({tab})</div>}
          </GTabs>
          <div className="g-vendor-box">
            <b>공급업체 {c.supplierNumber}</b><br />{c.supplierName}<br />Hauptstraße 12<br />10115 {c.supplierCity}<br />
            <span className="g-dim">은행 계좌: DE89 3704 0044 0532 0130 00</span>
          </div>
        </div>
        <div className="g-group-tabs">
          <div className="g-row">
            <span className="g-tabstrip-mini">PO 참조</span>
            <select className="g-select"><option>1 구매 오더/일정 계약</option></select>
            <input className="g-input g-req" style={{ width: 100 }} value={f.poRef} onChange={(e) => f.setPoRef(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && f.addRef()} readOnly={posted} />
            <GBtn onClick={() => f.addRef()} disabled={posted}>↵ 적용</GBtn>
            <select className="g-select"><option>입고 기준 송장 검증</option></select>
          </div>
          <GTable minRows={4} rows={f.added || posted ? [1] : []} rowKey={() => '1'} selected={f.selected ? ['1'] : []} onSelect={() => !posted && f.setSelected(!f.selected)}
            columns={[
              { key: 'i', label: '품목', w: 40, render: () => '1' },
              { key: 'a', label: '금액', w: 100, align: 'right', render: () => posted ? fmtNum(s.invoice!.amount) : <input className="g-cell-input r" value={f.amount} onChange={(e) => f.setAmount(Number(e.target.value) || 0)} /> },
              { key: 'q', label: '수량', w: 70, align: 'right', render: () => posted ? fmtQty(s.invoice!.qty) : <input className="g-cell-input r" value={f.qty} onChange={(e) => { const q = Number(e.target.value) || 0; f.setQty(q); f.setAmount(Math.round(q * c.netPrice * 100) / 100); }} /> },
              { key: 'u', label: 'OUn', w: 40, render: () => c.unit },
              { key: 'po', label: '구매 오더', w: 90, render: () => s.numbers.poNumber },
              { key: 'it', label: '품목', w: 40, render: () => '10' },
              { key: 't', label: 'PO 텍스트', w: 200, render: () => c.materialDescription },
              { key: 'tc', label: '세금 코드', w: 50, render: () => c.taxCode },
            ]} />
        </div>
      </div>
      <SimDialog open={sim} onClose={() => setSim(false)} f={f} />
    </GuiWindow>
  );
}
