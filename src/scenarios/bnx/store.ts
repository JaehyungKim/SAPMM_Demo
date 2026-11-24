/**
 * BNX – Consumable Purchasing: document chain
 * PR for a consumable (account assignment K, source = contract) → PO → [text item with
 * multiple account assignment] → [mass change] → [approval] → GR posted to cost centers
 * → [GR slip] → invoice (optionally blocked) → [release blocked invoice].
 * Sample data from BNX_DE test script (2025 FPS2).
 */
import { create } from 'zustand';
import { demoStorage } from '../../persistStorage';
import { persist } from 'zustand/middleware';
import { todayIso } from '../../format';
import { useDemo } from '../../store';
import { anchoredMerge, rnd } from '../shared/persist';
import { isOptOn } from '../types';
import type { DocItem, GrPosted, InvPosted } from '../shared/ui';

export const SUPPLIER = { no: '10300001', name: 'Domestic 10 Supplier 1', city: 'Hamburg' };
export const PURCH_GROUP = '003';
export const CC1 = '10101101';
export const CC2 = '10101401';

export interface Split { cc: string; pct: number }
export interface BnxItem extends DocItem { gl: string; matGroup: string; split: Split[] }

export const acctText = (split: Split[]) => 'K · ' + split.map((x) => (split.length > 1 ? `${x.cc} ${x.pct}%` : x.cc)).join(' / ');

/** Item 10: consumable with material number, from the requisition (BPD 4.1 case 1). */
export const ITEM10: BnxItem = { item: '10', material: 'NS0001', text: '소모품 NS0001 (Non-Stock)', qty: 60, unit: 'PC', price: 10, gl: '51600000', matGroup: 'YBMM01', split: [{ cc: CC1, pct: 100 }], acct: '' };
/** Item 20: text item without material number, two cost centers 20/80 (BPD 4.3 case 1 + 4.14). */
export const ITEM20: BnxItem = { item: '20', material: '', text: '사무용품 (office supplies)', qty: 40, unit: 'PC', price: 2.5, gl: '65100000', matGroup: 'YBMM00', split: [{ cc: CC1, pct: 20 }, { cc: CC2, pct: 80 }], acct: '' };
ITEM10.acct = acctText(ITEM10.split);
ITEM20.acct = acctText(ITEM20.split);

export type BnxReq = 'none' | 'pr' | 'po' | 'po-released' | 'gr' | 'invoice' | 'limit';

/** Limit item 30 (BPD 4.5): expected 300, overall limit 500 – supplier later bills 560. */
export const LIMIT_ITEM = { item: '30', text: '사무실 수리 · 기타 소모성 서비스 (Limit)', expected: 300, overall: 500, billed: 560, cc: CC1, gl: '65100000' };
/** Periodic invoicing plan (BPD 4.15): coffee machine rental, 50 EUR monthly for 12 months. */
export const PLAN = { text: '커피 머신 임대 (월)', monthly: 50, months: 12, cc: CC2, gl: '67000000' };

interface Numbers { pr: string; contract: string; po: string; gr: string; grFi: string; inv: string; invFi: string; job: string; inv2: string; cm: string; planPo: string; planInv: string }
const newNumbers = (): Numbers => ({
  pr: String(10000000 + rnd(6000, 6999)),
  contract: String(4600000000 + rnd(900, 999)),
  po: String(4500001000 + rnd(0, 899)),
  gr: String(5000000000 + rnd(1000, 9000)),
  grFi: String(4900000000 + rnd(1000, 9000)),
  inv: String(5105600000 + rnd(100, 900)),
  invFi: String(5100000000 + rnd(100, 900)),
  job: String(rnd(10000, 99999)),
  inv2: String(5105600000 + rnd(901, 949)),
  cm: String(5105600000 + rnd(950, 999)),
  planPo: String(4500001900 + rnd(0, 99)),
  planInv: String(5105700000 + rnd(100, 900)),
});

export interface BnxPo { status: 'Pending' | 'Released' | 'Rejected'; createdAt: string; payTerms: string; items: BnxItem[]; note: string }

export interface BnxState {
  anchorDate: string;
  briefed: boolean;
  visited: string[];
  numbers: Numbers;
  pr: 'None' | 'Created' | 'Ordered';
  po: BnxPo | null;
  massChanged: boolean;
  gr: GrPosted | null;
  invoice: InvPosted | null;
  released: boolean;
  /** Completion dates of the added optional steps (workload, limit, invplan, reduce). */
  ext: Record<string, string>;

  setBriefed: (b: boolean) => void;
  markVisited: (id: string) => void;
  reset: () => void;
  createPR: () => void;
  createPO: () => void;
  addTextItem: () => void;
  massChange: () => void;
  decidePO: (approve: boolean, note: string) => void;
  postGR: (dn: string, qty: Record<string, number>) => void;
  postInvoice: (ref: string, amount: number, blocked: boolean) => void;
  releaseInvoice: () => void;
  markExt: (id: string, text: string) => void;
  meets: (r: BnxReq) => boolean;
  autoComplete: (r: BnxReq) => void;
}

const fresh = () => ({
  anchorDate: todayIso(),
  briefed: false,
  visited: [] as string[],
  numbers: newNumbers(),
  pr: 'None' as const,
  po: null,
  massChanged: false,
  gr: null,
  invoice: null,
  released: false,
  ext: {} as Record<string, string>,
});

const msg = (text: string) => useDemo.getState().setGuiMessage({ type: 'S', text });

export const useBnx = create<BnxState>()(
  persist(
    (set, get) => ({
      ...fresh(),
      setBriefed: (briefed) => set({ briefed }),
      markVisited: (id) => set((s) => (s.visited.includes(id) ? s : { visited: [...s.visited, id] })),
      reset: () => set(fresh()),

      createPR: () => { set({ pr: 'Created' }); msg(`구매 요청 ${get().numbers.pr}이(가) 생성되었습니다`); },

      createPO: () => {
        // Flexible workflow: purchasing group 003 and net value > 500 EUR → release by purchasing manager.
        const needs = isOptOn('bnx', 'approve');
        set({ pr: 'Ordered', po: { status: needs ? 'Pending' : 'Released', createdAt: todayIso(), payTerms: '0001', items: [ITEM10], note: '' } });
        msg(`표준 구매 오더가 ${get().numbers.po} 번호로 생성되었습니다`);
      },

      addTextItem: () => {
        const po = get().po;
        if (!po || po.items.length > 1) return;
        set({ po: { ...po, items: [...po.items, ITEM20] } });
        msg(`표준 구매 오더 ${get().numbers.po}이(가) 변경되었습니다`);
      },

      massChange: () => {
        const po = get().po;
        if (!po) return;
        set({ po: { ...po, payTerms: '0003' }, massChanged: true });
        msg(`일괄 변경 작업 ${get().numbers.job}이(가) 완료되었습니다`);
      },

      decidePO: (approve, note) => {
        const po = get().po;
        if (!po) return;
        set({ po: { ...po, status: approve ? 'Released' : 'Rejected', note } });
        msg(`구매 오더 ${get().numbers.po}이(가) ${approve ? '승인' : '반려'}되었습니다`);
      },

      postGR: (dn, qty) => {
        const n = get().numbers;
        set({ gr: { docNo: n.gr, fiDocNo: n.grFi, date: todayIso(), dn, qty } });
        msg(`자재 전표 ${n.gr}이(가) 전기되었습니다`);
      },

      postInvoice: (ref, amount, blocked) => {
        const n = get().numbers;
        set({ invoice: { doc: n.inv, fi: n.invFi, ref, amount, date: todayIso(), blocked } });
        msg(`전표 번호 ${n.inv}이(가) 생성되었습니다${blocked ? ' (지급 보류)' : ''}`);
      },

      releaseInvoice: () => {
        const inv = get().invoice;
        if (!inv) return;
        set({ invoice: { ...inv, blocked: false }, released: true });
        msg(`송장 ${inv.doc}이(가) 지급을 위해 릴리스되었습니다`);
      },

      markExt: (id, text) => { set({ ext: { ...get().ext, [id]: todayIso() } }); msg(text); },

      meets: (r) => {
        const s = get();
        switch (r) {
          case 'none': return true;
          case 'pr': return s.pr !== 'None';
          case 'po': return !!s.po;
          case 'po-released': return s.po?.status === 'Released';
          case 'gr': return !!s.gr;
          case 'invoice': return !!s.invoice;
          case 'limit': return !!s.ext.limit;
        }
      },

      autoComplete: (r) => {
        if (r === 'limit') {
          if (get().pr === 'None') get().createPR();
          if (!get().po) get().createPO();
          if (!get().ext.limit) get().markExt('limit', `구매 오더 ${get().numbers.po}에 Limit 품목이 추가되었습니다`);
          useDemo.getState().setGuiMessage({ type: 'I', text: '선행 단계가 자동으로 완료되었습니다' });
          return;
        }
        const order: BnxReq[] = ['none', 'pr', 'po', 'po-released', 'gr', 'invoice'];
        const t = order.indexOf(r);
        const s = get;
        if (t >= 1 && s().pr === 'None') s().createPR();
        if (t >= 2 && !s().po) s().createPO();
        if (t >= 3 && s().po?.status !== 'Released') s().decidePO(true, '데모 자동 승인');
        if (t >= 4 && !s().gr) s().postGR('DN-' + s().numbers.po.slice(-4), Object.fromEntries(s().po!.items.map((i) => [i.item, i.qty])));
        if (t >= 5 && !s().invoice) {
          const v = s().po!.items.reduce((a, i) => a + i.qty * i.price, 0);
          s().postInvoice(`INV-${new Date().getFullYear()}-0${s().numbers.po.slice(-2)}`, v, isOptOn('bnx', 'release'));
        }
        useDemo.getState().setGuiMessage({ type: 'I', text: '선행 단계가 자동으로 완료되었습니다' });
      },
    }),
    { name: 'j45-demo-bnx', storage: demoStorage, version: 1, merge: (p, c) => { const m = anchoredMerge(p, c); return { ...m, numbers: { ...c.numbers, ...m.numbers }, ext: m.ext ?? {} }; } },
  ),
);
