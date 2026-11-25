/**
 * BMC – Core Inventory Management: steps, sample data and the live stock picture.
 * Every movement step changes the stock of TG11 in plant 1010; overview, material documents and
 * analytics are computed from the steps that have been posted.
 */
import { jo } from '../../josa';
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const MAT = 'TG11';
export const MAT_TX = 'Trading Good for Reg. Trading (MRP planning)';
export const PRICE = 10;
export const SUP = { no: '10300001', name: 'Domestic 10 Supplier 1' };
export const SLOCS = [
  { sl: '101A', name: 'Std. storage 1' }, { sl: '101B', name: 'Std. storage 2' },
  { sl: '101C', name: 'Raw mat. sto. loc.' }, { sl: '101R', name: 'Storage Location Returns' },
];
type Bucket = 'unr' | 'qi' | 'blk' | 'tr';
export interface Move { id: string; mvt: string; text: string; qty: number; delta: [string, Bucket, number][] }

/** Goods movements of the scenario (BPD 2.5.2 and 4.1–4.9) with their effect on stock. */
export const MOVES: Move[] = [
  { id: 'init', mvt: '561', text: '초기 재고 입력 (101R)', qty: 100, delta: [['101R', 'unr', 100]] },
  { id: 'grnoref', mvt: '501', text: '참조 없는 입고 (101A)', qty: 20, delta: [['101A', 'unr', 20]] },
  { id: 'scrapcopa', mvt: '551', text: '고객 반품 폐기 → CO-PA (101R)', qty: 5, delta: [['101R', 'unr', -5]] },
  { id: 'scrapcc', mvt: '551', text: '일반 재고 폐기 → 코스트 센터 (101A)', qty: 3, delta: [['101A', 'unr', -3]] },
  { id: 'block', mvt: '344', text: '가용 → 보류 (101A)', qty: 10, delta: [['101A', 'unr', -10], ['101A', 'blk', 10]] },
  { id: 'unblock', mvt: '343', text: '보류 → 가용 (101A)', qty: 5, delta: [['101A', 'blk', -5], ['101A', 'unr', 5]] },
  { id: 'toqi', mvt: '350', text: '보류 → 품질 검사 (101A)', qty: 5, delta: [['101A', 'blk', -5], ['101A', 'qi', 5]] },
  { id: 'transfer1', mvt: '311', text: '1단계 이전 101A → 101R', qty: 10, delta: [['101A', 'unr', -10], ['101R', 'unr', 10]] },
  { id: 'remove', mvt: '313', text: '2단계 이전: 101A에서 출고', qty: 8, delta: [['101A', 'unr', -8], ['101R', 'tr', 8]] },
  { id: 'place', mvt: '315', text: '2단계 이전: 101R에 입고', qty: 8, delta: [['101R', 'tr', -8], ['101R', 'unr', 8]] },
];
export const moveOf = (id: string) => MOVES.find((m) => m.id === id)!;

/** Stock per storage location after the posted movements (101A starts with 100 PC). */
export function stockOf(done: Record<string, string>) {
  const st: Record<string, Record<Bucket, number>> = Object.fromEntries(SLOCS.map((s) => [s.sl, { unr: s.sl === '101A' ? 100 : 0, qi: 0, blk: 0, tr: 0 }]));
  MOVES.filter((m) => done[m.id]).forEach((m) => m.delta.forEach(([sl, b, q]) => { st[sl][b] += q; }));
  return SLOCS.map((s) => ({ ...s, ...st[s.sl], total: st[s.sl].unr + st[s.sl].qi + st[s.sl].blk + st[s.sl].tr }));
}

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Warehouse Clerk', false, 'none'),
  step(1, 'init', '초기 재고 입력 (101R)', 'Initialize Material Stock', '2.5.2', 'Manage Stock', 'F1062', 'MB1C', 'Inventory Manager', true, 'none'),
  step(2, 'grnoref', '참조 없는 입고', 'Post Goods Receipt Without Reference', '4.1', 'Post Goods Receipt without Reference', 'F3244', 'MIGO_501', 'Warehouse Clerk', false, 'none'),
  step(3, 'scrapcopa', '고객 반품 폐기 (CO-PA)', 'Customer Returns Scrapping: Goods Issue to CO-PA', '4.2', 'Post Goods Movement', 'MIGO', 'MIGO', 'Inventory Manager', true, 'init'),
  step(4, 'scrapcc', '일반 재고 폐기 (코스트 센터)', 'General Stock Scrapping: Goods Issue to Cost Center', '4.3', 'Manage Stock', 'F1062', 'MB1A', 'Inventory Manager', false, 'none'),
  step(5, 'block', '재고 보류 (가용 → 보류)', 'Block Material', '4.4', 'Transfer Stock - In-Plant', 'F1061', 'MB1B_344', 'Warehouse Clerk', false, 'none'),
  step(6, 'unblock', '보류 해제 (보류 → 가용)', 'Unblock Material to Unrestricted', '4.5', 'Transfer Stock - In-Plant', 'F1061', 'MB1B_343', 'Warehouse Clerk', false, 'block'),
  step(7, 'toqi', '보류 → 품질 검사 재고', 'Unblock Material to Quality Inspection', '4.6', 'Transfer Stock - In-Plant', 'F1061', 'MB1B_350', 'Warehouse Clerk', true, 'block'),
  step(8, 'transfer1', '1단계 저장 위치 이전', 'One Step Stock Transfer', '4.7', 'Transfer Stock - In-Plant', 'F1061', 'MB1B', 'Warehouse Clerk', false, 'none'),
  step(9, 'remove', '2단계 이전 – 출고 (313)', 'Two Steps Stock Transfer (Remove)', '4.8', 'Transfer Stock - In-Plant', 'F1061', 'MB1B_313', 'Warehouse Clerk', true, 'none'),
  step(10, 'place', '2단계 이전 – 입고 (315)', 'Two Steps Stock Transfer (Place)', '4.9', 'Transfer Stock - In-Plant', 'F1061', 'MB1B_315', 'Warehouse Clerk', true, 'remove'),
  step(11, 'overview', '재고 현황 – 단일 자재', 'Stock Overview - Single Material', '4.10', 'Stock - Single Material', 'F1076', 'MMBE', 'Warehouse Clerk', true, 'none'),
  step(12, 'matdocs', '자재 전표 개요', 'Material Documents Overview', '4.11', 'Material Documents Overview', 'F1077', 'MB51', 'Warehouse Clerk', true, 'none'),
  step(13, 'slow', '저회전·무회전 자재', 'Slow or Non-Moving Materials', '4.12', 'Slow or Non-Moving Materials', 'F2137', 'MC46', 'Inventory Manager', false, 'none'),
  step(14, 'dead', '불용 재고 분석', 'Dead Stock Analysis', '4.13', 'Dead Stock Analysis', 'F2899', 'MC50', 'Inventory Manager', true, 'none'),
  step(15, 'gma', '재고 이동 분석', 'Goods Movement Analysis', '4.14', 'Goods Movement Analysis', 'F2912', 'MB5B', 'Inventory Manager', true, 'none'),
  step(16, 'range', '기간별 재고 분석', 'Analyze Stock in Date Range', '4.15', 'Analyze Stock in Date Range', 'F6185', 'MB5B_R', 'Inventory Manager', true, 'none'),
];

export const OPTS: ChainOpts = {
  scn: 'bmc',
  numbers: () => {
    const base = 4900000000 + rnd(1000, 8000);
    return Object.fromEntries(MOVES.map((m, i) => [m.id, String(base + i)]));
  },
  msgs: {
    ...Object.fromEntries(MOVES.map((m) => [m.id, (n: Record<string, string>) => `자재 전표 ${jo(n[m.id], '이')} 전기되었습니다 (${m.mvt})`])),
    slow: () => '저회전 자재 조회 완료',
  },
};

export const useBmc = makeChain(OPTS);
