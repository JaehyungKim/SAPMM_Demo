/** Phase 7 – Post Goods Receipt for Purchasing Document (F0843 / MIGO, movement type 101). BPD 4.1.9 */
import { pc } from '../josa';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Icon, MessageStrip } from '@ui5/webcomponents-react';
import { useDemo, grQty } from '../store';
import { fmtAmt, fmtDate, fmtQty, todayIso } from '../format';
import { FBtn, FInput, FioriShell, FooterBar, FormGroup, FTable, PageHeader, Section, Status, FLink } from '../components/fiori/Fiori';
import { GBtn, GCheck, GField, GTable, GTabs, GuiWindow, GLight } from '../components/gui/Gui';
import { Help } from '../components/Help';
import { ROLE_USER } from '../steps';
import { useSharedState } from '../sharedState';
import type { StepProps } from './types';

const STOCK_TYPES = ['가용 재고', '품질 검사', '보류 재고'];

function useGrForm() {
  const s = useDemo();
  const open = Math.max(0, s.config.quantity - grQty(s));
  const k = `gr:${s.numbers.poNumber}:${s.grDocs.length}:`;
  const [qty, setQty] = useSharedState(k + 'qty', open);
  const [sloc, setSloc] = useSharedState(k + 'sloc', s.config.storageLocation);
  const [dn, setDn] = useSharedState(k + 'dn', 'DN-' + s.numbers.poNumber.slice(-4));
  const [stock, setStock] = useSharedState(k + 'stock', STOCK_TYPES[0]);
  const [ok, setOk] = useSharedState(k + 'ok', true);
  return { s, open, qty, setQty, sloc, setSloc, dn, setDn, stock, setStock, ok, setOk };
}

export function PostGRFiori({ step }: StepProps) {
  const f = useGrForm();
  const { s } = f;
  const c = s.config;
  const nav = useNavigate();
  const df = c.dateFormat;
  const [done, setDone] = useState<string | null>(null);
  const post = () => {
    s.postGR(f.qty, f.dn, f.sloc);
    setDone(String(s.numbers.grDocBase + s.grDocs.length));
  };
  const invalid = f.qty <= 0 || f.qty > f.open * 1.1;
  return (
    <FioriShell title="구매 문서에 대한 입고 전기" role={step.role}>
      <PageHeader
        title={`구매 오더 ${s.numbers.poNumber}`}
        subtitle={`${c.supplierName} (${c.supplierNumber})`}
        attrs={[
          { label: '구매 문서', value: s.numbers.poNumber },
          { label: '공급업체', value: c.supplierName, help: 'supplier' },
          { label: '플랜트', value: `${c.plantName} (${c.plant})`, help: 'plant' },
        ]}
        kpis={[{ label: '미결 수량', value: `${fmtQty(f.open)} ${c.unit}` }]}
      />
      <div className="f-page-body">
        {f.open === 0 && (
          <MessageStrip design="Positive" hideCloseButton className="f-strip">
            모든 품목이 입고 완료되었습니다. 자재 전표: {s.grDocs.map((d) => d.docNo).join(', ')}
          </MessageStrip>
        )}
        <Section title="일반 정보">
          <FormGroup cols={3} fields={[
            { label: '납품서', value: <FInput value={f.dn} onChange={f.setDn} w={180} />, help: 'deliveryNote' },
            { label: '문서 일자', value: fmtDate(todayIso(), df) },
            { label: '전기 일자', value: fmtDate(todayIso(), df) },
            { label: '인쇄', value: <select className="f-select" defaultValue="i"><option value="i">개별 전표</option><option value="c">집합 전표</option><option value="n">출력 없음</option></select> },
            { label: '헤더 텍스트', value: <FInput value="" onChange={() => undefined} w={220} /> },
            { label: '이동 유형', value: '101 – 입고', help: 'movementType' },
          ]} />
        </Section>
        <Section title="품목">
          <FTable rowKey={() => '10'} rows={f.open > 0 ? [1] : []} empty="입고할 미결 품목이 없습니다"
            selected={f.ok ? ['10'] : []} onSelect={() => f.setOk(!f.ok)}
            columns={[
              { key: 'i', label: '품목', render: () => '10' },
              { key: 'm', label: '자재', render: () => <><b>{c.materialDescription}</b><div className="f-muted">{c.materialNumber}</div></> },
              { key: 'o', label: '미결 수량', align: 'right', render: () => `${fmtQty(f.open)} ${c.unit}` },
              { key: 'q', label: '입고 수량', align: 'right', render: () => <span onClick={(e) => e.stopPropagation()}><FInput value={f.qty} w={80} align="right" onChange={(v) => f.setQty(Number(v) || 0)} /> {c.unit}</span> },
              { key: 'sl', label: '저장 위치', render: () => <span onClick={(e) => e.stopPropagation()}><FInput value={f.sloc} w={70} onChange={f.setSloc} /><Help k="sloc" /></span> },
              { key: 'st', label: '재고 유형', render: () => <span onClick={(e) => e.stopPropagation()}><select className="f-select" value={f.stock} onChange={(e) => f.setStock(e.target.value)}>{STOCK_TYPES.map((t) => <option key={t}>{t}</option>)}</select><Help k="stockType" /></span> },
              { key: 'v', label: '금액', align: 'right', render: () => fmtAmt(f.qty * c.netPrice, c.currency) },
            ]} />
          {invalid && f.open > 0 && <div className="f-error-text">입고 수량은 0보다 크고 미결 수량 + 초과 납품 허용치(10%) 이내여야 합니다.</div>}
        </Section>
        {s.grDocs.length > 0 && (
          <Section title="전기된 자재 전표">
            <FTable rowKey={(r) => r.docNo} rows={s.grDocs} columns={[
              { key: 'd', label: '자재 전표', render: (r) => <FLink onClick={() => nav('/step/gr-detail')}>{r.docNo}</FLink> },
              { key: 'y', label: '연도', render: () => new Date().getFullYear() },
              { key: 'q', label: '수량', align: 'right', render: (r) => `${fmtQty(r.qty)} ${c.unit}` },
              { key: 'n', label: '납품서', render: (r) => r.deliveryNote },
              { key: 'p', label: '전기 일자', render: (r) => fmtDate(r.postingDate, df) },
            ]} />
          </Section>
        )}
      </div>
      {f.open > 0 && (
        <FooterBar>
          <FBtn emph disabled={!f.ok || invalid} onClick={post}>전기</FBtn>
          <FBtn onClick={() => nav('/step/launchpad')}>취소</FBtn>
        </FooterBar>
      )}
      <Dialog open={!!done} headerText="성공" onClose={() => setDone(null)} style={{ width: 420 }}
        footer={<div className="f-dialog-footer">
          <FBtn emph onClick={() => { setDone(null); nav('/step/gr-detail'); }}>자재 전표 표시</FBtn>
          <FBtn onClick={() => setDone(null)}>닫기</FBtn>
        </div>}>
        <div className="f-success"><Icon name="message-success" /> 자재 전표 {done}{pc(done, '이')} 전기되었습니다.</div>
        <p className="f-dialog-text">재고 증가: {fmtQty(f.qty)} {c.unit} · {f.stock} · 저장 위치 {f.sloc}<br />상태: <Status state="Positive" text={f.open === 0 ? '입고 완료' : '부분 입고'} /></p>
      </Dialog>
    </FioriShell>
  );
}

export function PostGRGui({ step }: StepProps) {
  const f = useGrForm();
  const { s } = f;
  const c = s.config;
  const df = c.dateFormat;
  const [hdrTab, setHdrTab] = useState('일반');
  const [itTab, setItTab] = useState('위치');
  return (
    <GuiWindow title={`입고 구매 오더 ${s.numbers.poNumber} - ${ROLE_USER[step.role].name}`} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>개요 켜기</GBtn><GBtn>보류</GBtn><GBtn>점검</GBtn><GBtn icon="💾" disabled={f.open === 0 || !f.ok || f.qty <= 0} onClick={() => s.postGR(f.qty, f.dn, f.sloc)}>전기</GBtn><GBtn>도움말</GBtn></>}>
      <div className="g-pad">
        <div className="g-row g-migo-top">
          <select className="g-select"><option>A01 입고</option></select>
          <select className="g-select"><option>R01 구매 오더</option></select>
          <input className="g-input g-req" style={{ width: 100 }} value={s.numbers.poNumber} readOnly />
          <input className="g-input" style={{ width: 60 }} value="" readOnly placeholder="품목" />
          <span className="g-lbl-inline">GR 입고</span>
          <input className="g-input" style={{ width: 40 }} value="101" readOnly /><Help k="movementType" />
        </div>
        <GTabs tabs={['일반', '공급업체']} active={hdrTab} onChange={setHdrTab}>
          {hdrTab === '일반' ? (
            <div className="g-cols">
              <div>
                <GField label="문서 일자" value={fmtDate(todayIso(), df)} w={90} lw={90} />
                <GField label="전기 일자" value={fmtDate(todayIso(), df)} w={90} lw={90} />
              </div>
              <div>
                <GField label="납품서" value={f.dn} onChange={f.setDn} w={140} lw={80} help="deliveryNote" />
                <GField label="선하 증권" value="" w={140} lw={80} />
              </div>
              <div>
                <GField label="헤더 텍스트" value="" w={160} lw={90} />
                <div className="g-field"><label style={{ width: 90 }}>출력</label><select className="g-select"><option>1 개별 전표</option></select></div>
              </div>
            </div>
          ) : (
            <div className="g-row"><GField label="공급업체" value={`${c.supplierNumber}  ${c.supplierName}`} w={260} lw={80} /></div>
          )}
        </GTabs>
        <GTable minRows={3} rows={f.open > 0 ? [1] : []} rowKey={() => '1'} selected={['1']}
          columns={[
            { key: 'l', label: '라인', w: 35, render: () => '1' },
            { key: 'm', label: '자재 내역', w: 200, render: () => c.materialDescription },
            { key: 'ok', label: 'OK', w: 30, align: 'center', render: () => <input type="checkbox" checked={f.ok} onChange={(e) => f.setOk(e.target.checked)} /> },
            { key: 'q', label: 'UnE 수량', w: 80, align: 'right', render: () => <input className="g-cell-input r" value={f.qty} onChange={(e) => f.setQty(Number(e.target.value) || 0)} /> },
            { key: 'u', label: 'EUn', w: 40, render: () => c.unit },
            { key: 'sl', label: '저장 위치', w: 70, render: () => <input className="g-cell-input" value={f.sloc} onChange={(e) => f.setSloc(e.target.value)} /> },
            { key: 'p', label: '플랜트', w: 70, render: () => c.plantName },
            { key: 'st', label: '재고 유형', w: 90, render: () => f.stock },
            { key: 'mv', label: 'MvT', w: 40, render: () => '101' },
            { key: 'li', label: '', w: 50, render: () => <GLight state={f.ok ? 'green' : 'yellow'} /> },
          ]} />
        {f.open === 0 && <div className="g-dim">구매 오더 {s.numbers.poNumber}: 모든 품목 입고 완료 ({s.grDocs.map((d) => d.docNo).join(', ')})</div>}
        <GTabs tabs={['자재', '수량', '위치', '구매 오더 데이터', '공급업체']} active={itTab} onChange={setItTab}>
          {itTab === '위치' && <div className="g-cols">
            <div>
              <GField label="이동 유형" value="101 GR 입고" w={120} lw={90} help="movementType" />
              <div className="g-field"><label style={{ width: 90 }}>재고 유형<Help k="stockType" /></label>
                <select className="g-select" value={f.stock} onChange={(e) => f.setStock(e.target.value)}>{STOCK_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div>
              <GField label="플랜트" value={`${c.plant} ${c.plantName}`} w={140} lw={80} />
              <GField label="저장 위치" value={f.sloc} onChange={f.setSloc} w={60} lw={80} help="sloc" />
            </div>
          </div>}
          {itTab === '수량' && <div className="g-row">
            <GField label="UnE 수량" value={f.qty} w={80} lw={90} align="right" suffix={c.unit} />
            <GField label="주문 수량" value={fmtQty(c.quantity)} w={80} lw={90} align="right" />
            <GField label="미결 수량" value={fmtQty(f.open)} w={80} lw={90} align="right" />
          </div>}
          {itTab === '구매 오더 데이터' && <div className="g-row">
            <GField label="구매 오더" value={s.numbers.poNumber} w={100} lw={80} />
            <GField label="품목" value="10" w={40} lw={40} />
            <GCheck label="납품 완료" checked={f.qty >= f.open} />
          </div>}
          {itTab === '자재' && <div className="g-row">
            <GField label="자재" value={c.materialNumber} w={100} lw={60} help="material" />
            <GField label="자재 그룹" value={c.materialGroup} w={60} lw={80} />
          </div>}
          {itTab === '공급업체' && <div className="g-row"><GField label="공급업체" value={c.supplierNumber} w={100} lw={80} /></div>}
        </GTabs>
      </div>
    </GuiWindow>
  );
}
