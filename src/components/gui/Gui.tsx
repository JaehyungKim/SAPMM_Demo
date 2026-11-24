/**
 * Classic SAP GUI for Windows simulation: window frame, menu bar, system toolbar with
 * command field, title bar, application toolbar, dynpro fields, ALV-style grid, tab strips
 * and status bar. The command field accepts real transaction codes (see TCODE_MAP).
 */
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../../store';
import { ROLE_USER, Role } from '../../steps';
import { useScenarioNav } from '../../scenarioContext';
import { Help } from '../Help';

const MENUS = ['메뉴', '편집', '이동', '추가 기능', '환경', '시스템', '도움말'];

/** Tiny pixel-style toolbar glyphs (SAP GUI Signature / Blue Crystal-ish). */
const G = {
  enter: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#2e8b2e" /><path d="M4.5 8.2l2.3 2.3 4.7-5" stroke="#fff" strokeWidth="1.8" fill="none" /></svg>,
  save: <svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" rx="1" fill="#3b6fb6" /><rect x="4" y="2" width="8" height="5" fill="#fff" /><rect x="4" y="10" width="8" height="4" fill="#cfe0f5" /></svg>,
  back: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#1d7a32" /><path d="M10 4L6 8l4 4" stroke="#fff" strokeWidth="2" fill="none" /></svg>,
  exit: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#d9a400" /><path d="M5 11l6-6M5 5l6 6" stroke="#fff" strokeWidth="1.8" /></svg>,
  cancel: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#c9302c" /><path d="M5 11l6-6M5 5l6 6" stroke="#fff" strokeWidth="1.8" /></svg>,
  print: <svg viewBox="0 0 16 16"><rect x="2" y="6" width="12" height="6" fill="#666" /><rect x="4" y="2" width="8" height="5" fill="#fff" stroke="#666" /><rect x="4" y="10" width="8" height="4" fill="#fff" stroke="#666" /></svg>,
  find: <svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.2" stroke="#333" strokeWidth="1.6" fill="#e8f2ff" /><path d="M9.5 9.5l5 5" stroke="#333" strokeWidth="2" /></svg>,
  first: <svg viewBox="0 0 16 16"><path d="M4 3v10M12 3L6 8l6 5z" stroke="#555" fill="#555" /></svg>,
  prev: <svg viewBox="0 0 16 16"><path d="M11 3L5 8l6 5z" fill="#555" /></svg>,
  next: <svg viewBox="0 0 16 16"><path d="M5 3l6 5-6 5z" fill="#555" /></svg>,
  last: <svg viewBox="0 0 16 16"><path d="M12 3v10M4 3l6 5-6 5z" stroke="#555" fill="#555" /></svg>,
  session: <svg viewBox="0 0 16 16"><rect x="1.5" y="3" width="10" height="9" fill="#fff" stroke="#555" /><rect x="4.5" y="5" width="10" height="9" fill="#dfe9f7" stroke="#555" /></svg>,
  help: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#3b6fb6" /><text x="5" y="12" fill="#fff" fontSize="11" fontWeight="bold">?</text></svg>,
};

function ToolBtn({ g, title, onClick }: { g: ReactNode; title: string; onClick?: () => void }) {
  return <button className="g-tbtn" title={title} onClick={onClick}>{g}</button>;
}

export function GuiWindow({
  title, tcode, appToolbar, children, role, webgui,
}: { title: string; tcode: string; appToolbar?: ReactNode; children: ReactNode; role: Role; webgui?: boolean }) {
  const nav = useNavigate();
  const { tcodes, go } = useScenarioNav();
  const msg = useDemo((s) => s.guiMessage);
  const setMsg = useDemo((s) => s.setGuiMessage);
  const [cmd, setCmd] = useState('');
  useEffect(() => setCmd(''), [tcode]);

  const run = () => {
    const t = cmd.trim().toUpperCase().replace(/^\/[NO]/, '');
    if (!t) return;
    const id = tcodes[t];
    if (id) { setMsg(null); go(id); }
    else setMsg({ type: 'E', text: `트랜잭션 ${t}이(가) 존재하지 않습니다` });
  };

  const sys = `S4H (1) 100`;
  return (
    <div className={`g-window ${webgui ? 'g-webgui' : ''}`}>
      {!webgui && (
        <div className="g-titlebar">
          <span className="g-titlebar-icon">◆</span>
          <span className="g-titlebar-text">{title}</span>
          <span className="g-win-btns"><span>—</span><span>☐</span><span>✕</span></span>
        </div>
      )}
      <div className="g-menubar">
        {MENUS.map((m) => <span key={m}>{m}</span>)}
        <span className="g-spacer" />
        {webgui && <span className="g-webgui-tag">SAP GUI for HTML</span>}
      </div>
      <div className="g-systoolbar">
        <ToolBtn g={G.enter} title="계속 (Enter)" onClick={run} />
        <div className="g-cmd">
          <input
            value={cmd}
            placeholder={tcode}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            aria-label="명령 필드"
          />
          <span className="g-cmd-arrow">▾</span>
        </div>
        <span className="g-sep" />
        <ToolBtn g={G.save} title="저장 (Ctrl+S)" />
        <ToolBtn g={G.back} title="뒤로 (F3)" onClick={() => nav(-1)} />
        <ToolBtn g={G.exit} title="종료 (Shift+F3)" onClick={() => go('launchpad')} />
        <ToolBtn g={G.cancel} title="취소 (F12)" onClick={() => nav(-1)} />
        <span className="g-sep" />
        <ToolBtn g={G.print} title="인쇄 (Ctrl+P)" />
        <ToolBtn g={G.find} title="찾기 (Ctrl+F)" />
        <span className="g-sep" />
        <ToolBtn g={G.first} title="첫 페이지" />
        <ToolBtn g={G.prev} title="이전 페이지" />
        <ToolBtn g={G.next} title="다음 페이지" />
        <ToolBtn g={G.last} title="마지막 페이지" />
        <span className="g-sep" />
        <ToolBtn g={G.session} title="새 세션 생성" />
        <ToolBtn g={G.help} title="도움말 (F1)" />
      </div>
      <div className="g-screen-title">{title}</div>
      {appToolbar && <div className="g-apptoolbar">{appToolbar}</div>}
      <div className="g-body">{children}</div>
      <div className="g-statusbar">
        <div className={`g-status-msg ${msg ? 'g-msg-' + msg.type : ''}`}>
          {msg && <span className="g-msg-icon" />}
          {msg?.text}
        </div>
        <div className="g-status-sys">
          <span>▷ {sys}</span>
          <span>{ROLE_USER[role].userId}</span>
          <span>{tcode}</span>
          <span>s4hcloud</span>
          <span>INS</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ dynpro elements */
export function GBtn({ children, onClick, icon, disabled }: { children?: ReactNode; onClick?: () => void; icon?: ReactNode; disabled?: boolean }) {
  return (
    <button className="g-btn" onClick={onClick} disabled={disabled}>
      {icon && <span className="g-btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

export function GField({
  label, value, onChange, w = 120, lw = 150, required, help, suffix, align, type = 'text',
}: {
  label: string; value: string | number; onChange?: (v: string) => void; w?: number; lw?: number; required?: boolean; help?: string; suffix?: ReactNode; align?: 'right'; type?: string;
}) {
  return (
    <div className="g-field">
      <label style={{ width: lw }}>{label}{help && <Help k={help} />}</label>
      <input
        className={`g-input ${required ? 'g-req' : ''} ${!onChange ? 'g-ro' : ''}`}
        style={{ width: w, textAlign: align }}
        value={value}
        type={type}
        readOnly={!onChange}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {suffix && <span className="g-suffix">{suffix}</span>}
    </div>
  );
}

export function GCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange?: (v: boolean) => void }) {
  return (
    <label className="g-check">
      <input type="checkbox" checked={checked} readOnly={!onChange} onChange={(e) => onChange?.(e.target.checked)} />
      {label}
    </label>
  );
}

export function GGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="g-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

export function GTabs({ tabs, active, onChange, children }: { tabs: string[]; active: string; onChange: (t: string) => void; children: ReactNode }) {
  return (
    <div className="g-tabs">
      <div className="g-tabstrip">
        {tabs.map((t) => (
          <button key={t} className={t === active ? 'active' : ''} onClick={() => onChange(t)}>{t}</button>
        ))}
      </div>
      <div className="g-tabbody">{children}</div>
    </div>
  );
}

export interface GCol<T> { key: string; label: string; render: (r: T) => ReactNode; w?: number; align?: 'right' | 'center' }

export function GTable<T>({
  columns, rows, rowKey, selected, onSelect, onRowDblClick, minRows = 6, title,
}: {
  columns: GCol<T>[]; rows: T[]; rowKey: (r: T) => string; selected?: string[]; onSelect?: (k: string) => void; onRowDblClick?: (r: T) => void; minRows?: number; title?: string;
}) {
  const fill = Math.max(0, minRows - rows.length);
  return (
    <div className="g-grid-wrap">
      {title && <div className="g-grid-title">{title}</div>}
      <table className="g-grid">
        <thead>
          <tr>
            <th className="g-rowsel" />
            {columns.map((c) => <th key={c.key} style={{ width: c.w, textAlign: c.align }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const k = rowKey(r);
            const sel = selected?.includes(k);
            return (
              <tr key={k} className={sel ? 'is-selected' : ''} onClick={() => onSelect?.(k)} onDoubleClick={() => onRowDblClick?.(r)}>
                <td className="g-rowsel">{sel ? '■' : ''}</td>
                {columns.map((c) => <td key={c.key} style={{ textAlign: c.align }}>{c.render(r)}</td>)}
              </tr>
            );
          })}
          {Array.from({ length: fill }).map((_, i) => (
            <tr key={'f' + i} className="g-empty-row">
              <td className="g-rowsel" />
              {columns.map((c) => <td key={c.key} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Traffic light used in MIRO balance and MIGO item OK. */
export function GLight({ state }: { state: 'green' | 'yellow' | 'red' }) {
  return (
    <span className="g-light">
      <i className={state === 'red' ? 'on-red' : ''} />
      <i className={state === 'yellow' ? 'on-yellow' : ''} />
      <i className={state === 'green' ? 'on-green' : ''} />
    </span>
  );
}

export const GGlyph = G;
