/**
 * Process step registry for scope item J45 (BPD 2608, chapter 4.1).
 * To add a step: add an entry here and register its Fiori/GUI components in `steps/index.tsx`.
 */

import { useDemo } from './store';
export type Role = 'Purchaser' | 'Purchasing Manager' | 'Warehouse Clerk' | 'Inventory Manager' | 'Accounts Payable Accountant'
  | 'Shipping Specialist' | 'Receiving Specialist' | 'Production Planner' | 'Employee' | 'Manager';

/** Document that must exist before a step makes sense. */
export type Requirement = 'none' | 'pr-assigned' | 'po' | 'po-released' | 'gr' | 'invoice';

export interface StepDef {
  id: string;
  no: number;
  title: string; // Korean step title
  titleEn: string; // English step name as in BPD
  bpd: string; // BPD section
  appName: string; // Fiori app name (as in SAP)
  appId: string; // Fiori app ID
  tcode: string; // SAP GUI transaction
  guiTitle: string; // GUI screen title
  role: Role;
  optional: boolean;
  /** Prerequisite key understood by the owning scenario's runtime (J45: a `Requirement`). */
  requires: string;
}

export const ROLE_KO: Record<Role, string> = {
  Purchaser: '구매 담당자',
  'Purchasing Manager': '구매 관리자',
  'Warehouse Clerk': '창고 담당자',
  'Inventory Manager': '재고 관리자',
  'Accounts Payable Accountant': '매입채무 회계 담당자',
  'Shipping Specialist': '출하 담당자',
  'Receiving Specialist': '입하 담당자',
  'Production Planner': '생산·자재 계획자',
  Employee: '현업 직원(요청자)',
  Manager: '부서 관리자',
};

export interface RoleUser { name: string; initials: string; userId: string; roleId: string }
/** Default persons per role (BPD test users); names can be overridden on the setup page. */
export const ROLE_USER_DEFAULT: Record<Role, RoleUser> = {
  Purchaser: { name: 'Kim Min-jun', initials: 'KM', userId: 'PURCHASER', roleId: 'SAP_BR_PURCHASER' },
  'Purchasing Manager': { name: 'Lee Seo-yeon', initials: 'LS', userId: 'PURCHASING_MANAGER', roleId: 'SAP_BR_PURCHASING_MANAGER' },
  'Warehouse Clerk': { name: 'Park Ji-ho', initials: 'PJ', userId: 'WAREHOUSE_CLERK', roleId: 'SAP_BR_WAREHOUSE_CLERK' },
  'Inventory Manager': { name: 'Choi Yu-na', initials: 'CY', userId: 'INVENTORY_MANAGER', roleId: 'SAP_BR_INVENTORY_MANAGER' },
  'Accounts Payable Accountant': { name: 'Jung Hae-won', initials: 'JH', userId: 'AP_ACCOUNTANT', roleId: 'SAP_BR_AP_ACCOUNTANT' },
  'Shipping Specialist': { name: 'Han Do-yun', initials: 'HD', userId: 'SHIPPING_SPECIALIST', roleId: 'SAP_BR_SHIPPING_SPECIALIST' },
  'Receiving Specialist': { name: 'Oh Ji-min', initials: 'OJ', userId: 'RECEIVING_SPECIALIST', roleId: 'SAP_BR_RECEIVING_SPECIALIST' },
  'Production Planner': { name: 'Yoon Seo-jun', initials: 'YS', userId: 'PRODUCTION_PLANNER', roleId: 'SAP_BR_PRODN_PLNR' },
  Employee: { name: 'Kang Min-seo', initials: 'KS', userId: 'EMPLOYEE_PROCURE', roleId: 'SAP_BR_EMPLOYEE_PROCUREMENT' },
  Manager: { name: 'Shin Hyun-woo', initials: 'SH', userId: 'MANAGER_PROCURE', roleId: 'SAP_BR_MANAGER_PROCUREMENT' },
};

export const STEPS: StepDef[] = [
  { id: 'launchpad', no: 0, title: 'SAP Fiori Launchpad 홈', titleEn: 'Home', bpd: '2.1', appName: 'Home', appId: 'Shell', tcode: 'S000', guiTitle: 'SAP Easy Access', role: 'Purchaser', optional: false, requires: 'none' },
  { id: 'process-pr', no: 1, title: '구매 요청 → 구매 오더 전환', titleEn: 'Convert Purchase Requisitions to Purchase Orders', bpd: '4.1.1', appName: 'Process Purchase Requisitions', appId: 'F1048A', tcode: 'ME57', guiTitle: '구매 요청 지정 및 처리', role: 'Purchaser', optional: false, requires: 'none' },
  { id: 'create-po', no: 2, title: '구매 오더 생성', titleEn: 'Create Purchase Order', bpd: '4.1.2', appName: 'Manage Purchase Orders', appId: 'F0842A', tcode: 'ME21N', guiTitle: '구매 오더 생성', role: 'Purchaser', optional: false, requires: 'none' },
  { id: 'approve-po', no: 3, title: '구매 오더 승인', titleEn: 'Approve Purchase Order', bpd: '4.1.3', appName: 'My Inbox - All Items', appId: 'F0862', tcode: 'SBWP', guiTitle: 'Business Workplace', role: 'Purchasing Manager', optional: true, requires: 'po' },
  { id: 'preview-po', no: 4, title: '구매 오더 미리보기', titleEn: 'Preview Purchase Order', bpd: '4.1.4', appName: 'Manage Purchase Orders', appId: 'F0842A', tcode: 'ME23N', guiTitle: '구매 오더 표시', role: 'Purchaser', optional: true, requires: 'po' },
  { id: 'change-po', no: 5, title: '구매 오더 변경', titleEn: 'Change Purchase Order', bpd: '4.1.5', appName: 'Manage Purchase Orders', appId: 'F0842A', tcode: 'ME22N', guiTitle: '구매 오더 변경', role: 'Purchaser', optional: true, requires: 'po' },
  { id: 'monitor-po', no: 6, title: '구매 오더 품목 모니터링', titleEn: 'Monitor Purchase Order Items', bpd: '4.1.6', appName: 'Monitor Purchase Order Items', appId: 'F2358', tcode: 'ME2M', guiTitle: '자재별 구매 문서', role: 'Purchaser', optional: true, requires: 'po' },
  { id: 'post-gr', no: 7, title: '입고 전기', titleEn: 'Post Goods Receipt', bpd: '4.1.9', appName: 'Post Goods Receipt for Purchasing Document', appId: 'F0843', tcode: 'MIGO', guiTitle: '입고 구매 오더 - 구매 담당자', role: 'Warehouse Clerk', optional: false, requires: 'po-released' },
  { id: 'gr-slip', no: 8, title: '입고 전표·라벨 미리보기', titleEn: 'Preview Goods Receipt Slip and Label', bpd: '4.1.10', appName: 'Material Documents Overview', appId: 'F1077', tcode: 'MB90', guiTitle: '자재 전표 출력', role: 'Warehouse Clerk', optional: true, requires: 'gr' },
  { id: 'gr-detail', no: 9, title: '입고 상세 확인', titleEn: 'Check Goods Receipt Details', bpd: '4.1.11', appName: 'Material Documents Overview', appId: 'F1077', tcode: 'MB03', guiTitle: '자재 전표 표시', role: 'Warehouse Clerk', optional: true, requires: 'gr' },
  { id: 'create-invoice', no: 10, title: '공급업체 송장 생성', titleEn: 'Create Supplier Invoice', bpd: '4.1.16.1', appName: 'Create Supplier Invoice', appId: 'F0859', tcode: 'MIRO', guiTitle: '수신 송장 입력: 회사 코드', role: 'Accounts Payable Accountant', optional: false, requires: 'gr' },
  { id: 'display-invoice', no: 11, title: '공급업체 송장 확인', titleEn: 'Check Supplier Invoice List', bpd: '4.1.20', appName: 'Supplier Invoices List', appId: 'F1060A', tcode: 'MIR4', guiTitle: '송장 전표 표시', role: 'Accounts Payable Accountant', optional: true, requires: 'invoice' },
  { id: 'clear-grir', no: 12, title: 'GR/IR 청산', titleEn: 'Clear GR / IR', bpd: '4.1.23', appName: 'Clear GR/IR Clearing Account', appId: 'MR11', tcode: 'MR11', guiTitle: 'GR/IR 청산 계정 유지보수', role: 'Accounts Payable Accountant', optional: true, requires: 'invoice' },
];

export const stepById = (id: string) => STEPS.find((s) => s.id === id) ?? STEPS[0];

/** Transaction codes accepted in the SAP GUI command field. */
export const TCODE_MAP: Record<string, string> = {
  S000: 'launchpad',
  SESSION_MANAGER: 'launchpad',
  ME57: 'process-pr',
  ME51N: 'process-pr',
  ME53N: 'process-pr',
  ME21N: 'create-po',
  SBWP: 'approve-po',
  ME29N: 'approve-po',
  ME23N: 'preview-po',
  ME9F: 'preview-po',
  ME22N: 'change-po',
  ME2M: 'monitor-po',
  ME2L: 'monitor-po',
  MIGO: 'post-gr',
  MB90: 'gr-slip',
  MB03: 'gr-detail',
  MIRO: 'create-invoice',
  MIR4: 'display-invoice',
  MR11: 'clear-grir',
};

/** Avatar initials: first letters of the first two words ("Kim Min-jun" → KM), else the first two characters. */
export const initialsOf = (name: string) => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
  // Korean full name without spaces (홍길동): show the given name, as Korean apps do (길동).
  if (/^[가-힣]{3,4}$/.test(w[0] ?? '')) return w[0].slice(-2);
  return (w[0] ?? '?').slice(0, 2).toUpperCase();
};

/**
 * Person per role as shown on all screens: the default user with the presenter's name override
 * from the setup page (DemoConfig.userNames) applied.
 */
export const ROLE_USER = new Proxy(ROLE_USER_DEFAULT, {
  get(target, role: string) {
    const base = target[role as Role];
    if (!base) return base;
    const custom = useDemo.getState().config.userNames?.[role]?.trim();
    return custom ? { ...base, name: custom, initials: initialsOf(custom) } : base;
  },
}) as Record<Role, RoleUser>;
