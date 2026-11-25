/**
 * Fiori busy state after a commit action (save / order / post …), like sap.m.BusyDialog:
 * a modal with the standard UI5 busy indicator shows briefly, then the action runs.
 */
import { create } from 'zustand';
import { BusyIndicator, Dialog } from '@ui5/webcomponents-react';

const useBusy = create<{ on: boolean }>(() => ({ on: false }));
export const BUSY_MS = 500;

/** Shows the busy dialog for BUSY_MS, then runs `fn` (ignored while already busy). */
export function withBusy(fn?: () => void) {
  if (useBusy.getState().on) return;
  useBusy.setState({ on: true });
  setTimeout(() => { useBusy.setState({ on: false }); fn?.(); }, BUSY_MS);
}

/** Button labels that commit a document and therefore show the busy dialog. */
const COMMIT = /저장|오더|전기|생성|제출|게시|주문|승인|반려|릴리스|낙찰|정산|청산|확정|발송|등록|재배분|재배정|역분개|폐기/;
export const isCommit = (label: unknown) => typeof label === 'string' && COMMIT.test(label) && !/초안|미리보기|취소/.test(label);

/** Mounted once by the demo layout. */
export function BusyDialog() {
  const on = useBusy((s) => s.on);
  if (!on) return null;
  return (
    <Dialog open className="f-busy-dialog" accessibleName="처리 중">
      <BusyIndicator active size="L" delay={0} />
    </Dialog>
  );
}
