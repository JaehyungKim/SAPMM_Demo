/** 41F – Procurement of Pipeline Materials: steps, sample data and document chain. */
import { jo } from '../../josa';
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const SUP = { no: '10300003', name: 'Inlandslieferant DE 3', city: 'Köln' };
export const MAT = 'PIP01';
export const MAT_TX = 'Pipeline Material 01 (공정 용수)';
export const QTY = 100;
export const UNIT = 'L';
export const PRICE = 1.2;
export const VALUE = QTY * PRICE;
export const CC = '10101301';
export const GL = '51100000';

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  step(1, 'inforecord', '파이프라인 구매 정보 레코드 생성', 'Create Purchasing Info Record', '4.1', 'Create Purchasing Info Record', 'ME11', 'ME11', 'Purchaser', true, 'none'),
  step(2, 'consume', '파이프라인 소비 기록 (201P)', 'Record Consumption', '4.2', 'Post Goods Movement', 'MIGO', 'MIGO', 'Warehouse Clerk', false, 'inforecord'),
  step(3, 'settle', '파이프라인 정산 작업 예약', 'Schedule Supplier Invoice Jobs', '4.3.1', 'Schedule Supplier Invoice Jobs - Advanced', 'F1683', 'MRKO', 'Accounts Payable Accountant', false, 'consume'),
  step(4, 'result', '정산 결과 확인', 'Check the Result', '4.3.1', 'Schedule Supplier Invoice Jobs - Advanced', 'F1683', 'MIR4', 'Accounts Payable Accountant', true, 'settle'),
];

export const OPTS: ChainOpts = {
  scn: '41f',
  numbers: () => ({
    info: String(5300000100 + rnd(0, 99)), md: String(4900000000 + rnd(1000, 9000)), mdFi: String(4900000000 + rnd(9001, 9999)),
    job: String(rnd(10000, 99999)), inv: String(5105600000 + rnd(100, 900)), invFi: String(5100000000 + rnd(100, 900)),
  }),
  msgs: {
    inforecord: (n) => `구매 정보 레코드 ${jo(n.info, '이')} 저장되었습니다 (파이프라인)`,
    consume: (n) => `자재 전표 ${jo(n.md, '이')} 전기되었습니다 (201P)`,
    settle: (n) => `작업 ${jo(n.job, '이')} 예약되었습니다 – 정산 문서 ${n.inv}`,
  },
};

export const use41f = makeChain(OPTS);
