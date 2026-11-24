/**
 * Maps each step id (see ../steps.ts) to its Fiori and SAP GUI renderings.
 * Screens are lazy-loaded: each step file becomes its own small chunk that is fetched
 * the first time the presenter opens that step.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { StepProps } from './types';

type Screen = LazyExoticComponent<ComponentType<StepProps>>;
type Mod = Record<string, ComponentType<StepProps>>;

/** Lazily loads named export `name` from a step module. */
const pick = (load: () => Promise<unknown>, name: string): Screen =>
  lazy(() => load().then((m) => ({ default: (m as Mod)[name] })));

const launchpad = () => import('./Launchpad');
const processPr = () => import('./ProcessPR');
const po = () => import('./PurchaseOrder');
const approve = () => import('./ApprovePO');
const monitor = () => import('./MonitorPO');
const gr = () => import('./PostGR');
const matDocs = () => import('./MaterialDocs');
const invoice = () => import('./CreateInvoice');
const invList = () => import('./InvoiceAndClearing');

export const SCREENS: Record<string, { fiori: Screen; gui: Screen }> = {
  launchpad: { fiori: pick(launchpad, 'LaunchpadFiori'), gui: pick(launchpad, 'LaunchpadGui') },
  'process-pr': { fiori: pick(processPr, 'ProcessPRFiori'), gui: pick(processPr, 'ProcessPRGui') },
  'create-po': { fiori: pick(po, 'CreatePOFiori'), gui: pick(po, 'CreatePOGui') },
  'approve-po': { fiori: pick(approve, 'ApprovePOFiori'), gui: pick(approve, 'ApprovePOGui') },
  'preview-po': { fiori: pick(po, 'PreviewPOFiori'), gui: pick(po, 'PreviewPOGui') },
  'change-po': { fiori: pick(po, 'ChangePOFiori'), gui: pick(po, 'ChangePOGui') },
  'monitor-po': { fiori: pick(monitor, 'MonitorPOFiori'), gui: pick(monitor, 'MonitorPOGui') },
  'post-gr': { fiori: pick(gr, 'PostGRFiori'), gui: pick(gr, 'PostGRGui') },
  'gr-slip': { fiori: pick(matDocs, 'GrSlipFiori'), gui: pick(matDocs, 'GrSlipGui') },
  'gr-detail': { fiori: pick(matDocs, 'GrDetailFiori'), gui: pick(matDocs, 'GrDetailGui') },
  'create-invoice': { fiori: pick(invoice, 'CreateInvoiceFiori'), gui: pick(invoice, 'CreateInvoiceGui') },
  'display-invoice': { fiori: pick(invList, 'DisplayInvoiceFiori'), gui: pick(invList, 'DisplayInvoiceGui') },
  'clear-grir': { fiori: pick(invList, 'ClearGRIRFiori'), gui: pick(invList, 'ClearGRIRGui') },
};
