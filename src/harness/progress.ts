/** Step progress rules shared by the process bar, sidebar, guide and prerequisite guard. */
import { DemoState, useDemo } from '../store';
import { STEPS, Requirement } from '../steps';

/** Whether a step counts as done for the stepper. */
export function stepDone(id: string, s: DemoState) {
  switch (id) {
    case 'launchpad': return s.visited.includes('launchpad');
    case 'process-pr': return s.prStatus === 'Closed';
    case 'create-po': return s.poStatus !== 'None';
    case 'approve-po': return ['Approved', 'Goods Received', 'Invoiced'].includes(s.poStatus);
    case 'change-po': return s.changeLog.length > 0;
    case 'post-gr': return s.grDocs.length > 0;
    case 'create-invoice': return s.invoiceStatus === 'Posted';
    case 'clear-grir': return s.cleared;
    default: return s.visited.includes(id);
  }
}

/** Steps in the current demo flow (mandatory + switched-on optional steps). */
export function useEnabledSteps() {
  const opt = useDemo((s) => s.optionalEnabled);
  return STEPS.filter((st) => !st.optional || opt[st.id]);
}

/** Guard text for a missing prerequisite and the step that produces it. */
export const REQ_TEXT: Record<Requirement, { text: string; goto: string }> = {
  none: { text: '', goto: 'launchpad' },
  'pr-assigned': { text: '구매 요청에 소스가 지정되어야 합니다.', goto: 'process-pr' },
  po: { text: '구매 오더가 아직 생성되지 않았습니다.', goto: 'create-po' },
  'po-released': { text: '구매 오더가 생성되고 승인(릴리스)되어야 합니다.', goto: 'approve-po' },
  gr: { text: '입고가 아직 전기되지 않았습니다.', goto: 'post-gr' },
  invoice: { text: '공급업체 송장이 아직 전기되지 않았습니다.', goto: 'create-invoice' },
};
