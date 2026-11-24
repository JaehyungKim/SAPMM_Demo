/**
 * Background documents that make list screens look like a real system.
 * The demo PO itself always comes from the store; these rows are context only.
 */
import { addDays, todayIso } from './format';
import type { DemoConfig } from './store';

export interface OtherPoItem {
  po: string; item: string; supplier: string; supplierName: string; material: string; materialText: string;
  qty: number; unit: string; price: number; deliveryDate: string; status: string; delivered: number;
}

export const otherPoItems = (c: DemoConfig): OtherPoItem[] => {
  const t = todayIso();
  return [
    { po: '4500000411', item: '10', supplier: '10300001', supplierName: 'Domestic 10 Supplier 1', material: 'TG0012', materialText: 'Trading Good 0012,PD,Regular Proc.', qty: 200, unit: 'PC', price: 30, deliveryDate: addDays(t, -6), status: '발송됨', delivered: 120 },
    { po: '4500000418', item: '10', supplier: '10300002', supplierName: 'Domestic 10 Supplier 2', material: 'TG0011', materialText: c.materialDescription, qty: 50, unit: 'PC', price: 35, deliveryDate: addDays(t, -2), status: '발송됨', delivered: 0 },
    { po: '4500000421', item: '20', supplier: '10300001', supplierName: 'Domestic 10 Supplier 1', material: 'TG0013', materialText: 'Trading Good 0013,PD,Regular Proc.', qty: 80, unit: 'PC', price: 18.5, deliveryDate: addDays(t, 3), status: '발송됨', delivered: 0 },
    { po: '4500000427', item: '10', supplier: '10300003', supplierName: 'Domestic DE Supplier 3', material: 'TG0021', materialText: 'Trading Good 0021,Reorder Point', qty: 40, unit: 'PC', price: 42, deliveryDate: addDays(t, 6), status: '발송됨', delivered: 0 },
    { po: '4500000430', item: '10', supplier: '10300002', supplierName: 'Domestic 10 Supplier 2', material: 'TG0012', materialText: 'Trading Good 0012,PD,Regular Proc.', qty: 150, unit: 'PC', price: 29, deliveryDate: addDays(t, 21), status: '발송됨', delivered: 0 },
  ];
};

export const otherPrs = (c: DemoConfig) => [
  { pr: '10000371', item: '10', material: 'TG0012', text: 'Trading Good 0012,PD,Regular Proc.', qty: 60, unit: 'PC', date: addDays(todayIso(), 10), plant: c.plant, group: '002', source: '' },
  { pr: '10000374', item: '10', material: 'TG0021', text: 'Trading Good 0021,Reorder Point', qty: 25, unit: 'PC', date: addDays(todayIso(), 18), plant: c.plant, group: '001', source: '10300003' },
];
