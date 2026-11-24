/**
 * Central demo state (Zustand).
 *
 * Every screen reads its business data from here – nothing is hard-coded per screen.
 * `config` holds the presenter-editable master data; the rest is the document chain
 * (PR → PO → GR → Invoice → GR/IR clearing) produced while clicking through the demo.
 * State is persisted to localStorage so a browser refresh during a demo is harmless.
 */
import { demoStorage } from './persistStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, daysBetween, shiftIso, todayIso } from './format';
import type { Requirement } from './steps';

export type ViewMode = 'fiori' | 'sapgui';
export type DateFormat = 'KR' | 'SAP';

export interface DemoConfig {
  companyName: string;
  companyCode: string;
  purchasingOrg: string;
  purchasingGroup: string;
  plant: string;
  plantName: string;
  storageLocation: string;
  supplierName: string;
  supplierNumber: string;
  supplierCity: string;
  materialNumber: string;
  materialDescription: string;
  materialGroup: string;
  quantity: number;
  unit: string;
  netPrice: number;
  currency: string;
  deliveryDate: string; // ISO yyyy-mm-dd
  paymentTerms: string;
  incoterms: string;
  taxCode: string;
  glInventory: string;
  glGrir: string;
  glPayables: string;
  dateFormat: DateFormat;
  /** Presenter-chosen person names per role (role → name); empty = default name. */
  userNames: Record<string, string>;
}

export type PrStatus = 'Open' | 'Assigned' | 'Closed';
export type PoStatus = 'None' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Created' | 'Goods Received' | 'Invoiced';
export type GrStatus = 'Not Posted' | 'Partial' | 'Complete';
export type InvoiceStatus = 'Not Created' | 'Posted';

export interface GrDoc { docNo: string; fiDocNo: string; qty: number; postingDate: string; deliveryNote: string; sloc: string }
export interface ChangeEntry { at: string; field: string; oldValue: string; newValue: string; user: string }
export interface GuiMessage { type: 'S' | 'W' | 'E' | 'I'; text: string }

export interface Numbers {
  prNumber: string;
  poNumber: string;
  grDocBase: number;
  grFiDocBase: number;
  invoiceDocNumber: string;
  accountingDocNumber: string;
  clearingDocNumber: string;
}

export interface DemoState {
  configured: boolean;
  /** Day the stored dates refer to. On load every date is moved so this becomes "today". */
  anchorDate: string;
  /** Scenario briefing already shown for the current document chain. */
  briefed: boolean;
  config: DemoConfig;
  viewMode: ViewMode;
  compare: boolean;
  showHelp: boolean;
  sidebarOpen: boolean;
  /** Presenter guide panel (situation + what each click means) on the right. */
  guideOpen: boolean;
  /** Optional process steps switched on/off by the presenter. */
  optionalEnabled: Record<string, boolean>;

  numbers: Numbers;
  prStatus: PrStatus;
  poFromPr: boolean;
  poStatus: PoStatus;
  poCreatedAt: string | null;
  approvalNote: string;
  rejectReason: string;
  changeLog: ChangeEntry[];
  grDocs: GrDoc[];
  invoiceStatus: InvoiceStatus;
  invoice: { reference: string; amount: number; qty: number; invoiceDate: string; postingDate: string } | null;
  cleared: boolean;
  guiMessage: GuiMessage | null;
  visited: string[];

  setBriefed: (b: boolean) => void;
  markVisited: (id: string) => void;
  setConfig: (c: Partial<DemoConfig>) => void;
  finishSetup: () => void;
  resetDemo: () => void;
  setViewMode: (m: ViewMode) => void;
  toggleCompare: () => void;
  toggleHelp: () => void;
  toggleSidebar: () => void;
  toggleGuide: () => void;
  setOptional: (id: string, on: boolean) => void;
  setGuiMessage: (m: GuiMessage | null) => void;

  assignSource: () => void;
  createPO: () => void;
  approvePO: (note: string) => void;
  rejectPO: (reason: string) => void;
  changePO: (c: Partial<Pick<DemoConfig, 'quantity' | 'netPrice' | 'deliveryDate'>>) => void;
  postGR: (qty: number, deliveryNote: string, sloc: string) => void;
  postInvoice: (inv: { reference: string; amount: number; qty: number; invoiceDate: string; postingDate: string }) => void;
  clearGRIR: () => void;
  /** Completes the document chain up to `req` so the presenter can jump to any step. */
  autoComplete: (req: Requirement) => void;
  /** Whether the document chain satisfies a step's requirement. */
  meets: (req: Requirement) => boolean;
}

export const defaultConfig = (): DemoConfig => ({
  companyName: 'ACME Corporation',
  companyCode: '1010',
  purchasingOrg: '1010',
  purchasingGroup: '001',
  plant: '1010',
  plantName: 'Plant 1 DE',
  storageLocation: '101A',
  supplierName: 'Domestic DE Supplier 3',
  supplierNumber: '10300003',
  supplierCity: 'Berlin',
  materialNumber: 'TG0011',
  materialDescription: 'Trading Good 0011,PD,Regular Proc.',
  materialGroup: 'L001',
  quantity: 100,
  unit: 'PC',
  netPrice: 25,
  currency: 'EUR',
  deliveryDate: addDays(todayIso(), DEFAULT_LEAD_DAYS),
  paymentTerms: '0003',
  incoterms: 'EXW',
  taxCode: 'V0',
  glInventory: '13100000',
  glGrir: '21300000',
  glPayables: '21100000',
  dateFormat: 'KR',
  userNames: {},
});

const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));
const newNumbers = (): Numbers => {
  const seq = rnd(100, 899);
  return {
    prNumber: String(10000000 + rnd(1000, 9000)),
    poNumber: String(4500000000 + seq),
    grDocBase: 5000000000 + rnd(1000, 9000),
    grFiDocBase: 4900000000 + rnd(1000, 9000),
    invoiceDocNumber: String(5105600000 + rnd(100, 900)),
    accountingDocNumber: String(5100000000 + rnd(100, 900)),
    clearingDocNumber: String(5105600000 + rnd(900, 999)),
  };
};

const freshDocs = () => ({
  numbers: newNumbers(),
  prStatus: 'Open' as PrStatus,
  poFromPr: false,
  poStatus: 'None' as PoStatus,
  poCreatedAt: null,
  approvalNote: '',
  rejectReason: '',
  changeLog: [] as ChangeEntry[],
  grDocs: [] as GrDoc[],
  invoiceStatus: 'Not Created' as InvoiceStatus,
  invoice: null,
  cleared: false,
  guiMessage: null,
  visited: [] as string[],
  briefed: false,
});

/** Days between today and the stored delivery date, used by the setup page. */
export const DEFAULT_LEAD_DAYS = 14;

/**
 * Re-anchors every stored date to the day the demo is opened. A chain created yesterday
 * (PO today, delivery +14) opens today with the same intervals, never with stale dates.
 */
function rebaseDates(s: DemoState): DemoState {
  const today = todayIso();
  const anchor = s.anchorDate ?? s.poCreatedAt ?? today;
  const d = daysBetween(anchor, today);
  if (!d) return { ...s, anchorDate: today };
  const sh = (iso: string) => shiftIso(iso, d);
  return {
    ...s,
    anchorDate: today,
    config: { ...s.config, deliveryDate: sh(s.config.deliveryDate) },
    poCreatedAt: s.poCreatedAt && sh(s.poCreatedAt),
    grDocs: s.grDocs.map((g) => ({ ...g, postingDate: sh(g.postingDate) })),
    invoice: s.invoice && { ...s.invoice, invoiceDate: sh(s.invoice.invoiceDate), postingDate: sh(s.invoice.postingDate) },
    changeLog: s.changeLog.map((e) => ({
      ...e,
      at: sh(e.at),
      ...(e.field.startsWith('납품일') ? { oldValue: sh(e.oldValue), newValue: sh(e.newValue) } : {}),
    })),
  };
}

export const OPTIONAL_DEFAULTS: Record<string, boolean> = {
  'approve-po': true,
  'preview-po': true,
  'change-po': true,
  'monitor-po': true,
  'gr-slip': true,
  'gr-detail': true,
  'display-invoice': true,
  'clear-grir': true,
};

/** Total GR quantity posted so far. */
export const grQty = (s: Pick<DemoState, 'grDocs'>) => s.grDocs.reduce((a, d) => a + d.qty, 0);
export const netValue = (c: DemoConfig) => Math.round(c.quantity * c.netPrice * 100) / 100;
export const poExists = (s: Pick<DemoState, 'poStatus'>) => s.poStatus !== 'None';
export const poReleased = (s: Pick<DemoState, 'poStatus'>) =>
  ['Approved', 'Created', 'Goods Received', 'Invoiced'].includes(s.poStatus);

const USER = 'PURCHASER';

export const useDemo = create<DemoState>()(
  persist(
    (set, get) => ({
      configured: false,
      anchorDate: todayIso(),
      config: defaultConfig(),
      viewMode: 'fiori',
      compare: false,
      showHelp: true,
      sidebarOpen: true,
      guideOpen: true,
      optionalEnabled: { ...OPTIONAL_DEFAULTS },
      ...freshDocs(),

      setBriefed: (briefed) => set({ briefed }),
      markVisited: (id) => set((s) => (s.visited.includes(id) ? s : { visited: [...s.visited, id] })),
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
      finishSetup: () => set({ configured: true }),
      resetDemo: () => set({ ...freshDocs(), config: { ...get().config } }),
      setViewMode: (viewMode) => set({ viewMode }),
      toggleCompare: () => set((s) => ({ compare: !s.compare })),
      toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleGuide: () => set((s) => ({ guideOpen: !s.guideOpen })),
      setOptional: (id, on) => set((s) => ({ optionalEnabled: { ...s.optionalEnabled, [id]: on } })),
      setGuiMessage: (guiMessage) => set({ guiMessage }),

      assignSource: () =>
        set({ prStatus: 'Assigned', guiMessage: { type: 'S', text: `구매 요청 ${get().numbers.prNumber}에 소스가 지정되었습니다` } }),

      createPO: () => {
        const s = get();
        const needsApproval = s.optionalEnabled['approve-po'];
        set({
          poStatus: needsApproval ? 'Pending Approval' : 'Created',
          poCreatedAt: todayIso(),
          poFromPr: s.prStatus !== 'Open',
          prStatus: s.prStatus !== 'Open' ? 'Closed' : s.prStatus,
          guiMessage: { type: 'S', text: `표준 구매 오더가 ${s.numbers.poNumber} 번호로 생성되었습니다` },
        });
      },

      approvePO: (note) =>
        set({ poStatus: 'Approved', approvalNote: note, guiMessage: { type: 'S', text: `구매 오더 ${get().numbers.poNumber}이(가) 승인되었습니다` } }),

      rejectPO: (reason) =>
        set({ poStatus: 'Rejected', rejectReason: reason, guiMessage: { type: 'W', text: `구매 오더 ${get().numbers.poNumber}이(가) 반려되었습니다` } }),

      changePO: (c) => {
        const s = get();
        const entries: ChangeEntry[] = [];
        const at = new Date().toISOString();
        if (c.quantity !== undefined && c.quantity !== s.config.quantity)
          entries.push({ at, field: '오더 수량 (EKPO-MENGE)', oldValue: String(s.config.quantity), newValue: String(c.quantity), user: USER });
        if (c.netPrice !== undefined && c.netPrice !== s.config.netPrice)
          entries.push({ at, field: '순 오더 가격 (EKPO-NETPR)', oldValue: s.config.netPrice.toFixed(2), newValue: c.netPrice.toFixed(2), user: USER });
        if (c.deliveryDate !== undefined && c.deliveryDate !== s.config.deliveryDate)
          entries.push({ at, field: '납품일 (EKET-EINDT)', oldValue: s.config.deliveryDate, newValue: c.deliveryDate, user: USER });
        if (!entries.length) {
          set({ guiMessage: { type: 'I', text: '변경된 데이터가 없습니다' } });
          return;
        }
        // "Always Restart" condition (BPD 2.6.6): a changed PO re-enters the approval workflow.
        const restart = s.optionalEnabled['approve-po'] && s.grDocs.length === 0;
        set({
          config: { ...s.config, ...c },
          changeLog: [...s.changeLog, ...entries],
          poStatus: restart ? 'Pending Approval' : s.poStatus,
          guiMessage: { type: 'S', text: `표준 구매 오더 ${s.numbers.poNumber}이(가) 변경되었습니다` },
        });
      },

      postGR: (qty, deliveryNote, sloc) => {
        const s = get();
        const n = s.grDocs.length;
        const doc: GrDoc = {
          docNo: String(s.numbers.grDocBase + n),
          fiDocNo: String(s.numbers.grFiDocBase + n),
          qty,
          postingDate: todayIso(),
          deliveryNote,
          sloc,
        };
        const total = grQty(s) + qty;
        set({
          grDocs: [...s.grDocs, doc],
          poStatus: total >= s.config.quantity ? 'Goods Received' : s.poStatus,
          guiMessage: { type: 'S', text: `자재 전표 ${doc.docNo}이(가) 전기되었습니다` },
        });
      },

      postInvoice: (inv) =>
        set({
          invoice: inv,
          invoiceStatus: 'Posted',
          poStatus: 'Invoiced',
          guiMessage: { type: 'S', text: `전표 번호 ${get().numbers.invoiceDocNumber}이(가) 생성되었습니다` },
        }),

      clearGRIR: () => set({ cleared: true, guiMessage: { type: 'S', text: `계정 유지보수 전표 ${get().numbers.clearingDocNumber}이(가) 전기되었습니다` } }),

      autoComplete: (req) => {
        const levels: Requirement[] = ['none', 'pr-assigned', 'po', 'po-released', 'gr', 'invoice'];
        const target = levels.indexOf(req);
        if (target >= 1 && get().prStatus === 'Open') get().assignSource();
        if (target >= 2 && !poExists(get())) get().createPO();
        if (target >= 3 && (get().poStatus === 'Pending Approval' || get().poStatus === 'Rejected')) get().approvePO('데모 자동 승인');
        if (target >= 4 && get().grDocs.length === 0) get().postGR(get().config.quantity, 'DN-' + get().numbers.poNumber.slice(-4), get().config.storageLocation);
        if (target >= 5 && !get().invoice) {
          const c = get().config;
          get().postInvoice({ reference: 'INV-' + new Date().getFullYear() + '-001', amount: netValue(c), qty: c.quantity, invoiceDate: todayIso(), postingDate: todayIso() });
        }
        set({ guiMessage: { type: 'I', text: '선행 단계가 자동으로 완료되었습니다' } });
      },

      meets: (req) => {
        const s = get();
        switch (req) {
          case 'none': return true;
          case 'pr-assigned': return s.prStatus !== 'Open';
          case 'po': return poExists(s);
          case 'po-released': return poReleased(s);
          case 'gr': return s.grDocs.length > 0;
          case 'invoice': return s.invoiceStatus === 'Posted';
        }
      },
    }),
    {
      name: 'j45-demo-state', storage: demoStorage,
      version: 1,
      merge: (persisted, current) => rebaseDates({ ...current, ...(persisted as Partial<DemoState>) }),
    },
  ),
);
