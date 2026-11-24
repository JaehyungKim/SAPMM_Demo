/**
 * BMD – Purchase Contract: document chain
 * Outline-agreement PR (RV) → quantity contract (MK) → [approval] → output → [source list]
 * → standard PR converted to a release order (PO against the contract) → GR → invoice
 * → [contract change with version history]. Sample data from BMD_DE test script (2025 FPS2).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { todayIso } from '../../format';
import { useDemo } from '../../store';
import { anchoredMerge, rnd, yearEnd } from '../shared/persist';
import { isOptOn } from '../types';
import type { DocItem, GrPosted, InvPosted } from '../shared/ui';

export const SUPPLIER = { no: '10300001', name: 'Domestic 10 Supplier 1', city: 'Hamburg' };
export const TRACKING = 'Test_Track';
export const MATS = {
  TG10: 'Trad.Good 10,PD,Third Party',
  TG11: 'Trading Good for Reg. Trading (MRP planning)',
};
/** Outline-agreement requisition (RV) items and contract target quantities, BPD 4.1.2 / 4.2.1. */
export const RV_ITEMS = [
  { item: '10', material: 'TG10', qty: 50, target: 500 },
  { item: '20', material: 'TG11', qty: 10, target: 100 },
];
/** Standard requisition (NB) converted into the release order, BPD 4.1.1 / 4.8. */
export const NB_ITEMS = [
  { item: '10', material: 'TG10', qty: 50 },
  { item: '20', material: 'TG11', qty: 30 },
];
export const CONTRACT_PRICE = 10;
export const APPROVAL_LIMIT = 2000;

export interface ContractItem { item: string; material: string; text: string; target: number; price: number; released: number }
export interface Contract {
  status: 'Pending' | 'Released' | 'Rejected';
  createdAt: string;
  validFrom: string;
  validTo: string;
  targetValue: number;
  items: ContractItem[];
  version: number;
  note: string;
}
export interface VersionEntry { v: number; date: string; reason: string; field: string; oldValue: string; newValue: string; user: string }

export type BmdReq = 'none' | 'pr' | 'contract' | 'contract-released' | 'po' | 'po-released' | 'gr';

/** Reference contract for a second supplier created from the saved contract template (BPD 4.3). */
export const REF_SUPPLIER = { no: '10300002', name: 'Domestic 10 Supplier 2', city: 'Berlin', price: 10.5 };
/** Partial GR reversal: TG11 item 20, 5 PC, movement type 102 (BPD 4.13). */
export const REVERSAL = { item: '20', material: 'TG11', qty: 5 };
export const PO_APPROVAL_LIMIT = 500;
export const nextYearEnd = () => `${new Date().getFullYear() + 1}-12-31`;

interface Numbers { prRv: string; prNb: string; contract: string; po: string; gr: string; grFi: string; inv: string; invFi: string; refContract: string; revDoc: string; job: string }
const newNumbers = (): Numbers => ({
  prRv: String(10000000 + rnd(4000, 4999)),
  prNb: String(10000000 + rnd(5000, 5999)),
  contract: String(4600000000 + rnd(100, 899)),
  po: String(4500000000 + rnd(900, 999)),
  gr: String(5000000000 + rnd(1000, 9000)),
  grFi: String(4900000000 + rnd(1000, 9000)),
  inv: String(5105600000 + rnd(100, 900)),
  invFi: String(5100000000 + rnd(100, 900)),
  refContract: String(4600000000 + rnd(900, 999)),
  revDoc: String(5000000000 + rnd(9001, 9999)),
  job: String(rnd(10000, 99999)),
});

export interface BmdState {
  anchorDate: string;
  briefed: boolean;
  visited: string[];
  numbers: Numbers;
  prRv: 'None' | 'Created' | 'Contracted';
  contract: Contract | null;
  versions: VersionEntry[];
  printed: boolean;
  sourceList: boolean;
  prNb: 'Open' | 'Ordered';
  po: { createdAt: string; items: DocItem[] } | null;
  gr: GrPosted | null;
  invoice: InvPosted | null;
  /** Completion dates of the added optional steps (reference, mass, poapprove, reverse). */
  ext: Record<string, string>;

  setBriefed: (b: boolean) => void;
  markVisited: (id: string) => void;
  reset: () => void;
  createRvPr: () => void;
  createContract: () => void;
  decideContract: (approve: boolean, note: string) => void;
  markPrinted: () => void;
  createSourceList: () => void;
  createPO: () => void;
  postGR: (dn: string, qty: Record<string, number>) => void;
  postInvoice: (ref: string, amount: number) => void;
  changeContract: (targetValue: number, reason: string) => void;
  createReference: () => void;
  massExtend: () => void;
  approvePO: () => void;
  reverseGR: () => void;
  meets: (r: BmdReq) => boolean;
  autoComplete: (r: BmdReq) => void;
}

const fresh = () => ({
  anchorDate: todayIso(),
  briefed: false,
  visited: [] as string[],
  numbers: newNumbers(),
  prRv: 'None' as const,
  contract: null,
  versions: [] as VersionEntry[],
  printed: false,
  sourceList: false,
  prNb: 'Open' as const,
  po: null,
  gr: null,
  invoice: null,
  ext: {} as Record<string, string>,
});

const msg = (text: string) => useDemo.getState().setGuiMessage({ type: 'S', text });
export const contractValue = (items: ContractItem[]) => items.reduce((a, i) => a + i.target * i.price, 0);
export const itemsFromContract = (ct: Contract) => ct.items;

export const useBmd = create<BmdState>()(
  persist(
    (set, get) => ({
      ...fresh(),
      setBriefed: (briefed) => set({ briefed }),
      markVisited: (id) => set((s) => (s.visited.includes(id) ? s : { visited: [...s.visited, id] })),
      reset: () => set(fresh()),

      createRvPr: () => { set({ prRv: 'Created' }); msg(`구매 요청 ${get().numbers.prRv}이(가) 생성되었습니다`); },

      createContract: () => {
        const items: ContractItem[] = RV_ITEMS.map((r) => ({ item: r.item, material: r.material, text: MATS[r.material as keyof typeof MATS], target: r.target, price: CONTRACT_PRICE, released: 0 }));
        const value = contractValue(items);
        // Flexible workflow BPD 2.4.6: contracts above 2,000 EUR need the purchasing manager's release.
        const needs = isOptOn('bmd', 'approve') && value > APPROVAL_LIMIT;
        set({
          prRv: 'Contracted',
          contract: { status: needs ? 'Pending' : 'Released', createdAt: todayIso(), validFrom: todayIso(), validTo: yearEnd(), targetValue: value, items, version: 1, note: '' },
        });
        msg(`수량 계약 ${get().numbers.contract}이(가) 생성되었습니다`);
      },

      decideContract: (approve, note) => {
        const ct = get().contract;
        if (!ct) return;
        set({ contract: { ...ct, status: approve ? 'Released' : 'Rejected', note } });
        msg(`구매 계약 ${get().numbers.contract}이(가) ${approve ? '릴리스' : '반려'}되었습니다`);
      },

      markPrinted: () => set({ printed: true }),
      createSourceList: () => { set({ sourceList: true }); msg('소스 리스트가 저장되었습니다'); },

      createPO: () => {
        const ct = get().contract;
        if (!ct) return;
        const items: DocItem[] = NB_ITEMS.map((n) => ({ item: n.item, material: n.material, text: MATS[n.material as keyof typeof MATS], qty: n.qty, unit: 'PC', price: CONTRACT_PRICE }));
        set({
          prNb: 'Ordered',
          po: { createdAt: todayIso(), items },
          // Release order updates the released quantity of the referenced contract items.
          contract: { ...ct, items: ct.items.map((ci) => ({ ...ci, released: ci.released + (NB_ITEMS.find((n) => n.material === ci.material)?.qty ?? 0) })) },
        });
        msg(`표준 구매 오더가 ${get().numbers.po} 번호로 생성되었습니다`);
      },

      postGR: (dn, qty) => {
        const n = get().numbers;
        set({ gr: { docNo: n.gr, fiDocNo: n.grFi, date: todayIso(), dn, qty } });
        msg(`자재 전표 ${n.gr}이(가) 전기되었습니다`);
      },

      postInvoice: (ref, amount) => {
        const n = get().numbers;
        set({ invoice: { doc: n.inv, fi: n.invFi, ref, amount, date: todayIso(), blocked: false } });
        msg(`전표 번호 ${n.inv}이(가) 생성되었습니다`);
      },

      changeContract: (targetValue, reason) => {
        const ct = get().contract;
        if (!ct || targetValue === ct.targetValue) return;
        const v = ct.version + 1;
        set({
          contract: { ...ct, targetValue, version: v },
          versions: [...get().versions, { v, date: new Date().toISOString(), reason, field: '목표 금액 (EKKO-KTWRT)', oldValue: String(ct.targetValue), newValue: String(targetValue), user: 'PURCHASER' }],
        });
        msg(`구매 계약 ${get().numbers.contract} 버전 ${v}이(가) 생성되었습니다`);
      },

      createReference: () => {
        set({ ext: { ...get().ext, reference: todayIso() } });
        msg(`계약 ${get().numbers.refContract}이(가) 템플릿을 참조하여 생성되었습니다`);
      },

      massExtend: () => {
        const ct = get().contract;
        if (!ct) return;
        set({ contract: { ...ct, validTo: nextYearEnd() }, ext: { ...get().ext, mass: todayIso() } });
        msg(`일괄 변경 작업 ${get().numbers.job}이(가) 완료되었습니다`);
      },

      approvePO: () => {
        set({ ext: { ...get().ext, poapprove: todayIso() } });
        msg(`구매 오더 ${get().numbers.po}이(가) 승인되었습니다`);
      },

      reverseGR: () => {
        const gr = get().gr;
        if (!gr || get().ext.reverse) return;
        set({ gr: { ...gr, qty: { ...gr.qty, [REVERSAL.item]: (gr.qty[REVERSAL.item] ?? 0) - REVERSAL.qty } }, ext: { ...get().ext, reverse: todayIso() } });
        msg(`자재 전표 ${get().numbers.revDoc}이(가) 전기되었습니다 (102 역분개)`);
      },

      meets: (r) => {
        const s = get();
        switch (r) {
          case 'none': return true;
          case 'pr': return s.prRv !== 'None';
          case 'contract': return !!s.contract;
          case 'contract-released': return s.contract?.status === 'Released';
          case 'po': return !!s.po;
          case 'po-released': return !!s.po && (!isOptOn('bmd', 'poapprove') || !!s.ext.poapprove);
          case 'gr': return !!s.gr;
        }
      },

      autoComplete: (r) => {
        const order: BmdReq[] = ['none', 'pr', 'contract', 'contract-released', 'po', 'po-released', 'gr'];
        const t = order.indexOf(r);
        const s = get;
        if (t >= 1 && s().prRv === 'None') s().createRvPr();
        if (t >= 2 && !s().contract) s().createContract();
        if (t >= 3 && s().contract?.status !== 'Released') s().decideContract(true, '데모 자동 승인');
        if (t >= 4 && !s().po) s().createPO();
        if (t >= 5 && isOptOn('bmd', 'poapprove') && !s().ext.poapprove) s().approvePO();
        if (t >= 6 && !s().gr) s().postGR('DN-' + s().numbers.po.slice(-4), Object.fromEntries(NB_ITEMS.map((n) => [n.item, n.qty])));
        useDemo.getState().setGuiMessage({ type: 'I', text: '선행 단계가 자동으로 완료되었습니다' });
      },
    }),
    { name: 'j45-demo-bmd', version: 1, merge: (p, c) => { const m = anchoredMerge(p, c); return { ...m, numbers: { ...c.numbers, ...m.numbers }, ext: m.ext ?? {} }; } },
  ),
);
