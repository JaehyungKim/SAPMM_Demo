/** Maps each step id (see ../steps.ts) to its Fiori and SAP GUI renderings. */
import type { ComponentType } from 'react';
import type { StepProps } from './types';
import { LaunchpadFiori, LaunchpadGui } from './Launchpad';
import { ProcessPRFiori, ProcessPRGui } from './ProcessPR';
import { ChangePOFiori, ChangePOGui, CreatePOFiori, CreatePOGui, PreviewPOFiori, PreviewPOGui } from './PurchaseOrder';
import { ApprovePOFiori, ApprovePOGui } from './ApprovePO';
import { MonitorPOFiori, MonitorPOGui } from './MonitorPO';
import { PostGRFiori, PostGRGui } from './PostGR';
import { GrDetailFiori, GrDetailGui, GrSlipFiori, GrSlipGui } from './MaterialDocs';
import { CreateInvoiceFiori, CreateInvoiceGui } from './CreateInvoice';
import { ClearGRIRFiori, ClearGRIRGui, DisplayInvoiceFiori, DisplayInvoiceGui } from './InvoiceAndClearing';

export const SCREENS: Record<string, { fiori: ComponentType<StepProps>; gui: ComponentType<StepProps> }> = {
  launchpad: { fiori: LaunchpadFiori, gui: LaunchpadGui },
  'process-pr': { fiori: ProcessPRFiori, gui: ProcessPRGui },
  'create-po': { fiori: CreatePOFiori, gui: CreatePOGui },
  'approve-po': { fiori: ApprovePOFiori, gui: ApprovePOGui },
  'preview-po': { fiori: PreviewPOFiori, gui: PreviewPOGui },
  'change-po': { fiori: ChangePOFiori, gui: ChangePOGui },
  'monitor-po': { fiori: MonitorPOFiori, gui: MonitorPOGui },
  'post-gr': { fiori: PostGRFiori, gui: PostGRGui },
  'gr-slip': { fiori: GrSlipFiori, gui: GrSlipGui },
  'gr-detail': { fiori: GrDetailFiori, gui: GrDetailGui },
  'create-invoice': { fiori: CreateInvoiceFiori, gui: CreateInvoiceGui },
  'display-invoice': { fiori: DisplayInvoiceFiori, gui: DisplayInvoiceGui },
  'clear-grir': { fiori: ClearGRIRFiori, gui: ClearGRIRGui },
};
