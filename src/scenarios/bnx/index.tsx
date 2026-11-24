/** BNX – Consumable Purchasing: step list, runtime, presenter guide and briefing. */
import type { StepDef } from '../../steps';
import { ROLE_KO, ROLE_USER } from '../../steps';
import { useSharedMap } from '../../sharedState';
import { fmtAmt } from '../../format';
import type { StepGuide } from '../../harness/guide';
import { pick, useOrg, type Briefing, type Runtime, type ScenarioDef } from '../types';
import { itemsValue } from '../shared/ui';
import { CC1, CC2, ITEM10, ITEM20, LIMIT_ITEM, PLAN, PURCH_GROUP, SUPPLIER, useBnx, type BnxReq } from './store';
import { B, GX, L } from '../shared/define';

const S = (no: number, id: string, title: string, titleEn: string, bpd: string, appName: string, appId: string, tcode: string, role: StepDef['role'], optional: boolean, requires: BnxReq): StepDef =>
  ({ id, no, title, titleEn, bpd, appName, appId, tcode, guiTitle: title, role, optional, requires });

export const BNX_STEPS: StepDef[] = [
  S(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  S(1, 'pr', '소모품 구매 요청 생성', 'Create Purchase Requisition', '4.1', 'Manage Purchase Requisitions - Professional', 'F2229', 'ME51N', 'Purchaser', false, 'none'),
  S(2, 'workload', '구매 담당자 업무량 재배분', 'Redistribute Workload', '4.2.1', 'Manage Workload of Purchasers', 'F2504', 'ME5W', 'Purchasing Manager', true, 'pr'),
  S(3, 'po', '구매 요청 → 구매 오더 전환', 'Convert Purchase Requisition to Purchase Order', '4.2', 'Process Purchase Requisitions (V2)', 'F1048A', 'ME57', 'Purchaser', false, 'pr'),
  S(4, 'additem', '텍스트 품목 추가 (다중 계정 지정)', 'Create PO Item w/o Material · Multiple Account Assignment', '4.3 / 4.14', 'Manage Purchase Orders', 'F0842A', 'ME22N', 'Purchaser', true, 'po'),
  S(5, 'limit', 'Limit 품목 추가', 'Create Limit Item', '4.5', 'Manage Purchase Orders', 'F0842A', 'ME22N_LIM', 'Purchaser', true, 'po'),
  S(6, 'mass', '구매 오더 일괄 변경', 'Execute Mass Changes to Purchase Orders', '4.4', 'Mass Changes to Purchase Orders', 'F2593', 'MEMASSPO', 'Purchaser', true, 'po'),
  S(7, 'approve', '구매 오더 승인', 'Approve Purchase Order', '4.7', 'My Inbox - All Items', 'F0862', 'SBWP', 'Purchasing Manager', true, 'po'),
  S(8, 'monitor', '계정 지정별 PO 품목 모니터링', 'Monitor Purchase Order Items by Account Assignment', '4.11', 'Purchase Order Items by Account Assignment', 'F2420', 'ME2K', 'Accounts Payable Accountant', true, 'po'),
  S(9, 'gr', '입고 전기 (비용 전기)', 'Post Goods Receipt', '4.9', 'Post Goods Receipt for Purchasing Document', 'F0843', 'MIGO', 'Warehouse Clerk', false, 'po-released'),
  S(10, 'slip', '입고 전표 미리보기', 'Preview Goods Receipt Slip', '4.10', 'Material Documents Overview', 'F1077', 'MB90', 'Warehouse Clerk', true, 'gr'),
  S(11, 'invoice', '공급업체 송장 생성', 'Create Supplier Invoice with PO/GR relation', '4.12.1', 'Create Supplier Invoice', 'F0859', 'MIRO', 'Accounts Payable Accountant', false, 'gr'),
  S(12, 'release', '보류된 송장 릴리스', 'Release Blocked Supplier Invoice', '4.13', 'My Inbox - All Items', 'F0862', 'MRBR', 'Purchasing Manager', true, 'invoice'),
  S(13, 'reduce', '송장 축소 (Limit 품목 한도 초과)', 'Invoice Reduction', '4.12.2', 'Create Supplier Invoice', 'F0859', 'MIRO_RED', 'Accounts Payable Accountant', true, 'limit'),
  S(14, 'invplan', '송장 계획 (정기 임대료)', 'Invoicing Plan', '4.15', 'Manage Purchase Orders', 'F0842A', 'MRIS', 'Purchaser', true, 'none'),
];

const m = () => import('./screens');
const both = (f: string, g: string) => ({ fiori: pick(m, f), gui: pick(m, g) });
const x = () => import('./extra');
const ext = (id: string) => ({ fiori: pick(x, `${id}F`), gui: pick(x, `${id}G`) });
const SCREENS = {
  launchpad: both('LaunchpadF', 'LaunchpadG'), pr: both('PrF', 'PrG'), po: both('PoF', 'PoG'), additem: both('AddItemF', 'AddItemG'),
  mass: both('MassF', 'MassG'), approve: both('ApproveF', 'ApproveG'), monitor: both('MonitorF', 'MonitorG'), gr: both('GrF', 'GrG'),
  slip: both('SlipF', 'SlipG'), invoice: both('InvoiceF', 'InvoiceG'), release: both('ReleaseF', 'ReleaseG'),
  workload: ext('workload'), limit: ext('limit'), reduce: ext('reduce'), invplan: ext('invplan'),
};

const TCODES: Record<string, string> = {
  S000: 'launchpad', ME51N: 'pr', ME57: 'po', ME21N: 'additem', ME22N: 'additem', ME23N: 'additem', MEMASSPO: 'mass', SBWP: 'approve',
  ME2K: 'monitor', MIGO: 'gr', MB90: 'slip', MB03: 'slip', MIRO: 'invoice', MRBR: 'release',
  ME5W: 'workload', ME22N_LIM: 'limit', MIRO_RED: 'reduce', MRIS: 'invplan',
};

const REQ: Record<string, { text: string; goto: string }> = {
  none: { text: '', goto: 'launchpad' },
  pr: { text: '구매 요청이 아직 없습니다.', goto: 'pr' },
  po: { text: '구매 오더가 아직 생성되지 않았습니다.', goto: 'po' },
  'po-released': { text: '구매 오더가 생성되고 승인(릴리스)되어야 합니다.', goto: 'approve' },
  gr: { text: '입고가 아직 전기되지 않았습니다.', goto: 'gr' },
  invoice: { text: '공급업체 송장이 아직 전기되지 않았습니다.', goto: 'invoice' },
  limit: { text: 'PO에 Limit 품목이 아직 없습니다.', goto: 'limit' },
};

function useRuntime(): Runtime {
  const s = useBnx();
  const cur = useOrg().currency;
  const done = (id: string) => {
    switch (id) {
      case 'pr': return s.pr !== 'None';
      case 'po': return !!s.po;
      case 'additem': return (s.po?.items.length ?? 0) > 1;
      case 'mass': return s.massChanged;
      case 'approve': return s.po?.status === 'Released';
      case 'gr': return !!s.gr;
      case 'invoice': return !!s.invoice;
      case 'release': return s.released;
      case 'workload': case 'limit': case 'reduce': case 'invplan': return !!s.ext[id];
      default: return s.visited.includes(id);
    }
  };
  return {
    done, meets: (r) => s.meets(r as BnxReq), autoComplete: (r) => s.autoComplete(r as BnxReq), reqText: REQ,
    summary: [
      { label: '구매 요청', value: s.pr === 'None' ? '–' : s.numbers.pr },
      { label: 'PO', value: s.po ? s.numbers.po : '–' },
      { label: '자재 전표', value: s.gr?.docNo ?? '–' },
      { label: '송장', value: s.invoice ? `${s.invoice.doc}${s.invoice.blocked ? ' (보류)' : ''}` : '–' },
      { label: '순 금액', value: fmtAmt(itemsValue(s.po?.items ?? [ITEM10]), cur) },
    ],
    reset: s.reset, briefed: s.briefed, setBriefed: s.setBriefed, markVisited: s.markVisited,
  };
}

function useGuide(id: string): StepGuide {
  const s = useBnx();
  const c = useOrg();
  const shared = useSharedMap();
  const po = s.po;
  const added = (po?.items.length ?? 0) > 1;
  const released = po?.status === 'Released';
  switch (id) {
    case 'launchpad': return {
      situation: `관리팀(코스트 센터 ${CC1})이 소모품이 떨어졌다고 알려 왔습니다. ${ROLE_KO.Purchaser} ${ROLE_USER.Purchaser.name}이(가) 구매 요청부터 처리합니다.`,
      fiori: [{ text: "'구매 요청 관리 - 전문가용' 타일 클릭", why: '자재 번호가 있는 소모품도, 텍스트로만 적는 품목도 같은 앱에서 요청합니다.', target: '구매 요청 관리 - 전문가용', done: false }],
      gui: [{ text: "'ME51N - 생성' 더블클릭", why: '구매 요청 생성 트랜잭션입니다.', target: 'ME51N - 생성', done: false }],
      value: '소모품 구매도 직접 자재와 같은 표준 프로세스를 탑니다.',
    };
    case 'pr': return {
      situation: `소모품 NS0001 ${ITEM10.qty}개가 필요합니다. 재고로 두지 않고 관리팀 비용(코스트 센터 ${CC1})으로 처리합니다.`,
      fiori: [
        { text: "품목의 '계정 지정' K와 코스트 센터 설명", why: 'K = 코스트 센터. 입고하는 순간 재고가 아니라 비용으로 전기됩니다.' },
        { text: "'공급원' 열의 계약 확인", why: `자동 소스 결정이 계약 ${s.numbers.contract}을 찾아 단가 ${ITEM10.price} EUR를 적용했습니다.` },
        { text: "하단 '생성' 클릭", why: `구매 요청 ${s.numbers.pr}가 저장됩니다.`, target: '생성', done: s.pr !== 'None' },
      ],
      gui: [{ text: "계정 지정 K·코스트 센터 확인 후 '저장'", why: 'ME51N 품목의 A 열이 계정 지정 범주입니다.', target: '저장', done: s.pr !== 'None' }],
      value: '요청 단계에서 비용 귀속(코스트 센터·G/L)이 정해져 예산 통제가 쉬워집니다.',
    };
    case 'workload': return GX(`구매 그룹 001 담당자가 휴가 중입니다. ${ROLE_KO['Purchasing Manager']}가 쌓인 요청을 다른 그룹에 배분합니다.`, [
      L('그룹별 미결 건수 설명', '어느 담당자에게 업무가 몰렸는지 한눈에 봅니다.'),
      B('재배분', '↪ 재배정', `구매 요청 ${s.numbers.pr}를 구매 그룹 ${PURCH_GROUP}로 옮깁니다.`, !!s.ext.workload),
    ], '담당자 부재·업무 편중으로 인한 구매 지연을 막습니다.');
    case 'limit': return GX('사무실 수리처럼 정확한 내용·금액을 미리 알 수 없는 비용이 생길 수 있습니다.', [
      L('예상 금액과 전체 한도 설명', `예상 ${fmtAmt(LIMIT_ITEM.expected, c.currency)}는 약정(commitment)으로, 전체 한도 ${fmtAmt(LIMIT_ITEM.overall, c.currency)}는 송장 상한으로 쓰입니다.`),
      B('Limit 품목 추가 및 저장', '💾 저장', `PO ${s.numbers.po}에 품목 ${LIMIT_ITEM.item}이(가) 추가됩니다.`, !!s.ext.limit),
    ], '불확실한 비용도 PO로 통제하고 예산에 미리 반영합니다.');
    case 'reduce': return GX(`공급업체가 Limit 품목에 ${fmtAmt(LIMIT_ITEM.billed, c.currency)}를 청구했습니다 – 한도 ${fmtAmt(LIMIT_ITEM.overall, c.currency)}를 넘습니다.`, [
      B('추가', '↵ 적용', 'PO의 Limit 품목이 제안되고 한도 초과가 표시됩니다.', !!s.ext.reduceAdded || !!s.ext.reduce),
      L('송장 축소 설명', '정확한 금액만 전기하고 차액은 시스템이 대변 메모로 자동 생성해 공급업체에 통지합니다.'),
      B('전기', '💾 전기', `송장 ${s.numbers.inv2}와 대변 메모 ${s.numbers.cm}이(가) 동시에 생성됩니다.`, !!s.ext.reduce),
    ], '과다 청구를 지급 전에 바로잡고 공급업체와의 정산 근거를 남깁니다.');
    case 'invplan': return GX(`매달 같은 금액이 나가는 커피 머신 임대료(${fmtAmt(PLAN.monthly, c.currency)}/월)는 송장 계획으로 처리합니다.`, [
      B('저장', '💾 저장', `송장 계획이 있는 PO ${s.numbers.planPo}가 생성되고 12개월 일정이 만들어집니다.`, !!s.ext.invplanPo || !!s.ext.invplan),
      B('정산 실행', '▶ 정산 실행 (MRIS)', '정산일이 된 회차의 송장을 시스템이 자동 생성합니다(ERS).', !!s.ext.invplan),
    ], '정기 지급을 공급업체 송장 없이 자동화해 처리 비용을 줄입니다.');
    case 'po': return {
      situation: `구매 요청 ${s.numbers.pr}에 공급원(계약)이 이미 지정되어 있어 바로 발주할 수 있습니다.`,
      fiori: [
        { text: "'구매 오더 생성' 클릭", why: '공급원이 지정된 요청은 클릭 한 번으로 PO 미리보기가 열립니다.', target: '구매 오더 생성', done: !!po },
        { text: "'오더' 클릭", why: `구매 그룹 ${PURCH_GROUP} · 금액 600 EUR라 승인 워크플로가 시작됩니다.`, target: '오더', done: !!po },
      ],
      gui: [{ text: "'지정 개요 → 구매 오더 생성' 클릭", why: 'ME57에서 PO를 만듭니다.', target: '지정 개요 → 구매 오더 생성', done: !!po }],
      value: '계약 가격과 계정 지정이 요청에서 PO로 그대로 넘어가 재입력이 없습니다.',
    };
    case 'additem': return {
      situation: `같은 공급업체에서 사무용품도 사기로 했습니다. 자재 번호가 없는 품목이고, 비용을 두 부서(${CC1} 20%, ${CC2} 80%)가 나눠 부담합니다.`,
      fiori: [
        { text: "상단 '편집' 클릭", why: '승인 전이므로 PO를 보완할 수 있습니다.', target: '편집', done: added },
        { text: "품목 표의 '품목 추가' 클릭", why: `자재 번호 없이 내역·자재 그룹 ${ITEM20.matGroup}만으로 품목을 만들고, G/L 계정 ${ITEM20.gl}은 자재 그룹에서 자동 결정됩니다.`, target: '품목 추가', done: added },
        { text: "다중 계정 지정 20/80 확인 후 '오더' 클릭", why: '한 품목의 비용을 여러 코스트 센터에 비율로 나눕니다. 입고·송장 시 비용도 같은 비율로 전기됩니다.', target: '오더', done: added },
      ],
      gui: [
        { text: "'＋ 품목 추가' 클릭", why: 'ME22N에서 텍스트 품목과 다중 계정 지정을 추가합니다.', target: '＋ 품목 추가', done: added },
        { text: "'저장' 클릭", why: 'PO가 변경됩니다.', target: '저장', done: added },
      ],
      value: '공용 비용도 한 장의 PO로 처리하면서 부서별 비용 배분이 정확히 이뤄집니다.',
    };
    case 'mass': return {
      situation: '재무팀 요청으로 이 공급업체의 미결 PO 지급 조건을 0003(현금 할인)으로 일괄 변경합니다.',
      fiori: [
        { text: "데모 PO가 선택된 상태에서 '일괄 편집' 클릭", why: '여러 PO를 한 번에 바꿀 수 있습니다. 헤더·품목·파트너 필드를 고를 수 있습니다.', target: '일괄 편집', done: s.massChanged },
        { text: "지급 조건 0003 선택 후 '일괄 변경 적용'", why: '백그라운드 작업으로 실행되고 결과는 작업 모니터에 남습니다.', target: '일괄 변경 적용', done: s.massChanged },
      ],
      gui: [{ text: "'▶ 실행 (F8)' 클릭", why: 'MEMASSPO로 필드 값을 일괄 교체합니다.', target: '▶ 실행 (F8)', done: s.massChanged }],
      value: '조건 변경을 PO마다 하지 않고 한 번에 처리해 시간과 실수를 줄입니다.',
    };
    case 'approve': return {
      situation: `PO ${s.numbers.po}가 승인 규칙(구매 그룹 003, 500 EUR 초과)에 걸려 ${ROLE_KO['Purchasing Manager']}에게 도착했습니다.`,
      fiori: [
        { text: `'구매 오더 ${s.numbers.po} 릴리스' 작업 선택`, why: '품목별 계정 지정(코스트 센터)까지 받은 편지함에서 확인합니다.', target: `구매 오더 ${s.numbers.po} 릴리스` },
        { text: "'승인' 클릭", why: '승인해야 공급업체에 발송되고 입고할 수 있습니다.', target: '승인', done: released },
        { text: "'제출' 클릭", why: 'PO 상태가 발송됨으로 바뀝니다.', target: '제출', done: released },
      ],
      gui: [{ text: "'✔ 릴리스(승인)' 클릭", why: 'SBWP 워크플로 작업입니다.', target: '✔ 릴리스(승인)', done: released }],
      value: '비용성 구매도 금액·그룹 조건으로 통제합니다.',
    };
    case 'monitor': return {
      situation: '매입채무 담당자가 코스트 센터별로 미결 PO 금액을 점검합니다.',
      fiori: [
        { text: '코스트 센터·배분(%)·순 금액 열 설명', why: `한 PO가 계정 지정 줄 단위로 나뉘어 보입니다 (${CC1} / ${CC2}).` },
        { text: '입고 미결 수량·송장 금액 열 설명', why: '비용이 아직 발생하지 않은 약정(commitment)을 부서별로 파악합니다.' },
      ],
      gui: [{ text: 'ME2K 목록 확인', why: '계정 지정별 구매 문서 목록입니다.' }],
      value: '부서별 약정 비용을 실시간으로 보고 예산 초과를 미리 막습니다.',
    };
    case 'gr': return {
      situation: `소모품과 사무용품이 도착했습니다. ${ROLE_KO['Warehouse Clerk']}가 PO 기준으로 입고합니다.`,
      fiori: [
        { text: "'계정 지정' 열 확인", why: '재고 유형 대신 코스트 센터가 표시됩니다 – 재고 없이 소비로 처리됩니다.' },
        { text: "하단 '전기' 클릭", why: '입고 시점에 비용이 코스트 센터로 전기됩니다 (차변 비용 / 대변 GR/IR).', target: '전기', done: !!s.gr },
      ],
      gui: [{ text: "'계정 지정' 탭 확인 후 '전기'", why: 'MIGO 이동 유형 101, 소비 전기입니다.', target: '전기', done: !!s.gr }],
      value: '비용이 실제로 받은 시점에 정확한 부서로 반영됩니다.',
    };
    case 'slip': return {
      situation: '입고 전표를 출력하고, 회계에 어떤 비용이 기록됐는지 확인합니다.',
      fiori: [
        { text: "'문서 표시' 클릭", why: '입고 전표 PDF입니다.', target: '문서 표시' },
        { text: "'회계 전표' 탭 클릭", why: `G/L ${ITEM10.gl}(자재 번호 품목)과 ${ITEM20.gl}(자재 그룹 품목)에 코스트 센터별로 비용이 나뉘어 전기되었습니다.`, target: '회계 전표' },
      ],
      gui: [
        { text: "'🖨 인쇄 미리보기' 클릭", why: 'MB90 출력 미리보기입니다.', target: '🖨 인쇄 미리보기' },
        { text: "'FI 전표' 클릭", why: '코스트 센터별 비용 라인을 확인합니다.', target: 'FI 전표' },
      ],
      value: '다중 계정 지정 비율이 회계 전표까지 정확히 이어집니다.',
    };
    case 'invoice': {
      const inv = shared[`inv:${s.numbers.po}:added`] === true;
      return {
        situation: '공급업체 송장이 도착했습니다. PO·입고와 대조하고, 확인이 더 필요한 경우 지급을 보류합니다.',
        fiori: [
          { text: "'추가' 클릭", why: '입고 수량 × PO 가격으로 두 품목이 채워집니다.', target: '추가', done: inv || !!s.invoice },
          { text: "'품목 수동 보류' 체크 확인", why: '지급을 막아 두고, 코스트 센터 책임자가 확인한 뒤 릴리스하게 합니다.' },
          { text: "하단 '전기' 클릭", why: '송장이 전기되고 보류 시 승인 워크플로가 시작됩니다.', target: '전기', done: !!s.invoice },
        ],
        gui: [
          { text: "'↵ 적용' 클릭", why: 'MIRO가 PO 품목을 제안합니다.', target: '↵ 적용', done: inv || !!s.invoice },
          { text: "'전기' 클릭", why: '송장 전표가 생성됩니다.', target: '전기', done: !!s.invoice },
        ],
        value: `금액 ${fmtAmt(itemsValue(po?.items ?? []), c.currency)}이(가) 자동 대조되고, 필요하면 지급을 보류해 통제합니다.`,
      };
    }
    case 'release': return {
      situation: `지급이 보류된 송장 ${s.invoice?.doc ?? ''}이(가) 코스트 센터 책임자에게 릴리스 요청으로 도착했습니다.`,
      fiori: [
        { text: '작업의 보류 사유와 금액 확인', why: '수동 보류(Manual)로 지급이 막혀 있습니다.', target: `차단된 송장 ${s.invoice?.doc ?? ''} 릴리스` },
        { text: "'릴리스' 클릭", why: '확인을 마친 송장을 지급 대상으로 만듭니다.', target: '릴리스', done: s.released },
        { text: "'제출' 클릭", why: '보류가 해제되고 다음 지급 실행에 포함됩니다.', target: '제출', done: s.released },
      ],
      gui: [{ text: "'✔ 릴리스' 클릭", why: 'MRBR에서 차단된 송장을 릴리스합니다.', target: '✔ 릴리스', done: s.released }],
      value: '지급 전 마지막 통제를 워크플로로 처리하고 처리 이력이 남습니다.',
    };
  }
  return { situation: '', fiori: [], gui: [], value: '' };
}

function useBriefing(): Briefing {
  const c = useOrg();
  return {
    headline: '소모품은 재고 없이, 바로 부서 비용으로',
    story: (
      <>
        <b>{c.companyName}</b> 관리팀(코스트 센터 <b>{CC1}</b>)이 소모품 <b>NS0001 {ITEM10.qty}개</b>를 요청했습니다.
        공급업체 <b>{SUPPLIER.name}</b>와의 계약 단가 <b>{ITEM10.price} EUR</b>가 자동으로 적용됩니다.
        소모품은 재고가 아니라 <b>코스트 센터 비용</b>으로 처리되므로, 입고하는 순간 비용이 전기됩니다.
        <br />
        같은 PO에 자재 번호 없는 <b>사무용품</b>을 추가해 두 부서({CC1} 20% / {CC2} 80%)에 나눠 배분하고,
        일괄 변경 → 승인 → 입고 → 송장(지급 보류) → 릴리스까지 진행합니다.
      </>
    ),
    phases: [
      { icon: 'request', t: '요청·발주', d: '구매 요청 → 구매 오더' },
      { icon: 'edit', t: '보완·승인', d: '텍스트 품목 · 다중 계정 · 일괄 변경 · 승인' },
      { icon: 'shipping-status', t: '입고', d: '코스트 센터 비용 전기 · 전표' },
      { icon: 'customer-financial-fact-sheet', t: '송장', d: '검증 · 지급 보류 · 릴리스' },
    ],
    cast: [
      { role: 'Purchaser', does: '요청을 PO로 바꾸고 품목·Limit 품목·조건·송장 계획을 관리합니다', steps: '0–1 · 3–6 · 14' },
      { role: 'Purchasing Manager', does: '업무를 재배분하고 PO 승인·보류 송장 릴리스를 합니다', steps: '2 · 7 · 12' },
      { role: 'Warehouse Clerk', does: '소모품을 받고 입고를 전기합니다', steps: '9–10' },
      { role: 'Accounts Payable Accountant', does: '부서별 약정을 보고 송장 처리·송장 축소를 합니다', steps: '8 · 11 · 13' },
    ],
  };
}

export const BNX: ScenarioDef = {
  id: 'bnx',
  code: 'BNX',
  title: '소모품 구매',
  titleEn: 'Consumable Purchasing',
  summary: '비재고 소모품: 요청 → PO(다중 계정 지정) → 승인 → 비용 입고 → 송장 보류·릴리스',
  source: 'BNX_S4HANA2025-FPS2_BPD',
  steps: BNX_STEPS,
  screens: SCREENS,
  tcodes: TCODES,
  useRuntime,
  useGuide,
  useBriefing,
};
