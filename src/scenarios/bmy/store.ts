/** BMY – Subcontracting: steps, sample data and document chain. */
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const SUP = { no: '10300007', name: 'Inland-Lohnbearbeiter A', city: 'Hamburg' };
export const MAT = 'SG23';
export const MAT_TX = 'Semifinished Good, Subcontracting';
export const QTY = 1000;
export const PRICE = 0.59;
export const VALUE = QTY * PRICE;
/** Components provided to the subcontractor (BOM of SG23). */
export const COMPS = [
  { item: '0010', material: 'RM13', text: 'Raw Material 13, PD', qty: 1000, unit: 'PC', price: 1.2 },
  { item: '0020', material: 'RM14', text: 'Raw Material 14, PD', qty: 1000, unit: 'PC', price: 0.8 },
];
export const COMP_VALUE = COMPS.reduce((a, c) => a + c.qty * c.price, 0);

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  step(1, 'mrp', 'MRP 실행 – 외주 구매 요청', 'Run MRP', '4.1', 'Schedule MRP Runs', 'F1339', 'MD03', 'Production Planner', true, 'none'),
  step(2, 'po', '외주 구매 오더 생성', 'Create Subcontracting Purchase Order', '4.2', 'Process Purchase Requisitions (V2)', 'F1048A', 'ME57', 'Purchaser', false, 'mrp'),
  step(3, 'monitor', '외주 PO 품목 모니터링', 'Monitor Subcontracting Purchase Orders', '4.3', 'Monitor Purchase Order Items', 'F2358', 'ME2M', 'Purchaser', true, 'po'),
  step(4, 'approve', '외주 구매 오더 승인', 'Approve Purchase Order', '4.4', 'My Inbox - All Items', 'F0862', 'SBWP', 'Purchasing Manager', true, 'po'),
  step(5, 'delivery', '구성품 납품 생성 (외주 콕핏)', 'Create Delivery for Components', '4.5', 'Subcontracting Cockpit', 'F2948', 'ME2ON', 'Shipping Specialist', false, 'approve'),
  step(6, 'pgi', '구성품 출고 전기 (541)', 'Post Goods Issue to Subcontractor', '4.6', 'Change Outbound Delivery', 'VL02N', 'VL02N', 'Shipping Specialist', false, 'delivery'),
  step(7, 'gr', '완제품 입고 (101 / 543)', 'Post Goods Receipt for Subcontracting PO', '4.7', 'Post Goods Receipt for Purchasing Document', 'F0843', 'MIGO', 'Warehouse Clerk', false, 'pgi'),
  step(8, 'review', '외주 재고 · 문서 흐름 확인', 'Review Subcontracting Stock', '4.8', 'Stock - Multiple Materials', 'F1595', 'MBLB', 'Inventory Manager', true, 'gr'),
  step(9, 'invoice', '외주 가공비 송장 생성', 'Create Supplier Invoice', '4.9', 'Create Supplier Invoice', 'F0859', 'MIRO', 'Accounts Payable Accountant', false, 'gr'),
];

export const OPTS: ChainOpts = {
  scn: 'bmy',
  numbers: () => ({
    pr: String(10000300 + rnd(0, 99)), po: String(4500001500 + rnd(0, 99)), dlv: String(80000500 + rnd(0, 99)),
    pgi: String(4900000000 + rnd(1000, 4999)), gr: String(5000000000 + rnd(1000, 4999)), grFi: String(5000000000 + rnd(5000, 9000)),
    inv: String(5105600000 + rnd(100, 900)), invFi: String(5100000000 + rnd(100, 900)),
  }),
  msgs: {
    mrp: (n) => `MRP 실행 완료 – 외주 구매 요청 ${n.pr}이(가) 생성되었습니다`,
    po: (n) => `표준 PO ${n.po}이(가) 생성되었습니다`,
    approve: (n) => `구매 오더 ${n.po}이(가) 릴리스되었습니다`,
    delivery: (n) => `납품 ${n.dlv}이(가) 저장되었습니다`,
    pgi: (n) => `납품 ${n.dlv} 출고가 전기되었습니다 (541)`,
    gr: (n) => `자재 전표 ${n.gr}이(가) 전기되었습니다`,
    invoice: (n) => `전표 번호 ${n.inv}이(가) 생성되었습니다`,
  },
};

export const useBmy = makeChain(OPTS);
