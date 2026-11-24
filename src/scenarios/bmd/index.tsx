/** BMD – Purchase Contract: step list, runtime, presenter guide and briefing. */
import type { StepDef } from '../../steps';
import { ROLE_KO, ROLE_USER } from '../../steps';
import { useSharedMap } from '../../sharedState';
import { fmtAmt, fmtDate } from '../../format';
import type { StepGuide } from '../../harness/guide';
import { pick, useOrg, type Briefing, type Runtime, type ScenarioDef } from '../types';
import { itemsValue } from '../shared/ui';
import { APPROVAL_LIMIT, CONTRACT_PRICE, NB_ITEMS, PO_APPROVAL_LIMIT, REF_SUPPLIER, REVERSAL, RV_ITEMS, SUPPLIER, TRACKING, useBmd, type BmdReq } from './store';
import { B, GX, L } from '../shared/define';

const S = (no: number, id: string, title: string, titleEn: string, bpd: string, appName: string, appId: string, tcode: string, role: StepDef['role'], optional: boolean, requires: BmdReq): StepDef =>
  ({ id, no, title, titleEn, bpd, appName, appId, tcode, guiTitle: title, role, optional, requires });

export const BMD_STEPS: StepDef[] = [
  S(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  S(1, 'pr', '계약용 구매 요청 생성', 'Create Purchase Requisition (Outline Agreement)', '4.1.2', 'Manage Purchase Requisitions - Professional', 'F2229', 'ME51N', 'Purchaser', false, 'none'),
  S(2, 'contract', '구매 요청 참조 계약 생성', 'Create Purchase Contract with reference to PR', '4.2.1', 'Process Purchase Requisitions', 'F1048A', 'ME31K', 'Purchaser', false, 'pr'),
  S(3, 'approve', '구매 계약 승인', 'Approve Purchase Contract', '4.4', 'My Inbox - All Items', 'F0862', 'SBWP', 'Purchasing Manager', true, 'contract'),
  S(4, 'print', '구매 계약 출력', 'Print Purchase Contract', '4.6', 'Manage Purchase Contracts', 'F1600A', 'ME33K', 'Purchaser', false, 'contract'),
  S(5, 'reference', '계약 템플릿 · 참조 계약 생성', 'Contract Template and Reference Contract', '4.3', 'Manage Purchase Contracts', 'F1600A', 'ME31K_REF', 'Purchaser', true, 'contract-released'),
  S(6, 'notify', '계약 알림 모니터링', 'Monitor Contract Notifications', '4.5', 'Manage Purchase Contracts - Alerts', 'F1600A', 'ME80RN', 'Purchaser', true, 'contract-released'),
  S(7, 'mass', '구매 계약 일괄 변경', 'Mass Changes to Purchase Contracts', '4.10', 'Mass Changes to Purchase Contracts', 'F2667', 'MEMASSCONTRACT', 'Purchaser', true, 'contract-released'),
  S(8, 'source', '소스 리스트 생성', 'Generate Source Lists', '4.7', 'Manage Source Lists', 'F1859', 'ME05', 'Purchaser', true, 'contract-released'),
  S(9, 'po', '구매 요청 → 계약 릴리스 오더', 'Process Purchase Requisition and Create Purchase Order', '4.8', 'Process Purchase Requisitions', 'F1048', 'ME57', 'Purchaser', false, 'contract-released'),
  S(10, 'poapprove', '구매 오더 승인', 'Approve Purchase Order', '4.8.1', 'My Inbox - All Items', 'F0862', 'SBWP_PO', 'Purchasing Manager', true, 'po'),
  S(11, 'tracking', '추적 번호로 구매 문서 검색', 'Search Purchase Documents with Requirement Tracking Number', '4.9', 'Purchasing Documents by Requirement Tracking Number', 'F2905', 'ME2N', 'Purchaser', true, 'pr'),
  S(12, 'monitor', '계약 품목 모니터링', 'Monitor Contract Items', '4.11', 'Monitor Purchase Contract Items', 'F2423', 'ME3M', 'Purchaser', true, 'contract'),
  S(13, 'gr', '입고 전기', 'Post Goods Receipt', '4.12', 'Post Goods Receipt for Purchasing Document', 'F0843', 'MIGO', 'Warehouse Clerk', false, 'po-released'),
  S(14, 'reverse', '입고 부분 역분개 (102)', 'Partial Reversal of Goods Receipt', '4.13', 'Post Goods Receipt for Purchasing Document', 'F0843', 'MBST', 'Warehouse Clerk', true, 'gr'),
  S(15, 'invoice', '공급업체 송장 생성', 'Create Supplier Invoice', '4.14', 'Create Supplier Invoice', 'F0859', 'MIRO', 'Accounts Payable Accountant', false, 'gr'),
  S(16, 'version', '계약 변경 및 버전 이력', 'Versioning of Purchase Contracts', '4.15', 'Manage Purchase Contracts', 'F1600A', 'ME32K', 'Purchaser', true, 'contract-released'),
];

const m = () => import('./screens');
const x = () => import('./extra');
const ext = (id: string) => ({ fiori: pick(x, `${id}F`), gui: pick(x, `${id}G`) });
const both = (f: string, g: string) => ({ fiori: pick(m, f), gui: pick(m, g) });
const SCREENS = {
  launchpad: both('LaunchpadF', 'LaunchpadG'), pr: both('PrF', 'PrG'), contract: both('ContractF', 'ContractG'), approve: both('ApproveF', 'ApproveG'),
  print: both('PrintF', 'PrintG'), source: both('SourceF', 'SourceG'), po: both('PoF', 'PoG'), tracking: both('TrackingF', 'TrackingG'),
  monitor: both('MonitorF', 'MonitorG'), gr: both('GrF', 'GrG'), invoice: both('InvoiceF', 'InvoiceG'), version: both('VersionF', 'VersionG'),
  reference: ext('reference'), notify: ext('notify'), mass: ext('mass'), poapprove: ext('poapprove'), reverse: ext('reverse'),
};

const TCODES: Record<string, string> = {
  S000: 'launchpad', ME51N: 'pr', ME53N: 'pr', ME31K: 'contract', SBWP: 'approve', ME33K: 'print', ME01: 'source', ME05: 'source',
  ME57: 'po', ME21N: 'po', ME2N: 'tracking', ME3M: 'monitor', MIGO: 'gr', MIRO: 'invoice', ME32K: 'version',
  ME31K_REF: 'reference', ME80RN: 'notify', MEMASSCONTRACT: 'mass', SBWP_PO: 'poapprove', MBST: 'reverse',
};

const REQ: Record<string, { text: string; goto: string }> = {
  none: { text: '', goto: 'launchpad' },
  pr: { text: '아웃라인 계약용 구매 요청이 아직 없습니다.', goto: 'pr' },
  contract: { text: '구매 계약이 아직 생성되지 않았습니다.', goto: 'contract' },
  'contract-released': { text: '구매 계약이 생성되고 승인(릴리스)되어야 합니다.', goto: 'approve' },
  po: { text: '계약을 참조한 구매 오더(릴리스 오더)가 아직 없습니다.', goto: 'po' },
  'po-released': { text: '구매 오더가 승인(릴리스)되어야 입고할 수 있습니다.', goto: 'poapprove' },
  gr: { text: '입고가 아직 전기되지 않았습니다.', goto: 'gr' },
};

function useRuntime(): Runtime {
  const s = useBmd();
  const done = (id: string) => {
    switch (id) {
      case 'pr': return s.prRv !== 'None';
      case 'contract': return !!s.contract;
      case 'approve': return s.contract?.status === 'Released';
      case 'print': return s.printed;
      case 'source': return s.sourceList;
      case 'po': return !!s.po;
      case 'gr': return !!s.gr;
      case 'invoice': return !!s.invoice;
      case 'version': return s.versions.length > 0;
      case 'reference': case 'mass': case 'poapprove': case 'reverse': return !!s.ext[id];
      default: return s.visited.includes(id);
    }
  };
  return {
    done, meets: (r) => s.meets(r as BmdReq), autoComplete: (r) => s.autoComplete(r as BmdReq), reqText: REQ,
    summary: [
      { label: '구매 요청 (RV)', value: s.prRv === 'None' ? '–' : s.numbers.prRv },
      { label: '구매 계약', value: s.contract ? `${s.numbers.contract} v${s.contract.version}` : '–' },
      { label: 'PO (릴리스 오더)', value: s.po ? s.numbers.po : '–' },
      { label: '자재 전표', value: s.gr?.docNo ?? '–' },
      { label: '송장', value: s.invoice?.doc ?? '–' },
    ],
    reset: s.reset, briefed: s.briefed, setBriefed: s.setBriefed, markVisited: s.markVisited,
  };
}

function useGuide(id: string): StepGuide {
  const s = useBmd();
  const c = useOrg();
  const shared = useSharedMap();
  const ct = s.contract;
  const value = RV_ITEMS.reduce((a, r) => a + r.target * CONTRACT_PRICE, 0);
  const sup = SUPPLIER.name;
  const pur = `${ROLE_KO.Purchaser} ${ROLE_USER.Purchaser.name}`;
  switch (id) {
    case 'launchpad': return {
      situation: `${pur}이(가) 로그인했습니다. 올해 반복 구매하는 상품 TG10·TG11을 건별 견적 대신 연간 계약으로 묶으려고 합니다.`,
      fiori: [
        { text: "'구매' 스페이스의 '구매 요청 관리 - 전문가용' 타일 클릭", why: '계약을 만들기 위한 아웃라인 계약 요청(RV)부터 등록합니다.', target: '구매 요청 관리 - 전문가용', done: false },
        { text: "'소싱 및 계약' 스페이스 보여 주기", why: '계약 관리, 계약 품목 모니터링, 소스 리스트 등 계약 업무 앱이 한곳에 모여 있습니다.', target: '소싱 및 계약', done: false },
      ],
      gui: [{ text: "'ME51N - 생성' 더블클릭", why: '구매 요청 생성 트랜잭션입니다. 계약 관련 트랜잭션은 ME31K/ME32K/ME33K입니다.', target: 'ME51N - 생성', done: false }],
      value: '구매 담당자는 운영 구매와 소싱·계약 업무를 같은 홈에서 처리합니다.',
    };
    case 'pr': return {
      situation: `계약 체결 전, 필요한 연간 물량을 '아웃라인 계약 요청(RV)'으로 등록합니다. 나중에 관련 문서를 한 번에 찾을 수 있도록 요구 추적 번호 ${TRACKING}를 붙입니다.`,
      fiori: [
        { text: "문서 유형 'Outline Agrmt. Reqn. (RV)' 설명", why: '일반 구매 요청(NB)과 달리, 구매 오더가 아니라 계약을 만들기 위한 요청입니다.' },
        { text: `품목 TG10 50개, TG11 10개와 추적 번호 ${TRACKING} 확인`, why: '추적 번호는 요청 → 계약 → PO로 그대로 넘어가 전체 흐름을 이어 줍니다.' },
        { text: "하단 '생성' 클릭", why: `구매 요청 ${s.numbers.prRv}가 저장됩니다.`, target: '생성', done: s.prRv !== 'None' },
      ],
      gui: [{ text: "문서 유형 'RV' 확인 후 '저장' 클릭", why: 'ME51N에서 아웃라인 계약 요청을 저장합니다.', target: '저장', done: s.prRv !== 'None' }],
      value: '계약이 필요한 물량도 요청 단계부터 시스템에 기록되어 승인·추적이 가능합니다.',
    };
    case 'contract': return {
      situation: `공급업체 ${sup}과 연말까지 TG10 500개, TG11 100개를 개당 ${CONTRACT_PRICE} EUR에 공급받기로 합의했습니다. 구매 요청을 참조해 수량 계약을 만듭니다.`,
      fiori: [
        { text: `구매 요청 ${s.numbers.prRv}의 두 품목이 선택된 상태 확인`, why: '요청의 자재·플랜트·추적 번호가 계약 품목으로 그대로 복사됩니다.' },
        { text: "'계약 생성' 클릭", why: '요청에서 바로 계약 미리보기를 엽니다. 계약을 처음부터 입력할 필요가 없습니다.', target: '계약 생성', done: !!ct },
        { text: "미리보기에서 계약 유형 MK·목표 수량·가격을 확인하고 '생성' 클릭", why: `목표 금액 ${fmtAmt(value, c.currency)}이(가) ${APPROVAL_LIMIT.toLocaleString()} EUR를 넘어 승인 워크플로가 시작됩니다.`, target: '생성', done: !!ct },
      ],
      gui: [{ text: "ME31K에서 헤더·품목 확인 후 '저장'", why: '공급업체, 유효 기간, 목표 수량, 순 가격으로 수량 계약을 저장합니다.', target: '저장', done: !!ct }],
      value: '한 번의 계약으로 연간 가격과 물량이 확정되어 건별 협상이 사라집니다.',
    };
    case 'approve': return {
      situation: `계약 ${s.numbers.contract}의 목표 금액이 승인 기준(2,000 EUR)을 넘어 ${ROLE_KO['Purchasing Manager']} ${ROLE_USER['Purchasing Manager'].name}에게 승인 작업이 도착했습니다.`,
      fiori: [
        { text: `'구매 계약 ${s.numbers.contract} 릴리스' 작업 선택`, why: '계약 헤더와 품목을 받은 편지함에서 바로 검토합니다.', target: `구매 계약 ${s.numbers.contract} 릴리스` },
        { text: "'승인' 클릭", why: '승인해야 계약이 소스로 쓰이고 릴리스 오더를 만들 수 있습니다.', target: '승인', done: ct?.status === 'Released' },
        { text: "'제출' 클릭", why: '계약 상태가 릴리스됨으로 바뀝니다.', target: '제출', done: ct?.status === 'Released' },
      ],
      gui: [{ text: "작업 선택 후 '✔ 릴리스(승인)'", why: 'SBWP에서 같은 워크플로 작업을 처리합니다.', target: '✔ 릴리스(승인)', done: ct?.status === 'Released' }],
      value: '금액 기준 승인 규칙을 설정만으로 운영하며 계약 통제를 강화합니다.',
    };
    case 'print': return {
      situation: '승인된 계약서를 공급업체에 보내기 전에 출력물을 확인합니다.',
      fiori: [
        { text: "'출력 관리' 탭 확인", why: '계약서는 이메일 채널로 공급업체에 발송됩니다.', target: '출력 관리' },
        { text: "'문서 표시' 클릭", why: '계약 번호, 유효 기간, 품목별 목표 수량과 가격이 인쇄된 PDF입니다.', target: '문서 표시', done: s.printed },
      ],
      gui: [{ text: "'🖨 인쇄 미리보기' 클릭", why: 'ME33K에서 계약서 출력물을 미리 봅니다.', target: '🖨 인쇄 미리보기', done: s.printed }],
      value: '계약서 발송이 표준화되고 발송 이력이 남습니다.',
    };
    case 'source': return {
      situation: 'MRP와 구매 요청이 이 계약을 자동으로 공급원으로 쓰도록 소스 리스트에 등록합니다.',
      fiori: [
        { text: "필터 TG10/TG11 · 플랜트 확인 후 '생성' 클릭", why: '현재 유효한 소스 리스트 항목이 없습니다.', target: '생성', done: s.sourceList },
        { text: "생성된 소스(계약 품목) 확인 후 '기존 항목에 추가 후 저장'", why: '계약이 고정 공급원으로 등록되어 MRP가 만든 요청에 자동으로 지정됩니다.', target: '기존 항목에 추가 후 저장', done: s.sourceList },
      ],
      gui: [
        { text: "'▶ 실행 (F8)' 클릭", why: 'ME05가 유효한 계약에서 소스 리스트 레코드를 제안합니다.', target: '▶ 실행 (F8)' },
        { text: "'저장' 클릭", why: '제안된 레코드를 저장합니다.', target: '저장', done: s.sourceList },
      ],
      value: '고정 공급원 지정으로 요청이 자동으로 계약 가격에 연결됩니다.',
    };
    case 'po': return {
      situation: `생산 부서가 TG10 50개, TG11 30개를 요청했습니다(구매 요청 ${s.numbers.prNb}). 공급원으로 계약 ${s.numbers.contract}가 자동 지정되어 있습니다.`,
      fiori: [
        { text: "'지정된 공급원' 열에서 계약 번호 확인", why: '견적이나 가격 입력 없이 계약 가격이 적용됩니다.' },
        { text: "'구매 오더 생성' 클릭", why: '선택한 요청 품목으로 PO 미리보기를 엽니다.', target: '구매 오더 생성', done: !!s.po },
        { text: "'오더' 클릭", why: `계약을 참조한 릴리스 오더 ${s.numbers.po}(${fmtAmt(itemsValue(NB_ITEMS.map((n) => ({ item: n.item, material: n.material, text: '', qty: n.qty, unit: 'PC', price: CONTRACT_PRICE }))), c.currency)})가 만들어지고 계약의 릴리스 수량이 자동으로 늘어납니다.`, target: '오더', done: !!s.po },
      ],
      gui: [{ text: "'지정 개요 → 구매 오더 생성' 클릭", why: 'ME57에서 계약을 참조한 PO를 만듭니다.', target: '지정 개요 → 구매 오더 생성', done: !!s.po }],
      value: '계약 가격 준수(compliance)가 자동으로 보장되고 발주 시간이 크게 줄어듭니다.',
    };
    case 'tracking': return {
      situation: `감사 담당자가 묻습니다: "${TRACKING} 건과 관련된 문서를 모두 보여 주세요."`,
      fiori: [
        { text: "필터의 추적 번호 확인 후 '실행' 클릭", why: '요청(RV), 계약, 요청(NB), PO가 한 목록에 나옵니다.', target: '실행' },
      ],
      gui: [{ text: "'▶ 실행 (F8)' 클릭", why: 'ME2N에서 요구 추적 번호로 구매 문서를 조회합니다.', target: '▶ 실행 (F8)' }],
      value: '요청부터 계약·발주까지 하나의 번호로 끝까지 추적합니다.',
    };
    case 'monitor': return {
      situation: '계약이 얼마나 소진되었는지, 남은 물량은 얼마인지 확인합니다.',
      fiori: [
        { text: "'릴리스 수량'과 '소진율' 열 설명", why: `릴리스 오더가 생길 때마다 자동으로 갱신됩니다. (TG10 ${ct?.items[0].released ?? 0}/500, TG11 ${ct?.items[1].released ?? 0}/100)` },
        { text: '헤더의 목표 금액 대비 릴리스 금액 설명', why: '계약 갱신이나 재협상 시점을 판단하는 근거가 됩니다.' },
      ],
      gui: [{ text: 'ME3M 목록의 릴리스됨·잔여 수량 확인', why: '자재별 아웃라인 계약 현황입니다.' }],
      value: '계약 소진 현황을 실시간으로 보고 재협상·갱신 시점을 놓치지 않습니다.',
    };
    case 'reference': return GX(`계약 ${s.numbers.contract} 조건을 템플릿으로 저장하고, 두 번째 공급업체 ${REF_SUPPLIER.name}와 같은 조건의 계약을 만듭니다.`, [
      L('템플릿 원본·복사된 품목 설명', '품목·목표 수량·조건이 템플릿에서 복사되고 공급업체와 단가만 바꿉니다.'),
      B('참조 계약 생성', '💾 저장', `계약 ${s.numbers.refContract}가 생성됩니다 (단가 ${REF_SUPPLIER.price} EUR).`, !!s.ext.reference),
    ], '표준 계약 조건을 재사용해 계약 작성 시간과 오류를 줄입니다.');
    case 'notify': return GX('구매 담당자는 만료가 다가오는 계약과 소진율 알림을 받습니다.', [
      L('만료까지 남은 일수 설명', '유효 종료일이 가까운 계약을 자동으로 알려 갱신 시점을 놓치지 않게 합니다.'),
      L('소진율 알림 설명', '목표 수량 대비 릴리스된 수량을 보고 재협상 여부를 판단합니다.'),
    ], '계약 만료로 인한 공급 중단·가격 상승을 예방합니다.');
    case 'mass': return GX('연간 계약을 갱신하기로 했습니다. 관련 계약의 유효 종료일을 한 번에 연장합니다.', [
      L('대상 계약과 새 유효 종료일 설명', '템플릿으로 만든 참조 계약도 함께 선택됩니다.'),
      B('일괄 변경 적용', '▶ 실행 (F8)', `작업 ${s.numbers.job}가 백그라운드에서 실행됩니다.`, !!s.ext.mass),
    ], '여러 계약을 열지 않고 조건을 일괄 갱신합니다.');
    case 'poapprove': return GX(`릴리스 오더 ${s.numbers.po}(800 EUR)가 PO 승인 규칙(${PO_APPROVAL_LIMIT} EUR 초과)에 걸렸습니다.`, [
      L('참조 계약·계약 단가 설명', '계약 가격이 적용된 PO라도 금액 기준 승인은 별도로 적용됩니다.'),
      B('승인', '✔ 릴리스(승인)', '승인되어야 공급업체에 발송되고 입고할 수 있습니다.', !!s.ext.poapprove),
    ], '계약 기반 구매도 지출 통제를 유지합니다.');
    case 'reverse': return GX(`입고 후 TG11 ${REVERSAL.qty} PC가 파손된 것을 발견했습니다. 입고를 일부만 취소합니다.`, [
      L('역분개 수량 설명', '전체 전표가 아니라 해당 품목·수량만 이동 유형 102로 되돌립니다.'),
      B('역분개 전기', '전기', `자재 전표 ${s.numbers.revDoc}가 전기되고 송장 제안 수량이 줄어듭니다.`, !!s.ext.reverse),
    ], '재고·GR/IR이 실제 받은 수량과 일치하게 정정됩니다.');
    case 'gr': return {
      situation: `공급업체 ${sup}의 물품이 도착했습니다. ${ROLE_KO['Warehouse Clerk']}가 PO ${s.numbers.po} 기준으로 입고합니다.`,
      fiori: [
        { text: '납품서 번호와 품목별 입고 수량 확인', why: '수량을 줄이면 부분 입고가 됩니다.' },
        { text: "하단 '전기' 클릭", why: '재고와 GR/IR 회계 전표가 동시에 생성됩니다.', target: '전기', done: !!s.gr },
      ],
      gui: [{ text: "'전기' 클릭", why: 'MIGO 이동 유형 101입니다.', target: '전기', done: !!s.gr }],
      value: '계약 기반 PO도 일반 PO와 똑같이 입고·재고 처리됩니다.',
    };
    case 'invoice': {
      const added = shared[`inv:${s.numbers.po}:added`] === true;
      return {
        situation: `공급업체 송장이 도착했습니다. 계약 가격 ${CONTRACT_PRICE} EUR가 그대로 청구되었는지 PO·입고와 대조합니다.`,
        fiori: [
          { text: "구매 오더 번호 확인 후 '추가' 클릭", why: '입고 수량 × 계약 가격으로 송장 품목이 채워집니다.', target: '추가', done: added || !!s.invoice },
          { text: '잔액이 0.00이고 녹색인지 확인', why: '계약 가격과 송장 가격이 같다는 뜻입니다.' },
          { text: "하단 '전기' 클릭", why: '매입채무가 생기고 GR/IR이 상계됩니다.', target: '전기', done: !!s.invoice },
        ],
        gui: [
          { text: "PO 참조 후 '↵ 적용'", why: 'MIRO가 입고 기준으로 품목을 제안합니다.', target: '↵ 적용', done: added || !!s.invoice },
          { text: "'전기' 클릭", why: '송장 전표가 생성됩니다.', target: '전기', done: !!s.invoice },
        ],
        value: '계약 가격과 다르면 자동으로 차이가 드러나 과다 청구를 막습니다.',
      };
    }
    case 'version': return {
      situation: '연말 물량이 늘어 계약 목표 금액을 올려야 합니다. 변경 내용은 새 계약 버전으로 남겨 이전 조건과 비교할 수 있어야 합니다.',
      fiori: [
        { text: "상단 '편집' 클릭", why: '활성 계약은 그대로 운영되고, 변경 요청이 새 버전으로 만들어집니다.', target: '편집', done: s.versions.length > 0 },
        { text: "목표 금액을 올리고 '새 버전 사유'를 선택한 뒤 '저장'", why: '버전 관련 필드(목표 금액)를 바꾸면 새 버전이 생성됩니다.', target: '저장', done: s.versions.length > 0 },
        { text: "'버전 이력' 탭에서 '비교' 클릭", why: '이전 버전과 현재 버전의 차이를 필드 단위로 보여 줍니다.', target: '비교' },
      ],
      gui: [{ text: "목표 금액 변경 후 '저장'", why: 'ME32K에서 계약을 변경하면 버전이 올라갑니다.', target: '저장', done: s.versions.length > 0 }],
      value: '계약 조건 변경 이력이 버전으로 관리되어 감사와 분쟁 대응이 쉬워집니다.',
    };
  }
  return { situation: '', fiori: [], gui: [], value: '' };
}

function useBriefing(): Briefing {
  const s = useBmd();
  const c = useOrg();
  return {
    headline: '연간 구매 계약으로 가격과 물량을 확정하기',
    story: (
      <>
        <b>{c.companyName}</b>는 판매용 상품 <b>TG10</b>, <b>TG11</b>을 매달 반복 구매합니다. 지금까지는 건마다 견적과 가격을 협상했지만,
        올해 남은 기간(<b>{fmtDate(s.contract?.validTo ?? `${new Date().getFullYear()}-12-31`, c.dateFormat)}</b>까지) 공급업체 <b>{SUPPLIER.name}</b>와
        <b> 수량 계약</b>(TG10 500개, TG11 100개, 단가 {CONTRACT_PRICE} EUR, 목표 금액 {fmtAmt(RV_ITEMS.reduce((a, r) => a + r.target * CONTRACT_PRICE, 0), c.currency)})을 맺기로 했습니다.
        <br />
        계약을 만들고 승인받은 뒤, 실제 필요가 생기면 구매 요청을 <b>계약 가격으로 자동 발주(릴리스 오더)</b>하고 입고·송장까지 처리합니다.
        마지막으로 계약 조건 변경을 <b>버전</b>으로 관리합니다.
      </>
    ),
    phases: [
      { icon: 'request', t: '계약 준비', d: '계약용 요청 → 계약 → 승인' },
      { icon: 'documents', t: '계약 공유', d: '계약서 출력 · 소스 리스트' },
      { icon: 'activity-items', t: '계약 릴리스', d: '요청 → 릴리스 오더 · 모니터링' },
      { icon: 'shipping-status', t: '이행·변경', d: '입고 · 송장 · 버전 관리' },
    ],
    cast: [
      { role: 'Purchaser', does: '요청·계약·템플릿·일괄 변경·릴리스 오더를 처리하고 계약을 관리합니다', steps: '0–2 · 4–9 · 11–12 · 16' },
      { role: 'Purchasing Manager', does: '2,000 EUR 초과 계약과 500 EUR 초과 PO를 승인합니다', steps: '3 · 10' },
      { role: 'Warehouse Clerk', does: '입고를 전기하고 일부를 역분개합니다', steps: '13–14' },
      { role: 'Accounts Payable Accountant', does: '계약 가격으로 송장을 검증합니다', steps: '15' },
    ],
  };
}

export const BMD: ScenarioDef = {
  id: 'bmd',
  code: 'BMD',
  title: '구매 계약',
  titleEn: 'Purchase Contract',
  summary: '수량 계약: 계약용 요청 → 계약 → 승인 → 릴리스 오더 → 입고 → 송장 → 버전',
  source: 'BMD_S4HANA2025-FPS2_BPD',
  steps: BMD_STEPS,
  screens: SCREENS,
  tcodes: TCODES,
  useRuntime,
  useGuide,
  useBriefing,
};
