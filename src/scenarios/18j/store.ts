/** 18J – Requisitioning: steps, sample data and document chain. */
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const SUP = { no: '10300002', name: 'Inlandslieferant DE 2', city: 'München' };
export const GROUP = '003';
export const ITEM = { item: '10', material: 'YBMM00', text: '사무용 모니터 거치대 (카탈로그)', qty: 10, unit: 'EA', price: 100 };
export const VALUE = ITEM.qty * ITEM.price;
export const SPLIT = [{ cc: '10101101', name: '관리팀', pct: 40 }, { cc: '10101401', name: '영업팀', pct: 60 }];
export const STOCK = { material: 'TG0011', text: 'Trading Good 11 (재고 자재)', qty: 10, unit: 'PC' };

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Employee', false, 'none'),
  step(1, 'catalog', '카탈로그 품목 관리', 'Manage Catalog Items', '4.1', 'Manage Catalog Items', 'F3149', 'MECCM', 'Purchaser', true, 'none'),
  step(2, 'pr', '셀프서비스 구매 요청', 'Create Purchase Requisition (Self-Service)', '4.2', 'Create Purchase Requisition', 'F1643A', 'ME51N', 'Employee', false, 'catalog'),
  step(3, 'masschange', '구매 요청 일괄 변경', 'Mass Changes to Purchase Requisitions', '4.3', 'Mass Changes to Purchase Requisitions', 'F2594', 'MEMASSRQ', 'Purchaser', true, 'pr'),
  step(4, 'prmonitor', '구매 요청 품목 모니터링', 'Monitor Purchase Requisition Items', '4.4', 'Monitor Purchase Requisition Items', 'F2422', 'ME5A', 'Purchaser', true, 'pr'),
  step(5, 'prapprove', '구매 요청 승인 (부서 관리자)', 'Approve Purchase Requisition', '4.5', 'My Inbox - Approve Purchase Requisitions', 'F0401', 'ME54N', 'Manager', true, 'pr'),
  step(6, 'workload', '구매 담당자 업무량 재배분', 'Manage Workload of Purchasers', '4.6', 'Manage Workload of Purchasers', 'F2504', 'ME5W', 'Purchasing Manager', true, 'prapprove'),
  step(7, 'po', '구매 요청 → 구매 오더 전환', 'Create Purchase Order from Requisition', '4.7', 'Process Purchase Requisitions (V2)', 'F1048A', 'ME57', 'Purchaser', false, 'workload'),
  step(8, 'poapprove', '구매 오더 승인', 'Approve Purchase Order', '4.8', 'My Inbox - All Items', 'F0862', 'SBWP', 'Purchasing Manager', true, 'po'),
  step(9, 'confirm', '입고 확인 (요청자)', 'Confirm Receipt of Goods', '4.9', 'Confirm Receipt of Goods and Services', 'F4489', 'MIGO_GR', 'Employee', false, 'poapprove'),
  step(10, 'invoice', '공급업체 송장 생성', 'Create Supplier Invoice', '4.10', 'Create Supplier Invoice', 'F0859', 'MIRO', 'Accounts Payable Accountant', false, 'confirm'),
  step(11, 'reserve', '재고 자재 요청 → 예약 자동 생성', 'Requisition Stock Material (Reservation)', '4.11', 'Create Purchase Requisition', 'F1643A', 'MB21', 'Employee', true, 'none'),
  step(12, 'gi', '예약 기준 출고 (201)', 'Post Goods Issue for Reservation', '4.12', 'Post Goods Movement', 'F0843', 'MIGO', 'Warehouse Clerk', true, 'reserve'),
];

export const OPTS: ChainOpts = {
  scn: '18j',
  numbers: () => ({
    pr: String(10000500 + rnd(0, 99)), job: String(rnd(10000, 99999)), po: String(4500001700 + rnd(0, 99)), gr: String(5000000000 + rnd(1000, 4999)),
    inv: String(5105600000 + rnd(100, 900)), invFi: String(5100000000 + rnd(100, 900)), rsv: String(rnd(1000, 9999)), gi: String(4900000000 + rnd(1000, 4999)),
  }),
  msgs: {
    catalog: () => '카탈로그 품목이 게시되었습니다',
    pr: (n) => `구매 요청 ${n.pr}이(가) 생성되었습니다`,
    masschange: (n) => `일괄 변경 작업 ${n.job}이(가) 완료되었습니다`,
    prapprove: (n) => `구매 요청 ${n.pr}이(가) 승인되었습니다`,
    workload: () => '구매 요청이 구매 그룹 003으로 재배분되었습니다',
    po: (n) => `표준 PO ${n.po}이(가) 생성되었습니다`,
    poapprove: (n) => `구매 오더 ${n.po}이(가) 릴리스되었습니다`,
    confirm: (n) => `자재 전표 ${n.gr}이(가) 전기되었습니다`,
    invoice: (n) => `전표 번호 ${n.inv}이(가) 생성되었습니다`,
    reserve: (n) => `예약 ${n.rsv}이(가) 생성되었습니다`,
    gi: (n) => `자재 전표 ${n.gi}이(가) 전기되었습니다 (201)`,
  },
};

export const use18j = makeChain(OPTS);
