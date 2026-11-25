/** BMK – Return to Supplier (BMK_DE): steps, sample data and document chain. */
import { jo } from '../../josa';
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const SUP = { no: '10300006', name: 'Inlandslieferant DE 6 (Retouren)', city: 'Berlin' };
export const MAT = 'TG12';
export const MAT_TX = 'Trading Good for Reg. Trading (reorder point planning)';
export const PRICE = 15;
/** Item 10 goes back for a credit memo, item 20 for replacement material (advanced returns NB2). */
export const ITEMS = [
  { item: '10', material: MAT, text: MAT_TX, qty: 5, unit: 'PC', price: PRICE, reason: '잘못된 자재 납품', follow: '대변 메모' },
  { item: '20', material: MAT, text: MAT_TX, qty: 2, unit: 'PC', price: PRICE, reason: '품질 검사 불합격', follow: '대체 자재 수령' },
];
export const RET_QTY = ITEMS.reduce((a, i) => a + i.qty, 0);

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  step(1, 'stock', '재고 현황 분석', 'Analyse Stock Overview', '2.5.7', 'Stock - Single Material', 'F1076', 'MMBE', 'Inventory Manager', true, 'none'),
  step(2, 'transfer', '반품 저장 위치로 재고 이전', 'Transfer Stock', '2.5.8', 'Transfer Stock - In-Plant', 'F1061', 'MB1B', 'Warehouse Clerk', true, 'none'),
  step(3, 'retpo', '반품 구매 오더 생성', 'Create Returns Purchase Order', '4.1.1', 'Create Purchase Order - Advanced', 'ME21N', 'ME21N', 'Purchaser', false, 'none'),
  step(4, 'delivery', '반품 아웃바운드 납품 생성', 'Create Outbound Delivery', '4.1.2', 'My Purchase Orders - Due for Delivery', 'VL10B', 'VL10B', 'Shipping Specialist', false, 'retpo'),
  step(5, 'pgi', '피킹 및 출고 전기', 'Pick and Post Goods Issue', '4.1.3', 'Change Outbound Delivery', 'VL02N', 'VL02N', 'Shipping Specialist', false, 'delivery'),
  step(6, 'monitor', '반품 PO 품목 모니터링', 'Monitor Purchase Order Items', '4.2.3', 'Monitor Purchase Order Items', 'F2358', 'ME2M', 'Purchaser', true, 'retpo'),
  step(7, 'credit', '대변 메모 생성', 'Create Credit Memo', '4.1.4', 'Create Supplier Invoice', 'F0859', 'MIRO', 'Accounts Payable Accountant', false, 'pgi'),
  step(8, 'replace', '대체 자재 수령 처리', 'Receive Replacement Material', '4.1.5', 'Receive Replacement Materials - From Vendor', 'MSR_VRM_GR', 'MSR_VRM_GR', 'Receiving Specialist', true, 'pgi'),
  step(9, 'replgr', '대체 자재 입고 전기', 'Post Goods Receipt (Inbound Delivery)', '4.1.6', 'Change Inbound Delivery', 'VL32N', 'VL32N', 'Receiving Specialist', true, 'replace'),
  step(10, 'followup', '대체 자재 후속 조치', 'Follow-Up Activities for Replacement Material', '4.1.7', 'My Follow-Up Activities - For Replacement Materials', 'MSR_VRM_LFU', 'MSR_VRM_LFU', 'Receiving Specialist', true, 'replgr'),
  step(11, 'invdoc', '반품 개요 – 송장 문서 확인', 'Check Invoice Document', '4.1.8', 'Manage Purchase Orders', 'F0842A', 'ME23N', 'Purchaser', true, 'replgr'),
];

export const OPTS: ChainOpts = {
  scn: 'bmk',
  numbers: () => ({
    tr: String(4900000000 + rnd(1000, 4999)), retpo: String(4500001300 + rnd(0, 99)), dlv: String(80000400 + rnd(0, 99)),
    pgi: String(4900000000 + rnd(5000, 9000)), credit: String(5105600000 + rnd(100, 900)), creditFi: String(5100000000 + rnd(100, 900)),
    replpo: String(4500001400 + rnd(0, 99)), ibd: String(180000000 + rnd(100, 999)), replgr: String(5000000000 + rnd(1000, 9000)), ivdoc: String(5105600000 + rnd(901, 999)),
  }),
  msgs: {
    transfer: (n) => `자재 전표 ${jo(n.tr, '이')} 전기되었습니다 (이동 유형 311)`,
    retpo: (n) => `반품 구매 오더(Enh.Ret.to Supplier) ${jo(n.retpo, '이')} 생성되었습니다`,
    delivery: (n) => `납품 ${jo(n.dlv, '이')} 백그라운드에서 생성되었습니다`,
    pgi: (n) => `반품(구매 오더) ${jo(n.dlv, '이')} 저장되었습니다 – 출고 전기 완료`,
    credit: (n) => `대변 메모 ${jo(n.credit, '이')} 전기되었습니다`,
    replace: (n) => `대체 구매 오더 ${jo(n.replpo, '이')} 생성되었습니다`,
    replgr: (n) => `인바운드 납품 ${n.ibd}에 대한 입고가 전기되었습니다`,
    followup: () => '물류 후속 조치가 저장되었습니다',
  },
};

export const useBmk = makeChain(OPTS);
