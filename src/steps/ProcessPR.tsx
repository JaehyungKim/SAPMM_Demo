/** Phase 1 – Convert Purchase Requisitions to Purchase Orders (F1048A / ME57). BPD 4.1.1 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, MessageStrip } from '@ui5/webcomponents-react';
import { useDemo, netValue } from '../store';
import { fmtAmt, fmtDate, fmtNum, fmtQty } from '../format';
import { otherPrs } from '../demoData';
import { FBtn, FilterBar, FioriShell, FTable, FVal, PageHeader, Status, showToast, FLink } from '../components/fiori/Fiori';
import { GBtn, GTable, GuiWindow, GField, GGroup } from '../components/gui/Gui';
import { Help } from '../components/Help';
import type { StepProps } from './types';

/** Candidate sources of supply = purchasing info records from BPD 2.6.2 (+ the configured supplier). */
export function useSources() {
  const c = useDemo((s) => s.config);
  const base = [
    { supplier: '10300001', name: 'Domestic 10 Supplier 1', price: 30, infoRec: '5300000210', fixed: false },
    { supplier: '10300002', name: 'Domestic 10 Supplier 2', price: 35, infoRec: '5300000211', fixed: false },
    { supplier: '10300003', name: 'Domestic DE Supplier 3', price: 25, infoRec: '5300000212', fixed: false },
  ];
  const list = base.filter((b) => b.supplier !== c.supplierNumber);
  list.unshift({ supplier: c.supplierNumber, name: c.supplierName, price: c.netPrice, infoRec: '5300000215', fixed: true });
  return list;
}

type PrRow = { pr: string; item: string; material: string; text: string; qty: number; unit: string; date: string; plant: string; group: string; source: string; status: string; mine: boolean };

function usePrRows(): PrRow[] {
  const s = useDemo();
  const c = s.config;
  const mine: PrRow = {
    pr: s.numbers.prNumber, item: '10', material: c.materialNumber, text: c.materialDescription, qty: c.quantity, unit: c.unit,
    date: c.deliveryDate, plant: c.plant, group: c.purchasingGroup,
    source: s.prStatus === 'Open' ? '' : `${c.supplierName} (${c.supplierNumber})`,
    status: s.prStatus === 'Open' ? '미결' : s.prStatus === 'Assigned' ? '소스 지정됨' : 'PO 생성됨', mine: true,
  };
  return [mine, ...otherPrs(c).map((o) => ({ ...o, source: o.source ? `Domestic DE Supplier 3 (${o.source})` : '', status: '미결', mine: false }))];
}

function SourceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sources = useSources();
  const { setConfig, assignSource, config } = useDemo();
  const pick = (src: (typeof sources)[number]) => {
    setConfig({ supplierNumber: src.supplier, supplierName: src.name, netPrice: src.price });
    assignSource();
    onClose();
    showToast(`공급업체 ${src.name}이(가) 소스로 지정되었습니다`);
  };
  return (
    <Dialog open={open} headerText="공급원 지정" onClose={onClose} style={{ width: 640 }}
      footer={<div className="f-dialog-footer"><FBtn onClick={onClose}>취소</FBtn></div>}>
      <p className="f-dialog-text">구매 정보 레코드에서 결정된 공급원을 선택하십시오. 소스 리스트의 고정 공급업체가 우선 제안됩니다.</p>
      <table className="f-table">
        <thead><tr><th>공급업체</th><th>구매 정보 레코드</th><th style={{ textAlign: 'right' }}>순 가격</th><th>소스 리스트</th><th /></tr></thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.supplier}>
              <td><b>{s.name}</b><br /><span className="f-muted">{s.supplier}</span></td>
              <td>{s.infoRec}</td>
              <td style={{ textAlign: 'right' }}>{fmtAmt(s.price, config.currency)} / 1 {config.unit}</td>
              <td>{s.fixed ? <Status state="Positive" text="고정" /> : <span className="f-muted">-</span>}</td>
              <td><FBtn emph={s.fixed} onClick={() => pick(s)}>지정</FBtn></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

function PoPreviewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useDemo();
  const nav = useNavigate();
  const c = s.config;
  const order = () => {
    s.createPO();
    onClose();
    showToast(`구매 오더 ${s.numbers.poNumber}이(가) 생성되었습니다`);
    setTimeout(() => nav('/step/create-po'), 900);
  };
  return (
    <Dialog open={open} headerText="새 구매 오더" onClose={onClose} style={{ width: 620 }}
      footer={<div className="f-dialog-footer"><FBtn emph onClick={order}>오더</FBtn><FBtn onClick={onClose}>취소</FBtn></div>}>
      <div className="f-preview-grid">
        <span>구매 문서 유형:</span><b>표준 PO (NB)</b>
        <span>공급업체:</span><b>{c.supplierName} ({c.supplierNumber})</b>
        <span>구매 조직 / 그룹:</span><b>{c.purchasingOrg} / {c.purchasingGroup}</b>
        <span>자재:</span><b>{c.materialNumber} – {c.materialDescription}</b>
        <span>수량:</span><b>{fmtQty(c.quantity)} {c.unit}</b>
        <span>순 오더 금액:</span><b>{fmtAmt(netValue(c), c.currency)}</b>
        <span>참조 구매 요청:</span><b>{s.numbers.prNumber} / 10</b>
      </div>
      {s.optionalEnabled['approve-po'] && (
        <MessageStrip design="Information" hideCloseButton style={{ marginTop: 12 }}>
          유연한 워크플로가 활성화되어 있어 저장 후 구매 관리자 승인이 필요합니다.
        </MessageStrip>
      )}
    </Dialog>
  );
}

export function ProcessPRFiori({ step }: StepProps) {
  const s = useDemo();
  const rows = usePrRows();
  const nav = useNavigate();
  const [sel, setSel] = useState<string[]>([s.numbers.prNumber]);
  const [srcOpen, setSrcOpen] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const mineSelected = sel.includes(s.numbers.prNumber);
  const df = s.config.dateFormat;
  return (
    <FioriShell title="구매 요청 처리" role={step.role}>
      <PageHeader title="구매 요청 처리" subtitle="Process Purchase Requisitions" />
      <FilterBar fields={[
        { label: '구매 조직', value: <FVal v={s.config.purchasingOrg} /> },
        { label: '플랜트', value: <FVal v={s.config.plant} /> },
        { label: '자재 그룹', value: <FVal v={s.config.materialGroup} /> },
        { label: '구매 그룹', value: <FVal v="001, 002" /> },
        { label: '처리 상태', value: <FVal v="미결, 소스 지정됨" /> },
      ]} />
      <div className="f-page-body">
        {s.prStatus === 'Closed' && (
          <MessageStrip design="Positive" hideCloseButton className="f-strip">
            구매 요청 {s.numbers.prNumber}이(가) 구매 오더 <FLink onClick={() => nav('/step/create-po')}>{s.numbers.poNumber}</FLink>(으)로 전환되었습니다.
          </MessageStrip>
        )}
        <FTable
          title="구매 요청" count={rows.length} rows={rows} rowKey={(r) => r.pr}
          selected={sel} onSelect={(k) => setSel((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))}
          toolbar={<>
            <FBtn trans onClick={() => showToast('RFQ 생성은 이번 데모 범위에 포함되지 않습니다')}>RFQ 생성</FBtn>
            <FBtn trans disabled={!mineSelected || s.prStatus === 'Closed'} onClick={() => setSrcOpen(true)}>빠른 편집 (소스 지정)</FBtn>
            <FBtn emph disabled={!mineSelected || s.prStatus !== 'Assigned'} onClick={() => setPoOpen(true)}>구매 오더 생성</FBtn>
          </>}
          columns={[
            { key: 'pr', label: '구매 요청', render: (r) => <><FLink>{r.pr}</FLink>{r.mine && <Help k="prNumber" />}<div className="f-muted">품목 {r.item}</div></> },
            { key: 'mat', label: '자재', render: (r) => <><b>{r.text}</b><div className="f-muted">{r.material}</div></> },
            { key: 'qty', label: '수량', align: 'right', render: (r) => `${fmtQty(r.qty)} ${r.unit}` },
            { key: 'date', label: '납품일', render: (r) => fmtDate(r.date, df) },
            { key: 'plant', label: '플랜트', render: (r) => r.plant },
            { key: 'grp', label: '구매 그룹', render: (r) => r.group },
            { key: 'src', label: '지정된 공급원', render: (r) => r.source ? r.source : <span className="f-muted">지정되지 않음</span> },
            { key: 'val', label: '평가 가격', align: 'right', render: (r) => r.mine ? fmtAmt(s.config.netPrice, s.config.currency) : '-' },
            { key: 'st', label: '처리 상태', render: (r) => <Status state={r.status === 'PO 생성됨' ? 'Positive' : r.status === '소스 지정됨' ? 'Information' : 'None'} text={r.status} /> },
          ]}
        />
      </div>
      <SourceDialog open={srcOpen} onClose={() => setSrcOpen(false)} />
      <PoPreviewDialog open={poOpen} onClose={() => setPoOpen(false)} />
    </FioriShell>
  );
}

export function ProcessPRGui({ step }: StepProps) {
  const s = useDemo();
  const rows = usePrRows();
  const sources = useSources();
  const [sel, setSel] = useState<string[]>([s.numbers.prNumber]);
  const df = s.config.dateFormat;
  const assign = () => {
    const src = sources[0];
    s.setConfig({ supplierNumber: src.supplier, supplierName: src.name, netPrice: src.price });
    s.assignSource();
  };
  return (
    <GuiWindow title={step.guiTitle} tcode={step.tcode} role={step.role}
      appToolbar={<>
        <GBtn onClick={assign} disabled={s.prStatus !== 'Open'}>소스 지정</GBtn>
        <GBtn disabled={s.prStatus !== 'Assigned'} onClick={() => s.createPO()}>지정 개요 → 구매 오더 생성</GBtn>
        <GBtn>선택 기준</GBtn>
      </>}>
      <div className="g-pad">
        <GGroup title="선택 기준">
          <div className="g-row">
            <GField label="구매 조직" value={s.config.purchasingOrg} w={60} lw={110} help="purchOrg" />
            <GField label="플랜트" value={s.config.plant} w={60} lw={80} help="plant" />
            <GField label="자재 그룹" value={s.config.materialGroup} w={70} lw={90} />
          </div>
        </GGroup>
        <GTable
          title={`구매 요청 – 지정 리스트 (${rows.length})`}
          rows={rows} rowKey={(r) => r.pr} selected={sel}
          onSelect={(k) => setSel([k])}
          columns={[
            { key: 'pr', label: '구매 요청', w: 90, render: (r) => r.pr },
            { key: 'it', label: '품목', w: 45, render: (r) => r.item },
            { key: 'mat', label: '자재', w: 80, render: (r) => r.material },
            { key: 'tx', label: '내역', w: 230, render: (r) => r.text },
            { key: 'q', label: '요청 수량', w: 80, align: 'right', render: (r) => fmtQty(r.qty) },
            { key: 'u', label: '단위', w: 40, render: (r) => r.unit },
            { key: 'd', label: '납품일', w: 85, render: (r) => fmtDate(r.date, df) },
            { key: 'p', label: '플랜트', w: 50, render: (r) => r.plant },
            { key: 'f', label: '고정 공급업체', w: 90, render: (r) => (r.source.match(/\((\d+)\)/)?.[1] ?? '') },
            { key: 'pr2', label: '평가 가격', w: 90, align: 'right', render: (r) => (r.mine ? fmtNum(s.config.netPrice) : '') },
            { key: 'po', label: '구매 오더', w: 90, render: (r) => (r.mine && s.prStatus === 'Closed' ? s.numbers.poNumber : '') },
          ]}
        />
      </div>
    </GuiWindow>
  );
}
