/**
 * Admin page (#/admin) for the presenter, who owns the full story (all scenarios):
 *  1. analyse a customer interview → recommended scope items with evidence
 *  2. pick the customer's scope items on the full scope-item map
 *  3. customer name + greeting → customer link (everything encoded in the link) · preview · copy
 *  4. saved customer links
 * Reached only by typing #/admin (no button anywhere). Not access-protected – static site.
 */
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SapLogo } from '../../components/fiori/Fiori';
import { useDemo } from '../../store';
import { demoStorage, isPreview } from '../../persistStorage';
import { SCENARIOS } from '../../scenarios/index';
import { CATALOG, itemByCode } from '../../scenarios/catalog';
import { configDiff, customerLink, leaveCustomerMode, useProfile, type CustomerProfile } from '../../profile';
import { analyze, fileToText, highlight, level, type Match } from './analyze';

interface Preset extends CustomerProfile { id: string }
const useAdmin = create<{ presets: Preset[]; save: (p: Preset) => void; remove: (id: string) => void }>()(
  persist((set, get) => ({
    presets: [],
    save: (p) => set({ presets: [p, ...get().presets.filter((x) => x.id !== p.id)] }),
    remove: (id) => set({ presets: get().presets.filter((x) => x.id !== id) }),
  }), { name: 'j45-demo-admin', storage: demoStorage, version: 1 }),
);

const IMPLEMENTED = new Set(SCENARIOS.map((d) => d.code));
const titleOf = (code: string) => SCENARIOS.find((d) => d.code === code)?.title ?? itemByCode(code)?.ko ?? code;

async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); return true; } catch { /* fall back */ }
  const ta = document.createElement('textarea');
  ta.value = t; document.body.appendChild(ta); ta.select();
  const ok = document.execCommand('copy'); ta.remove();
  return ok;
}

export function Admin() {
  const nav = useNavigate();
  const config = useDemo((s) => s.config);
  const profile = useProfile((s) => s.active);
  const { presets, save, remove } = useAdmin();

  // 1 · interview analysis
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [err, setErr] = useState('');
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 2/3 · selection and customer data
  const [sel, setSel] = useState<string[]>([]);
  const [customer, setCustomer] = useState('');
  const [message, setMessage] = useState('');
  const [useCompany, setUseCompany] = useState(true);
  const [withSetup, setWithSetup] = useState(true);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const flash = (t: string) => { setNote(t); window.setTimeout(() => setNote(''), 2500); };
  const toggle = (code: string) => setSel((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));

  const load = async (f: File) => {
    setErr(''); setFileName(f.name);
    try { setText(await fileToText(f)); setMatches(null); } catch (e) { setErr((e as Error).message); }
  };
  const run = () => {
    setErr('');
    if (!text.trim()) { setErr('인터뷰 내용을 올리거나 붙여 넣어 주세요.'); return; }
    const m = analyze(text);
    setMatches(m);
    // Pre-select recommended scope items that can be demonstrated.
    const rec = m.filter((x) => x.score >= 3 && IMPLEMENTED.has(x.item.code)).map((x) => x.item.code);
    setSel((s) => [...new Set([...s, ...rec])]);
  };
  const hinted = useMemo(() => new Set((matches ?? []).filter((x) => x.score > 0).map((x) => x.item.code)), [matches]);

  const prof: CustomerProfile | null = customer.trim() && sel.length ? {
    v: 1, customer: customer.trim(), message: message.trim(),
    codes: SCENARIOS.map((d) => d.code).filter((c) => sel.includes(c)),
    cfg: { ...(withSetup ? configDiff(config) : {}), ...(useCompany ? { companyName: customer.trim() } : {}) },
    createdAt: new Date().toISOString(),
  } : null;
  const link = prof ? customerLink(prof) : '';

  const doSave = () => {
    if (!prof) return;
    const id = presetId ?? `p${Date.now()}`;
    save({ ...prof, id }); setPresetId(id); flash('저장했습니다');
  };
  const doLoad = (p: Preset) => {
    setPresetId(p.id); setCustomer(p.customer); setMessage(p.message); setSel(p.codes);
    setUseCompany(p.cfg.companyName === p.customer); flash(`'${p.customer}' 링크를 불러왔습니다`);
  };

  return (
    <div className="setup">
      <header className="setup-head">
        <SapLogo h={30} />
        <div>
          <h1>관리자 · 고객 맞춤 데모 링크</h1>
          <p>인터뷰 내용을 분석해 Scope Item을 추천받고, 고객사에 맞는 시나리오만 담은 링크를 만들어 보냅니다. 링크에 모든 정보가 들어 있어 별도 서버가 필요 없습니다.</p>
        </div>
      </header>
      <div className="setup-body">
        {profile && !isPreview && (
          <div className="adm-banner"><Icon name="alert" /> 이 브라우저는 현재 <b>{profile.customer}</b> 고객 모드입니다 (시나리오 {profile.codes.length}개만 표시).
            <button className="f-btn" onClick={() => { leaveCustomerMode(); flash('전체 모드로 돌아왔습니다'); }}>전체 모드로 복귀</button>
          </div>
        )}
        {isPreview && <div className="adm-banner"><Icon name="alert" /> 미리보기 탭입니다. 이 탭에서 바꾼 내용은 관리자 브라우저에 저장되지 않습니다.</div>}
        <div className="adm-grid">
          <div>
            <section className="adm-card">
              <h2><span className="adm-step">1</span> 인터뷰 분석 <Icon name="survey" /></h2>
              <p className="adm-sub">인터뷰 결과를 올리면 Scope Item별 키워드로 관련 업무를 찾아 추천합니다. 분석은 이 브라우저 안에서만 이뤄지며 외부로 전송되지 않습니다.</p>
              <div className={`adm-drop ${over ? 'over' : ''}`} onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) load(f); }}>
                <Icon name="upload" />
                {fileName ? <><b>{fileName}</b> · 다른 파일을 올리려면 클릭</> : <>인터뷰 파일을 끌어 놓거나 클릭해서 선택 <small className="adm-muted">(txt · md · csv · docx · pptx · xlsx)</small></>}
                <input ref={fileRef} type="file" hidden accept=".txt,.md,.csv,.tsv,.docx,.pptx,.xlsx,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ''; }} />
              </div>
              <textarea className="adm-text" placeholder="또는 인터뷰 메모를 여기에 붙여 넣으세요. 예) 원자재는 MRP로 발주하고, 협력사에 부품을 보내 임가공합니다. 서비스 용역은 작업 확인 후 정산…"
                value={text} onChange={(e) => { setText(e.target.value); setMatches(null); }} />
              <div className="adm-row">
                <span className="adm-muted grow">{text ? `${text.length.toLocaleString()}자` : ''}</span>
                <button className="f-btn f-btn-emph" onClick={run}><Icon name="survey" /> 분석</button>
              </div>
              {err && <div className="adm-err">{err}</div>}
              {matches && (
                <div className="adm-res">
                  {matches.length === 0 && <div className="adm-muted">관련 Scope Item을 찾지 못했습니다. 업무 설명이 들어 있는지 확인해 주세요.</div>}
                  {matches.map((m) => {
                    const ok = IMPLEMENTED.has(m.item.code);
                    const lv = level(m.score);
                    return (
                      <div key={m.item.code} className={`adm-match ${sel.includes(m.item.code) ? 'sel' : ''}`}>
                        <div className="adm-match-top">
                          <input type="checkbox" disabled={!ok} checked={sel.includes(m.item.code)} onChange={() => toggle(m.item.code)} title={ok ? '고객 링크에 포함' : '아직 시연 화면이 없는 Scope Item'} />
                          <span className="adm-code">{m.item.code}</span>
                          <span className="adm-name">{m.item.ko}<small>{m.item.name}</small></span>
                          <span className={`adm-lvl ${lv.c}`}>{lv.t}</span>
                          <span className={`adm-tag ${ok ? 'ok' : 'no'}`}>{ok ? '시연 가능' : '시연 준비 중'}</span>
                          <span className="adm-score">점수 {m.score}</span>
                        </div>
                        <ul className="adm-ev">
                          {m.evidence.map((e, i) => (
                            <li key={i} className={e.negative ? 'neg' : ''}>
                              {highlight(e.line, e.kws).map((p, j) => (p.hit ? <mark key={j}>{p.t}</mark> : <span key={j}>{p.t}</span>))}
                              {e.negative && ' (부정 표현 – 감점)'}
                            </li>
                          ))}
                        </ul>
                        <div className="adm-kws">키워드: {Object.entries(m.hits).map(([k, n]) => `${k}×${n}`).join(', ')}</div>
                      </div>
                    );
                  })}
                  <div className="adm-muted">점수 3 이상이면서 시연 가능한 Scope Item은 자동으로 선택됩니다. 키워드 기반 추천이므로 근거 문장을 확인하고 조정해 주세요.</div>
                </div>
              )}
            </section>

            <section className="adm-card">
              <h2><span className="adm-step">2</span> Scope Item 선택 <Icon name="grid" /></h2>
              <p className="adm-sub">전체 Scope Item 맵입니다. 진하게 표시된 항목이 시연 가능한 시나리오이고, 주황 표시는 인터뷰에서 언급된 항목입니다. 선택 {sel.length}개</p>
              {CATALOG.map((g) => (
                <div key={g.id} className="adm-cat">
                  <h3>{g.title} · {g.titleKo}</h3>
                  <div className="adm-items">
                    {g.items.map((it) => {
                      const ok = IMPLEMENTED.has(it.code);
                      return (
                        <label key={it.code} className={`adm-item ${ok ? '' : 'na'} ${sel.includes(it.code) ? 'sel' : ''} ${hinted.has(it.code) ? 'hint' : ''}`} title={it.name}>
                          <input type="checkbox" disabled={!ok} checked={sel.includes(it.code)} onChange={() => toggle(it.code)} />
                          <span><b>{it.code} · {ok ? titleOf(it.code) : it.ko}</b><small>{ok ? it.name : '시연 준비 중'}</small></span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div>
            <section className="adm-card">
              <h2><span className="adm-step">3</span> 고객 정보 · 링크 <Icon name="chain-link" /></h2>
              <p className="adm-sub">링크를 연 고객은 선택한 시나리오만 보고, 관리자 화면 입구는 보이지 않습니다.</p>
              <div className="setup-field"><span>고객사명</span><input value={customer} placeholder="예: 한국전자" onChange={(e) => setCustomer(e.target.value)} /></div>
              <div className="setup-field"><span>안내 문구</span>
                <textarea className="adm-text" style={{ minHeight: 70, marginTop: 0 }} value={message} placeholder="예: 지난 인터뷰에서 말씀하신 외주 가공과 서비스 구매 프로세스를 SAP에서 어떻게 처리하는지 확인해 보십시오." onChange={(e) => setMessage(e.target.value)} />
              </div>
              <label className="adm-row"><input type="checkbox" checked={useCompany} onChange={(e) => setUseCompany(e.target.checked)} /> SAP 화면의 회사명을 고객사명으로 표시</label>
              <label className="adm-row"><input type="checkbox" checked={withSetup} onChange={(e) => setWithSetup(e.target.checked)} /> 현재 데모 환경 설정(담당자 이름·조직·G/L 등) 포함</label>
              <div className="adm-row adm-muted">선택: {sel.length ? SCENARIOS.filter((d) => sel.includes(d.code)).map((d) => `${d.code} ${d.title}`).join(' · ') : '없음'}</div>
              <textarea className="adm-link" readOnly value={link || '고객사명을 입력하고 Scope Item을 1개 이상 선택하면 링크가 만들어집니다.'} onFocus={(e) => e.target.select()} />
              <div className="adm-row">
                <button className="f-btn f-btn-emph" disabled={!link} onClick={async () => flash((await copyText(link)) ? '링크를 복사했습니다' : '복사하지 못했습니다 – 링크를 직접 선택해 복사해 주세요')}><Icon name="copy" /> 링크 복사</button>
                <button className="f-btn" disabled={!link} onClick={() => window.open(`${link}?preview=1`, '_blank', 'noopener')}><Icon name="show" /> 미리보기 (새 탭)</button>
                <button className="f-btn" disabled={!prof} onClick={doSave}><Icon name="save" /> {presetId ? '저장 (덮어쓰기)' : '고객 링크 저장'}</button>
                {presetId && <button className="f-btn" onClick={() => { setPresetId(null); setCustomer(''); setMessage(''); setSel([]); }}>새 고객</button>}
                <span className="adm-muted">{note}</span>
              </div>
              {link && <div className="adm-muted" style={{ marginTop: 6 }}>링크 길이 {link.length.toLocaleString()}자 · 메일·메신저로 그대로 보내면 됩니다. 미리보기는 이 탭의 데모 데이터에 영향을 주지 않습니다.</div>}
            </section>

            <section className="adm-card">
              <h2><Icon name="role" /> 저장된 고객 링크</h2>
              <p className="adm-sub">이 브라우저에만 저장됩니다.</p>
              <div className="adm-presets">
                {presets.length === 0 && <div className="adm-muted">아직 저장된 고객 링크가 없습니다.</div>}
                {presets.map((p) => (
                  <div key={p.id} className="adm-preset">
                    <span className="grow"><b>{p.customer}</b><small>{p.codes.join(' · ')} · {new Date(p.createdAt).toLocaleDateString('ko-KR')}</small></span>
                    <button className="adm-icon-btn" title="불러와서 편집" onClick={() => doLoad(p)}><Icon name="edit" /></button>
                    <button className="adm-icon-btn" title="링크 복사" onClick={async () => flash((await copyText(customerLink(p))) ? `'${p.customer}' 링크를 복사했습니다` : '복사하지 못했습니다')}><Icon name="copy" /></button>
                    <button className="adm-icon-btn" title="삭제" onClick={() => { remove(p.id); if (presetId === p.id) setPresetId(null); }}><Icon name="delete" /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      <footer className="setup-foot">
        <span className="adm-muted">전체 Scope Item {CATALOG.reduce((a, g) => a + g.items.length, 0)}개 중 시연 가능 {SCENARIOS.length}개</span>
        <span className="dbar-spacer" />
        <button className="f-btn" onClick={() => nav('/setup')}>데모 환경 설정</button>
        <button className="f-btn f-btn-emph f-btn-lg" onClick={() => nav('/')}>데모로 돌아가기 <Icon name="navigation-right-arrow" /></button>
      </footer>
    </div>
  );
}
