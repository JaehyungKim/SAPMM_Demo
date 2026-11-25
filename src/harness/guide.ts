/**
 * Presenter storyline: the opening scenario and, per step, the situation, every click with
 * its business meaning, and the value to stress. All text is built from the live demo state,
 * so names, numbers and dates always match what is on screen.
 *
 * `target` is the visible text of the element to click (exact match preferred, else the
 * shortest element containing it). The guide panel outlines it on the SAP screen.
 * `done` ticks the action off; actions without `done` are things to point at or explain.
 */
import { jo } from '../josa';
import { CHANGE_DELAY_DAYS, DemoState, grQty, netValue } from '../store';
import { ROLE_KO, ROLE_USER } from '../steps';
import { addDays, fmtAmt, fmtDate, fmtQty } from '../format';

export interface GuideAction {
  /** What to do, in presenter words. */
  text: string;
  /** What the click means for the business / in SAP. */
  why: string;
  target?: string;
  done?: boolean;
}

export interface StepGuide {
  situation: string;
  fiori: GuideAction[];
  gui: GuideAction[];
  value: string;
}

type Shared = Record<string, unknown>;

const invAdded = (s: DemoState, m: Shared) => m[`inv:${s.numbers.invoiceDocNumber}:${s.grDocs.length}:added`] === true;

export function buildGuide(id: string, s: DemoState, shared: Shared): StepGuide {
  const c = s.config;
  const df = c.dateFormat;
  const po = s.numbers.poNumber;
  const pr = s.numbers.prNumber;
  const amt = fmtAmt(netValue(c), c.currency);
  const qty = `${fmtQty(c.quantity)} ${c.unit}`;
  const poMade = s.poStatus !== 'None';
  const released = ['Approved', 'Created', 'Goods Received', 'Invoiced'].includes(s.poStatus);
  const workflow = s.optionalEnabled['approve-po'];

  switch (id) {
    case 'launchpad':
      return {
        situation: `${ROLE_KO.Purchaser} ${jo(ROLE_USER.Purchaser.name, '이')} 출근해 SAP에 로그인했습니다. 홈 화면의 '구매 요청 처리' 타일에 처리할 요청이 쌓여 있습니다.`,
        fiori: [
          { text: "상단 '구매' 스페이스를 보여 주기", why: '역할(SAP_BR_PURCHASER)에 맞는 앱과 KPI만 보입니다. 숫자가 있는 타일은 지금 처리할 일이 있다는 뜻입니다.', target: '구매' },
          { text: "'구매 요청 처리' 타일 클릭", why: 'MRP가 자동으로 만든 구매 요청을 구매 오더로 바꾸는 업무를 시작합니다.', target: '구매 요청 처리', done: false },
        ],
        gui: [
          { text: 'SAP 메뉴 트리에서 자재 관리 → 구매 영역 보여 주기', why: 'SAP GUI에서는 메뉴 트리나 트랜잭션 코드로 업무를 찾아갑니다.' },
          { text: "'ME57 - 지정 및 처리'를 더블클릭하거나 명령 필드에 ME57 입력", why: '구매 요청에 공급원을 지정하고 구매 오더로 전환하는 트랜잭션입니다.', target: '지정 및 처리', done: false },
        ],
        value: '역할 기반 홈 화면: 사용자는 메뉴를 찾지 않고 자기 업무와 처리할 건수부터 봅니다.',
      };

    case 'process-pr':
      return {
        situation: `MRP 실행 결과 ${c.plantName}(${c.plant})의 ${c.materialNumber} 재고가 부족해, 구매 요청 ${pr}(${qty}, 납기 ${fmtDate(c.deliveryDate, df)})가 자동으로 만들어졌습니다. 아직 어느 공급업체에서 살지 정해지지 않았습니다.`,
        fiori: [
          { text: `구매 요청 ${pr} 행이 선택되어 있는지 확인`, why: "'지정된 공급원'이 비어 있습니다. 이 상태로는 발주할 수 없습니다." },
          { text: "'빠른 편집 (소스 지정)' 클릭", why: '시스템이 구매 정보 레코드와 소스 리스트에서 살 수 있는 공급업체와 계약 단가를 찾아 줍니다.', target: '빠른 편집 (소스 지정)', done: s.prStatus !== 'Open' },
          { text: `'고정' 표시된 ${c.supplierName} 행의 '지정' 클릭`, why: `소스 리스트에 고정된 공급업체입니다. 단가 ${jo(fmtAmt(c.netPrice, c.currency), '이')} 정보 레코드에서 자동으로 들어옵니다. 견적을 다시 받을 필요가 없습니다.`, target: '지정', done: s.prStatus !== 'Open' },
          { text: "'구매 오더 생성' 클릭", why: '공급원이 정해진 요청을 바로 구매 오더 초안으로 만듭니다.', target: '구매 오더 생성', done: poMade },
          { text: "미리보기를 확인하고 '오더' 클릭", why: `PO ${jo(po, '이')} 저장되고 구매 요청은 '완료'로 닫힙니다. ${workflow ? '승인 워크플로가 켜져 있어 구매 관리자에게 승인 요청이 갑니다.' : ''}`, target: '오더', done: poMade },
        ],
        gui: [
          { text: `리스트에서 구매 요청 ${pr} 확인`, why: "'고정 공급업체' 칸이 비어 있습니다. 아직 공급원이 지정되지 않았습니다." },
          { text: "'소스 지정' 클릭", why: '구매 정보 레코드와 소스 리스트를 기준으로 공급업체와 단가가 자동으로 지정됩니다.', target: '소스 지정', done: s.prStatus !== 'Open' },
          { text: "'지정 개요 → 구매 오더 생성' 클릭", why: `지정된 공급원으로 PO ${jo(po, '을')} 만들고 구매 요청을 닫습니다.`, target: '지정 개요 → 구매 오더 생성', done: poMade },
        ],
        value: '계약된 공급원과 가격으로 바로 발주합니다. 구매 리드타임이 줄고, 계약 단가 준수(price compliance)가 시스템으로 보장됩니다.',
      };

    case 'create-po':
      return {
        situation: poMade
          ? `구매 요청에서 PO ${jo(po, '이')} 만들어졌습니다. 공급업체에 보내기 전에 내용을 확인합니다.`
          : '구매 요청 없이 담당자가 직접 구매 오더를 만드는 경우입니다.',
        fiori: [
          { text: "'품목' 탭에서 수량·단가·납기 확인", why: `${qty} × ${fmtAmt(c.netPrice, c.currency)} = ${amt}. 단가는 정보 레코드에서, 납기는 구매 요청에서 왔습니다.`, target: '품목' },
          { text: "'일반 정보' 탭 보여 주기", why: `지급 조건 ${c.paymentTerms}, 인코텀즈 ${jo(c.incoterms, '이')} 공급업체 마스터에서 자동으로 제안됩니다. 직접 입력하는 값이 거의 없습니다.`, target: '일반 정보' },
          { text: poMade ? '헤더의 상태 확인' : "하단 '오더' 클릭", why: workflow ? "저장하면 '승인 대기' 상태가 되고 승인 전에는 공급업체에 보내지 않습니다." : '저장 즉시 공급업체에 보낼 수 있는 상태가 됩니다.', target: poMade ? undefined : '오더', done: poMade },
        ],
        gui: [
          { text: "헤더 '조건' 탭과 품목 표 확인", why: '공급업체, 조직, 단가, 납기가 한 화면(ME21N)에 모여 있습니다.', target: '조건' },
          { text: poMade ? '이미 저장된 PO 번호 확인' : "'저장' 클릭", why: `표준 구매 오더 ${jo(po, '이')} 생성됩니다.`, target: poMade ? undefined : '저장', done: poMade },
        ],
        value: '마스터 데이터(공급업체·정보 레코드)에서 대부분의 값이 자동으로 들어와 입력 오류와 처리 시간이 줄어듭니다.',
      };

    case 'approve-po':
      return {
        situation: `PO ${po}(${amt})가 유연한 워크플로 규칙에 따라 ${ROLE_KO['Purchasing Manager']} ${ROLE_USER['Purchasing Manager'].name}에게 승인 요청으로 도착했습니다. 승인 전에는 공급업체에 보낼 수 없습니다.`,
        fiori: [
          { text: `왼쪽 목록에서 '구매 오더 ${po} 릴리스' 작업 선택`, why: '내 받은 편지함 하나에 모든 승인 업무가 모입니다. 모바일에서도 같은 화면을 씁니다.', target: `구매 오더 ${po} 릴리스` },
          { text: "'정보' 탭에서 공급업체·금액·품목 검토", why: 'PO를 따로 열지 않아도 승인 판단에 필요한 정보가 다 있습니다.', target: '정보' },
          { text: "하단 '승인' 클릭", why: '승인 의견을 남길 수 있고, 반려하면 사유가 필수로 기록됩니다.', target: '승인', done: released },
          { text: "대화 상자에서 '제출' 클릭", why: `PO ${jo(po, '이')} '승인됨'이 되고 공급업체 출력(이메일)이 가능해집니다.`, target: '제출', done: released },
        ],
        gui: [
          { text: `작업 목록에서 PO ${po} 릴리스 행 선택`, why: 'SAP Business Workplace의 받은 편지함입니다.' },
          { text: "'✔ 릴리스(승인)' 클릭", why: 'PO가 릴리스되어 입고와 출력이 가능해집니다.', target: '✔ 릴리스(승인)', done: released },
        ],
        value: '금액·구매 그룹 같은 조건으로 승인 규칙을 구성할 수 있습니다(코딩 불필요). 내부 통제와 처리 속도를 함께 확보합니다.',
      };

    case 'preview-po':
      return {
        situation: `승인된 PO ${jo(po, '이')} 공급업체 ${c.supplierName}에 어떤 모습으로 전달되는지 확인합니다.`,
        fiori: [
          { text: "상단 '출력 미리보기' 클릭", why: '공급업체가 받을 PO 양식(PDF)입니다. 회사 로고, 지급 조건, 납기가 그대로 인쇄됩니다.', target: '출력 미리보기' },
          { text: "'출력 관리' 탭 보여 주기", why: '출력 채널(이메일/인쇄)과 발송 상태를 확인합니다. 승인과 동시에 자동으로 발송됩니다.', target: '출력 관리' },
        ],
        gui: [
          { text: "'출력 미리보기' 클릭", why: 'ME23N에서 같은 PO 양식을 미리 봅니다.', target: '출력 미리보기' },
        ],
        value: 'PO 발송이 자동화되어 수작업 이메일·팩스가 사라지고, 무엇을 언제 보냈는지 기록이 남습니다.',
      };

    case 'change-po': {
      // Before saving: the supplier's proposed date; after saving: the change that was recorded.
      const dc = s.changeLog.find((e) => e.field.startsWith('납품일'));
      const from = fmtDate(dc ? dc.oldValue : c.deliveryDate, df);
      const to = fmtDate(dc ? dc.newValue : addDays(c.deliveryDate, CHANGE_DELAY_DAYS), df);
      return {
        situation: `공급업체 ${c.supplierName}에서 연락이 왔습니다: "생산 일정 때문에 납품을 ${CHANGE_DELAY_DAYS}일 늦춰도 될까요?" 구매 담당자가 PO 납기를 ${from} → ${jo(to, '로')} 변경합니다.`,
        fiori: [
          { text: `품목 표의 '납품일'이 ${jo(to, '로')} 입력된 것 보여 주기`, why: '공급업체가 요청한 날짜를 입력해 두었습니다. 다른 날짜로 바꾸거나 수량·단가를 바꿔도 됩니다.' },
          { text: "하단 '오더' 클릭해 저장", why: workflow && s.grDocs.length === 0 ? '납품일만 바뀌면 승인 상태가 유지됩니다. 수량·단가처럼 금액이 바뀌면 PO가 다시 승인 대기 상태가 됩니다(재승인).' : '변경 내용이 바로 반영됩니다.', target: '오더', done: s.changeLog.length > 0 },
          { text: "저장 후 '변경 내역' 탭 보여 주기", why: '누가, 언제, 어떤 값을 무엇으로 바꿨는지 자동으로 기록됩니다(감사 추적).', target: '변경 내역' },
        ],
        gui: [
          { text: `품목 표 '납품일'이 ${jo(to, '로')} 입력된 것 확인`, why: 'ME22N 변경 모드입니다. 공급업체가 요청한 날짜를 입력해 두었고, 다른 값으로 바꿔도 됩니다.' },
          { text: "'저장' 클릭", why: '변경 문서가 생성됩니다. 금액이 바뀌는 변경(수량·단가)이면 재승인이 필요합니다.', target: '저장', done: s.changeLog.length > 0 },
        ],
        value: '모든 변경이 변경 문서로 남아 감사 대응이 쉽고, 금액이 바뀌는 변경만 자동으로 다시 승인을 거칩니다.',
      };
    }

    case 'monitor-po':
      return {
        situation: '구매 담당자는 매일 아침 납기가 지났거나 곧 다가오는 PO 품목부터 점검합니다.',
        fiori: [
          { text: "'연체 품목' KPI 클릭", why: '납기가 지났는데 입고되지 않은 품목만 걸러 냅니다. 공급업체 독촉 대상입니다.', target: '연체 품목' },
          { text: "'이번 주 납기 품목' KPI 클릭", why: `오늘부터 7일 안에 납기가 오는 품목입니다. 데모 PO ${jo(po, '이')} 포함되는지 보여 주세요.`, target: '이번 주 납기 품목' },
          { text: "'미결 PO 품목'으로 돌아가 차트 설명", why: '공급업체별 미결 금액을 한눈에 비교합니다.', target: '미결 PO 품목' },
        ],
        gui: [
          { text: 'ME2M 리스트에서 납품일과 미결 수량 확인', why: '자재별 구매 문서 목록입니다. 예외 필터링은 직접 정렬·필터로 합니다.' },
        ],
        value: '예외 관리: 문제 있는 품목만 보고 바로 조치해 결품과 생산 중단을 막습니다.',
      };

    case 'post-gr':
      return {
        situation: `공급업체 트럭이 창고에 도착했습니다. ${ROLE_KO['Warehouse Clerk']} ${jo(ROLE_USER['Warehouse Clerk'].name, '이')} 납품서를 PO ${jo(po, '와')} 대조해 입고를 처리합니다.`,
        fiori: [
          { text: '헤더의 납품서 번호 확인', why: '공급업체 납품서 번호를 남겨 나중에 송장과 대조합니다.' },
          { text: "품목의 '입고 수량' 확인", why: `미결 수량 ${fmtQty(Math.max(0, c.quantity - grQty(s)))} ${jo(c.unit, '이')} 기본값입니다. 수량을 줄이면 부분 입고가 되고 나머지는 미결로 남습니다.` },
          { text: "'재고 유형' 설명", why: "'가용 재고'는 바로 출고할 수 있고, '품질 검사'를 고르면 검사가 끝날 때까지 쓸 수 없는 재고가 됩니다." },
          { text: "하단 '전기' 클릭", why: '재고가 즉시 늘어나고, 재고 회계 분개(차변 재고 / 대변 GR/IR)가 자동으로 생성됩니다.', target: '전기', done: s.grDocs.length > 0 },
        ],
        gui: [
          { text: "품목 표의 'OK' 체크 확인", why: 'MIGO에서는 OK에 체크한 품목만 전기됩니다.' },
          { text: "품목 상세 '위치' 탭 클릭", why: '이동 유형 101(입고), 재고 유형, 저장 위치를 확인합니다.', target: '위치' },
          { text: "상단 '전기' 클릭", why: '자재 전표와 회계 전표가 동시에 생성됩니다.', target: '전기', done: s.grDocs.length > 0 },
        ],
        value: '입고와 동시에 재고와 회계가 실시간으로 반영됩니다. 별도 인터페이스나 마감 배치가 필요 없습니다.',
      };

    case 'gr-slip':
      return {
        situation: '입고된 물품에 라벨을 붙이고 입고 전표를 출력해 보관합니다.',
        fiori: [
          { text: "'출력 관리' 탭 확인", why: '입고 전표와 라벨이 전기 시점에 자동으로 출력 대기열에 들어갔습니다.', target: '출력 관리' },
          { text: "'문서 표시' 클릭", why: '실제 출력물(PDF)을 미리 봅니다.', target: '문서 표시' },
        ],
        gui: [
          { text: "'🖨 인쇄 미리보기' 클릭", why: 'MB90에서 입고 전표 출력물을 확인합니다.', target: '🖨 인쇄 미리보기' },
        ],
        value: '전표·라벨 출력이 자동화되어 현장 처리 시간이 줄어듭니다.',
      };

    case 'gr-detail':
      return {
        situation: '재무팀이 묻습니다: "이 입고로 회계에는 무엇이 기록됐나요?"',
        fiori: [
          { text: "'프로세스 흐름' 탭 클릭", why: '구매 요청 → PO → 자재 전표 → 분개가 하나의 흐름으로 연결되어 있습니다.', target: '프로세스 흐름' },
          { text: "'회계 전표' 탭 클릭", why: `차변 재고(${c.glInventory}) / 대변 GR/IR 청산(${c.glGrir}). 송장이 오기 전까지 GR/IR 계정이 부채를 잡아 둡니다.`, target: '회계 전표' },
        ],
        gui: [
          { text: "'FI 전표' 클릭", why: 'MB03에서 자재 전표와 연결된 회계 전표를 봅니다.', target: 'FI 전표' },
        ],
        value: '물류와 회계가 하나의 시스템으로 통합되어 있어 재고 금액이 항상 실시간으로 정확합니다.',
      };

    case 'create-invoice': {
      const added = invAdded(s, shared);
      const posted = s.invoiceStatus === 'Posted';
      return {
        situation: `공급업체 ${c.supplierName}에서 송장이 도착했습니다. ${ROLE_KO['Accounts Payable Accountant']} ${jo(ROLE_USER['Accounts Payable Accountant'].name, '이')} PO·입고와 대조(3-way match)해 전기합니다.`,
        fiori: [
          { text: '헤더의 송장 일자·참조·총액 확인', why: '공급업체 송장에 적힌 금액을 입력합니다. 이 금액이 대조 기준이 됩니다.' },
          { text: `'구매 오더' 칸의 ${po} 확인 후 '추가' 클릭`, why: '입고된 수량과 PO 단가가 송장 품목으로 자동으로 채워집니다.', target: '추가', done: added || posted },
          { text: "'잔액'이 0.00이고 녹색인지 확인", why: '송장 금액 = 입고 수량 × PO 단가. 3-way match가 맞았다는 뜻입니다. 차이가 있으면 전기할 수 없습니다.' },
          { text: "'시뮬레이트' 클릭(선택)", why: '전기 전에 분개(차변 GR/IR / 대변 공급업체)를 미리 봅니다.', target: '시뮬레이트' },
          { text: "하단 '전기' 클릭", why: '매입채무가 생기고 GR/IR 계정이 상계됩니다. 지급 조건에 따라 지급 예정일이 정해집니다.', target: '전기', done: posted },
        ],
        gui: [
          { text: `PO 참조 칸에 ${po} 확인 후 '↵ 적용' 클릭`, why: 'MIRO가 입고 기준으로 송장 품목을 제안합니다.', target: '↵ 적용', done: added || posted },
          { text: '잔액 신호등이 녹색인지 확인', why: '잔액이 0이어야 전기할 수 있습니다.' },
          { text: "'전기' 클릭", why: '송장 전표와 회계 전표가 생성됩니다.', target: '전기', done: posted },
        ],
        value: '자동 3-way match로 송장 검증 시간이 줄고, 금액이 다르면 시스템이 자동으로 지급을 보류합니다.',
      };
    }

    case 'display-invoice':
      return {
        situation: '매입채무 담당자가 오늘 전기한 송장의 상태와 지급 예정일을 확인합니다.',
        fiori: [
          { text: `'데모' 표시가 있는 송장 ${s.numbers.invoiceDocNumber} 행 클릭`, why: '목록에서 상태(전기됨)와 지급 상태를 바로 볼 수 있습니다.', target: s.numbers.invoiceDocNumber },
          { text: "'프로세스 흐름' 탭 클릭", why: 'PR → PO → 입고 → 송장 전체 문서 흐름을 한 화면에서 추적합니다.', target: '프로세스 흐름' },
          { text: "'타임라인' 탭 클릭", why: '지급 조건에 따른 할인 기한과 만기일을 확인합니다.', target: '타임라인' },
        ],
        gui: [
          { text: "'후속 전표' 클릭", why: 'MIR4에서 송장과 연결된 회계 전표를 봅니다.', target: '후속 전표' },
        ],
        value: '구매부터 지급까지 모든 문서가 연결되어 있어 문의에 바로 답할 수 있습니다.',
      };

    case 'clear-grir':
      return {
        situation: `월말 결산입니다. GR/IR 청산 계정에 입고와 송장 금액이 맞지 않는 잔액이 남아 있으면 정리해야 합니다. 데모 PO ${jo(po, '은')} 차이가 0이지만, 다른 PO 4500000411에는 300 EUR 차이가 남아 있습니다.`,
        fiori: [
          { text: "'▶ 실행 (F8)' 클릭", why: '회사 코드 기준으로 GR/IR 잔액이 남은 PO 품목을 찾습니다.', target: '▶ 실행 (F8)' },
          { text: '차이가 있는 4500000411 행이 선택되어 있는지 확인', why: '입고 120개, 송장 110개로 금액이 맞지 않아 300 EUR가 남았습니다.' },
          { text: "'청산 전기 (Ctrl+F12)' 클릭", why: '남은 차이를 가격 차이 계정으로 정리해 GR/IR 계정을 0으로 만듭니다.', target: '청산 전기 (Ctrl+F12)', done: s.cleared },
        ],
        gui: [
          { text: "'▶ 실행 (F8)' 클릭", why: 'MR11 선택 화면에서 청산 대상을 조회합니다.', target: '▶ 실행 (F8)' },
          { text: "'청산 전기 (Ctrl+F12)' 클릭", why: '차이를 정리하는 계정 유지보수 전표가 생성됩니다.', target: '청산 전기 (Ctrl+F12)', done: s.cleared },
        ],
        value: '결산 시 GR/IR 잔액을 정리해 재무제표의 부채 금액을 정확하게 유지합니다.',
      };
  }
  return { situation: '', fiori: [], gui: [], value: '' };
}
