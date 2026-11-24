/**
 * Screen kit for the chain scenarios: one declarative spec per step is rendered both as a
 * Fiori app page and as an SAP GUI transaction, so both UIs always show the same data and
 * the presenter guide can address the same button labels.
 */
import { useState, type ReactNode } from 'react';
import { Dialog, MessageStrip } from '@ui5/webcomponents-react';
import type { StepProps } from '../../steps/types';
import type { StepDef } from '../../steps';
import { ROLE_KO } from '../../steps';
import {
  FBtn, FioriShell, FooterBar, FormGroup, FTable, PageHeader, Section, Status, showToast, type FormField, type StatusState,
} from '../../components/fiori/Fiori';
import { GBtn, GField, GTable, GuiWindow } from '../../components/gui/Gui';
import { LaunchpadFiori, LaunchpadGui, PdfDialog, type MenuNode, type Tile } from './ui';

export interface KCol<T> { key: string; label: string; render: (r: T) => ReactNode; align?: 'right'; w?: number }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface KTable<T = any> { title?: string; rows: T[]; rowKey: (r: T) => string; cols: KCol<T>[]; select?: boolean; empty?: string }
export interface KAction {
  label: string;
  /** SAP GUI toolbar label (defaults to label). */
  gui?: string;
  onClick: () => void;
  disabled?: boolean;
  emph?: boolean;
  toast?: string;
  /** Fiori only: a dialog that must be confirmed with `confirm.label`. */
  confirm?: { title: string; label: string; body?: ReactNode; fields?: FormField[] };
}
export interface KField extends FormField { g?: string | number }
export interface KSpec {
  app: string;
  appId: string;
  title: ReactNode;
  sub?: string;
  gtitle: string;
  status?: [StatusState, string];
  kpis?: { label: string; value: ReactNode }[];
  fields?: KField[];
  tables?: KTable[];
  actions?: KAction[];
  /** Put actions into the Fiori footer bar (create/edit pages) instead of the table toolbar. */
  footer?: boolean;
  done?: boolean;
  doneMsg?: ReactNode;
  info?: ReactNode;
  warn?: ReactNode;
  pdf?: { label: string; gui?: string; title: string; doc: ReactNode; onOpen?: () => void };
  extra?: ReactNode;
}

const gtext = (f: KField) => (f.g !== undefined ? f.g : typeof f.value === 'string' || typeof f.value === 'number' ? f.value : '');

function KFiori({ step, s }: { step: StepDef; s: KSpec }) {
  const [pending, setPending] = useState<KAction | null>(null);
  const [pdf, setPdf] = useState(false);
  const run = (a: KAction) => { a.onClick(); if (a.toast) showToast(a.toast); };
  const click = (a: KAction) => (a.confirm ? setPending(a) : run(a));
  const btns = (s.actions ?? []).map((a, i) => <FBtn key={a.label} emph={a.emph ?? i === 0} disabled={a.disabled} onClick={() => click(a)}>{a.label}</FBtn>);
  const pdfBtn = s.pdf && <FBtn key="pdf" onClick={() => { setPdf(true); s.pdf!.onOpen?.(); }}>{s.pdf.label}</FBtn>;
  const inHeader = !s.footer && !s.tables?.length;
  return (
    <FioriShell title={s.app} role={step.role}>
      <PageHeader breadcrumb={[s.app]} title={s.title} subtitle={s.sub ?? `${step.appName} (${s.appId})`}
        status={s.status && <Status state={s.status[0]} text={s.status[1]} />} kpis={s.kpis}
        actions={inHeader ? <>{btns}{pdfBtn}</> : pdfBtn} />
      <div className="f-page-body">
        {s.done && s.doneMsg && <MessageStrip design="Positive" hideCloseButton className="f-strip">{s.doneMsg}</MessageStrip>}
        {s.warn && <MessageStrip design="Critical" hideCloseButton className="f-strip">{s.warn}</MessageStrip>}
        {s.info && <MessageStrip design="Information" hideCloseButton className="f-strip">{s.info}</MessageStrip>}
        {s.fields && <Section title="일반 정보"><FormGroup cols={3} fields={s.fields} /></Section>}
        {s.tables?.map((t, i) => (
          <FTable key={t.title ?? i} title={t.title} count={t.rows.length} rowKey={t.rowKey} rows={t.rows} empty={t.empty}
            selected={t.select ? t.rows.map(t.rowKey) : undefined} onSelect={t.select ? () => undefined : undefined}
            toolbar={i === 0 && !s.footer ? <>{btns}</> : undefined}
            columns={t.cols.map((c) => ({ key: c.key, label: c.label, align: c.align, render: c.render }))} />
        ))}
        {s.extra}
      </div>
      {s.footer && btns.length > 0 && <FooterBar>{btns}</FooterBar>}
      {pending && (
        <Dialog open headerText={pending.confirm!.title} onClose={() => setPending(null)} style={{ width: 600 }}
          footer={<div className="f-dialog-footer">
            <FBtn emph onClick={() => { run(pending); setPending(null); }}>{pending.confirm!.label}</FBtn>
            <FBtn onClick={() => setPending(null)}>취소</FBtn>
          </div>}>
          {pending.confirm!.fields && <FormGroup cols={2} fields={pending.confirm!.fields} />}
          {pending.confirm!.body}
        </Dialog>
      )}
      {s.pdf && <PdfDialog open={pdf} onClose={() => setPdf(false)} title={s.pdf.title}>{s.pdf.doc}</PdfDialog>}
    </FioriShell>
  );
}

function KGui({ step, s }: { step: StepDef; s: KSpec }) {
  const [pdf, setPdf] = useState(false);
  const fields = s.fields ?? [];
  return (
    <GuiWindow title={s.gtitle} tcode={step.tcode} role={step.role}
      appToolbar={<>
        {(s.actions ?? []).map((a) => <GBtn key={a.label} disabled={a.disabled} onClick={a.onClick}>{a.gui ?? a.label}</GBtn>)}
        {s.pdf && <GBtn onClick={() => { setPdf(true); s.pdf!.onOpen?.(); }}>{s.pdf.gui ?? '🖨 인쇄 미리보기'}</GBtn>}
      </>}>
      <div className="g-pad">
        {fields.length > 0 && (
          <div className="g-sel-screen" style={{ maxWidth: 900, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
            {fields.map((f) => <GField key={f.label} label={f.label} value={gtext(f)} w={240} lw={140} help={f.help} />)}
          </div>
        )}
        {s.tables?.map((t, i) => (
          <GTable key={t.title ?? i} title={t.title} minRows={Math.max(3, t.rows.length)} rows={t.rows} rowKey={t.rowKey}
            selected={t.select ? t.rows.map(t.rowKey) : undefined}
            columns={t.cols.map((c) => ({ key: c.key, label: c.label, w: c.w ?? 110, align: c.align, render: c.render }))} />
        ))}
        {s.warn && <div className="g-warn-box" style={{ background: '#fff4e5', border: '1px solid #e6a23c', padding: '6px 8px' }}>{s.warn}</div>}
        {s.done && s.doneMsg && <div className="g-ok-box">{s.doneMsg}</div>}
      </div>
      {s.pdf && <PdfDialog open={pdf} onClose={() => setPdf(false)} title={s.pdf.title}>{s.pdf.doc}</PdfDialog>}
    </GuiWindow>
  );
}

/** Builds the Fiori and SAP GUI screen components for one step from a spec hook. */
export function pair(useSpec: (p: StepProps) => KSpec) {
  const F = (p: StepProps) => <KFiori step={p.step} s={useSpec(p)} />;
  const G = (p: StepProps) => <KGui step={p.step} s={useSpec(p)} />;
  return [F, G] as const;
}

const iconFor = (st: StepDef) =>
  /approve|release|inbox/.test(st.id) ? 'inbox'
    : /gr|receive|confirm|pgi|delivery/.test(st.id) ? 'shipping-status'
      : /invoice|credit|reduce/.test(st.id) ? 'receipt'
        : /monitor|coverage|stock|review|check|tracking/.test(st.id) ? 'monitor-payments'
          : /print|preview|slip/.test(st.id) ? 'documents'
            : /mrp|schedule|plan/.test(st.id) ? 'calendar'
              : 'activity-items';

/** Launchpad (Fiori spaces per role, SAP Easy Access tree per role) generated from the step list. */
export function autoLaunchpad(steps: StepDef[], hint: ReactNode) {
  const apps = steps.filter((s) => s.appId !== 'Shell');
  const roles = [...new Set(apps.map((s) => s.role))];
  const spaces = Object.fromEntries(roles.map((r) => [ROLE_KO[r], [{
    section: '내 업무', tiles: apps.filter((s) => s.role === r).map<Tile>((s) => ({ title: s.title, sub: `${s.appName}${s.optional ? ' · 선택' : ''}`, icon: iconFor(s), to: s.id })),
  }]]));
  const tree: MenuNode[] = [{ id: 'sap', label: 'SAP 메뉴', children: roles.map((r) => ({
    id: r, label: ROLE_KO[r], children: apps.filter((s) => s.role === r).map((s) => ({ id: s.id, label: s.title, tcode: s.tcode, to: s.id })),
  })) }];
  const F = ({ step }: StepProps) => <LaunchpadFiori step={step} spaces={spaces} />;
  const G = ({ step }: StepProps) => <LaunchpadGui step={step} tree={tree} hint={hint} />;
  return [F, G] as const;
}
