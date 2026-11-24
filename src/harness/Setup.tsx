/**
 * "데모 환경 설정" landing page. Every value here propagates reactively to all screens.
 * Defaults follow the J45_DE BPD sample data (company code / plant 1010, TG0011, supplier 10300003).
 */
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui5/webcomponents-react';
import { defaultConfig, useDemo, netValue, DemoConfig } from '../store';
import { STEPS } from '../steps';
import { addDays, daysBetween, fmtAmt, fmtDate, todayIso } from '../format';
import { SapLogo } from '../components/fiori/Fiori';

/** 'lead' = date entered as days from today, so the demo always runs relative to the presentation day. */
type Field = { k: keyof DemoConfig; label: string; type?: 'number' | 'lead' | 'text'; hint?: string };

const GROUPS: { title: string; icon: string; fields: Field[] }[] = [
  { title: '회사 및 조직', icon: 'building', fields: [
    { k: 'companyName', label: '회사명' },
    { k: 'companyCode', label: '회사 코드' },
    { k: 'purchasingOrg', label: '구매 조직' },
    { k: 'purchasingGroup', label: '구매 그룹', hint: '003 + 500 EUR 초과 시 BPD 승인 워크플로 조건' },
    { k: 'plant', label: '플랜트' },
    { k: 'plantName', label: '플랜트 이름' },
    { k: 'storageLocation', label: '저장 위치' },
  ] },
  { title: '공급업체', icon: 'supplier', fields: [
    { k: 'supplierNumber', label: '공급업체 번호' },
    { k: 'supplierName', label: '공급업체 이름' },
    { k: 'supplierCity', label: '도시' },
  ] },
  { title: '자재 및 오더', icon: 'product', fields: [
    { k: 'materialNumber', label: '자재 번호' },
    { k: 'materialDescription', label: '자재 내역' },
    { k: 'materialGroup', label: '자재 그룹' },
    { k: 'quantity', label: '발주 수량', type: 'number' },
    { k: 'unit', label: '단위' },
    { k: 'netPrice', label: '순 단가', type: 'number' },
    { k: 'currency', label: '통화' },
    { k: 'deliveryDate', label: '납기 (오늘 +일)', type: 'lead' },
  ] },
  { title: '조건 및 회계', icon: 'accounting-document-verification', fields: [
    { k: 'paymentTerms', label: '지급 조건', hint: '0001 / 0002 / 0003' },
    { k: 'incoterms', label: '인코텀즈' },
    { k: 'taxCode', label: '세금 코드' },
    { k: 'glInventory', label: 'G/L 재고 (상품)', hint: '고객 시스템 계정과목표로 확인' },
    { k: 'glGrir', label: 'G/L GR/IR 청산', hint: '고객 시스템 계정과목표로 확인' },
    { k: 'glPayables', label: 'G/L 매입채무 (조정)', hint: '고객 시스템 계정과목표로 확인' },
  ] },
];

export function Setup() {
  const s = useDemo();
  const nav = useNavigate();
  const c = s.config;
  const today = todayIso();
  const set =(k: keyof DemoConfig, v: string, type?: string) => s.setConfig({ [k]: type === 'number' ? Number(v) || 0 : v } as Partial<DemoConfig>);
  const start = () => { s.finishSetup(); nav('/step/launchpad'); };
  const docsExist = s.poStatus !== 'None';

  return (
    <div className="setup">
      <header className="setup-head">
        <SapLogo h={30} />
        <div>
          <h1>데모 환경 설정</h1>
          <p>SAP S/4HANA Cloud Public Edition · Scope Item J45 – 직접 자재 조달 (Procurement of Direct Materials) · 2608</p>
        </div>
      </header>
      <div className="setup-body">
        <div className="setup-grid">
          {GROUPS.map((g) => (
            <section key={g.title} className="setup-card">
              <h2><Icon name={g.icon} /> {g.title}</h2>
              {g.fields.map((f) => f.type === 'lead' ? (
                <label key={f.k} className="setup-field">
                  <span>{f.label}</span>
                  <input type="number" min={0} value={daysBetween(today, c.deliveryDate)}
                    onChange={(e) => s.setConfig({ deliveryDate: addDays(today, Math.max(0, Number(e.target.value) || 0)) })} />
                  <small>= {fmtDate(c.deliveryDate, c.dateFormat)} · 데모를 여는 날 기준으로 자동 계산</small>
                </label>
              ) : (
                <label key={f.k} className="setup-field">
                  <span>{f.label}</span>
                  <input type={f.type ?? 'text'} value={String(c[f.k])} onChange={(e) => set(f.k, e.target.value, f.type)} />
                  {f.hint && <small>{f.hint}</small>}
                </label>
              ))}
            </section>
          ))}
          <section className="setup-card">
            <h2><Icon name="action-settings" /> 데모 옵션</h2>
            <label className="setup-field">
              <span>날짜 형식</span>
              <select value={c.dateFormat} onChange={(e) => s.setConfig({ dateFormat: e.target.value as 'KR' | 'SAP' })}>
                <option value="KR">한국식 YYYY.MM.DD</option>
                <option value="SAP">SAP 표준 DD.MM.YYYY</option>
              </select>
            </label>
            <label className="setup-field">
              <span>시작 UI 모드</span>
              <select value={s.viewMode} onChange={(e) => s.setViewMode(e.target.value as 'fiori' | 'sapgui')}>
                <option value="fiori">SAP Fiori</option>
                <option value="sapgui">SAP GUI</option>
              </select>
            </label>
            <div className="setup-opt-title">선택 단계 포함</div>
            {STEPS.filter((x) => x.optional).map((x) => (
              <label key={x.id} className="setup-check">
                <input type="checkbox" checked={s.optionalEnabled[x.id]} onChange={(e) => s.setOptional(x.id, e.target.checked)} />
                {x.no}. {x.title} {x.id === 'approve-po' && <small>(유연한 워크플로 승인)</small>}
              </label>
            ))}
          </section>
        </div>
      </div>
      <footer className="setup-foot">
        <div className="setup-total">순 오더 금액 <b>{fmtAmt(netValue(c), c.currency)}</b> <span>({c.quantity} {c.unit} × {c.netPrice} {c.currency})</span></div>
        {docsExist && <span className="setup-warn">진행 중인 문서 체인이 있습니다 – 변경 사항은 모든 화면에 즉시 반영됩니다.</span>}
        <span className="dbar-spacer" />
        <button className="f-btn" onClick={() => s.setConfig(defaultConfig())}>기본값 복원</button>
        <button className="f-btn f-btn-emph f-btn-lg" onClick={start}>{s.configured ? '데모로 돌아가기' : '데모 시작'} <Icon name="navigation-right-arrow" /></button>
      </footer>
    </div>
  );
}
