/** BMR – Scheduling Agreements in Procurement: steps, sample data and document chain. */
import { jo, pc } from '../../josa';
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const SUP = { no: '10300001', name: 'Inlandslieferant DE 1', city: 'Frankfurt' };
export const SUP2 = { no: '10300002', name: 'Inlandslieferant DE 2', city: 'München', price: 18 };
export const MAT = 'RM129';
export const MAT_TX = 'Raw Material 129, Scheduling Agreement';
export const PRICE = 17.55;
export const TARGET = 120000;
export const LINE_QTY = 1000;
export const LINES = [0, 7, 14];
export const GR_VALUE = LINE_QTY * PRICE;

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  step(1, 'create', '납품 일정 계약 생성', 'Create Scheduling Agreement', '4.1', 'Manage Scheduling Agreements', 'F2179', 'ME31L', 'Purchaser', false, 'none'),
  step(2, 'mass', '납품 일정 계약 일괄 변경', 'Mass Changes to Scheduling Agreements', '4.2', 'Mass Changes to Scheduling Agreements', 'F2668', 'MEMASSSA', 'Purchaser', true, 'create'),
  step(3, 'schedule', '납품 일정 라인 유지', 'Maintain Schedule Lines', '4.3', 'Maintain Scheduling Agreement Schedule Lines', 'ME38', 'ME38', 'Purchaser', false, 'create'),
  step(4, 'quota', '쿼터 배분 생성', 'Maintain Quota Arrangement', '4.4', 'Manage Quota Arrangements', 'F1877', 'MEQ1', 'Purchaser', true, 'create'),
  step(5, 'mrp', '계획 독립 소요 · MRP 실행', 'Planned Independent Requirements and MRP', '4.5', 'Schedule MRP Runs', 'F1339', 'MD01N', 'Production Planner', true, 'schedule'),
  step(6, 'release', '납품 일정 릴리스 생성 (FRC · JIT)', 'Create Scheduling Agreement Releases', '4.6', 'Create SA Releases', 'ME84', 'ME84', 'Purchaser', false, 'schedule'),
  step(7, 'print', '릴리스 출력 미리보기', 'Print Preview of Release', '4.7', 'Output Scheduling Agreement Releases', 'ME9E', 'ME9E', 'Purchaser', true, 'release'),
  step(8, 'coverage', '자재 소요 현황 확인', 'Monitor Material Coverage', '4.8', 'Monitor Material Coverage', 'F2101A', 'MD04', 'Production Planner', true, 'release'),
  step(9, 'gr', '납품 일정 기준 입고', 'Post Goods Receipt', '4.9', 'Post Goods Receipt for Purchasing Document', 'F0843', 'MIGO', 'Warehouse Clerk', false, 'release'),
  step(10, 'invoice', '공급업체 송장 생성', 'Create Supplier Invoice', '4.10', 'Create Supplier Invoice', 'F0859', 'MIRO', 'Accounts Payable Accountant', false, 'gr'),
];

export const OPTS: ChainOpts = {
  scn: 'bmr',
  numbers: () => ({
    sa: String(5500000100 + rnd(0, 99)), job: String(rnd(10000, 99999)), quota: String(rnd(100, 999)), rel: String(rnd(1, 9)).padStart(4, '0'),
    gr: String(5000000000 + rnd(1000, 4999)), inv: String(5105600000 + rnd(100, 900)), invFi: String(5100000000 + rnd(100, 900)),
  }),
  msgs: {
    create: (n) => `납품 일정 계약 ${jo(n.sa, '이')} 생성되었습니다`,
    mass: (n) => `일괄 변경 작업 ${jo(n.job, '이')} 완료되었습니다`,
    schedule: (n) => `납품 일정 계약 ${jo(n.sa, '이')} 변경되었습니다`,
    quota: (n) => `쿼터 배분 ${jo(n.quota, '이')} 저장되었습니다`,
    mrp: () => 'MRP 실행 완료 – 납품 일정 라인이 생성되었습니다',
    release: (n) => `릴리스 ${n.rel}(FRC/JIT)${pc(n.rel, '이')} 생성되었습니다`,
    gr: (n) => `자재 전표 ${jo(n.gr, '이')} 전기되었습니다`,
    invoice: (n) => `전표 번호 ${jo(n.inv, '이')} 생성되었습니다`,
  },
};

export const useBmr = makeChain(OPTS);
