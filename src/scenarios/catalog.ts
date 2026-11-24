/**
 * SAP S/4HANA Cloud procurement scope-item map (solution-scope overview, by line of business).
 * The scenario picker groups implemented scenarios by this map and keeps this order, so a new
 * scenario only needs its scope-item code (`ScenarioDef.code`) to land in the right place.
 * Codes that are not on the map are shown under "기타".
 */
export interface CatalogItem { code: string; name: string }
export interface CatalogGroup { id: string; title: string; titleKo: string; items: CatalogItem[] }

const I = (code: string, name: string): CatalogItem => ({ code, name });

export const CATALOG: CatalogGroup[] = [
  { id: 'sourcing', title: 'Sourcing and Contract Mgmt.', titleKo: '소싱 및 계약 관리', items: [
    I('1XF', 'Request for Price'),
    I('BMD', 'Purchase Contract'),
    I('3QD', 'Accelerated Third Party Returns from Seller to Supplier'),
    I('4GH', 'Acquisition of Freight Invoices'),
    I('1XV', 'SAP S/4HANA for Enterprise Contract Management'),
    I('4AZ', 'Contract Management with SAP Ariba Contracts'),
    I('4BL', 'Sourcing with Ariba Sourcing'),
    I('6V2', 'Integration to Icertis for Contract Assembly'),
  ] },
  { id: 'operational', title: 'Operational Procurement and Invoice Mgmt.', titleKo: '운영 구매 및 송장 관리', items: [
    I('J45', 'Procurement of Direct Materials'),
    I('4N6', 'Central Invoice Management'),
    I('22Z', 'Procurement of Services'),
    I('18J', 'Requisitioning'),
    I('BNX', 'Consumable Purchasing'),
    I('2TX', 'Direct Procurement with Inbound Delivery'),
    I('BMR', 'Scheduling Agreements in Procurement'),
    I('2NY', 'Scheduling Agreements for Consignment'),
    I('2NX', 'Scheduling Agreements for Subcontracting'),
    I('2XU', 'Procurement of Materials with Variant Configuration'),
    I('1P9', 'Intercompany Stock Transfer'),
    I('2TS', 'Intercompany Stock Transfer Returns'),
    I('2LH', 'Automated Invoice Settlement'),
    I('BMY', 'Subcontracting'),
    I('BMK', 'Return to Supplier'), // not on the source overview; placed in Operational Procurement by request
    I('2LG', 'Supplier Consignment'),
    I('41F', 'Procurement of Pipeline Materials'),
    I('5HP', 'Advanced Intercompany Stock Transfer'),
    I('3ZB', 'Billing of Costs between Affiliated Companies'),
    I('5W6', 'Foreign Trade for Procurement'),
    I('2R7', 'Purchasing Rebate Processing'),
    I('4AI', 'SAP Ariba Buying, base edition'),
    I('2R3', 'Cross-Company Purchasing Organization'),
    I('2TW', 'Complementary Procurement Functions'),
    I('6GD', 'Engineer Products and Systems - Project with Production'),
    I('2UU', 'Returnable Packaging to Vendor'),
    I('BLL', 'Serial Number Management'),
    I('1ZQ', 'Logistics with Third-Party Warehouse Management'),
    I('54U', 'Produce and Sell Standard Products - Inventory Managed'),
    I('54V', 'Produce and Sell Standard Products - Warehouse Managed'),
    I('J82', 'SAP Ariba Commerce Automation Integration'),
    I('1ZM', 'SAP Ariba Buying and Invoicing Integration'),
    I('2EJ', 'Integration of SAP S/4HANA Cloud Procurement with Suppliers'),
    I('2NV', 'Guided Buying Integration'),
    I('42K', 'Automation of Source-to-Pay with Ariba Network'),
    I('22K', 'Fieldglass Integration: Service Procurement'),
    I('19W', 'Fieldglass Integration: Invoice'),
    I('4R2', 'Procurement of Services with Ariba and Fieldglass'),
    I('5I2', 'Subcontracting with Ariba Network'),
  ] },
  { id: 'central', title: 'Central Procurement', titleKo: '중앙 구매', items: [
    I('1XI', 'Central Requisitioning'),
    I('2XT', 'Central Purchasing'),
    I('3ZF', 'Central Sourcing'),
    I('2ME', 'Central Purchase Contracts'),
    I('4QN', 'Central Procurement with Ariba Sourcing'),
    I('3EN', 'Guided Buying Integration for Central Procurement'),
    I('5JT', 'Automation of Central Procurement Quotes with Ariba Network'),
    I('4B0', 'Contract for Central Procurement with SAP Ariba Contracts'),
    I('6BJ', 'Central Procurement with SAP Business Network for Procurement'),
  ] },
  { id: 'analytics', title: 'Procurement Analytics', titleKo: '구매 분석', items: [
    I('1JI', 'Real-Time Reporting, Monitoring, and Spend Visibility'),
    I('1QR', 'Predictive Analytics for Contract Consumption in Procurement'),
  ] },
  { id: 'supplier', title: 'Supplier Mgmt.', titleKo: '공급업체 관리', items: [
    I('SL4', 'Supplier Evaluation and Performance Monitoring'),
    I('19E', 'Supplier Classification and Segmentation'),
    I('3FY', 'Supplier Delivery Prediction'),
  ] },
];

export const OTHER_GROUP: Omit<CatalogGroup, 'items'> = { id: 'other', title: 'Other Scope Items', titleKo: '기타 (맵에 없는 Scope Item)' };

/** Groups the given scenarios by the catalog (catalog order), dropping empty groups. */
export function groupByCatalog<T extends { code: string }>(list: T[]): { group: Omit<CatalogGroup, 'items'>; items: T[] }[] {
  const pos = (g: CatalogGroup, code: string) => g.items.findIndex((i) => i.code === code);
  const out = CATALOG.map((g) => ({
    group: g,
    items: list.filter((d) => pos(g, d.code) >= 0).sort((a, b) => pos(g, a.code) - pos(g, b.code)),
  }));
  const mapped = new Set(CATALOG.flatMap((g) => g.items.map((i) => i.code)));
  out.push({ group: { ...OTHER_GROUP, items: [] } as CatalogGroup, items: list.filter((d) => !mapped.has(d.code)) });
  return out.filter((x) => x.items.length > 0);
}

export const CATALOG_SIZE = CATALOG.reduce((a, g) => a + g.items.length, 0);
