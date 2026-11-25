/**
 * SAP Fiori (Horizon) building blocks: shell bar, dynamic page header, filter bar,
 * responsive table, form groups, footer toolbar and message toast.
 * Primitive controls come from UI5 Web Components; floorplan layout is plain CSS (styles/sap/fiori.css).
 */
import { withBusy } from './Busy';
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { Icon, ObjectStatus } from '@ui5/webcomponents-react';
import { useDemo } from '../../store';
import { ROLE_USER, Role } from '../../steps';
import { Help } from '../Help';
import { useScenarioNav } from '../../scenarioContext';

/* ---------------------------------------------------------------- toast */
const TOAST_MS = 3000;
const useToastStore = create<{ text: string | null; until: number; show: (t: string) => void }>((set) => ({
  text: null,
  until: 0,
  show: (text) => set({ text, until: Date.now() + TOAST_MS }),
}));
export const showToast = (t: string) => useToastStore.getState().show(t);

/** Message toast; expiry is time-based so it never resurfaces on a later screen. */
function Toast() {
  const { text, until } = useToastStore();
  const [, tick] = useState(0);
  const left = until - Date.now();
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => tick((n) => n + 1), left);
    return () => clearTimeout(id);
  }, [until, left]);
  return text && left > 0 ? <div className="f-toast">{text}</div> : null;
}

/* ---------------------------------------------------------------- shell */
export function SapLogo({ h = 22 }: { h?: number }) {
  return (
    <svg height={h} viewBox="0 0 92 45" aria-label="SAP">
      <defs>
        <linearGradient id="sapg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00b8f1" />
          <stop offset="1" stopColor="#1e5fbb" />
        </linearGradient>
      </defs>
      <polygon points="0,0 92,0 47,45 0,45" fill="url(#sapg)" />
      <text x="7" y="33" fill="#fff" fontFamily="Arial" fontWeight="bold" fontSize="27" letterSpacing="-1">SAP</text>
    </svg>
  );
}

export function FioriShell({ title, role, children, home }: { title: string; role: Role; children: ReactNode; home?: boolean }) {
  const nav = useNavigate();
  const { go } = useScenarioNav();
  const u = ROLE_USER[role];
  return (
    <div className="f-app">
      <header className="f-shell">
        {!home && (
          <button className="f-shell-btn" title="뒤로" onClick={() => nav(-1)}>
            <Icon name="nav-back" />
          </button>
        )}
        <button className="f-shell-brand" onClick={() => go('launchpad')} title="홈">
          <SapLogo />
        </button>
        <span className="f-shell-title">{title}<Icon name="slim-arrow-down" className="f-shell-caret" /></span>
        <div className="f-shell-search">
          <Icon name="search" />
          <span>Fiori 앱 및 문서 검색</span>
        </div>
        <span className="f-shell-spacer" />
        <button className="f-shell-btn" title="Joule"><Icon name="ai" /></button>
        <button className="f-shell-btn" title="알림"><Icon name="bell" /><span className="f-badge">2</span></button>
        <span className="f-avatar" title={`${u.name} (${u.userId})`}>{u.initials}</span>
      </header>
      <div className="f-content">{children}</div>
      <Toast />
    </div>
  );
}

/* ---------------------------------------------------------------- page header */
export interface Attr { label: string; value: ReactNode; help?: string }

export function PageHeader({
  title, subtitle, status, attrs, kpis, actions, breadcrumb,
}: {
  title: ReactNode; subtitle?: ReactNode; status?: ReactNode; attrs?: Attr[]; kpis?: { label: string; value: ReactNode }[]; actions?: ReactNode; breadcrumb?: string[];
}) {
  return (
    <div className="f-page-header">
      {breadcrumb && <div className="f-breadcrumb">{breadcrumb.map((b, i) => <span key={i}>{b}</span>)}</div>}
      <div className="f-title-row">
        <div>
          <h1 className="f-title">{title}</h1>
          {subtitle && <div className="f-subtitle">{subtitle}</div>}
        </div>
        <div className="f-title-actions">{actions}</div>
      </div>
      {(attrs || kpis || status) && (
        <div className="f-header-content">
          {attrs && (
            <div className="f-attrs">
              {attrs.map((a) => (
                <div key={a.label} className="f-attr">
                  <span className="f-attr-label">{a.label}{a.help && <Help k={a.help} />}:</span>
                  <span className="f-attr-value">{a.value}</span>
                </div>
              ))}
            </div>
          )}
          {kpis?.map((k) => (
            <div key={k.label} className="f-kpi">
              <span className="f-attr-label">{k.label}</span>
              <span className="f-kpi-value">{k.value}</span>
            </div>
          ))}
          {status && <div className="f-kpi"><span className="f-attr-label">상태</span>{status}</div>}
        </div>
      )}
    </div>
  );
}

export type StatusState = 'None' | 'Positive' | 'Critical' | 'Negative' | 'Information';
export function Status({ state, text, large }: { state: StatusState; text: string; large?: boolean }) {
  return <ObjectStatus state={state} inverted={large} showDefaultIcon>{text}</ObjectStatus>;
}

/* ---------------------------------------------------------------- filter bar */
export function FilterBar({ fields, onGo, variant = '표준' }: { fields: { label: string; value: ReactNode }[]; onGo?: () => void; variant?: string }) {
  return (
    <div className="f-filterbar">
      <div className="f-variant">{variant} <Icon name="slim-arrow-down" /></div>
      <div className="f-filters">
        {fields.map((f) => (
          <label key={f.label} className="f-filter">
            <span>{f.label}:</span>
            {f.value}
          </label>
        ))}
        <div className="f-filter-btns">
          <button className="f-btn f-btn-emph" onClick={onGo}>실행</button>
          <button className="f-btn f-btn-trans">필터 조정</button>
        </div>
      </div>
    </div>
  );
}

/** Read-only token-style filter value (looks like a filled Fiori input). */
export const FVal = ({ v }: { v: ReactNode }) => <span className="f-input-ro">{v}</span>;

/* ---------------------------------------------------------------- table */
export interface Col<T> { key: string; label: string; render: (r: T) => ReactNode; align?: 'right' | 'center'; width?: string }

export function FTable<T>({
  title, count, columns, rows, rowKey, selected, onSelect, onRowClick, toolbar, nav, empty,
}: {
  title?: string; count?: number; columns: Col<T>[]; rows: T[]; rowKey: (r: T) => string;
  selected?: string[]; onSelect?: (k: string) => void; onRowClick?: (r: T) => void; toolbar?: ReactNode; nav?: boolean; empty?: string;
}) {
  return (
    <div className="f-table-card">
      {(title || toolbar) && (
        <div className="f-table-toolbar">
          {title && <span className="f-table-title">{title}{count !== undefined && ` (${count})`}</span>}
          <span className="f-shell-spacer" />
          {toolbar}
          <button className="f-icon-btn" title="Excel로 내보내기"><Icon name="excel-attachment" /></button>
          <button className="f-icon-btn" title="설정"><Icon name="action-settings" /></button>
        </div>
      )}
      <table className="f-table">
        <thead>
          <tr>
            {onSelect && <th className="f-sel" />}
            {columns.map((c) => <th key={c.key} style={{ textAlign: c.align, width: c.width }}>{c.label}</th>)}
            {nav && <th className="f-sel" />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length + 2} className="f-empty">{empty ?? '데이터가 없습니다'}</td></tr>
          )}
          {rows.map((r) => {
            const k = rowKey(r);
            const sel = selected?.includes(k);
            return (
              <tr key={k} className={`${sel ? 'is-selected' : ''} ${onRowClick ? 'is-clickable' : ''}`} onClick={() => onRowClick?.(r)}>
                {onSelect && (
                  <td className="f-sel" onClick={(e) => { e.stopPropagation(); onSelect(k); }}>
                    <span className={`f-check ${sel ? 'on' : ''}`}>{sel && <Icon name="accept" />}</span>
                  </td>
                )}
                {columns.map((c) => <td key={c.key} style={{ textAlign: c.align }}>{c.render(r)}</td>)}
                {nav && <td className="f-sel"><Icon name="slim-arrow-right" className="f-nav-arrow" /></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------- object page bits */
export function AnchorBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="f-anchorbar">
      {tabs.map((t) => (
        <button key={t} className={t === active ? 'active' : ''} onClick={() => onChange(t)}>{t}</button>
      ))}
    </div>
  );
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="f-section">
      <div className="f-section-head"><h2>{title}</h2>{actions}</div>
      {children}
    </section>
  );
}

export interface FormField { label: string; value: ReactNode; help?: string; required?: boolean }
export function FormGroup({ title, fields, cols = 3 }: { title?: string; fields: FormField[]; cols?: number }) {
  return (
    <div className="f-formgroup">
      {title && <h3>{title}</h3>}
      <div className="f-form" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {fields.map((f) => (
          <div key={f.label} className="f-field">
            <label>{f.label}{f.required && <span className="f-req">*</span>}{f.help && <Help k={f.help} />}:</label>
            <div className="f-field-v">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FooterBar({ children, message }: { children: ReactNode; message?: ReactNode }) {
  return (
    <div className="f-footer">
      {message && <div className="f-footer-msg">{message}</div>}
      <span className="f-shell-spacer" />
      {children}
    </div>
  );
}

/** Primary buttons that commit a document show the busy dialog before their action runs. */
const AUTO_BUSY = ['저장', '오더', '전기', '제출', '생성', '계약 생성'];

export function FBtn({ children, emph, trans, onClick, disabled, icon, busy }: { children?: ReactNode; emph?: boolean; trans?: boolean; onClick?: () => void; disabled?: boolean; icon?: string; busy?: boolean }) {
  const busyOn = busy ?? (!!emph && typeof children === 'string' && AUTO_BUSY.includes(children));
  return (
    <button className={`f-btn ${emph ? 'f-btn-emph' : ''} ${trans ? 'f-btn-trans' : ''}`} onClick={busyOn && onClick ? () => withBusy(onClick) : onClick} disabled={disabled}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

/** Small native input styled as a Fiori input (fast, fully controlled). */
export function FInput({ value, onChange, type = 'text', w, align, readOnly }: { value: string | number; onChange?: (v: string) => void; type?: string; w?: number; align?: 'right'; readOnly?: boolean }) {
  return (
    <input
      className="f-input"
      type={type}
      value={value}
      readOnly={readOnly || !onChange}
      style={{ width: w, textAlign: align }}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

/** Link-styled text, e.g. document numbers that are navigable in Fiori. */
export const FLink = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <span className="f-link" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>{children}</span>
);

export function useFioriDate() {
  return useDemo((s) => s.config.dateFormat);
}
