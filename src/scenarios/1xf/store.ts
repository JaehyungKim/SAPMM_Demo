/** 1XF – Request for Price: steps, sample data and document chain. */
import { jo } from '../../josa';
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const MAT = 'TG0011';
export const MAT_TX = 'Trading Good 0011,PD,Regular Proc.';
export const QTY = 100;
export const TARGET = 3500;
export const BIDDERS = [
  { no: '10300001', name: 'Domestic 10 Supplier 1', city: 'Hamburg', price: 30 },
  { no: '10300002', name: 'Domestic 10 Supplier 2', city: 'Berlin', price: 35 },
];
export const BEST = BIDDERS[0];

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  step(1, 'rfq', '가격 요청(RFQ) 생성 및 게시', 'Create Price Request', '4.1', 'Manage RFQs', 'F2049', 'ME41', 'Purchaser', false, 'none'),
  step(2, 'quotes', '공급업체 견적 입력', 'Create Supplier Quotation', '4.2', 'Manage RFQs', 'F2049', 'ME47', 'Purchaser', false, 'rfq'),
  step(3, 'display', '공급업체 견적 확인', 'Display Supplier Quotation', '4.3', 'Manage RFQs', 'F2049', 'ME48', 'Purchaser', true, 'quotes'),
  step(4, 'award', '견적 비교 및 낙찰', 'Compare and Award Supplier Quotation', '4.4', 'Compare Supplier Quotations', 'F2324', 'ME49', 'Purchaser', false, 'quotes'),
  step(5, 'followon', '후속 문서(구매 계약) 생성', 'Create Follow-on Documents', '4.5', 'Manage Supplier Quotations', 'F1991', 'ME31K', 'Purchaser', false, 'award'),
  step(6, 'situation', '견적 부족 상황 알림 대응', 'Detect and React to Situation', '4.6', 'My Situations', 'F4154', 'SITN', 'Purchaser', true, 'rfq'),
];

export const OPTS: ChainOpts = {
  scn: '1xf',
  numbers: () => ({
    rfq: String(7000000100 + rnd(0, 99)), q1: String(8000000100 + rnd(0, 49)), q2: String(8000000150 + rnd(0, 49)), contract: String(4600000300 + rnd(0, 99)),
  }),
  msgs: {
    rfq: (n) => `RFQ ${jo(n.rfq, '이')} 게시되었습니다`,
    quotes: (n) => `공급업체 견적 ${n.q1}, ${jo(n.q2, '이')} 제출되었습니다`,
    award: (n) => `견적 ${jo(n.q1, '이')} 낙찰되었습니다`,
    followon: (n) => `구매 계약 ${jo(n.contract, '이')} 생성되었습니다`,
    situation: () => '상황이 해결됨으로 처리되었습니다',
  },
};

export const use1xf = makeChain(OPTS);
