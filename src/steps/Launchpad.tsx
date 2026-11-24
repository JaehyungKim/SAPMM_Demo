/** Phase 0 – SAP Fiori Launchpad (spaces & pages) / SAP Easy Access menu. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo } from '../store';
import { FioriShell, showToast } from '../components/fiori/Fiori';
import { GuiWindow } from '../components/gui/Gui';
import type { StepProps } from './types';

interface Tile { title: string; sub: string; icon: string; to?: string; kpi?: string | number; kpiState?: 'neg' | 'crit' | 'pos'; foot?: string }

function useSpaces() {
  const s = useDemo();
  const pendingApprovals = s.poStatus === 'Pending Approval' ? 1 : 0;
  const openPr = s.prStatus === 'Open' ? 3 : 2;
  const spaces: Record<string, { section: string; tiles: Tile[] }[]> = {
    구매: [
      {
        section: '운영 구매',
        tiles: [
          { title: '구매 요청 처리', sub: 'Process Purchase Requisitions', icon: 'activity-items', to: 'process-pr', kpi: openPr, foot: '미결' },
          { title: '구매 오더 관리', sub: 'Manage Purchase Orders', icon: 'sales-document', to: 'create-po' },
          { title: '구매 오더 품목 모니터링', sub: 'Monitor Purchase Order Items', icon: 'monitor-payments', to: 'monitor-po', kpi: 2, kpiState: 'neg', foot: '연체' },
          { title: '구매 오더 일괄 변경', sub: 'Mass Changes to Purchase Orders', icon: 'edit' },
          { title: '구매 정보 레코드 관리', sub: 'Manage Purchasing Info Records', icon: 'database' },
          { title: '소스 리스트 관리', sub: 'Manage Source Lists', icon: 'list' },
        ],
      },
      {
        section: '승인',
        tiles: [
          { title: '내 받은 편지함', sub: 'My Inbox - All Items', icon: 'inbox', to: 'approve-po', kpi: pendingApprovals, foot: '작업' },
        ],
      },
    ],
    '재고 처리': [
      {
        section: '입고',
        tiles: [
          { title: '구매 문서에 대한 입고 전기', sub: 'Post Goods Receipt for Purchasing Document', icon: 'shipping-status', to: 'post-gr' },
          { title: '자재 전표 개요', sub: 'Material Documents Overview', icon: 'documents', to: 'gr-detail' },
          { title: '재고 - 단일 자재', sub: 'Stock - Single Material', icon: 'product' },
          { title: '재고 관리', sub: 'Manage Stock', icon: 'inventory' },
        ],
      },
    ],
    매입채무: [
      {
        section: '송장 처리',
        tiles: [
          { title: '공급업체 송장 생성', sub: 'Create Supplier Invoice', icon: 'request', to: 'create-invoice' },
          { title: '공급업체 송장 리스트', sub: 'Supplier Invoices List', icon: 'customer-financial-fact-sheet', to: 'display-invoice', kpi: s.invoiceStatus === 'Posted' ? 1 : 0, foot: '오늘' },
          { title: 'GR/IR 청산 계정 유지보수', sub: 'Clear GR/IR Clearing Account (MR11)', icon: 'accounting-document-verification', to: 'clear-grir' },
        ],
      },
    ],
  };
  return spaces;
}

export function LaunchpadFiori({ step }: StepProps) {
  const nav = useNavigate();
  const spaces = useSpaces();
  const [space, setSpace] = useState('구매');
  return (
    <FioriShell title="홈" role={step.role} home>
      <div className="lp-spaces">
        <button className="lp-space">내 홈</button>
        {Object.keys(spaces).map((k) => (
          <button key={k} className={`lp-space ${k === space ? 'active' : ''}`} onClick={() => setSpace(k)}>{k}</button>
        ))}
      </div>
      <div className="lp-page">
        {spaces[space].map((sec) => (
          <div key={sec.section} className="lp-section">
            <h2>{sec.section}</h2>
            <div className="lp-tiles">
              {sec.tiles.map((t) => (
                <button
                  key={t.title}
                  className={`lp-tile ${t.to ? '' : 'lp-tile-inactive'}`}
                  onClick={() => (t.to ? nav(`/step/${t.to}`) : showToast(`'${t.title}' 앱은 이번 데모 범위에 포함되지 않습니다`))}
                >
                  <div className="lp-tile-title">{t.title}</div>
                  <div className="lp-tile-sub">{t.sub}</div>
                  <div className="lp-tile-bottom">
                    <Icon name={t.icon} className="lp-tile-icon" />
                    {t.kpi !== undefined && (
                      <span className={`lp-tile-kpi ${t.kpiState ?? ''}`}>{t.kpi}</span>
                    )}
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

interface Node { id: string; label: string; tcode?: string; to?: string; children?: Node[] }

const TREE: Node[] = [
  { id: 'fav', label: '즐겨찾기', children: [] },
  {
    id: 'sap', label: 'SAP 메뉴', children: [
      {
        id: 'mm', label: '자재 관리 (MM)', children: [
          {
            id: 'pur', label: '구매', children: [
              {
                id: 'pr', label: '구매 요청', children: [
                  { id: 'me51n', label: '생성', tcode: 'ME51N', to: 'process-pr' },
                  { id: 'me52n', label: '변경', tcode: 'ME52N' },
                  { id: 'me53n', label: '표시', tcode: 'ME53N', to: 'process-pr' },
                  { id: 'me57', label: '지정 및 처리', tcode: 'ME57', to: 'process-pr' },
                ],
              },
              {
                id: 'po', label: '구매 오더', children: [
                  { id: 'me21n', label: '생성', tcode: 'ME21N', to: 'create-po' },
                  { id: 'me22n', label: '변경', tcode: 'ME22N', to: 'change-po' },
                  { id: 'me23n', label: '표시', tcode: 'ME23N', to: 'preview-po' },
                  { id: 'me2m', label: '자재별 리스트', tcode: 'ME2M', to: 'monitor-po' },
                ],
              },
            ],
          },
          {
            id: 'im', label: '재고 관리', children: [
              { id: 'migo', label: '자재 이동', tcode: 'MIGO', to: 'post-gr' },
              { id: 'mb03', label: '자재 전표 표시', tcode: 'MB03', to: 'gr-detail' },
              { id: 'mb90', label: '자재 전표 출력', tcode: 'MB90', to: 'gr-slip' },
            ],
          },
          {
            id: 'liv', label: '물류 송장 검증 (LIV)', children: [
              { id: 'miro', label: '수신 송장 입력', tcode: 'MIRO', to: 'create-invoice' },
              { id: 'mir4', label: '송장 전표 표시', tcode: 'MIR4', to: 'display-invoice' },
              { id: 'mr11', label: 'GR/IR 청산 계정 유지보수', tcode: 'MR11', to: 'clear-grir' },
            ],
          },
        ],
      },
      { id: 'wf', label: '사무실', children: [{ id: 'sbwp', label: '비즈니스 워크플레이스', tcode: 'SBWP', to: 'approve-po' }] },
    ],
  },
];

function TreeNode({ n, depth, open, toggle, sel, setSel }: { n: Node; depth: number; open: Set<string>; toggle: (id: string) => void; sel: string; setSel: (id: string) => void }) {
  const nav = useNavigate();
  const isOpen = open.has(n.id);
  const leaf = !n.children;
  return (
    <>
      <div
        className={`g-tree-row ${sel === n.id ? 'is-selected' : ''}`}
        style={{ paddingLeft: 6 + depth * 18 }}
        onClick={() => { setSel(n.id); if (!leaf) toggle(n.id); }}
        onDoubleClick={() => n.to && nav(`/step/${n.to}`)}
        title={leaf ? '두 번 클릭하여 실행' : undefined}
      >
        <span className="g-tree-exp">{leaf ? '' : isOpen ? '▾' : '▸'}</span>
        <span className={leaf ? 'g-tree-tx' : 'g-tree-folder'} />
        {n.tcode && <span className="g-tree-code">{n.tcode} - </span>}
        <span className={n.to || !leaf ? '' : 'g-tree-dim'}>{n.label}</span>
      </div>
      {isOpen && n.children?.map((c) => <TreeNode key={c.id} n={c} depth={depth + 1} open={open} toggle={toggle} sel={sel} setSel={setSel} />)}
    </>
  );
}

export function LaunchpadGui({ step }: StepProps) {
  const [open, setOpen] = useState(new Set(['sap', 'mm', 'pur', 'pr', 'po', 'im', 'liv']));
  const [sel, setSel] = useState('');
  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <GuiWindow title="SAP Easy Access" tcode={step.tcode} role={step.role}
      appToolbar={<><span className="g-at-item">▣ 기타 메뉴</span><span className="g-at-item">★ 즐겨찾기에 추가</span><span className="g-at-item">✎ 즐겨찾기 변경</span></>}>
      <div className="g-easy">
        <div className="g-tree">
          {TREE.map((n) => <TreeNode key={n.id} n={n} depth={0} open={open} toggle={toggle} sel={sel} setSel={setSel} />)}
        </div>
        <div className="g-easy-side">
          <div className="g-easy-logo">SAP S/4HANA Cloud</div>
          <p>트랜잭션을 두 번 클릭하거나 명령 필드에 트랜잭션 코드(예: <b>ME21N</b>, <b>MIGO</b>, <b>MIRO</b>)를 입력하고 Enter를 누르십시오.</p>
        </div>
      </div>
    </GuiWindow>
  );
}
