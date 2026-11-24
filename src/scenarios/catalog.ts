/**
 * SAP S/4HANA Cloud procurement scope-item map (solution-scope overview, by line of business).
 * The scenario picker groups implemented scenarios by this map and keeps this order, so a new
 * scenario only needs its scope-item code (`ScenarioDef.code`) to land in the right place.
 * Codes that are not on the map are shown under "기타".
 *
 * `ko` is a short Korean description and `kw` the keywords (Korean / English) the admin's
 * interview analysis looks for. Longer, more specific keywords weigh more.
 */
export interface CatalogItem { code: string; name: string; ko: string; kw: string[] }
export interface CatalogGroup { id: string; title: string; titleKo: string; items: CatalogItem[] }

const I = (code: string, name: string, ko: string, kw: string[]): CatalogItem => ({ code, name, ko, kw });

export const CATALOG: CatalogGroup[] = [
  { id: 'sourcing', title: 'Sourcing and Contract Mgmt.', titleKo: '소싱 및 계약 관리', items: [
    I('1XF', 'Request for Price', '견적 요청(RFQ)·견적 비교', ['견적 요청', '견적 비교', '비교 견적', '견적서', 'RFQ', '가격 요청', '입찰', 'quotation', 'request for quotation']),
    I('BMD', 'Purchase Contract', '구매 계약(수량·금액 계약)', ['구매 계약', '단가 계약', '연간 계약', '수량 계약', '금액 계약', '계약 단가', '계약 만료', '계약 갱신', '계약 관리', '릴리스 오더', 'outline agreement', 'purchase contract', '계약 템플릿', '계약 승인']),
    I('3QD', 'Accelerated Third Party Returns from Seller to Supplier', '제3자 반품 신속 처리', ['제3자 반품', '판매자 반품', 'third party return', '직송 반품']),
    I('4GH', 'Acquisition of Freight Invoices', '운임 송장 수취', ['운임', '운송비', '화물 송장', '운송 송장', 'freight invoice', '물류비']),
    I('1XV', 'SAP S/4HANA for Enterprise Contract Management', '엔터프라이즈 계약 관리', ['법무 계약', '계약서 작성', '계약 조항', '계약 문서 관리', 'enterprise contract', '법무팀']),
    I('4AZ', 'Contract Management with SAP Ariba Contracts', 'Ariba Contracts 연동 계약', ['Ariba Contracts', '아리바 계약']),
    I('4BL', 'Sourcing with Ariba Sourcing', 'Ariba Sourcing 연동 소싱', ['Ariba Sourcing', '아리바 소싱', '전자 입찰', 'e-sourcing', '역경매']),
    I('6V2', 'Integration to Icertis for Contract Assembly', 'Icertis 계약 작성 연동', ['Icertis']),
  ] },
  { id: 'operational', title: 'Operational Procurement and Invoice Mgmt.', titleKo: '운영 구매 및 송장 관리', items: [
    I('J45', 'Procurement of Direct Materials', '직접 자재 조달(요청→PO→입고→송장)', ['직접 자재', '원자재', '재고 자재', '생산 자재', '구매 오더', '발주', '입고', '송장 검증', '3-way', '3웨이', 'GR/IR', '구매 요청', 'MRP', '재고 보충', 'direct material', 'purchase order', '발주서', 'PO 승인']),
    I('4N6', 'Central Invoice Management', '중앙 송장 관리', ['중앙 송장', '송장 통합', '송장 스캔', 'OCR', 'central invoice', '전자 세금계산서']),
    I('22Z', 'Procurement of Services', '서비스 조달(서비스 입력 시트)', ['서비스 구매', '용역', '용역 구매', '유지보수 서비스', '서비스 입력 시트', 'SES', '컨설팅', '시간 단위', '작업 확인', '서비스 실적', 'service procurement', '서비스 계약']),
    I('18J', 'Requisitioning', '현업 셀프서비스 구매 요청', ['셀프서비스', '직원 구매 요청', '현업 요청', '현업 구매', '카탈로그', '장바구니', '요청자', '부서 승인', '사내 구매 요청', 'requisition', 'self-service', '수령 확인']),
    I('BNX', 'Consumable Purchasing', '소모품 구매(비용 처리)', ['소모품', '비용 처리', '코스트 센터', 'MRO', '사무용품', '계정 지정', '비재고', '간접 자재', '간접 구매', 'consumable', '비용 배분', 'limit 품목', '한도 품목']),
    I('2TX', 'Direct Procurement with Inbound Delivery', '인바운드 납품(사전 납품 통지) 기반 조달', ['인바운드 납품', '사전 납품 통지', 'ASN', 'inbound delivery', '입고 예정', '납품 통지']),
    I('BMR', 'Scheduling Agreements in Procurement', '납품 일정 계약', ['납품 일정 계약', '일정 라인', '정기 납품', '반복 납품', '주간 납품', 'JIT', 'scheduling agreement', '쿼터', '분할 납품', '납품 일정']),
    I('2NY', 'Scheduling Agreements for Consignment', '위탁 납품 일정 계약', ['위탁 납품 일정', 'consignment scheduling']),
    I('2NX', 'Scheduling Agreements for Subcontracting', '외주 납품 일정 계약', ['외주 납품 일정', 'subcontracting scheduling']),
    I('2XU', 'Procurement of Materials with Variant Configuration', '가변 구성 자재 조달', ['가변 구성', 'variant configuration', '옵션 자재', '사양 선택', '구성 자재']),
    I('1P9', 'Intercompany Stock Transfer', '회사 간 재고 이전', ['회사 간 재고 이전', '법인 간 이동', '공장 간 이동', 'intercompany', 'STO', '재고 이전 오더', '계열사 간 이동']),
    I('2TS', 'Intercompany Stock Transfer Returns', '회사 간 재고 이전 반품', ['회사 간 반품', '법인 간 반품']),
    I('2LH', 'Automated Invoice Settlement', '자동 송장 정산(ERS)', ['자동 송장 정산', '자동 정산', 'ERS', 'evaluated receipt', '무송장 정산']),
    I('BMY', 'Subcontracting', '외주 가공(임가공·사급)', ['외주 가공', '임가공', '사급', '유상사급', '무상사급', 'subcontracting', '구성품 제공', '협력사 가공', '외주처', '부품 제공']),
    I('BMK', 'Return to Supplier', '공급업체 반품', ['공급업체 반품', '반품', '불량 반품', '대변 메모', 'return to supplier', '클레임', '대체품', '교환', '품질 불량']),
    I('2LG', 'Supplier Consignment', '공급업체 위탁 재고', ['위탁 재고', 'consignment', 'VMI', '위탁 자재']),
    I('41F', 'Procurement of Pipeline Materials', '파이프라인 자재 조달', ['파이프라인', 'pipeline', '유틸리티 자재']),
    I('5HP', 'Advanced Intercompany Stock Transfer', '고급 회사 간 재고 이전', ['고급 회사 간 재고 이전', 'advanced intercompany']),
    I('3ZB', 'Billing of Costs between Affiliated Companies', '계열사 간 비용 청구', ['계열사 비용', '관계사 비용', '계열사 간 청구', 'affiliated companies']),
    I('5W6', 'Foreign Trade for Procurement', '수입 무역 관리', ['수입', '무역', '통관', '관세', 'foreign trade', '수출입', '원산지']),
    I('2R7', 'Purchasing Rebate Processing', '구매 리베이트', ['리베이트', '장려금', 'rebate', '판매 장려금']),
    I('4AI', 'SAP Ariba Buying, base edition', 'SAP Ariba Buying 기본판', ['Ariba Buying']),
    I('2R3', 'Cross-Company Purchasing Organization', '회사 간 공동 구매 조직', ['공동 구매 조직', '회사 간 구매 조직', 'cross-company', '여러 회사 코드']),
    I('2TW', 'Complementary Procurement Functions', '보완 구매 기능', ['보완 구매']),
    I('6GD', 'Engineer Products and Systems - Project with Production', '프로젝트 기반 생산 조달', ['프로젝트 생산', '엔지니어링 프로젝트', '수주 생산 프로젝트']),
    I('2UU', 'Returnable Packaging to Vendor', '회수 용기 반환', ['회수 용기', '반환 포장', '리턴 팔레트', 'returnable packaging', '공용기']),
    I('BLL', 'Serial Number Management', '일련번호 관리', ['일련번호', 'serial number', '시리얼']),
    I('1ZQ', 'Logistics with Third-Party Warehouse Management', '3PL 창고 연동', ['3PL', '외부 창고', '제3자 창고', '물류 대행']),
    I('54U', 'Produce and Sell Standard Products - Inventory Managed', '표준 제품 생산·판매(재고 관리)', ['표준 제품 생산']),
    I('54V', 'Produce and Sell Standard Products - Warehouse Managed', '표준 제품 생산·판매(창고 관리)', ['창고 관리 생산']),
    I('J82', 'SAP Ariba Commerce Automation Integration', 'Ariba Commerce Automation 연동', ['Commerce Automation']),
    I('1ZM', 'SAP Ariba Buying and Invoicing Integration', 'Ariba Buying and Invoicing 연동', ['Ariba Buying and Invoicing', '아리바 구매']),
    I('2EJ', 'Integration of SAP S/4HANA Cloud Procurement with Suppliers', '공급업체 연동(전자 PO·확인)', ['공급업체 포털', '공급사 포털', '협력사 포털', '공급업체 협업', '전자 PO', '납기 회신', '오더 확인', 'supplier collaboration', 'EDI']),
    I('2NV', 'Guided Buying Integration', 'Guided Buying 연동', ['Guided Buying', '가이드 구매']),
    I('42K', 'Automation of Source-to-Pay with Ariba Network', 'Ariba Network S2P 자동화', ['Ariba Network', '아리바 네트워크', 'source-to-pay']),
    I('22K', 'Fieldglass Integration: Service Procurement', 'Fieldglass 서비스 조달 연동', ['Fieldglass', '파견 인력', '외부 인력', '도급 인력']),
    I('19W', 'Fieldglass Integration: Invoice', 'Fieldglass 송장 연동', ['Fieldglass 송장']),
    I('4R2', 'Procurement of Services with Ariba and Fieldglass', 'Ariba·Fieldglass 서비스 조달', ['Ariba Fieldglass']),
    I('5I2', 'Subcontracting with Ariba Network', 'Ariba Network 외주 가공', ['Ariba Network 외주']),
  ] },
  { id: 'inventory', title: 'Inventory', titleKo: '재고 관리', items: [
    I('BMC', 'Core Inventory Management', '핵심 재고 관리(입출고·이전·재고 조회)', ['재고 관리', '재고 조회', '재고 현황', '입출고', '자재 이동', '재고 이전', '저장 위치 이전', 'goods movement', 'MIGO', 'MMBE']),
    I('1P7', 'Cross-Plant Transfer Posting', '플랜트 간 이전 전기', ['플랜트 간 이전', '공장 간 이전', 'cross-plant', '이전 전기']),
    I('BME', 'Stock Transfer with Delivery', '납품 기반 재고 이전', ['납품 기반 재고 이전', '재고 이전 오더', '출하 이전', 'stock transport order']),
    I('BMH', 'Stock Transfer without Delivery', '납품 없는 재고 이전', ['납품 없는 재고 이전', '단순 재고 이전']),
    I('5WI', 'Intra-Company Returns Stock Transfers', '사내 반품 재고 이전', ['사내 반품', '공장 간 반품', 'intra-company return']),
    I('5HP', 'Advanced Intercompany Stock Transfer', '고급 회사 간 재고 이전', ['고급 회사 간 재고 이전', 'advanced intercompany']),
    I('20N', 'Predictive Analytics Model Training: Stock in Transit', '이동 중 재고 예측 모델', ['이동 중 재고', '운송 중 재고', 'stock in transit', '도착 예측']),
    I('BMY', 'Subcontracting', '외주 가공(임가공·사급)', ['외주 가공', '임가공', '사급', 'subcontracting']),
    I('BML', 'Inventory Count & Adjustment', '재고 실사·조정', ['재고 실사', '실사', '재고 조사', '재고 차이', '재고 조정', 'physical inventory', '연말 실사']),
    I('4LU', 'Physical Inventory - Cycle Counting', '순환 실사', ['순환 실사', 'cycle count', '사이클 카운트', 'ABC 실사']),
    I('4O0', 'Electronic Movement Control System', '전자 이동 통제(EMCS)', ['EMCS', '주세', '물품세', 'excise', '전자 이동 통제']),
    I('7HO', 'SAP Returnable Packaging Management', '회수 용기 관리', ['회수 용기 관리', '팔레트 관리', '공용기 관리', 'returnable packaging management', 'RPM']),
  ] },
  { id: 'central', title: 'Central Procurement', titleKo: '중앙 구매', items: [
    I('1XI', 'Central Requisitioning', '중앙 구매 요청', ['중앙 구매 요청', '여러 법인 구매 요청', 'central requisitioning']),
    I('2XT', 'Central Purchasing', '중앙 구매(그룹 구매)', ['중앙 구매', '본사 구매', '그룹 구매', '통합 구매', 'central purchasing', '여러 ERP', '여러 시스템']),
    I('3ZF', 'Central Sourcing', '중앙 소싱', ['중앙 소싱', '그룹 소싱', 'central sourcing']),
    I('2ME', 'Central Purchase Contracts', '중앙 구매 계약', ['중앙 계약', '그룹 계약', '본사 계약', '그룹 공통 단가', 'central contract']),
    I('4QN', 'Central Procurement with Ariba Sourcing', '중앙 구매 + Ariba Sourcing', ['중앙 소싱 Ariba']),
    I('3EN', 'Guided Buying Integration for Central Procurement', '중앙 구매 Guided Buying', ['중앙 Guided Buying']),
    I('5JT', 'Automation of Central Procurement Quotes with Ariba Network', '중앙 견적 자동화(Ariba Network)', ['중앙 견적']),
    I('4B0', 'Contract for Central Procurement with SAP Ariba Contracts', '중앙 계약 + Ariba Contracts', ['중앙 Ariba 계약']),
    I('6BJ', 'Central Procurement with SAP Business Network for Procurement', '중앙 구매 + Business Network', ['Business Network']),
  ] },
  { id: 'analytics', title: 'Procurement Analytics', titleKo: '구매 분석', items: [
    I('1JI', 'Real-Time Reporting, Monitoring, and Spend Visibility', '실시간 구매 리포트·지출 가시성', ['지출 분석', '구매 분석', '구매 실적', '대시보드', '실시간 리포트', '리포팅', 'spend', 'KPI', '가시성', '구매 현황', '모니터링']),
    I('1QR', 'Predictive Analytics for Contract Consumption in Procurement', '계약 소진 예측', ['계약 소진', '소진율', '예측 분석', 'predictive', '계약 사용률']),
  ] },
  { id: 'supplier', title: 'Supplier Mgmt.', titleKo: '공급업체 관리', items: [
    I('SL4', 'Supplier Evaluation and Performance Monitoring', '공급업체 평가·성과 모니터링', ['공급업체 평가', '협력사 평가', '공급사 평가', '성과 평가', '스코어카드', 'scorecard', '납기 준수율', '품질 점수']),
    I('19E', 'Supplier Classification and Segmentation', '공급업체 분류·세분화', ['공급업체 분류', '협력사 분류', '세분화', 'segmentation', '전략 공급업체']),
    I('3FY', 'Supplier Delivery Prediction', '공급업체 납기 예측', ['납기 예측', '납기 지연', '지연 예측', 'delivery prediction', '납기 리스크']),
  ] },
];

export const OTHER_GROUP: Omit<CatalogGroup, 'items'> = { id: 'other', title: 'Other Scope Items', titleKo: '기타 (맵에 없는 Scope Item)' };

/** Every scope item once (some, e.g. BMY, appear in two categories on the map – the first one wins). */
export const ALL_ITEMS: (CatalogItem & { group: CatalogGroup })[] = CATALOG.flatMap((g) => g.items.map((i) => ({ ...i, group: g })))
  .filter((x, i, arr) => arr.findIndex((y) => y.code === x.code) === i);
export const itemByCode = (code: string) => ALL_ITEMS.find((i) => i.code === code);

/** Groups the given scenarios by the catalog (catalog order), dropping empty groups. */
export function groupByCatalog<T extends { code: string }>(list: T[]): { group: Omit<CatalogGroup, 'items'>; items: T[] }[] {
  const pos = (g: CatalogGroup, code: string) => g.items.findIndex((i) => i.code === code);
  const out = CATALOG.map((g) => ({
    group: g as Omit<CatalogGroup, 'items'>,
    items: list.filter((d) => pos(g, d.code) >= 0).sort((a, b) => pos(g, a.code) - pos(g, b.code)),
  }));
  const mapped = new Set(ALL_ITEMS.map((i) => i.code));
  out.push({ group: OTHER_GROUP, items: list.filter((d) => !mapped.has(d.code)) });
  return out.filter((x) => x.items.length > 0);
}

export const CATALOG_SIZE = ALL_ITEMS.length;
