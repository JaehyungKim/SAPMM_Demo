/**
 * Purchase order object in three modes, shared by
 *  Phase 2 Create Purchase Order (F0842A / ME21N)      BPD 4.1.2
 *  Phase 4 Preview Purchase Order (F0842A / ME23N)     BPD 4.1.4
 *  Phase 5 Change Purchase Order  (F0842A / ME22N)     BPD 4.1.5
 */
import { jo, pc } from '../josa';
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, MessageStrip } from '@ui5/webcomponents-react';
import { useDemo, netValue, DemoConfig, CHANGE_DELAY_DAYS } from '../store';
import { addDays, fmtAmt, fmtDate, fmtNum, fmtQty, todayIso } from '../format';
import {
  AnchorBar, FBtn, FInput, FioriShell, FooterBar, FormGroup, FTable, PageHeader, Section, Status, StatusState, showToast, FLink,
} from '../components/fiori/Fiori';
import { GBtn, GCheck, GField, GTable, GTabs, GuiWindow } from '../components/gui/Gui';
import { Help } from '../components/Help';
import { useSharedState } from '../sharedState';
import type { StepProps } from './types';

type Mode = 'create' | 'display' | 'edit';

const PAYTERM_TEXT: Record<string, string> = {
  '0001': '즉시 지급, 공제 없음',
  '0002': '14일 이내 2%, 30일 순액',
  '0003': '14일 3%, 30일 2%, 45일 순액',
};
export const payTermText = (t: string) => PAYTERM_TEXT[t] ?? '';

export function poStatusView(st: string): { state: StatusState; text: string } {
  switch (st) {
    case 'None': return { state: 'None', text: '초안' };
    case 'Pending Approval': return { state: 'Critical', text: '승인 중' };
    case 'Approved': return { state: 'Positive', text: '발송됨' };
    case 'Created': return { state: 'Positive', text: '발송됨' };
    case 'Rejected': return { state: 'Negative', text: '반려됨' };
    case 'Goods Received': return { state: 'Information', text: '입고 완료' };
    case 'Invoiced': return { state: 'Positive', text: '송장 처리됨' };
    default: return { state: 'None', text: st };
  }
}

/* ------------------------------------------------------------------ printable PO */
export function PoPrintDoc() {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  return (
    <div className="pdf-page">
      <div className="pdf-head">
        <div>
          <div className="pdf-company">{c.companyName}</div>
          <div className="pdf-small">Company Code {c.companyCode} · Plant {c.plant} {c.plantName}</div>
        </div>
        <div className="pdf-doc-title">구매 오더<br /><span>Purchase Order</span></div>
      </div>
      <div className="pdf-cols">
        <div className="pdf-box">
          <div className="pdf-label">공급업체</div>
          <b>{c.supplierName}</b><br />공급업체 번호 {c.supplierNumber}<br />{c.supplierCity}, Germany
        </div>
        <div className="pdf-box">
          <div className="pdf-grid">
            <span>PO 번호</span><b>{s.numbers.poNumber}</b>
            <span>PO 일자</span><b>{fmtDate(s.poCreatedAt ?? todayIso(), df)}</b>
            <span>구매 그룹</span><b>{c.purchasingGroup}</b>
            <span>통화</span><b>{c.currency}</b>
          </div>
        </div>
      </div>
      <div className="pdf-small" style={{ margin: '14px 0 6px' }}>납품 주소: {c.companyName}, {c.plantName}, 저장 위치 {c.storageLocation}</div>
      <table className="pdf-table">
        <thead><tr><th>품목</th><th>자재 / 내역</th><th>납품일</th><th className="r">수량</th><th className="r">단가</th><th className="r">금액</th></tr></thead>
        <tbody>
          <tr>
            <td>00010</td>
            <td><b>{c.materialNumber}</b><br />{c.materialDescription}</td>
            <td>{fmtDate(c.deliveryDate, df)}</td>
            <td className="r">{fmtQty(c.quantity)} {c.unit}</td>
            <td className="r">{fmtNum(c.netPrice)}</td>
            <td className="r">{fmtNum(netValue(c))}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td colSpan={5} className="r">순 총액</td><td className="r"><b>{fmtAmt(netValue(c), c.currency)}</b></td></tr>
        </tfoot>
      </table>
      <div className="pdf-terms">
        <div><span className="pdf-label">지급 조건</span>{c.paymentTerms} – {payTermText(c.paymentTerms)}</div>
        <div><span className="pdf-label">인도 조건</span>{c.incoterms} – Ex Works, VENDOR</div>
        <div><span className="pdf-label">세금 코드</span>{c.taxCode} – 매입세 0%</div>
      </div>
      <div className="pdf-foot">본 구매 오더 번호를 모든 납품서와 송장에 기재하여 주십시오. · {c.companyName}</div>
    </div>
  );
}

export function PdfDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <Dialog open={open} headerText={title} onClose={onClose} stretch
      footer={<div className="f-dialog-footer"><FBtn onClick={onClose}>닫기</FBtn></div>}>
      <div className="pdf-viewer">
        <div className="pdf-toolbar"><span>{title}.pdf</span><span>1 / 1</span><span>100%</span></div>
        {children}
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ Fiori object page */
type Draft = Pick<DemoConfig, 'quantity' | 'netPrice' | 'deliveryDate' | 'storageLocation'>;
/** Change-mode draft: the supplier's requested new delivery date is already proposed. */
const changeDraft = (c: DemoConfig, propose: boolean): Draft =>
  ({ quantity: c.quantity, netPrice: c.netPrice, deliveryDate: propose ? addDays(c.deliveryDate, CHANGE_DELAY_DAYS) : c.deliveryDate, storageLocation: c.storageLocation });

function FioriPo({ step, mode, initialTab }: StepProps & { mode: Mode; initialTab?: string }) {
  const s = useDemo();
  const nav = useNavigate();
  const c = s.config;
  const df = c.dateFormat;
  const [draft, setDraft] = useSharedState<Draft>(`chg:${s.numbers.poNumber}:${s.changeLog.length}`, changeDraft(c, s.changeLog.length === 0));
  const [itemOpen, setItemOpen] = useState(false);
  const [itemTab, setItemTab] = useState('일반 정보');
  const [pdf, setPdf] = useState(false);
  const workflow = s.optionalEnabled['approve-po'];
  const tabs = ['일반 정보', '납품 및 송장', '공급업체 연락처 데이터', '노트', '품목', ...(mode !== 'create' ? ['출력 관리', '승인 상세', '변경 내역'] : [])];
  const [tab, setTab] = useState(initialTab ?? '품목');

  const editable = mode !== 'display';
  // In create mode edits go straight into the shared config; in change mode into a local draft.
  const val: Draft = mode === 'edit' ? draft : { quantity: c.quantity, netPrice: c.netPrice, deliveryDate: c.deliveryDate, storageLocation: c.storageLocation };
  const upd = (p: Partial<Draft>) => (mode === 'edit' ? setDraft({ ...draft, ...p }) : s.setConfig(p));
  const value = Math.round(val.quantity * val.netPrice * 100) / 100;
  const st = poStatusView(s.poStatus);

  const order = () => {
    if (mode === 'create') {
      s.createPO();
      showToast(`구매 오더 ${jo(s.numbers.poNumber, '이')} 생성되었습니다`);
    } else {
      if (draft.quantity === c.quantity && draft.netPrice === c.netPrice && draft.deliveryDate === c.deliveryDate) {
        showToast('변경된 데이터가 없습니다');
        return;
      }
      s.changePO({ quantity: draft.quantity, netPrice: draft.netPrice, deliveryDate: draft.deliveryDate });
      showToast(`구매 오더 ${jo(s.numbers.poNumber, '이')} 저장되었습니다`);
      setTab('변경 내역');
    }
  };

  const num = (v: string) => Number(v.replace(/,/g, '')) || 0;

  return (
    <FioriShell title="구매 오더 관리" role={step.role}>
      <PageHeader
        breadcrumb={['구매 오더 관리']}
        title={mode === 'create' ? '새 구매 오더' : `구매 오더 ${s.numbers.poNumber}`}
        subtitle={mode === 'create' ? '표준 PO (NB)' : `${c.supplierName} (${c.supplierNumber})`}
        actions={mode === 'display' ? <>
          <FBtn emph onClick={() => nav('/step/change-po')} disabled={s.poStatus === 'Invoiced'}>편집</FBtn>
          <FBtn onClick={() => setPdf(true)}>출력 미리보기</FBtn>
          <FBtn trans icon="copy">복사</FBtn>
        </> : mode === 'create' ? <FBtn onClick={() => setPdf(true)}>출력 미리보기</FBtn> : null}
        attrs={[
          { label: '공급업체', value: `${c.supplierName} (${c.supplierNumber})`, help: 'supplier' },
          { label: '구매 조직', value: c.purchasingOrg, help: 'purchOrg' },
          { label: '구매 그룹', value: c.purchasingGroup, help: 'purchGroup' },
          { label: '회사 코드', value: `${c.companyCode} (${c.companyName})`, help: 'companyCode' },
        ]}
        kpis={[
          { label: '순 금액', value: <span className="f-amount">{fmtAmt(value, c.currency)}</span> },
          { label: '문서 일자', value: fmtDate(s.poCreatedAt ?? todayIso(), df) },
        ]}
        status={<Status state={mode === 'create' ? 'None' : st.state} text={mode === 'create' ? '초안' : st.text} large />}
      />
      <AnchorBar tabs={tabs} active={tab} onChange={setTab} />
      <div className="f-page-body">
        {mode === 'edit' && workflow && s.grDocs.length === 0 && (
          <MessageStrip design="Information" hideCloseButton className="f-strip">
            가격·수량처럼 금액이 바뀌는 변경은 유연한 워크플로 재시작 조건에 따라 승인이 다시 요청됩니다. 납품일만 바꾸면 승인 상태가 유지됩니다.
          </MessageStrip>
        )}
        {mode === 'create' && s.poStatus !== 'None' && (
          <MessageStrip design="Positive" hideCloseButton className="f-strip">
            구매 오더 {s.numbers.poNumber}{pc(s.numbers.poNumber, '이')} 저장되었습니다. {s.poStatus === 'Pending Approval' ? '구매 관리자의 승인 대기 중입니다.' : '공급업체에 발송되었습니다.'}
            {s.poFromPr && ` (구매 요청 ${s.numbers.prNumber} 참조)`}
          </MessageStrip>
        )}

        {tab === '일반 정보' && (
          <Section title="일반 정보">
            <FormGroup cols={3} fields={[
              { label: '구매 문서 유형', value: '표준 PO (NB)', help: 'docType', required: true },
              { label: '공급업체', value: `${c.supplierName} (${c.supplierNumber})`, help: 'supplier', required: true },
              { label: '회사 코드', value: `${c.companyName} (${c.companyCode})`, help: 'companyCode', required: true },
              { label: '구매 조직', value: `Purch. Org. ${c.purchasingOrg} (${c.purchasingOrg})`, help: 'purchOrg', required: true },
              { label: '구매 그룹', value: `Group ${c.purchasingGroup} (${c.purchasingGroup})`, help: 'purchGroup', required: true },
              { label: '통화', value: `Euro (${c.currency})`, required: true },
            ]} />
          </Section>
        )}
        {tab === '납품 및 송장' && (
          <Section title="납품 및 송장">
            <FormGroup cols={3} fields={[
              { label: '지급 조건', value: `${payTermText(c.paymentTerms)} (${c.paymentTerms})`, help: 'paymentTerms' },
              { label: '인코텀즈', value: `${c.incoterms} – Ex Works`, help: 'incoterms' },
              { label: '인코텀즈 위치 1', value: 'VENDOR' },
              { label: '환율', value: '1.00000' },
              { label: '현금 할인 1', value: '3.000 % / 14일' },
              { label: '현금 할인 2', value: '2.000 % / 30일' },
            ]} />
          </Section>
        )}
        {tab === '공급업체 연락처 데이터' && (
          <Section title="공급업체 연락처 데이터">
            <FormGroup cols={3} fields={[
              { label: '공급업체 주소', value: `${c.supplierName}, Hauptstraße 12, 10115 ${c.supplierCity}` },
              { label: '전화', value: '+49 30 1234 5600' },
              { label: '팩스', value: '+49 30 1234 5699' },
              { label: '담당자', value: 'Anna Schmidt' },
              { label: '이메일', value: 'orders@supplier3.example.de' },
              { label: '언어', value: '독일어 (DE)' },
            ]} />
          </Section>
        )}
        {tab === '노트' && (
          <Section title="노트">
            <FormGroup cols={1} fields={[{ label: '헤더 텍스트', value: <FInput value="J45 데모 – 직접 자재 조달 테스트" w={420} readOnly /> }]} />
          </Section>
        )}
        {tab === '품목' && (
          <Section title="구매 오더 품목">
            <FTable
              title="품목" count={1} rowKey={() => '10'} rows={[1]} nav onRowClick={() => setItemOpen((o) => !o)}
              toolbar={editable ? <FBtn trans>생성</FBtn> : undefined}
              columns={[
                { key: 'it', label: '품목', render: () => '10' },
                { key: 'mat', label: '자재', render: () => <><b>{c.materialDescription}</b><div className="f-muted">{c.materialNumber}</div></> },
                { key: 'pl', label: '플랜트', render: () => `${c.plantName} (${c.plant})` },
                { key: 'q', label: '오더 수량', align: 'right', render: () => editable
                  ? <span onClick={(e) => e.stopPropagation()}><FInput value={val.quantity} w={80} align="right" onChange={(v) => upd({ quantity: num(v) })} /> {c.unit}</span>
                  : `${fmtQty(val.quantity)} ${c.unit}` },
                { key: 'p', label: '순 오더 가격', align: 'right', render: () => editable
                  ? <span onClick={(e) => e.stopPropagation()}><FInput value={val.netPrice} w={80} align="right" onChange={(v) => upd({ netPrice: num(v) })} /> {c.currency}</span>
                  : `${fmtNum(val.netPrice)} ${c.currency}` },
                { key: 'd', label: '납품일', render: () => editable
                  ? <span onClick={(e) => e.stopPropagation()}><FInput type="date" value={val.deliveryDate} w={140} onChange={(v) => upd({ deliveryDate: v })} /></span>
                  : fmtDate(val.deliveryDate, df) },
                { key: 'v', label: '순 오더 금액', align: 'right', render: () => <b className="f-amount">{fmtAmt(value, c.currency)}</b> },
              ]}
            />
            {itemOpen && (
              <div className="f-subobject">
                <div className="f-subobject-head">
                  <b>구매 오더 품목 10</b> – {c.materialDescription}
                  <span className="f-shell-spacer" />
                  <FBtn trans icon="decline" onClick={() => setItemOpen(false)} />
                </div>
                <AnchorBar tabs={['일반 정보', '프로세스 흐름', '세금', '일정 라인', '가격 결정', '첨부 파일']} active={itemTab} onChange={setItemTab} />
                {itemTab === '일반 정보' && <FormGroup cols={3} fields={[
                  { label: '품목 범주', value: '표준 (0)' },
                  { label: '자재 그룹', value: c.materialGroup },
                  { label: '플랜트', value: `${c.plantName} (${c.plant})`, help: 'plant' },
                  { label: '저장 위치', value: editable ? <FInput value={val.storageLocation} w={80} onChange={(v) => upd({ storageLocation: v })} /> : `Standard storage 1 (${val.storageLocation})`, help: 'sloc' },
                  { label: '구매 요청', value: s.poFromPr || s.prStatus !== 'Open' ? `${s.numbers.prNumber} / 10` : '-' },
                  { label: '구매 정보 레코드', value: '5300000215' },
                ]} />}
                {itemTab === '프로세스 흐름' && <FormGroup cols={3} fields={[
                  { label: '입고', value: '예' },
                  { label: '송장 수령', value: '예' },
                  { label: '입고 기준 송장 검증', value: <Status state="Positive" text="선택됨" />, help: 'grBasedIv' },
                  { label: '평가 입고 정산(ERS)', value: '아니요' },
                  { label: '최종 입고', value: s.poStatus === 'Goods Received' || s.poStatus === 'Invoiced' ? '예' : '아니요' },
                  { label: '확인 관리', value: '-' },
                ]} />}
                {itemTab === '세금' && <FormGroup cols={3} fields={[
                  { label: '세금 코드', value: `${c.taxCode} (매입세 0%)`, help: 'taxCode' },
                  { label: '세금 일자', value: fmtDate(todayIso(), df) },
                  { label: '세금 국가', value: 'DE' },
                ]} />}
                {itemTab === '일정 라인' && (
                  <FTable rowKey={() => '1'} rows={[1]} columns={[
                    { key: 'l', label: '일정 라인', render: () => '1' },
                    { key: 'd', label: '납품일', render: () => fmtDate(val.deliveryDate, df) },
                    { key: 'q', label: '일정 수량', align: 'right', render: () => `${fmtQty(val.quantity)} ${c.unit}` },
                    { key: 'g', label: '입고 수량', align: 'right', render: () => `${fmtQty(s.grDocs.reduce((a, d) => a + d.qty, 0))} ${c.unit}` },
                  ]} />
                )}
                {itemTab === '가격 결정' && (
                  <FTable rowKey={(r) => r.k} rows={[{ k: 'PPR0', n: '총 가격', a: val.netPrice }, { k: 'NAVS', n: '공제 불가 세금', a: 0 }]} columns={[
                    { key: 'k', label: '조건 유형', render: (r) => r.k },
                    { key: 'n', label: '내역', render: (r) => r.n },
                    { key: 'a', label: '금액', align: 'right', render: (r) => `${fmtNum(r.a)} ${c.currency}` },
                    { key: 'p', label: '가격 단위', render: () => `1 ${c.unit}` },
                    { key: 'v', label: '조건 금액', align: 'right', render: (r) => fmtAmt(r.a * val.quantity, c.currency) },
                  ]} />
                )}
                {itemTab === '첨부 파일' && <p className="f-muted" style={{ padding: 12 }}>업로드할 문서 유형: 외부 사용 – 첨부 파일 없음</p>}
              </div>
            )}
          </Section>
        )}
        {tab === '출력 관리' && (
          <Section title="출력 관리">
            <FTable rowKey={() => 'o'} rows={[1]} columns={[
              { key: 't', label: '출력 유형', render: () => 'PURCHASE_ORDER' },
              { key: 'r', label: '수신인', render: () => `${c.supplierName} (LF)` },
              { key: 'c', label: '채널', render: () => '이메일' },
              { key: 'f', label: '양식 템플릿', render: () => 'MM_PUR_PURCHASE_ORDER' },
              { key: 's', label: '상태', render: () => s.poStatus === 'Pending Approval' || s.poStatus === 'Rejected' ? <Status state="None" text="보류" /> : <Status state="Positive" text="완료됨" /> },
              { key: 'a', label: '', render: () => <FLink onClick={() => setPdf(true)}>문서 표시</FLink> },
            ]} />
          </Section>
        )}
        {tab === '승인 상세' && (
          <Section title="승인 상세">
            {!workflow ? <p className="f-muted">유연한 워크플로 비활성 – 자동 릴리스 (Automatic Release of Purchase Order)</p> : (
              <FTable rowKey={(r) => r.n} rows={[
                { n: '1', st: '구매 오더 릴리스', rec: 'PURCHASING_MANAGER', status: s.poStatus === 'Pending Approval' ? '진행 중' : s.poStatus === 'Rejected' ? '반려됨' : '완료됨', note: s.poStatus === 'Rejected' ? s.rejectReason : s.approvalNote },
              ]} columns={[
                { key: 'n', label: '단계', render: (r) => r.n },
                { key: 'st', label: '단계 유형', render: (r) => r.st },
                { key: 'rec', label: '수신인', render: (r) => r.rec },
                { key: 's', label: '상태', render: (r) => <Status state={r.status === '완료됨' ? 'Positive' : r.status === '반려됨' ? 'Negative' : 'Critical'} text={r.status} /> },
                { key: 'c', label: '의견', render: (r) => r.note || '-' },
              ]} />
            )}
          </Section>
        )}
        {tab === '변경 내역' && (
          <Section title="변경 내역">
            <FTable rowKey={(r) => r.at + r.field} rows={s.changeLog} empty="변경 내역이 없습니다" columns={[
              { key: 'a', label: '변경 일시', render: (r) => `${fmtDate(r.at, df)} ${r.at.slice(11, 19)}` },
              { key: 'u', label: '사용자', render: (r) => r.user },
              { key: 'f', label: '필드', render: (r) => r.field },
              { key: 'o', label: '이전 값', render: (r) => <span className="f-old">{r.oldValue}</span> },
              { key: 'n', label: '새 값', render: (r) => <b>{r.newValue}</b> },
            ]} />
          </Section>
        )}
      </div>
      {mode === 'create' && s.poStatus === 'None' && (
        <FooterBar message={<span><Help k="netValue" /> 순 금액 {fmtAmt(value, c.currency)}</span>}>
          <FBtn emph onClick={order} disabled={value <= 0}>오더</FBtn>
          <FBtn>초안 저장</FBtn>
          <FBtn onClick={() => nav('/step/launchpad')}>폐기</FBtn>
        </FooterBar>
      )}
      {mode === 'edit' && (
        <FooterBar>
          <FBtn emph onClick={order}>오더</FBtn>
          <FBtn onClick={() => nav('/step/preview-po')}>취소</FBtn>
        </FooterBar>
      )}
      <PdfDialog open={pdf} onClose={() => setPdf(false)} title={`구매 오더 ${s.numbers.poNumber}`}><PoPrintDoc /></PdfDialog>
    </FioriShell>
  );
}

/* ------------------------------------------------------------------ SAP GUI ME21N/ME22N/ME23N */
function GuiPo({ step, mode }: StepProps & { mode: Mode }) {
  const s = useDemo();
  const c = s.config;
  const df = c.dateFormat;
  const [hdrTab, setHdrTab] = useState('조직 데이터');
  const [itTab, setItTab] = useState('납품 일정');
  const [draft, setDraft] = useSharedState<Draft>(`chg:${s.numbers.poNumber}:${s.changeLog.length}`, changeDraft(c, s.changeLog.length === 0));
  const [pdf, setPdf] = useState(false);
  const created = s.poStatus !== 'None';
  const editable = mode === 'edit' || (mode === 'create' && !created);
  const v = mode === 'edit' ? draft : { quantity: c.quantity, netPrice: c.netPrice, deliveryDate: c.deliveryDate };
  const upd = (p: Partial<Draft>) => (mode === 'edit' ? setDraft({ ...draft, ...p }) : s.setConfig(p));
  const num = (x: string) => Number(x.replace(/,/g, '')) || 0;
  const title =
    mode === 'create' ? (created ? `표준 PO ${s.numbers.poNumber} 생성됨` : '구매 오더 생성')
      : mode === 'edit' ? `표준 PO ${s.numbers.poNumber} 변경` : `표준 PO ${s.numbers.poNumber} 표시`;

  const save = () => (mode === 'edit' ? s.changePO({ quantity: draft.quantity, netPrice: draft.netPrice, deliveryDate: draft.deliveryDate }) : s.createPO());

  return (
    <GuiWindow title={title} tcode={step.tcode} role={step.role}
      appToolbar={<>
        <GBtn>문서 개요 켜기</GBtn>
        <GBtn disabled={!editable}>보류</GBtn>
        <GBtn onClick={save} disabled={!editable} icon="💾">저장</GBtn>
        <GBtn>점검</GBtn>
        <GBtn onClick={() => setPdf(true)}>출력 미리보기</GBtn>
        <GBtn>개인 설정</GBtn>
      </>}>
      <div className="g-pad">
        <div className="g-row g-po-head">
          <select className="g-select" value="NB" disabled={!editable} onChange={() => undefined}><option value="NB">NB 표준 PO</option></select>
          <span className="g-lbl-inline">{created ? s.numbers.poNumber : ''}</span>
          <GField label="공급업체" value={`${c.supplierNumber} ${c.supplierName}`} w={240} lw={70} required={editable} help="supplier" />
          <GField label="문서 일자" value={fmtDate(s.poCreatedAt ?? todayIso(), df)} w={90} lw={80} />
        </div>
        <GTabs tabs={['납품/송장', '조건', '텍스트', '주소', '통신', '파트너', '추가 데이터', '조직 데이터', '상태']} active={hdrTab} onChange={setHdrTab}>
          {hdrTab === '조직 데이터' && <div className="g-row">
            <GField label="구매 조직" value={c.purchasingOrg} w={60} lw={100} required={editable} help="purchOrg" />
            <GField label="구매 그룹" value={c.purchasingGroup} w={45} lw={90} required={editable} help="purchGroup" />
            <GField label="회사 코드" value={c.companyCode} w={60} lw={90} required={editable} help="companyCode" />
          </div>}
          {hdrTab === '납품/송장' && <div className="g-cols">
            <div>
              <GField label="지급 조건" value={c.paymentTerms} w={50} lw={100} help="paymentTerms" suffix={payTermText(c.paymentTerms)} />
              <GField label="인코텀즈" value={c.incoterms} w={50} lw={100} help="incoterms" suffix="VENDOR" />
            </div>
            <div>
              <GField label="통화" value={c.currency} w={50} lw={80} />
              <GField label="환율" value="1.00000" w={80} lw={80} />
            </div>
          </div>}
          {hdrTab === '상태' && <div className="g-status-tab">
            <div>{s.poStatus === 'Pending Approval' ? '◐ 승인 대기' : created ? '● 활성' : '○ 보류'}</div>
            <div>주문 수량 {fmtQty(c.quantity)} {c.unit} · 입고 {fmtQty(s.grDocs.reduce((a, d) => a + d.qty, 0))} {c.unit} · 송장 {s.invoice ? fmtQty(s.invoice.qty) : 0} {c.unit}</div>
            <div>순 금액 {fmtAmt(netValue(c), c.currency)}</div>
          </div>}
          {!['조직 데이터', '납품/송장', '상태'].includes(hdrTab) && <div className="g-dim">({hdrTab} – 데모에서는 표시 전용)</div>}
        </GTabs>

        <GTable
          title="품목 개요" minRows={4} rows={[1]} rowKey={() => '10'} selected={['10']}
          columns={[
            { key: 'i', label: '품목', w: 40, render: () => '10' },
            { key: 'a', label: 'A', w: 20, render: () => '' },
            { key: 'c', label: 'I', w: 20, render: () => '' },
            { key: 'm', label: '자재', w: 80, render: () => c.materialNumber },
            { key: 't', label: '내역', w: 210, render: () => c.materialDescription },
            { key: 'q', label: 'PO 수량', w: 80, align: 'right', render: () => editable ? <input className="g-cell-input r" value={v.quantity} onChange={(e) => upd({ quantity: num(e.target.value) })} /> : fmtQty(v.quantity) },
            { key: 'u', label: 'OUn', w: 40, render: () => c.unit },
            { key: 'd', label: '납품일', w: 95, render: () => editable ? <input className="g-cell-input" type="date" value={v.deliveryDate} onChange={(e) => upd({ deliveryDate: e.target.value })} /> : fmtDate(v.deliveryDate, df) },
            { key: 'p', label: '순 가격', w: 80, align: 'right', render: () => editable ? <input className="g-cell-input r" value={v.netPrice} onChange={(e) => upd({ netPrice: num(e.target.value) })} /> : fmtNum(v.netPrice) },
            { key: 'cu', label: '통화', w: 40, render: () => c.currency },
            { key: 'pe', label: 'Per', w: 30, render: () => '1' },
            { key: 'mg', label: '자재 그룹', w: 60, render: () => c.materialGroup },
            { key: 'pl', label: '플랜트', w: 45, render: () => c.plant },
            { key: 'sl', label: '저장 위치', w: 55, render: () => c.storageLocation },
          ]}
        />
        <div className="g-item-detail-head">품목 [ 10 ] {c.materialNumber}, {c.materialDescription}</div>
        <GTabs tabs={['자재 데이터', '수량/중량', '납품 일정', '납품', '송장', '조건', '구매 오더 이력', '확인']} active={itTab} onChange={setItTab}>
          {itTab === '납품 일정' && <GTable minRows={2} rows={[1]} rowKey={() => '1'} columns={[
            { key: 'c', label: 'C', w: 20, render: () => 'D' },
            { key: 'd', label: '납품일', w: 90, render: () => fmtDate(v.deliveryDate, df) },
            { key: 'q', label: '일정 수량', w: 90, align: 'right', render: () => fmtQty(v.quantity) },
            { key: 'g', label: '입고 수량', w: 90, align: 'right', render: () => fmtQty(s.grDocs.reduce((a, d) => a + d.qty, 0)) },
            { key: 'pr', label: '구매 요청', w: 90, render: () => (s.poFromPr ? s.numbers.prNumber : '') },
          ]} />}
          {itTab === '송장' && <div className="g-row">
            <GCheck label="송장 수령" checked />
            <GCheck label="최종 송장" checked={s.invoiceStatus === 'Posted'} />
            <GCheck label="입고 기준 송장 검증" checked />
            <GField label="세금 코드" value={c.taxCode} w={40} lw={70} help="taxCode" suffix="매입세 0%" />
          </div>}
          {itTab === '납품' && <div className="g-row">
            <GField label="미달 납품 허용" value="10.0 %" w={60} lw={110} />
            <GField label="초과 납품 허용" value="10.0 %" w={60} lw={110} />
            <GCheck label="입고" checked />
            <GCheck label="납품 완료" checked={s.poStatus === 'Goods Received' || s.poStatus === 'Invoiced'} />
          </div>}
          {itTab === '조건' && <GTable minRows={2} rows={[{ k: 'PPR0', t: '총 가격' }]} rowKey={(r) => r.k} columns={[
            { key: 'k', label: '조건', w: 60, render: (r) => r.k },
            { key: 't', label: '이름', w: 140, render: (r) => r.t },
            { key: 'a', label: '금액', w: 90, align: 'right', render: () => fmtNum(v.netPrice) },
            { key: 'c', label: '통화', w: 50, render: () => c.currency },
            { key: 'v', label: '조건 금액', w: 110, align: 'right', render: () => fmtNum(v.quantity * v.netPrice) },
          ]} />}
          {itTab === '구매 오더 이력' && <GTable minRows={3} rows={s.grDocs} rowKey={(r) => r.docNo} columns={[
            { key: 's', label: '단', w: 40, render: () => 'WE' },
            { key: 'm', label: 'MvT', w: 40, render: () => '101' },
            { key: 'd', label: '자재 전표', w: 100, render: (r) => r.docNo },
            { key: 'p', label: '전기일', w: 90, render: (r) => fmtDate(r.postingDate, df) },
            { key: 'q', label: '수량', w: 80, align: 'right', render: (r) => fmtQty(r.qty) },
            { key: 'a', label: '금액', w: 100, align: 'right', render: (r) => fmtNum(r.qty * c.netPrice) },
          ]} />}
          {!['납품 일정', '송장', '납품', '조건', '구매 오더 이력'].includes(itTab) && <div className="g-dim">({itTab})</div>}
        </GTabs>
      </div>
      <PdfDialog open={pdf} onClose={() => setPdf(false)} title={`구매 오더 ${s.numbers.poNumber}`}><PoPrintDoc /></PdfDialog>
    </GuiWindow>
  );
}

/* ------------------------------------------------------------------ step exports */
export function CreatePOFiori({ step }: StepProps) {
  const created = useDemo((s) => s.poStatus !== 'None');
  return <FioriPo step={step} mode={created ? 'display' : 'create'} initialTab="품목" key={String(created)} />;
}
export const CreatePOGui = ({ step }: StepProps) => <GuiPo step={step} mode="create" />;

export const PreviewPOFiori = ({ step }: StepProps) => <FioriPo step={step} mode="display" initialTab="출력 관리" />;
export const PreviewPOGui = ({ step }: StepProps) => <GuiPo step={step} mode="display" />;

export const ChangePOFiori = ({ step }: StepProps) => <FioriPo step={step} mode="edit" initialTab="품목" />;
export const ChangePOGui = ({ step }: StepProps) => <GuiPo step={step} mode="edit" />;
