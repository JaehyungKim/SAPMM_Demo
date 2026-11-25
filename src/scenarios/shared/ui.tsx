/**
 * Reusable SAP screens for the BMD and BNX scenarios: launchpad / Easy Access, My Inbox /
 * Business Workplace, goods receipt (F0843 / MIGO), supplier invoice (F0859 / MIRO),
 * material document with journal entry, and PDF output previews.
 * Every screen receives its business data as props, so each scenario wires its own store.
 */
import { pc } from '../../josa';
import { Fragment, ReactNode, useState } from 'react';
import { Dialog, Icon, MessageStrip } from '@ui5/webcomponents-react';
import type { StepProps } from '../../steps/types';
import { ROLE_USER } from '../../steps';
import { useScenarioNav } from '../../scenarioContext';
import { useSharedState } from '../../sharedState';
import { fmtAmt, fmtDate, fmtNum, fmtQty, todayIso, fiscalYear } from '../../format';
import { useOrg } from '../types';
import {
  AnchorBar, FBtn, FInput, FioriShell, FooterBar, FormGroup, FormField, FTable, PageHeader, Section, Status, showToast, FLink,
} from '../../components/fiori/Fiori';
import { GBtn, GCheck, GField, GLight, GTable, GTabs, GuiWindow } from '../../components/gui/Gui';
import { Help } from '../../components/Help';

/* ================================================================= common types */
export interface DocItem {
  item: string;
  material: string;
  text: string;
  qty: number;
  unit: string;
  price: number;
  /** e.g. "K · 10101101" for consumables */
  acct?: string;
}
export const itemsValue = (items: DocItem[]) => Math.round(items.reduce((a, i) => a + i.qty * i.price, 0) * 100) / 100;

export interface JournalLine { acc: string; text: string; dc: '차변' | '대변'; amt: number; cc?: string }

/* ================================================================= launchpad */
export interface Tile { title: string; sub: string; icon: string; to?: string; kpi?: string | number; kpiState?: 'neg' | 'crit' | 'pos'; foot?: string }

export function LaunchpadFiori({ step, spaces }: StepProps & { spaces: Record<string, { section: string; tiles: Tile[] }[]> }) {
  const { go } = useScenarioNav();
  const keys = Object.keys(spaces);
  const [space, setSpace] = useState(keys[0]);
  return (
    <FioriShell title="홈" role={step.role} home>
      <div className="lp-spaces">
        <button className="lp-space">내 홈</button>
        {keys.map((k) => <button key={k} className={`lp-space ${k === space ? 'active' : ''}`} onClick={() => setSpace(k)}>{k}</button>)}
      </div>
      <div className="lp-page">
        {spaces[space].map((sec) => (
          <div key={sec.section} className="lp-section">
            <h2>{sec.section}</h2>
            <div className="lp-tiles">
              {sec.tiles.map((t) => (
                <button key={t.title} className={`lp-tile ${t.to ? '' : 'lp-tile-inactive'}`}
                  onClick={() => (t.to ? go(t.to) : showToast(`'${t.title}' 앱은 이번 데모 범위에 포함되지 않습니다`))}>
                  <div className="lp-tile-title">{t.title}</div>
                  <div className="lp-tile-sub">{t.sub}</div>
                  <div className="lp-tile-bottom">
                    <Icon name={t.icon} className="lp-tile-icon" />
                    {t.kpi !== undefined && <span className={`lp-tile-kpi ${t.kpiState ?? ''}`}>{t.kpi}</span>}
                  </div>
                  {t.foot && <div className="lp-tile-foot">{t.foot}</div>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </FioriShell>
  );
}

export interface MenuNode { id: string; label: string; tcode?: string; to?: string; children?: MenuNode[] }

function TreeNode({ n, depth, open, toggle }: { n: MenuNode; depth: number; open: Set<string>; toggle: (id: string) => void }) {
  const { go } = useScenarioNav();
  const leaf = !n.children;
  return (
    <>
      <div className="g-tree-row" style={{ paddingLeft: 6 + depth * 18 }} onClick={() => !leaf && toggle(n.id)}
        onDoubleClick={() => n.to && go(n.to)} title={leaf ? '두 번 클릭하여 실행' : undefined}>
        <span className="g-tree-exp">{leaf ? '' : open.has(n.id) ? '▾' : '▸'}</span>
        <span className={leaf ? 'g-tree-tx' : 'g-tree-folder'} />
        {n.tcode && <span className="g-tree-code">{n.tcode} - </span>}
        <span className={n.to || !leaf ? '' : 'g-tree-dim'}>{n.label}</span>
      </div>
      {open.has(n.id) && n.children?.map((c) => <TreeNode key={c.id} n={c} depth={depth + 1} open={open} toggle={toggle} />)}
    </>
  );
}

export function LaunchpadGui({ step, tree, hint }: StepProps & { tree: MenuNode[]; hint: ReactNode }) {
  const all = (ns: MenuNode[]): string[] => ns.flatMap((n) => (n.children ? [n.id, ...all(n.children)] : []));
  const [open, setOpen] = useState(new Set(all(tree)));
  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <GuiWindow title="SAP Easy Access" tcode={step.tcode} role={step.role}
      appToolbar={<><span className="g-at-item">▣ 기타 메뉴</span><span className="g-at-item">★ 즐겨찾기에 추가</span></>}>
      <div className="g-easy">
        <div className="g-tree">{tree.map((n) => <TreeNode key={n.id} n={n} depth={0} open={open} toggle={toggle} />)}</div>
        <div className="g-easy-side"><div className="g-easy-logo">SAP S/4HANA Cloud</div><p>{hint}</p></div>
      </div>
    </GuiWindow>
  );
}

/* ================================================================= My Inbox / SBWP */
export interface InboxTask {
  title: string;
  subtitle: string;
  kpiLabel: string;
  kpi: string;
  fields: FormField[];
  body?: ReactNode;
  icon?: string;
}

function DecisionDialog({ kind, approveLabel, onSubmit, onClose }: { kind: 'approve' | 'reject' | null; approveLabel: string; onSubmit: (k: 'approve' | 'reject', note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState('');
  if (!kind) return null;
  return (
    <Dialog open headerText="결정 제출" onClose={onClose} style={{ width: 480 }}
      footer={<div className="f-dialog-footer">
        <FBtn emph disabled={kind === 'reject' && !note.trim()} onClick={() => { onSubmit(kind, note); setNote(''); onClose(); }}>제출</FBtn>
        <FBtn onClick={onClose}>취소</FBtn>
      </div>}>
      <p className="f-dialog-text">결정: <b>{kind === 'approve' ? approveLabel : '반려'}</b></p>
      <label className="f-dialog-label">{kind === 'reject' ? '사유 (필수)' : '결정 노트 (선택)'}</label>
      <textarea className="f-textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
    </Dialog>
  );
}

const OTHER_TASKS = [
  { id: 'o1', title: '구매 요청 10000374 릴리스', from: 'REQUESTER_01', prio: '보통' },
  { id: 'o2', title: '공급업체 확인 승인 – PO 4500000411', from: 'PURCHASER', prio: '낮음' },
];

export function InboxFiori({ step, task, done, approveLabel = '승인', onDecide }: StepProps & {
  task: InboxTask | null; done?: ReactNode; approveLabel?: string; onDecide: (k: 'approve' | 'reject', note: string) => void;
}) {
  const df = useOrg().dateFormat;
  const [dlg, setDlg] = useState<'approve' | 'reject' | null>(null);
  const [sel, setSel] = useState(task ? 'mine' : 'o1');
  const [tab, setTab] = useState('정보');
  const tasks = [...(task ? [{ id: 'mine', title: task.title, from: 'PURCHASER', prio: '높음' }] : []), ...OTHER_TASKS];
  return (
    <FioriShell title="내 받은 편지함" role={step.role}>
      <div className="inbox">
        <aside className="inbox-list">
          <div className="inbox-list-head"><b>모든 항목 ({tasks.length})</b><span className="f-shell-spacer" /><Icon name="sort" /><Icon name="filter" /></div>
          <div className="inbox-search"><Icon name="search" /> 검색</div>
          {tasks.map((t) => (
            <button key={t.id} className={`inbox-item ${sel === t.id ? 'active' : ''}`} onClick={() => setSel(t.id)}>
              <div className="inbox-item-title">{t.title}</div>
              <div className="inbox-item-meta"><span>{t.from}</span><span className={t.prio === '높음' ? 'prio-high' : ''}>{t.prio}</span></div>
              <div className="inbox-item-meta"><span>{fmtDate(todayIso(), df)}</span></div>
            </button>
          ))}
        </aside>
        <main className="inbox-detail">
          {done && <MessageStrip design="Positive" hideCloseButton className="f-strip">{done}</MessageStrip>}
          {task && sel === 'mine' ? (
            <>
              <div className="inbox-detail-head">
                <div className="inbox-icon"><Icon name={task.icon ?? 'sales-document'} /></div>
                <div><h1 className="f-title">{task.title}</h1><div className="f-subtitle">{task.subtitle}</div></div>
                <span className="f-shell-spacer" />
                <div className="f-kpi"><span className="f-attr-label">{task.kpiLabel}</span><span className="f-kpi-value f-amount">{task.kpi}</span></div>
              </div>
              <AnchorBar tabs={['정보', '코멘트', '첨부 파일 (0)', '처리 로그']} active={tab} onChange={setTab} />
              <div className="f-page-body">
                {tab === '정보' && <><FormGroup cols={3} fields={task.fields} />{task.body}</>}
                {tab === '처리 로그' && <FTable rowKey={(r) => r.a} rows={[{ a: '워크플로 시작됨' }, { a: '수신인 결정: PURCHASING_MANAGER' }]}
                  columns={[{ key: 'a', label: '작업', render: (r) => r.a }, { key: 'u', label: '사용자', render: () => 'SYSTEM' }, { key: 'd', label: '일자', render: () => fmtDate(todayIso(), df) }]} />}
                {tab !== '정보' && tab !== '처리 로그' && <p className="f-muted">항목이 없습니다.</p>}
              </div>
              <FooterBar>
                <FBtn emph onClick={() => setDlg('approve')}>{approveLabel}</FBtn>
                <FBtn onClick={() => setDlg('reject')}>반려</FBtn>
                <FBtn trans>전달</FBtn>
              </FooterBar>
            </>
          ) : (
            <div className="inbox-empty"><Icon name="inbox" /><p>{task ? '이 데모에서는 맨 위 작업만 처리할 수 있습니다.' : '처리할 작업이 없습니다.'}</p></div>
          )}
        </main>
      </div>
      <DecisionDialog kind={dlg} approveLabel={approveLabel} onSubmit={onDecide} onClose={() => setDlg(null)} />
    </FioriShell>
  );
}

export function InboxGui({ step, task, preview, done, approveLabel = '릴리스(승인)', onDecide }: StepProps & {
  task: string | null; preview?: ReactNode; done?: ReactNode; approveLabel?: string; onDecide: (k: 'approve' | 'reject', note: string) => void;
}) {
  const df = useOrg().dateFormat;
  const rows = [...(task ? [{ id: 'mine', t: task, p: '높음' }] : []), ...OTHER_TASKS.map((o) => ({ id: o.id, t: o.title, p: o.prio }))];
  const [sel, setSel] = useState<string[]>(task ? ['mine'] : []);
  const on = !!task && sel.includes('mine');
  return (
    <GuiWindow title="Business Workplace – PURCHASING_MANAGER" tcode={step.tcode} role={step.role}
      appToolbar={<>
        <GBtn>새 메시지</GBtn>
        <GBtn disabled={!on} onClick={() => onDecide('approve', 'SBWP')}>✔ {approveLabel}</GBtn>
        <GBtn disabled={!on} onClick={() => onDecide('reject', 'SBWP에서 반려')}>✖ 반려</GBtn>
      </>}>
      <div className="g-split">
        <div className="g-tree g-tree-narrow">
          <div className="g-tree-row">▾ 워크플레이스: {ROLE_USER['Purchasing Manager'].name}</div>
          <div className="g-tree-row" style={{ paddingLeft: 22 }}>▾ 받은 편지함</div>
          <div className="g-tree-row is-selected" style={{ paddingLeft: 40 }}>  워크플로 {rows.length}</div>
        </div>
        <div style={{ flex: 1 }}>
          <GTable title={`워크플로 ${rows.length}`} minRows={6} rows={rows} rowKey={(r) => r.id} selected={sel} onSelect={(k) => setSel([k])}
            columns={[
              { key: 'e', label: '!', w: 20, render: (r) => (r.p === '높음' ? '!' : '') },
              { key: 't', label: '제목', w: 420, render: (r) => r.t },
              { key: 'd', label: '수신일', w: 90, render: () => fmtDate(todayIso(), df) },
              { key: 'p', label: '우선 순위', w: 70, render: (r) => r.p },
            ]} />
          {on && preview && <div className="g-preview">{preview}</div>}
          {done && <div className="g-preview">{done}</div>}
        </div>
      </div>
    </GuiWindow>
  );
}

/* ================================================================= PDF output */
export function PdfDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <Dialog open={open} headerText={title} onClose={onClose} stretch footer={<div className="f-dialog-footer"><FBtn onClick={onClose}>닫기</FBtn></div>}>
      <div className="pdf-viewer"><div className="pdf-toolbar"><span>{title}.pdf</span><span>1 / 1</span><span>100%</span></div>{children}</div>
    </Dialog>
  );
}

export function PrintDoc({ title, titleEn, partner, meta, items, terms, foot, showValue = true }: {
  title: string; titleEn: string; partner: { name: string; no: string; city: string }; meta: [string, string][];
  items: (DocItem & { extra?: string })[]; terms: [string, string][]; foot: string; showValue?: boolean;
}) {
  const c = useOrg();
  return (
    <div className="pdf-page">
      <div className="pdf-head">
        <div><div className="pdf-company">{c.companyName}</div><div className="pdf-small">Company Code {c.companyCode} · Purch. Org. {c.purchasingOrg}</div></div>
        <div className="pdf-doc-title">{title}<br /><span>{titleEn}</span></div>
      </div>
      <div className="pdf-cols">
        <div className="pdf-box"><div className="pdf-label">공급업체</div><b>{partner.name}</b><br />공급업체 번호 {partner.no}<br />{partner.city}, Germany</div>
        <div className="pdf-box"><div className="pdf-grid">{meta.map(([k, v]) => <Fragment key={k}><span>{k}</span><b>{v}</b></Fragment>)}</div></div>
      </div>
      <table className="pdf-table" style={{ marginTop: 18 }}>
        <thead><tr><th>품목</th><th>자재 / 내역</th><th className="r">수량</th><th className="r">단가</th>{showValue && <th className="r">금액</th>}</tr></thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.item}><td>{i.item.padStart(5, '0')}</td><td><b>{i.material || '(텍스트 품목)'}</b><br />{i.text}{i.extra && <div className="pdf-small">{i.extra}</div>}</td>
              <td className="r">{fmtQty(i.qty)} {i.unit}</td><td className="r">{fmtNum(i.price)}</td>{showValue && <td className="r">{fmtNum(i.qty * i.price)}</td>}</tr>
          ))}
        </tbody>
        {showValue && <tfoot><tr><td colSpan={4} className="r">순 총액</td><td className="r"><b>{fmtAmt(itemsValue(items), c.currency)}</b></td></tr></tfoot>}
      </table>
      <div className="pdf-terms">{terms.map(([k, v]) => <div key={k}><span className="pdf-label">{k}</span>{v}</div>)}</div>
      <div className="pdf-sign"><div>{c.companyName} – 구매 담당</div><div>{partner.name}</div></div>
      <div className="pdf-foot">{foot}</div>
    </div>
  );
}

/* ================================================================= goods receipt */
export interface GrPosted { docNo: string; fiDocNo: string; date: string; dn: string; qty: Record<string, number> }

function useGrForm(key: string, items: DocItem[], defaultDn: string) {
  const [dn, setDn] = useSharedState(key + ':dn', defaultDn);
  const [qty, setQty] = useSharedState<Record<string, number>>(key + ':qty', Object.fromEntries(items.map((i) => [i.item, i.qty])));
  const [ok, setOk] = useSharedState(key + ':ok', true);
  return { dn, setDn, qty, setQty, ok, setOk };
}

export function GrFiori({ step, po, supplier, items, posted, consumption, onPost, onShowDoc }: StepProps & {
  po: string; supplier: string; items: DocItem[]; posted: GrPosted | null; consumption?: boolean; onPost: (dn: string, qty: Record<string, number>) => void; onShowDoc?: () => void;
}) {
  const c = useOrg();
  const f = useGrForm(`gr:${po}`, items, 'DN-' + po.slice(-4));
  const df = c.dateFormat;
  return (
    <FioriShell title="구매 문서에 대한 입고 전기" role={step.role}>
      <PageHeader title={`구매 오더 ${po}`} subtitle={`공급업체 ${supplier}`} attrs={[
        { label: '플랜트', value: `${c.plant} ${c.plantName}`, help: 'plant' },
        { label: '이동 유형', value: '101 – 입고', help: 'movementType' },
        { label: '재고 유형', value: consumption ? '소비 (계정 지정)' : '가용 재고' },
      ]} />
      <div className="f-page-body">
        {posted && <MessageStrip design="Positive" hideCloseButton className="f-strip">자재 전표 {posted.docNo} / {fiscalYear()}{pc(fiscalYear(), '이')} 전기되었습니다. {onShowDoc && <FLink onClick={onShowDoc}>자재 전표 표시</FLink>}</MessageStrip>}
        <Section title="일반 정보">
          <FormGroup cols={3} fields={[
            { label: '납품서', value: posted ? posted.dn : <FInput value={f.dn} onChange={f.setDn} w={180} />, help: 'deliveryNote' },
            { label: '문서 일자', value: fmtDate(posted?.date ?? todayIso(), df) },
            { label: '전기 일자', value: fmtDate(posted?.date ?? todayIso(), df) },
            { label: '인쇄', value: '개별 전표' },
          ]} />
        </Section>
        <Section title="품목">
          <FTable rowKey={(i) => i.item} rows={items} selected={f.ok ? items.map((i) => i.item) : []} onSelect={() => !posted && f.setOk(!f.ok)} columns={[
            { key: 'i', label: '품목', render: (i) => i.item },
            { key: 'm', label: '자재', render: (i) => <><b>{i.text}</b><div className="f-muted">{i.material || '(자재 번호 없음)'}</div></> },
            { key: 'o', label: '오더 수량', align: 'right', render: (i) => `${fmtQty(i.qty)} ${i.unit}` },
            { key: 'q', label: '입고 수량', align: 'right', render: (i) => posted ? `${fmtQty(posted.qty[i.item] ?? 0)} ${i.unit}`
              : <span onClick={(e) => e.stopPropagation()}><FInput value={f.qty[i.item] ?? 0} w={80} align="right" onChange={(v) => f.setQty({ ...f.qty, [i.item]: Number(v) || 0 })} /> {i.unit}</span> },
            consumption
              ? { key: 'a', label: '계정 지정', render: (i) => <>{i.acct}<Help k="costCenter" /></> }
              : { key: 's', label: '저장 위치', render: () => c.storageLocation },
          ]} />
        </Section>
      </div>
      {!posted && <FooterBar><FBtn emph disabled={!f.ok} onClick={() => { onPost(f.dn, f.qty); showToast('자재 전표가 전기되었습니다'); }}>전기</FBtn><FBtn>취소</FBtn></FooterBar>}
    </FioriShell>
  );
}

export function GrGui({ step, po, supplier, items, posted, consumption, onPost }: StepProps & {
  po: string; supplier: string; items: DocItem[]; posted: GrPosted | null; consumption?: boolean; onPost: (dn: string, qty: Record<string, number>) => void;
}) {
  const c = useOrg();
  const f = useGrForm(`gr:${po}`, items, 'DN-' + po.slice(-4));
  const [tab, setTab] = useState(consumption ? '계정 지정' : '위치');
  return (
    <GuiWindow title={`입고 구매 오더 ${po} - ${ROLE_USER['Warehouse Clerk'].name}`} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>개요 켜기</GBtn><GBtn>점검</GBtn><GBtn icon="💾" disabled={!!posted || !f.ok} onClick={() => onPost(f.dn, f.qty)}>전기</GBtn></>}>
      <div className="g-pad">
        <div className="g-row"><b>A01 입고</b> · <b>R01 구매 오더</b> · <GField label="구매 오더" value={po} w={100} lw={70} /> <GField label="이동 유형" value="101" w={40} lw={70} help="movementType" /></div>
        <div className="g-row">
          <GField label="문서 일자" value={fmtDate(posted?.date ?? todayIso(), c.dateFormat)} w={90} lw={80} />
          <GField label="납품서" value={posted ? posted.dn : f.dn} onChange={posted ? undefined : f.setDn} w={130} lw={60} help="deliveryNote" />
          <GField label="공급업체" value={supplier} w={220} lw={60} />
        </div>
        <GTable minRows={3} rows={items} rowKey={(i) => i.item} selected={items.map((i) => i.item)} columns={[
          { key: 'l', label: '라인', w: 35, render: (i) => String(Number(i.item) / 10) },
          { key: 'm', label: '자재 내역', w: 210, render: (i) => i.text },
          { key: 'ok', label: 'OK', w: 30, align: 'center', render: () => <input type="checkbox" checked={f.ok} disabled={!!posted} onChange={(e) => f.setOk(e.target.checked)} /> },
          { key: 'q', label: 'UnE 수량', w: 80, align: 'right', render: (i) => posted ? fmtQty(posted.qty[i.item] ?? 0)
            : <input className="g-cell-input r" value={f.qty[i.item] ?? 0} onChange={(e) => f.setQty({ ...f.qty, [i.item]: Number(e.target.value) || 0 })} /> },
          { key: 'u', label: 'EUn', w: 40, render: (i) => i.unit },
          consumption ? { key: 'a', label: '계정 지정', w: 150, render: (i) => i.acct ?? '' } : { key: 's', label: '저장 위치', w: 70, render: () => c.storageLocation },
          { key: 'p', label: '플랜트', w: 60, render: () => c.plant },
          { key: 'mv', label: 'MvT', w: 40, render: () => '101' },
          { key: 'li', label: '', w: 50, render: () => <GLight state={f.ok ? 'green' : 'yellow'} /> },
        ]} />
        <GTabs tabs={consumption ? ['자재', '수량', '계정 지정', '구매 오더 데이터'] : ['자재', '수량', '위치', '구매 오더 데이터']} active={tab} onChange={setTab}>
          {tab === '계정 지정' && <div className="g-row"><GField label="계정 지정 범주" value="K 코스트 센터" w={130} lw={110} help="acctAssign" /><GField label="계정 지정" value={items.map((i) => i.acct).join(' / ')} w={320} lw={70} /></div>}
          {tab === '위치' && <div className="g-row"><GField label="재고 유형" value="가용 재고" w={110} lw={80} help="stockType" /><GField label="저장 위치" value={c.storageLocation} w={60} lw={80} help="sloc" /></div>}
          {(tab === '자재' || tab === '수량' || tab === '구매 오더 데이터') && <div className="g-dim">({tab}) 구매 오더 {po}에서 복사된 데이터</div>}
        </GTabs>
        {posted && <div className="g-ok-box">자재 전표 {posted.docNo}{pc(posted.docNo, '이')} 전기되었습니다</div>}
      </div>
    </GuiWindow>
  );
}

/* ================================================================= material document */
export function MatDocFiori({ step, doc, items, journal, po, slip, focusOutput }: StepProps & {
  doc: GrPosted; items: DocItem[]; journal: JournalLine[]; po: string; slip: ReactNode; focusOutput?: boolean;
}) {
  const c = useOrg();
  const [tab, setTab] = useState(focusOutput ? '출력 관리' : '품목');
  const [pdf, setPdf] = useState(false);
  return (
    <FioriShell title="자재 전표 개요" role={step.role}>
      <PageHeader breadcrumb={['자재 전표 개요']} title={`자재 전표 ${doc.docNo}`} subtitle={`${fiscalYear()} · GR goods receipt (101)`}
        attrs={[{ label: '전기 일자', value: fmtDate(doc.date, c.dateFormat) }, { label: '납품서', value: doc.dn }, { label: '구매 오더', value: po }]}
        status={<Status state="Positive" text="전기됨" />} />
      <AnchorBar tabs={['품목', '회계 전표', '출력 관리']} active={tab} onChange={setTab} />
      <div className="f-page-body">
        {tab === '품목' && <FTable rowKey={(i) => i.item} rows={items} columns={[
          { key: 'i', label: '품목', render: (i) => i.item },
          { key: 'm', label: '자재', render: (i) => <><b>{i.text}</b><div className="f-muted">{i.material || '(자재 번호 없음)'}</div></> },
          { key: 'q', label: '수량', align: 'right', render: (i) => `${fmtQty(doc.qty[i.item] ?? 0)} ${i.unit}` },
          { key: 'a', label: '계정 지정 / 저장 위치', render: (i) => i.acct ?? `${c.plant} / ${c.storageLocation}` },
        ]} />}
        {tab === '회계 전표' && <Section title={`분개 ${doc.fiDocNo} (WE)`}><JournalTable lines={journal} /></Section>}
        {tab === '출력 관리' && <Section title="출력 관리"><FTable rowKey={() => 's'} rows={[1]} columns={[
          { key: 't', label: '출력 유형', render: () => 'GOODS_RECEIPT_PO_SLIP' },
          { key: 'c', label: '채널', render: () => '인쇄' },
          { key: 's', label: '상태', render: () => <Status state="Positive" text="완료됨" /> },
          { key: 'a', label: '미리보기', render: () => <FLink onClick={() => setPdf(true)}>문서 표시</FLink> },
        ]} /></Section>}
      </div>
      <PdfDialog open={pdf} onClose={() => setPdf(false)} title={`입고 전표 ${doc.docNo}`}>{slip}</PdfDialog>
    </FioriShell>
  );
}

export function MatDocGui({ step, doc, items, journal, slip }: StepProps & { doc: GrPosted; items: DocItem[]; journal: JournalLine[]; slip: ReactNode }) {
  const c = useOrg();
  const [pdf, setPdf] = useState(false);
  const [fi, setFi] = useState(false);
  return (
    <GuiWindow title={`자재 전표 ${doc.docNo} 표시`} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn onClick={() => setPdf(true)}>🖨 인쇄 미리보기</GBtn><GBtn onClick={() => setFi(!fi)}>FI 전표</GBtn></>}>
      <div className="g-pad">
        <div className="g-row"><GField label="자재 전표" value={doc.docNo} w={100} lw={80} /><GField label="연도" value={fiscalYear()} w={50} lw={40} /><GField label="전기 일자" value={fmtDate(doc.date, c.dateFormat)} w={90} lw={70} /></div>
        <GTable minRows={3} rows={items} rowKey={(i) => i.item} columns={[
          { key: 'i', label: '품목', w: 40, render: (i) => i.item },
          { key: 'm', label: '자재 내역', w: 240, render: (i) => i.text },
          { key: 'q', label: '수량', w: 70, align: 'right', render: (i) => fmtQty(doc.qty[i.item] ?? 0) },
          { key: 'mv', label: 'MvT', w: 40, render: () => '101' },
          { key: 'a', label: '계정 지정', w: 160, render: (i) => i.acct ?? c.storageLocation },
        ]} />
        {fi && <GTable title={`회계 전표 ${doc.fiDocNo}`} minRows={3} rows={journal} rowKey={(l) => l.acc + l.dc + l.cc} columns={[
          { key: 'k', label: 'PK', w: 30, render: (l) => (l.dc === '차변' ? '81' : '96') },
          { key: 'a', label: 'G/L 계정', w: 90, render: (l) => l.acc },
          { key: 't', label: '내역', w: 200, render: (l) => l.text },
          { key: 'c', label: '코스트 센터', w: 90, render: (l) => l.cc ?? '' },
          { key: 'm', label: '금액', w: 100, align: 'right', render: (l) => fmtNum(l.dc === '차변' ? l.amt : -l.amt) },
        ]} />}
      </div>
      <PdfDialog open={pdf} onClose={() => setPdf(false)} title={`입고 전표 ${doc.docNo}`}>{slip}</PdfDialog>
    </GuiWindow>
  );
}

export function JournalTable({ lines }: { lines: JournalLine[] }) {
  const cur = useOrg().currency;
  return (
    <FTable rowKey={(l) => l.acc + l.dc + (l.cc ?? '')} rows={lines} columns={[
      { key: 'a', label: 'G/L 계정', render: (l) => <><b>{l.acc}</b><div className="f-muted">{l.text}</div></> },
      { key: 'c', label: '코스트 센터', render: (l) => l.cc ?? '–' },
      { key: 'd', label: '차변/대변', render: (l) => l.dc },
      { key: 'm', label: '금액', align: 'right', render: (l) => <span className={l.dc === '대변' ? 'neg' : ''}>{fmtAmt(l.dc === '차변' ? l.amt : -l.amt, cur)}</span> },
    ]} />
  );
}

export function GrSlipDoc({ doc, items, po, supplier }: { doc: GrPosted; items: DocItem[]; po: string; supplier: { name: string; no: string; city: string } }) {
  const c = useOrg();
  return (
    <PrintDoc title="입고 전표" titleEn="Goods Receipt Slip" partner={supplier} showValue={false}
      meta={[['자재 전표', doc.docNo], ['전기 일자', fmtDate(doc.date, c.dateFormat)], ['구매 오더', po], ['납품서', doc.dn]]}
      items={items.map((i) => ({ ...i, qty: doc.qty[i.item] ?? 0, extra: i.acct }))}
      terms={[['플랜트', `${c.plant} ${c.plantName}`], ['이동 유형', '101 – 구매 오더 입고']]} foot="수령 확인 서명 후 보관하십시오." />
  );
}

/* ================================================================= supplier invoice */
export interface InvPosted { doc: string; fi: string; ref: string; amount: number; date: string; blocked: boolean }

function useInvForm(po: string, expected: number, blockDefault: boolean) {
  const k = `inv:${po}:`;
  const [ref, setRef] = useSharedState(k + 'ref', `INV-${fiscalYear()}-0${po.slice(-2)}`);
  const [gross, setGross] = useSharedState(k + 'gross', expected.toFixed(2));
  const [poRef, setPoRef] = useSharedState(k + 'po', po);
  const [added, setAdded] = useSharedState(k + 'added', false);
  const [block, setBlock] = useSharedState(k + 'block', blockDefault);
  const items = added ? expected : 0;
  const balance = Math.round(((Number(gross.replace(/,/g, '')) || 0) - items) * 100) / 100;
  const add = () => { if (poRef.trim() === po) { setAdded(true); return true; } return false; };
  return { ref, setRef, gross, setGross, poRef, setPoRef, added, add, block, setBlock, balance };
}

export function InvoiceFiori({ step, po, supplier, items, posted, blockOption, blockDefault = false, journal, onPost, onShowNext }: StepProps & {
  po: string; supplier: string; items: DocItem[]; posted: InvPosted | null; blockOption?: boolean; blockDefault?: boolean; journal: JournalLine[];
  onPost: (ref: string, amount: number, blocked: boolean) => void; onShowNext?: ReactNode;
}) {
  const c = useOrg();
  const expected = itemsValue(items);
  const f = useInvForm(po, expected, blockDefault);
  const [err, setErr] = useState(false);
  const [sim, setSim] = useState(false);
  const ok = f.added && f.balance === 0;
  const df = c.dateFormat;
  return (
    <FioriShell title="공급업체 송장 생성" role={step.role}>
      <PageHeader title={posted ? `공급업체 송장 ${posted.doc}` : '공급업체 송장 생성'} subtitle={`송장 발행처 ${supplier}`} kpis={[
        { label: '총 송장 금액', value: fmtAmt(Number(f.gross) || 0, c.currency) },
        { label: '잔액', value: <span className={`f-balance ${ok || posted ? 'ok' : 'bad'}`}><Icon name={ok || posted ? 'status-positive' : 'status-negative'} /> {fmtAmt(posted ? 0 : f.balance, c.currency)}<Help k="balance" /></span> },
      ]} />
      <div className="f-page-body">
        {posted && <MessageStrip design={posted.blocked ? 'Critical' : 'Positive'} hideCloseButton className="f-strip">
          공급업체 송장 {posted.doc} / {fiscalYear()}{pc(fiscalYear(), '이')} 전기되었습니다 (분개 {posted.fi}). {posted.blocked && '품목이 수동 보류되어 지급이 차단되었습니다.'} {onShowNext}
        </MessageStrip>}
        <Section title="기본 데이터">
          <FormGroup cols={3} fields={[
            { label: '트랜잭션', value: '송장' },
            { label: '회사 코드', value: c.companyCode, help: 'companyCode' },
            { label: '참조', value: posted ? posted.ref : <FInput value={f.ref} onChange={f.setRef} w={180} />, help: 'reference', required: true },
            { label: '총 송장 금액', value: posted ? fmtAmt(posted.amount, c.currency) : <><FInput value={f.gross} onChange={f.setGross} w={120} align="right" /> {c.currency}</>, help: 'grossAmount', required: true },
            { label: '송장 일자', value: fmtDate(todayIso(), df) },
            { label: '전기 일자', value: fmtDate(todayIso(), df) },
          ]} />
        </Section>
        <Section title="구매 문서 참조">
          {!posted && <div className="inv-ref">
            <label>구매 오더:</label><FInput value={f.poRef} onChange={(v) => { f.setPoRef(v); setErr(false); }} w={130} />
            <FBtn emph={!f.added} onClick={() => setErr(!f.add())}>추가</FBtn>
            {err && <span className="f-error-text">구매 오더 {f.poRef}에 대해 송장 처리할 미결 입고가 없습니다.</span>}
          </div>}
          <FTable title="송장 품목" count={f.added || posted ? items.length : 0} rowKey={(i) => i.item} rows={f.added || posted ? items : []} empty="구매 오더를 참조로 추가하십시오" columns={[
            { key: 'po', label: '구매 오더', render: (i) => `${po} / ${i.item}` },
            { key: 'm', label: '자재', render: (i) => <><b>{i.text}</b><div className="f-muted">{i.material || i.acct}</div></> },
            { key: 'q', label: '수량', align: 'right', render: (i) => `${fmtQty(i.qty)} ${i.unit}` },
            { key: 'a', label: '금액', align: 'right', render: (i) => fmtAmt(i.qty * i.price, c.currency) },
            { key: 't', label: '세금 코드', render: () => 'V0' },
          ]} />
          {blockOption && (f.added || posted) && (
            <label className="setup-check" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={posted ? posted.blocked : f.block} disabled={!!posted} onChange={(e) => f.setBlock(e.target.checked)} />
              품목 수동 보류 (Manually Blocked)<Help k="paymentBlock" />
            </label>
          )}
        </Section>
      </div>
      {!posted && <FooterBar message={f.added ? <span>품목 합계 {fmtAmt(expected, c.currency)}</span> : undefined}>
        <FBtn emph disabled={!ok} onClick={() => { onPost(f.ref, Number(f.gross) || 0, !!blockOption && f.block); showToast('송장이 전기되었습니다'); }}>전기</FBtn>
        <FBtn disabled={!f.added} onClick={() => setSim(true)}>시뮬레이트</FBtn>
        <FBtn>초안 저장</FBtn>
      </FooterBar>}
      <Dialog open={sim} headerText="시뮬레이션" onClose={() => setSim(false)} style={{ width: 640 }} footer={<div className="f-dialog-footer"><FBtn onClick={() => setSim(false)}>닫기</FBtn></div>}>
        <JournalTable lines={journal} />
      </Dialog>
    </FioriShell>
  );
}

export function InvoiceGui({ step, po, supplier, items, posted, blockOption, blockDefault = false, onPost }: StepProps & {
  po: string; supplier: string; items: DocItem[]; posted: InvPosted | null; blockOption?: boolean; blockDefault?: boolean;
  onPost: (ref: string, amount: number, blocked: boolean) => void;
}) {
  const c = useOrg();
  const expected = itemsValue(items);
  const f = useInvForm(po, expected, blockDefault);
  const ok = f.added && f.balance === 0;
  return (
    <GuiWindow title={`수신 송장 입력: 회사 코드 ${c.companyCode}`} tcode={step.tcode} role={step.role}
      appToolbar={<><GBtn>보류</GBtn><GBtn>시뮬레이트</GBtn><GBtn icon="💾" disabled={!!posted || !ok} onClick={() => onPost(f.ref, Number(f.gross) || 0, !!blockOption && f.block)}>전기</GBtn></>}>
      <div className="g-pad">
        <div className="g-row">
          <GField label="송장 일자" value={fmtDate(todayIso(), c.dateFormat)} w={90} lw={90} required />
          <GField label="참조" value={posted ? posted.ref : f.ref} onChange={posted ? undefined : f.setRef} w={140} lw={50} help="reference" />
          <GField label="금액" value={posted ? fmtNum(posted.amount) : f.gross} onChange={posted ? undefined : f.setGross} w={100} lw={50} align="right" suffix={c.currency} />
          <span className="g-lbl-inline">잔액 {fmtNum(posted ? 0 : f.balance)}</span> <GLight state={ok || posted ? 'green' : 'red'} />
        </div>
        <div className="g-row">
          <GField label="송장 발행처" value={supplier} w={260} lw={90} />
          <span className="g-tabstrip-mini">PO 참조</span>
          <input className="g-input g-req" style={{ width: 100 }} value={f.poRef} readOnly={!!posted} onChange={(e) => f.setPoRef(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && f.add()} />
          <GBtn disabled={!!posted} onClick={() => f.add()}>↵ 적용</GBtn>
        </div>
        <GTable minRows={4} rows={f.added || posted ? items : []} rowKey={(i) => i.item} selected={f.added ? items.map((i) => i.item) : []} columns={[
          { key: 'i', label: '품목', w: 40, render: (i) => i.item },
          { key: 'a', label: '금액', w: 100, align: 'right', render: (i) => fmtNum(i.qty * i.price) },
          { key: 'q', label: '수량', w: 70, align: 'right', render: (i) => fmtQty(i.qty) },
          { key: 'u', label: 'OUn', w: 40, render: (i) => i.unit },
          { key: 'po', label: '구매 오더', w: 90, render: () => po },
          { key: 't', label: '내역', w: 220, render: (i) => i.text },
          { key: 'tx', label: '세금', w: 40, render: () => 'V0' },
        ]} />
        {blockOption && <GCheck label="품목 수동 보류 (지급 차단)" checked={posted ? posted.blocked : f.block} onChange={posted ? undefined : f.setBlock} />}
        {posted && <div className="g-ok-box">전표 번호 {posted.doc}{pc(posted.doc, '이')} 생성되었습니다{posted.blocked ? ' (지급 보류)' : ''}</div>}
      </div>
    </GuiWindow>
  );
}
