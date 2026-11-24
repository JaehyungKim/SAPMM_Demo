/** 22Z – Procurement of Services: steps, sample data and document chain. */
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const SUP = { no: '10300001', name: 'Inlandslieferant DE 1', city: 'Frankfurt' };
export const GROUP = '003';
export const CC = [{ cc: '10101501', name: 'IT 서비스', pct: 70 }, { cc: '10101601', name: '시설 관리', pct: 30 }];
export const SVC = { item: '10', material: 'SM0001', text: '현장 유지보수 서비스 (시간)', qty: 50, unit: 'H', price: 20 };
export const SVC_VALUE = SVC.qty * SVC.price;
export const LIMIT = { item: '20', text: '예비 부품 · 기타 서비스 (Limit)', expected: 200, overall: 400, actual: 150 };
export const SES_VALUE = SVC_VALUE + LIMIT.actual;
export const PO_VALUE = SVC_VALUE + LIMIT.expected;

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  step(1, 'contract', '서비스 구매 계약 생성', 'Create Purchase Contract for Services', '4.1', 'Manage Purchase Contracts', 'F1600A', 'ME31K', 'Purchaser', true, 'none'),
  step(2, 'pr', '서비스 구매 요청 생성 (Limit 품목)', 'Create Purchase Requisition for Services', '4.2', 'Manage Purchase Requisitions - Professional', 'F2229', 'ME51N', 'Purchaser', false, 'contract'),
  step(3, 'autopo', '구매 오더 자동 생성 작업', 'Schedule Automatic Creation of Purchase Orders', '4.3', 'Schedule Purchasing Jobs - Automatic PO Creation', 'F1702', 'ME59N', 'Purchaser', true, 'pr'),
  step(4, 'po', '서비스 구매 오더 생성', 'Create Purchase Order for Services', '4.4', 'Process Purchase Requisitions (V2)', 'F1048A', 'ME57', 'Purchaser', false, 'pr'),
  step(5, 'approve', '서비스 구매 오더 승인', 'Approve Purchase Order', '4.5', 'My Inbox - All Items', 'F0862', 'SBWP', 'Purchasing Manager', true, 'po'),
  step(6, 'ses', '서비스 입력 시트 생성', 'Create Service Entry Sheet', '4.6', 'Manage Service Entry Sheets - Lean Services', 'F2027', 'ML81N', 'Purchaser', false, 'approve'),
  step(7, 'sesapprove', '서비스 입력 시트 승인', 'Approve Service Entry Sheet', '4.7', 'My Inbox - All Items', 'F0862', 'MLSES', 'Purchasing Manager', false, 'ses'),
  step(8, 'sescheck', '서비스 입력 시트 · 문서 흐름 확인', 'Display Service Entry Sheet', '4.8', 'Manage Service Entry Sheets - Lean Services', 'F2027', 'ML82', 'Purchaser', true, 'sesapprove'),
  step(9, 'invoice', '서비스 송장 생성', 'Create Supplier Invoice', '4.9', 'Create Supplier Invoice', 'F0859', 'MIRO', 'Accounts Payable Accountant', false, 'sesapprove'),
  step(10, 'release', '보류된 송장 릴리스', 'Release Blocked Invoice', '4.10', 'Manage Supplier Invoices', 'F0859A', 'MRBR', 'Accounts Payable Accountant', true, 'invoice'),
];

export const OPTS: ChainOpts = {
  scn: '22z',
  numbers: () => ({
    contract: String(4600000200 + rnd(0, 99)), pr: String(10000400 + rnd(0, 99)), job: String(rnd(10000, 99999)), po: String(4500001600 + rnd(0, 99)),
    ses: String(1000000100 + rnd(0, 99)), gr: String(5000000000 + rnd(1000, 4999)), inv: String(5105600000 + rnd(100, 900)), invFi: String(5100000000 + rnd(100, 900)),
  }),
  msgs: {
    contract: (n) => `계약 ${n.contract}이(가) 생성되었습니다`,
    pr: (n) => `구매 요청 ${n.pr}이(가) 생성되었습니다`,
    autopo: (n) => `작업 ${n.job} 완료 – 구매 오더 ${n.po}이(가) 생성되었습니다`,
    po: (n) => `표준 PO ${n.po}이(가) 생성되었습니다`,
    approve: (n) => `구매 오더 ${n.po}이(가) 릴리스되었습니다`,
    ses: (n) => `서비스 입력 시트 ${n.ses}이(가) 승인 요청되었습니다`,
    sesapprove: (n) => `서비스 입력 시트 ${n.ses}이(가) 승인되었습니다 – 자재 전표 ${n.gr}`,
    invoice: (n) => `전표 번호 ${n.inv}이(가) 생성되었습니다 (지급 보류)`,
    release: (n) => `송장 ${n.inv}의 지급 보류가 해제되었습니다`,
  },
};

export const use22z = makeChain(OPTS);
