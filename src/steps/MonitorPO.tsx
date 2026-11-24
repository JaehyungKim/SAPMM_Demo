/** Phase 6 – Monitor Purchase Order Items (F2358 analytical list page / ME2M). BPD 4.1.6 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo, grQty } from '../store';
import { addDays, fmtAmt, fmtDate, fmtNum, fmtQty, todayIso } from '../format';
import { otherPoItems } from '../demoData';
import { FilterBar, FioriShell, FTable, FVal, PageHeader, Status, FLink } from '../components/fiori/Fiori';
import { GTable, GuiWindow, GBtn } from '../components/gui/Gui';
import { poStatusView } from './PurchaseOrder';
import type { StepProps } from './types';

type Row = { po: string; item: string; supplier: string; supplierName: string; material: string; materialText: string; qty: number; unit: string; price: number; deliveryDate: string; delivered: number; status: string; mine: boolean };
type Health = 'overdue' | 'week' | 'ok' | 'done';

const health = (r: Row): Health => {
  if (r.delivered >= r.qty) return 'done';
  const t = todayIso();
  if (r.deliveryDate < t) return 'overdue';
  if (r.deliveryDate <= addDays(t, 7)) return 'week';
  return 'ok';
};
const HEALTH_TXT: Record<Health, { t: string; s: 'Negative' | 'Critical' | 'Positive' | 'Information' }> = {
  overdue: { t: '연체', s: 'Negative' },
  week: { t: '이번 주 납기', s: 'Critical' },
  ok: { t: '정시', s: 'Positive' },
  done: { t: '납품 완료', s: 'Information' },
};

function useRows(): Row[] {
  const s = useDemo();
  const c = s.config;
  return useMemo(() => {
    const others = otherPoItems(c).map((o) => ({ ...o, mine: false }));
    if (s.poStatus === 'None') return others;
    const mine: Row = {
      po: s.numbers.poNumber, item: '10', supplier: c.supplierNumber, supplierName: c.supplierName, material: c.materialNumber,
      materialText: c.materialDescription, qty: c.quantity, unit: c.unit, price: c.netPrice, deliveryDate: c.deliveryDate,
      delivered: grQty(s), status: poStatusView(s.poStatus).text, mine: true,
    };
    return [mine, ...others];
  }, [s, c]);
}

export function MonitorPOFiori({ step }: StepProps) {
  const s = useDemo();
  const nav = useNavigate();
  const rows = useRows();
  const df = s.config.dateFormat;
  const [filter, setFilter] = useState<Health | 'all'>('all');
  const counts = { open: rows.filter((r) => health(r) !== 'done').length, overdue: rows.filter((r) => health(r) === 'overdue').length, week: rows.filter((r) => health(r) === 'week').length };
  const shown = filter === 'all' ? rows : rows.filter((r) => health(r) === filter);
  const maxVal = Math.max(...rows.map((r) => r.qty * r.price));
  return (
    <FioriShell title="구매 오더 품목 모니터링" role={step.role}>
      <PageHeader title="구매 오더 품목 모니터링" subtitle="Monitor Purchase Order Items" />
      <FilterBar fields={[
        { label: '구매 조직', value: <FVal v={s.config.purchasingOrg} /> },
        { label: '플랜트', value: <FVal v={s.config.plant} /> },
        { label: '표시 통화', value: <FVal v={s.config.currency} /> },
        { label: '납품일', value: <FVal v={`${fmtDate(addDays(todayIso(), -30), df)} – ${fmtDate(addDays(todayIso(), 30), df)}`} /> },
      ]} />
      <div className="f-page-body">
        <div className="alp-kpis">
          {([
            ['all', '미결 PO 품목', counts.open, ''],
            ['overdue', '연체 품목', counts.overdue, 'neg'],
            ['week', '이번 주 납기 품목', counts.week, 'crit'],
          ] as const).map(([k, label, v, cls]) => (
            <button key={k} className={`alp-kpi ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k as Health | 'all')}>
              <span>{label}</span>
              <b className={cls}>{v}</b>
            </button>
          ))}
          <div className="alp-chart">
            <div className="alp-chart-title">공급업체별 미결 금액 ({s.config.currency})</div>
            {rows.map((r) => (
              <div key={r.po} className="alp-bar-row">
                <span className="alp-bar-label">{r.po}</span>
                <span className="alp-bar"><i style={{ width: `${((r.qty * r.price) / maxVal) * 100}%` }} className={`h-${health(r)} ${r.mine ? 'mine' : ''}`} /></span>
                <span className="alp-bar-val">{fmtNum(r.qty * r.price, 0)}</span>
              </div>
            ))}
          </div>
        </div>
        <FTable
          title="구매 오더 품목" count={shown.length} rows={shown} rowKey={(r) => r.po + r.item} nav
          onRowClick={(r) => r.mine && nav('/step/preview-po')}
          columns={[
            { key: 'h', label: '', width: '6px', render: (r) => <span className={`health-bar h-${health(r)}`} /> },
            { key: 'po', label: '구매 오더', render: (r) => <><FLink>{r.po}</FLink> / {r.item}{r.mine && <span className="mine-tag">데모 PO</span>}</> },
            { key: 'sup', label: '공급업체', render: (r) => <>{r.supplierName}<div className="f-muted">{r.supplier}</div></> },
            { key: 'm', label: '자재', render: (r) => <>{r.materialText}<div className="f-muted">{r.material}</div></> },
            { key: 'd', label: '납품일', render: (r) => fmtDate(r.deliveryDate, df) },
            { key: 'q', label: '오더 수량', align: 'right', render: (r) => `${fmtQty(r.qty)} ${r.unit}` },
            { key: 'g', label: '입고 수량', align: 'right', render: (r) => `${fmtQty(r.delivered)} ${r.unit}` },
            { key: 'v', label: '순 금액', align: 'right', render: (r) => fmtAmt(r.qty * r.price, s.config.currency) },
            { key: 's', label: '납품 상태', render: (r) => <Status state={HEALTH_TXT[health(r)].s} text={HEALTH_TXT[health(r)].t} /> },
          ]}
        />
      </div>
    </FioriShell>
  );
}

export function MonitorPOGui({ step }: StepProps) {
  const s = useDemo();
  const rows = useRows();
  const df = s.config.dateFormat;
  const [sel, setSel] = useState<string[]>([]);
  return (
    <GuiWindow title="자재별 구매 문서" tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>상세 정보</GBtn><GBtn>정렬 ▲</GBtn><GBtn>정렬 ▼</GBtn><GBtn>필터</GBtn><GBtn>합계</GBtn><GBtn>내보내기</GBtn></>}>
      <div className="g-pad">
        <GTable title={`구매 문서 – 플랜트 ${s.config.plant}`} minRows={8} rows={rows} rowKey={(r) => r.po} selected={sel} onSelect={(k) => setSel([k])}
          columns={[
            { key: 'st', label: '상태', w: 40, align: 'center', render: (r) => <span className={`g-led h-${health(r)}`} /> },
            { key: 'po', label: '구매 문서', w: 90, render: (r) => r.po },
            { key: 'it', label: '품목', w: 40, render: (r) => r.item },
            { key: 'ty', label: '유형', w: 40, render: () => 'NB' },
            { key: 'sup', label: '공급업체', w: 80, render: (r) => r.supplier },
            { key: 'm', label: '자재', w: 70, render: (r) => r.material },
            { key: 'tx', label: '내역', w: 200, render: (r) => r.materialText },
            { key: 'd', label: '납품일', w: 85, render: (r) => fmtDate(r.deliveryDate, df) },
            { key: 'q', label: 'PO 수량', w: 70, align: 'right', render: (r) => fmtQty(r.qty) },
            { key: 'g', label: '납품 잔량', w: 70, align: 'right', render: (r) => fmtQty(r.qty - r.delivered) },
            { key: 'p', label: '순 가격', w: 70, align: 'right', render: (r) => fmtNum(r.price) },
          ]} />
      </div>
    </GuiWindow>
  );
}
