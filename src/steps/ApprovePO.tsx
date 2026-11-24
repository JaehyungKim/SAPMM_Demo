/** Phase 3 – Approve Purchase Order via flexible workflow (My Inbox F0862 / SBWP). BPD 4.1.3 */
import { useState } from 'react';
import { Dialog, Icon, MessageStrip } from '@ui5/webcomponents-react';
import { useDemo, netValue } from '../store';
import { addDays, fmtAmt, fmtDate, fmtNum, fmtQty, todayIso } from '../format';
import { FBtn, FioriShell, FooterBar, FormGroup, FTable, showToast, AnchorBar } from '../components/fiori/Fiori';
import { GBtn, GTable, GuiWindow } from '../components/gui/Gui';
import type { StepProps } from './types';
import { ROLE_USER } from '../steps';

function DecisionDialog({ kind, onClose }: { kind: 'approve' | 'reject' | null; onClose: () => void }) {
  const s = useDemo();
  const [note, setNote] = useState('');
  if (!kind) return null;
  const submit = () => {
    if (kind === 'approve') { s.approvePO(note); showToast(`구매 오더 ${s.numbers.poNumber}이(가) 승인되었습니다`); }
    else { s.rejectPO(note); showToast(`구매 오더 ${s.numbers.poNumber}이(가) 반려되었습니다`); }
    setNote('');
    onClose();
  };
  return (
    <Dialog open headerText="결정 제출" onClose={onClose} style={{ width: 480 }}
      footer={<div className="f-dialog-footer">
        <FBtn emph onClick={submit} disabled={kind === 'reject' && !note.trim()}>제출</FBtn>
        <FBtn onClick={onClose}>취소</FBtn>
      </div>}>
      <p className="f-dialog-text">결정: <b>{kind === 'approve' ? '승인' : '반려'}</b></p>
      <label className="f-dialog-label">{kind === 'reject' ? '사유 (필수)' : '결정 노트 (선택)'}</label>
      <textarea className="f-textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)}
        placeholder={kind === 'approve' ? '예: 예산 범위 내 – 승인합니다' : '예: 단가 재협상 필요'} />
    </Dialog>
  );
}

const OTHER_TASKS = [
  { id: 't2', title: '구매 요청 10000374 릴리스', from: 'REQUESTER_01', date: addDays(todayIso(), -1), prio: '보통' },
  { id: 't3', title: '공급업체 확인 승인 – PO 4500000411', from: 'PURCHASER', date: addDays(todayIso(), -3), prio: '낮음' },
];

export function ApprovePOFiori({ step }: StepProps) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  const [dlg, setDlg] = useState<'approve' | 'reject' | null>(null);
  const [tab, setTab] = useState('정보');
  const pending = s.poStatus === 'Pending Approval';
  const [selected, setSelected] = useState(pending ? 'mine' : 't2');
  const tasks = [
    ...(pending ? [{ id: 'mine', title: `구매 오더 ${s.numbers.poNumber} 릴리스`, from: 'PURCHASER', date: todayIso(), prio: '높음' }] : []),
    ...OTHER_TASKS,
  ];
  const isMine = selected === 'mine' && pending;

  return (
    <FioriShell title="내 받은 편지함" role={step.role}>
      <div className="inbox">
        <aside className="inbox-list">
          <div className="inbox-list-head">
            <b>모든 항목 ({tasks.length})</b>
            <span className="f-shell-spacer" />
            <Icon name="sort" /><Icon name="filter" /><Icon name="multi-select" />
          </div>
          <div className="inbox-search"><Icon name="search" /> 검색</div>
          {tasks.map((t) => (
            <button key={t.id} className={`inbox-item ${selected === t.id ? 'active' : ''}`} onClick={() => setSelected(t.id)}>
              <div className="inbox-item-title">{t.title}</div>
              <div className="inbox-item-meta"><span>{t.from}</span><span className={t.prio === '높음' ? 'prio-high' : ''}>{t.prio}</span></div>
              <div className="inbox-item-meta"><span>{fmtDate(t.date, df)}</span><span>만기 {fmtDate(addDays(t.date, 1), df)}</span></div>
            </button>
          ))}
        </aside>
        <main className="inbox-detail">
          {!pending && s.poStatus !== 'None' && (
            <MessageStrip design={s.poStatus === 'Rejected' ? 'Negative' : 'Positive'} hideCloseButton className="f-strip">
              구매 오더 {s.numbers.poNumber}: {s.poStatus === 'Rejected' ? `반려됨 – ${s.rejectReason}` : '승인 완료 – 공급업체에 발송되었습니다.'}
            </MessageStrip>
          )}
          {isMine ? (
            <>
              <div className="inbox-detail-head">
                <div className="inbox-icon"><Icon name="sales-document" /></div>
                <div>
                  <h1 className="f-title">구매 오더 {s.numbers.poNumber} 릴리스</h1>
                  <div className="f-subtitle">{c.supplierName} · 생성자 PURCHASER ({fmtDate(todayIso(), df)})</div>
                </div>
                <span className="f-shell-spacer" />
                <div className="f-kpi"><span className="f-attr-label">순 금액</span><span className="f-kpi-value f-amount">{fmtAmt(netValue(c), c.currency)}</span></div>
              </div>
              <AnchorBar tabs={['정보', '코멘트', '첨부 파일 (0)', '처리 로그', '오브젝트 링크']} active={tab} onChange={setTab} />
              <div className="f-page-body">
                {tab === '정보' && <>
                  <FormGroup cols={3} fields={[
                    { label: '공급업체', value: `${c.supplierName} (${c.supplierNumber})`, help: 'supplier' },
                    { label: '구매 그룹', value: c.purchasingGroup, help: 'purchGroup' },
                    { label: '구매 조직', value: c.purchasingOrg, help: 'purchOrg' },
                    { label: '회사 코드', value: c.companyCode },
                    { label: '지급 조건', value: c.paymentTerms, help: 'paymentTerms' },
                    { label: '워크플로', value: 'Test Workflow for Purchase Order' },
                  ]} />
                  <FTable title="품목" count={1} rowKey={() => '10'} rows={[1]} columns={[
                    { key: 'i', label: '품목', render: () => '10' },
                    { key: 'm', label: '자재', render: () => <><b>{c.materialDescription}</b><div className="f-muted">{c.materialNumber}</div></> },
                    { key: 'q', label: '수량', align: 'right', render: () => `${fmtQty(c.quantity)} ${c.unit}` },
                    { key: 'p', label: '순 가격', align: 'right', render: () => `${fmtNum(c.netPrice)} ${c.currency}` },
                    { key: 'd', label: '납품일', render: () => fmtDate(c.deliveryDate, df) },
                    { key: 'v', label: '순 금액', align: 'right', render: () => <b>{fmtAmt(netValue(c), c.currency)}</b> },
                  ]} />
                </>}
                {tab === '처리 로그' && <FTable rowKey={(r) => r.a} rows={[
                  { a: '워크플로 시작됨', u: 'SYSTEM' }, { a: '작업 생성: 구매 오더 릴리스', u: 'SYSTEM' }, { a: '수신인 결정: PURCHASING_MANAGER', u: 'SYSTEM' },
                ]} columns={[{ key: 'a', label: '작업', render: (r) => r.a }, { key: 'u', label: '사용자', render: (r) => r.u }, { key: 'd', label: '일자', render: () => fmtDate(todayIso(), df) }]} />}
                {tab !== '정보' && tab !== '처리 로그' && <p className="f-muted">항목이 없습니다.</p>}
              </div>
              <FooterBar>
                <FBtn emph onClick={() => setDlg('approve')}>승인</FBtn>
                <FBtn onClick={() => setDlg('reject')}>반려</FBtn>
                <FBtn trans>클레임</FBtn>
                <FBtn trans>전달</FBtn>
                <FBtn trans>일시 중지</FBtn>
              </FooterBar>
            </>
          ) : (
            <div className="inbox-empty">
              <Icon name="inbox" />
              <p>{selected === 'mine' ? '작업이 완료되었습니다.' : '이 데모에서는 구매 오더 릴리스 작업만 처리할 수 있습니다.'}</p>
            </div>
          )}
        </main>
      </div>
      <DecisionDialog kind={dlg} onClose={() => setDlg(null)} />
    </FioriShell>
  );
}

export function ApprovePOGui({ step }: StepProps) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  const pending = s.poStatus === 'Pending Approval';
  const rows = [
    ...(pending ? [{ id: 'mine', t: `구매 오더 ${s.numbers.poNumber} 릴리스 (${fmtAmt(netValue(c), c.currency)})`, d: todayIso(), p: '높음' }] : []),
    ...OTHER_TASKS.map((o) => ({ id: o.id, t: o.title, d: o.date, p: o.prio })),
  ];
  const [sel, setSel] = useState<string[]>(pending ? ['mine'] : []);
  return (
    <GuiWindow title="Business Workplace – PURCHASING_MANAGER" tcode={step.tcode} role={step.role}
      appToolbar={<>
        <GBtn>새 메시지</GBtn><GBtn>공유 폴더 찾기</GBtn>
        <GBtn disabled={!pending || !sel.includes('mine')} onClick={() => s.approvePO('SBWP에서 승인')}>✔ 릴리스(승인)</GBtn>
        <GBtn disabled={!pending || !sel.includes('mine')} onClick={() => s.rejectPO('SBWP에서 반려')}>✖ 반려</GBtn>
      </>}>
      <div className="g-split">
        <div className="g-tree g-tree-narrow">
          <div className="g-tree-row">▾ 워크플레이스: {ROLE_USER['Purchasing Manager'].name}</div>
          <div className="g-tree-row" style={{ paddingLeft: 22 }}>▾ 받은 편지함</div>
          <div className="g-tree-row" style={{ paddingLeft: 40 }}>  미결 메시지 0</div>
          <div className="g-tree-row is-selected" style={{ paddingLeft: 40 }}>  워크플로 {rows.length}</div>
          <div className="g-tree-row" style={{ paddingLeft: 22 }}>▸ 보낸 편지함</div>
        </div>
        <div style={{ flex: 1 }}>
          <GTable title={`워크플로 ${rows.length}`} minRows={6} rows={rows} rowKey={(r) => r.id} selected={sel} onSelect={(k) => setSel([k])}
            columns={[
              { key: 'e', label: '!', w: 20, render: (r) => (r.p === '높음' ? '!' : '') },
              { key: 't', label: '제목', w: 420, render: (r) => r.t },
              { key: 'd', label: '수신일', w: 90, render: (r) => fmtDate(r.d, df) },
              { key: 'p', label: '우선 순위', w: 70, render: (r) => r.p },
            ]} />
          {sel.includes('mine') && pending && (
            <div className="g-preview">
              <b>작업 설명</b><br />
              구매 오더 {s.numbers.poNumber} (공급업체 {c.supplierNumber} {c.supplierName})를 릴리스하십시오.<br />
              자재 {c.materialNumber}, {fmtQty(c.quantity)} {c.unit} × {fmtNum(c.netPrice)} {c.currency} = {fmtAmt(netValue(c), c.currency)}
            </div>
          )}
          {!pending && s.poStatus !== 'None' && <div className="g-preview">구매 오더 {s.numbers.poNumber}: {s.poStatus === 'Rejected' ? '반려됨' : '릴리스됨'}</div>}
        </div>
      </div>
    </GuiWindow>
  );
}
