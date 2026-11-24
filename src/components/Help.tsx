/**
 * "?" field-help bubble (demo feature 9.2). Shows meaning, process relevance and the SAP
 * technical field name. Hidden globally when the presenter switches help off.
 */
import { useDemo } from '../store';

export interface HelpEntry { en: string; tech: string; desc: string }

export const HELP: Record<string, HelpEntry> = {
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
