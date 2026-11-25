/**
 * 1JI – documents created in the other scenarios of this demo. The analytics apps show them
 * next to the sample data, so "posted in one app → visible in analytics at once" is real.
 */
import { useDemo, netValue, grQty } from '../../store';
import { useBmd } from '../bmd/store';
import { use1xf } from '../1xf/store';
import { useBmr } from '../bmr/store';
import { use41f } from '../41f/store';

export interface Live {
  /** J45 purchase order. */
  po: { no: string; supplier: string; date: string; value: number; status: string; changed: boolean } | null;
  /** BMD quantity contract. */
  contract: { no: string; released: boolean } | null;
  /** 1XF request for quotation. */
  rfq: { no: string; quotes: number; awarded: boolean } | null;
  /** BMR scheduling agreement. */
  sa: { no: string; released: boolean } | null;
  /** 41F pipeline settlement posted. */
  pipeline: boolean;
}

export function useLive(): Live {
  const j = useDemo();
  const bmd = useBmd();
  const x = use1xf();
  const r = useBmr();
  const p = use41f();
  const got = grQty(j);
  return {
    po: j.poStatus === 'None' ? null : {
      no: j.numbers.poNumber, supplier: j.config.supplierNumber, date: j.config.deliveryDate, value: netValue(j.config),
      status: got >= j.config.quantity ? '입고 완료' : got > 0 ? '부분 입고' : j.poStatus === 'Pending Approval' ? '승인 대기' : '정상',
      changed: j.changeLog.length > 0,
    },
    contract: bmd.contract ? { no: bmd.numbers.contract, released: bmd.contract.status === 'Released' } : null,
    rfq: x.done.rfq ? { no: x.numbers.rfq, quotes: x.done.quotes ? 2 : 0, awarded: !!x.done.award } : null,
    sa: r.done.create ? { no: r.numbers.sa, released: !!r.done.release } : null,
    pipeline: !!p.done.settle,
  };
}

/** Marker appended to rows that come from the demo's own documents. */
export const MARK = ' ★';
