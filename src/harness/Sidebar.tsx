/** Left step list with optional-step switches and the current document numbers. */
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { useDemo, netValue } from '../store';
import { STEPS } from '../steps';
import { fmtAmt } from '../format';
import { stepDone } from './progress';

export function Sidebar({ current }: { current: string }) {
  const s = useDemo();
  const nav = useNavigate();
  if (!s.sidebarOpen) return null;
  return (
    <aside className="side">
      <div className="side-head">J45 프로세스 단계</div>
      {STEPS.map((st) => {
        const done = stepDone(st.id, s);
        const enabled = !st.optional || s.optionalEnabled[st.id];
        return (
          <div key={st.id} className={`side-step ${st.id === current ? 'cur' : ''} ${done ? 'done' : ''} ${enabled ? '' : 'disabled'}`}>
            <button className="side-step-main" onClick={() => nav(`/step/${st.id}`)}>
              <span className="side-dot">{done ? <Icon name="accept" /> : st.no}</span>
              <span className="side-txt">
                <span className="side-title">{st.title}</span>
                <span className="side-meta">{st.appId !== 'Shell' ? `${st.appId} · ${st.tcode}` : 'Fiori Launchpad · Easy Access'}{st.optional && ' · (선택 사항)'}</span>
              </span>
            </button>
            {st.optional && (
              <label className="side-switch" title="선택 단계 포함/제외">
                <input type="checkbox" checked={enabled} onChange={(e) => s.setOptional(st.id, e.target.checked)} />
                <span />
              </label>
            )}
          </div>
        );
      })}
      <div className="side-summary">
        <div><span>PR</span><b>{s.numbers.prNumber}</b></div>
        <div><span>PO</span><b>{s.poStatus === 'None' ? '–' : s.numbers.poNumber}</b></div>
        <div><span>자재 전표</span><b>{s.grDocs[0]?.docNo ?? '–'}</b></div>
        <div><span>송장</span><b>{s.invoice ? s.numbers.invoiceDocNumber : '–'}</b></div>
        <div><span>순 금액</span><b>{fmtAmt(netValue(s.config), s.config.currency)}</b></div>
      </div>
    </aside>
  );
}
