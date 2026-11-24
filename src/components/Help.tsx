/**
 * "?" field-help bubble (demo feature 9.2). Shows meaning, process relevance and the SAP
 * technical field name. Hidden globally when the presenter switches help off.
 */
import { useDemo } from '../store';

export interface HelpEntry { en: string; tech: string; desc: string }

export const HELP: Record<string, HelpEntry> = {
  returnsItem: { en: 'Returns Item', tech: 'EKPO-RETPO', desc: '반품 품목 표시. 입고 대신 공급업체로 출고(이동 유형 161/122)되고 송장은 대변 메모가 됩니다.' },
  shippingPoint: { en: 'Shipping Point', tech: 'LIKP-VSTEL', desc: '아웃바운드 납품을 처리하는 출하 지점. 반품·외주 출고 납품이 여기서 생성됩니다.' },
  pickedQty: { en: 'Picked Quantity', tech: 'LIPS-PIKMG', desc: '피킹 완료 수량. 납품 수량과 같아야 출고(PGI)를 전기할 수 있습니다.' },
  creditMemo: { en: 'Credit Memo', tech: 'RBKP-XRECH', desc: '대변 메모. 공급업체에 대한 채무를 줄이며 반품 PO를 참조하면 수량·금액이 자동 제안됩니다.' },
  itemCatL: { en: 'Item Category L', tech: 'EKPO-PSTYP', desc: 'L = 외주가공(Subcontracting). 공급업체에 구성품을 제공하고 가공비만 발주합니다.' },
  subconStock: { en: 'Stock Provided to Vendor', tech: 'MSLB', desc: '외주처에 제공된 재고(이동 유형 541). 자산은 회사 소유로 남고 입고 시 543으로 소비됩니다.' },
  limitItem: { en: 'Limit Item', tech: 'EKPO-PSTYP B', desc: '정확한 수량을 모르는 서비스·소모품을 금액 한도(예상 금액/전체 한도)로 발주합니다.' },
  expectedValue: { en: 'Expected Value', tech: 'EKPO-COMMITMENT', desc: '한도 품목의 예상 금액. 약정(commitment)과 승인 조건 계산에 사용됩니다.' },
  overallLimit: { en: 'Overall Limit', tech: 'EKPO-SUMLIMIT', desc: '한도 품목의 최대 금액. 이를 넘는 SES·송장은 경고 또는 오류가 됩니다.' },
  ses: { en: 'Service Entry Sheet', tech: 'MMPUR_SES', desc: '서비스 수행 확인서. 승인되면 서비스 입고(비용 전기)가 이뤄지고 송장의 기준이 됩니다.' },
  invoicingPlan: { en: 'Invoicing Plan', tech: 'FPLA', desc: '정기 청구 일정(예: 월 임대료). 일정일에 MRIS로 송장을 자동 정산합니다.' },
  invReduction: { en: 'Invoice Reduction', tech: 'RBKP-IVTYP', desc: '청구 금액이 PO·입고보다 많을 때 차액만큼 줄여 전기하고 공급업체용 대변 메모를 자동 생성합니다.' },
  catalog: { en: 'Catalog Item', tech: 'MMPUR_CATALOG', desc: '현업 직원이 검색해 바로 담을 수 있는 카탈로그 품목(가격·공급업체 포함).' },
  reservation: { en: 'Reservation', tech: 'RESB', desc: '창고 재고에서 출고하도록 예약. 재고가 있으면 구매 대신 자동 예약이 생성됩니다(이동 유형 201).' },
  schedAgreement: { en: 'Scheduling Agreement', tech: 'EKKO-BSTYP L', desc: '장기 공급 계약에 납품 일정(일자·수량)을 붙여 여러 PO 대신 하나의 문서로 운영합니다.' },
  scheduleLine: { en: 'Schedule Line', tech: 'EKET', desc: '납품 일정 라인. 일자·수량 단위로 공급업체에 납품을 요구합니다.' },
  quota: { en: 'Quota Arrangement', tech: 'EQUP', desc: '같은 자재를 여러 공급업체에 비율(예: 40/60)로 나눠 MRP가 자동 배분합니다.' },
  releaseType: { en: 'Release Type', tech: 'EKEH-ABART', desc: 'FRC = 예측(중장기) 일정, JIT = 확정 단기 일정. 릴리스 문서로 공급업체에 전송됩니다.' },
  template: { en: 'Contract Template', tech: 'EKKO (Template)', desc: '반복 사용하는 계약 조건을 템플릿으로 저장해 새 계약을 참조 생성합니다.' },
  reversal: { en: 'Reversal Movement 102', tech: 'MSEG-BWART', desc: '입고 취소 이동 유형 102. 일부 수량만 역분개하면 PO의 입고 수량과 GR/IR이 함께 줄어듭니다.' },
  supplier: { en: 'Supplier', tech: 'EKKO-LIFNR', desc: '물품을 공급하는 비즈니스 파트너. 가격·지급조건·인도조건이 공급업체/구매정보레코드에서 기본값으로 제안됩니다.' },
  purchOrg: { en: 'Purchasing Organization', tech: 'EKKO-EKORG', desc: '공급업체와 조건을 협상하고 구매 책임을 지는 조직 단위입니다.' },
  purchGroup: { en: 'Purchasing Group', tech: 'EKKO-EKGRP', desc: '구매 담당자(그룹). 유연한 워크플로 시작 조건(예: 그룹 003 & 500 EUR 초과)에 사용됩니다.' },
  companyCode: { en: 'Company Code', tech: 'EKKO-BUKRS', desc: '재무 회계의 법인 단위. 입고·송장 전기 시 회계 전표가 이 회사 코드로 생성됩니다.' },
  docType: { en: 'Purchasing Doc. Type', tech: 'EKKO-BSART', desc: 'NB = 표준 구매 오더. 번호 범위와 유연한 워크플로 활성화 여부를 제어합니다.' },
  material: { en: 'Material', tech: 'EKPO-MATNR', desc: '조달 대상 재고 자재(상품, HAWA). 재고 관리 대상이므로 입고 시 재고가 증가합니다.' },
  plant: { en: 'Plant', tech: 'EKPO-WERKS', desc: '자재를 입고·보관하는 사업장. 자재 평가와 MRP가 플랜트 단위로 수행됩니다.' },
  sloc: { en: 'Storage Location', tech: 'EKPO-LGORT', desc: '플랜트 내 재고 보관 장소. 입고 시 재고가 이 위치에 기록됩니다.' },
  quantity: { en: 'Order Quantity', tech: 'EKPO-MENGE', desc: '발주 수량. 입고 및 송장 검증(3-way match)의 기준이 됩니다.' },
  netPrice: { en: 'Net Order Price', tech: 'EKPO-NETPR', desc: '구매정보레코드(PB00/PPR0 조건)에서 제안된 순단가. 재고 평가 및 송장 검증에 사용됩니다.' },
  netValue: { en: 'Net Order Value', tech: 'EKPO-NETWR', desc: '수량 × 순단가. 승인 워크플로의 금액 조건에 사용됩니다.' },
  deliveryDate: { en: 'Delivery Date', tech: 'EKET-EINDT', desc: '납품 일정 라인의 납기일. 연체 모니터링과 독촉(Dunning)의 기준입니다.' },
  paymentTerms: { en: 'Payment Terms', tech: 'EKKO-ZTERM', desc: '지급 조건(예: 0003 = 14일 3%, 30일 2%, 45일 순액). 현금 할인 기한을 결정합니다.' },
  incoterms: { en: 'Incoterms', tech: 'EKKO-INCO1', desc: '인도 조건(EXW = 공장인도). 운송 비용·위험 이전 시점을 정의합니다.' },
  taxCode: { en: 'Tax Code', tech: 'EKPO-MWSKZ', desc: 'V0 = 매입세 0%. 송장 검증 시 세액 계산에 사용됩니다.' },
  grBasedIv: { en: 'GR-Based Invoice Verification', tech: 'EKPO-WEBRE', desc: '입고 수량을 기준으로 송장 검증. 입고 전에는 송장을 매칭할 수 없습니다.' },
  movementType: { en: 'Movement Type', tech: 'MSEG-BWART', desc: '101 = 구매 오더 입고. 재고 증가 + GR/IR 청산 계정 대변 전기가 발생합니다.' },
  deliveryNote: { en: 'Delivery Note', tech: 'MKPF-XBLNR', desc: '공급업체 납품서 번호. 자재 전표 헤더의 참조로 저장됩니다.' },
  stockType: { en: 'Stock Type', tech: 'MSEG-INSMK', desc: '가용 재고 / 품질 검사 / 보류 재고 등 입고 재고의 유형.' },
  reference: { en: 'Reference', tech: 'RBKP-XBLNR', desc: '공급업체가 발행한 송장 번호. 중복 송장 검사에 사용됩니다.' },
  grossAmount: { en: 'Gross Invoice Amount', tech: 'RBKP-RMWWR', desc: '세금 포함 송장 총액. 품목 금액 + 세액과의 차이(잔액)가 0이어야 전기할 수 있습니다.' },
  balance: { en: 'Balance', tech: '-', desc: '총 송장 금액 − (품목 합계 + 세액). 0이거나 허용 오차 이내이면 녹색 신호등이 표시됩니다.' },
  grir: { en: 'GR/IR Clearing Account', tech: 'WRX', desc: '입고(GR)와 송장(IR) 사이의 임시 계정. 금액 차이가 남으면 MR11로 청산합니다.' },
  prNumber: { en: 'Purchase Requisition', tech: 'EBAN-BANFN', desc: 'MRP 또는 요청자가 생성한 내부 구매 요청. 소스 지정 후 구매 오더로 전환됩니다.' },
  source: { en: 'Source of Supply', tech: 'EBAN-FLIEF / INFNR', desc: '구매정보레코드·소스 리스트·계약에서 결정된 공급원.' },
  // Purchase contracts (BMD)
  contractType: { en: 'Contract Type', tech: 'EKKO-BSART', desc: 'MK = 수량 계약, WK = 금액 계약. 수량 계약은 품목별 목표 수량까지 릴리스 오더(콜오프)를 발행합니다.' },
  targetQty: { en: 'Target Quantity', tech: 'EKPO-KTMNG', desc: '계약 기간 동안 구매하기로 약정한 총 수량. 릴리스 오더가 생성될 때마다 소진량이 자동 갱신됩니다.' },
  targetValue: { en: 'Target Value', tech: 'EKKO-KTWRT', desc: '계약 목표 금액. 유연한 워크플로 시작 조건(예: 2,000 EUR 초과 시 승인)과 버전 관리 대상 필드로 사용됩니다.' },
  validity: { en: 'Validity Period', tech: 'EKKO-KDATB / KDATE', desc: '계약 유효 기간. 이 기간 안에서만 계약이 소스로 결정되고 릴리스 오더를 만들 수 있습니다.' },
  outlineReq: { en: 'Outline Agreement Requisition', tech: 'EBAN-BSART = RV', desc: '구매 오더가 아니라 장기 계약(아웃라인 계약)을 만들기 위한 구매 요청 유형입니다.' },
  trackingNo: { en: 'Requirement Tracking Number', tech: 'EBAN-BEDNR / EKPO-BEDNR', desc: '요청부터 계약·PO까지 같은 값을 넘겨받아 관련 구매 문서를 한 번에 찾게 해 주는 추적 번호입니다.' },
  sourceList: { en: 'Source List', tech: 'EORD', desc: '자재·플랜트별 허용/고정 공급원 목록. 고정(fixed) 공급원은 MRP와 자동 소스 결정에서 우선 사용됩니다.' },
  releaseOrder: { en: 'Release Order (Call-off)', tech: 'EKPO-KONNR / KTPNR', desc: '계약을 참조해 만든 구매 오더. 계약 가격이 적용되고 계약의 릴리스 수량이 갱신됩니다.' },
  versionReason: { en: 'Reason for New Version', tech: 'Version mgmt (reason code)', desc: '버전 관련 필드를 변경할 때 남기는 사유. 버전 이력에서 이전 버전과 비교할 수 있습니다.' },
  // Consumable purchasing (BNX)
  acctAssign: { en: 'Account Assignment Category', tech: 'EKPO-KNTTP', desc: 'K = 코스트 센터. 재고가 아니라 비용으로 바로 처리되는 소모품 구매를 뜻합니다.' },
  costCenter: { en: 'Cost Center', tech: 'EKKN-KOSTL', desc: '비용이 귀속되는 조직 단위. 입고·송장 시 비용이 이 코스트 센터로 전기됩니다.' },
  glAccount: { en: 'G/L Account', tech: 'EKKN-SAKTO', desc: '비용 계정. 자재 번호가 있으면 평가 클래스에서, 없으면 자재 그룹에서 자동 결정됩니다.' },
  distribution: { en: 'Distribution (%)', tech: 'EKKN-VPROZ', desc: '다중 계정 지정 시 각 코스트 센터에 배분되는 비율. 합계는 100%여야 합니다.' },
  matGroup: { en: 'Material Group', tech: 'EKPO-MATKL', desc: '자재 번호가 없는 텍스트 품목은 자재 그룹으로 G/L 계정과 구매 담당을 결정합니다.' },
  paymentBlock: { en: 'Payment Block', tech: 'RBKP-ZLSPR / RSEG-SPGRx', desc: '송장 품목을 수동으로 보류하면 지급이 막히고, 책임자가 릴리스해야 지급 대상이 됩니다.' },
  pipeline: { en: 'Pipeline Material', tech: 'EINA-PIPELINE / MSEG-BWART 201P', desc: '파이프라인(가스·용수·전기 등)에서 언제든 꺼내 쓰는 자재. 재고 없이 출고(201P) 시점에 공급업체 채무가 생기고 정기 정산합니다.' },
  infoRecord: { en: 'Purchasing Info Record', tech: 'EINA / EINE', desc: '공급업체·자재별 구매 조건(가격·납기·세금 코드). 파이프라인 정보 레코드는 정산 가격의 기준입니다.' },
  pipelineSettle: { en: 'Pipeline Settlement', tech: 'MRKO', desc: '기간 동안의 파이프라인 출고를 모아 송장 문서와 회계 전표를 자동 생성합니다 (공급업체 송장 없이 정산).' },
  rfq: { en: 'Request for Quotation', tech: 'EKKO-BSTYP = R', desc: '여러 공급업체에 같은 품목의 가격을 요청하는 문서. 게시하면 견적을 받을 수 있습니다.' },
  quotation: { en: 'Supplier Quotation', tech: 'EKKO-BSTYP = Q', desc: '공급업체가 회신한 가격·조건. RFQ별로 비교해 낙찰합니다.' },
  award: { en: 'Award', tech: 'Quotation Status = Awarded', desc: '가장 좋은 견적을 선정하는 것. 낙찰된 견적에서 구매 계약·PO 같은 후속 문서를 만듭니다.' },
  weighting: { en: 'Weighting and Scoring', tech: 'F2551', desc: '수량·가격·시간·품질·설문 등 평가 기준별 가중치(합계 100%)와 편차별 점수 규칙.' },
  questionnaire: { en: 'Evaluation Questionnaire', tech: 'F2194', desc: '공급업체 평가용 설문지. 섹션·질문·가중치·최소 점수를 정의하고 릴리스해서 사용합니다.' },
  scorecard: { en: 'Scorecard', tech: 'F2191', desc: '설문 응답을 점수화한 공급업체 평가 결과. 운영 점수와 합쳐 종합 점수가 됩니다.' },
  kpiCard: { en: 'Overview Page Card', tech: 'F1990', desc: '구매 개요 페이지의 카드. 카드 머리글이나 항목을 누르면 해당 앱·KPI 드릴다운으로 이동합니다.' },
};

export function Help({ k }: { k: string }) {
  const show = useDemo((s) => s.showHelp);
  const h = HELP[k];
  if (!show || !h) return null;
  return (
    <span className="help-tip" tabIndex={0} aria-label={`${h.en} 도움말`}>
      ?
      <span className="help-pop" role="tooltip">
        <b>{h.en}</b>
        <code>{h.tech}</code>
        <span>{h.desc}</span>
      </span>
    </span>
  );
}
