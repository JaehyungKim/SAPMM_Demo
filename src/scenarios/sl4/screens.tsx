/** SL4 – Supplier Evaluation screens (Fiori + SAP GUI from one spec per step). */
import { addDays, fmtDate, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { ROLE_USER } from '../../steps';
import { useOrg } from '../types';
import { autoLaunchpad, pair } from '../shared/kit';
import { OPS, QUESTIONS, QUEST_SCORE, STEPS, SUP, WEIGHTS, classOf, useSl4 } from './store';

const SUPT = `${SUP.name} (${SUP.no})`;
const use = () => { const s = useSl4(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };
type Op = (typeof OPS)[number];
/** Operational score = weighted mean of the operational criteria. */
const opScore = (o: Op, adj = 0) => Math.round((o.qty * 20 + o.price * 20 + (o.time + adj) * 20 + o.lot * 10 + o.qn * 10) / 80);

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>공급업체 평가는 <b>가중치 설정</b> → <b>운영 평가</b> → <b>설문 평가</b> → <b>종합 점수·발송</b> 순서입니다.</>);

export const [weightingF, weightingG] = pair(() => {
  const { s, d } = use();
  const total = WEIGHTS.reduce((a, w) => a + w.w, 0);
  return {
    app: '공급업체 평가 가중치 및 점수', appId: 'F2551', title: '가중치 및 점수 – 구매 범주: 원자재', gtitle: '공급업체 평가 가중치 및 점수',
    kpis: [{ label: '가중치 합계', value: `${total} %` }],
    fields: [
      { label: '구매 범주', value: '원자재 (Raw Materials)', help: 'weighting' }, { label: '분류', value: 'A 80–100 · B 60–79 · C 1–59' },
      { label: '수량 규칙', value: '편차 0 % → 100점' }, { label: '시간 규칙', value: '3일 지연 → 90점' },
      { label: '가격 규칙', value: '편차 2 % → 95점' }, { label: '품질 통지 규칙', value: '통지 5건 → 90점' },
    ],
    tables: [{ title: '평가 기준', rows: WEIGHTS, rowKey: (r) => r.k, cols: [
      { key: 'a', label: '활성', w: 50, render: () => '☑' }, { key: 'l', label: '기준', w: 200, render: (r) => r.label },
      { key: 'w', label: '가중치', w: 80, align: 'right', render: (r) => `${r.w} %` },
    ] }],
    footer: true, done: d('weighting'), doneMsg: '가중치와 점수 규칙이 저장되었습니다 – 이제 PO·입고·송장 데이터로 운영 점수가 자동 계산됩니다.',
    actions: [{ label: '저장', gui: '💾 저장', disabled: d('weighting'), onClick: () => s.mark('weighting'), toast: '가중치 저장' }],
  };
});

export const [opevalF, opevalG] = pair(() => {
  const { s, d } = use();
  const adj = d('adjust') ? 10 : 0;
  return {
    app: '운영 공급업체 평가', appId: 'F1662A', title: '운영 공급업체 평가 – 점수 및 편차', gtitle: '운영 공급업체 평가',
    kpis: [{ label: `${SUP.no} 운영 점수`, value: String(opScore(OPS[0])) }],
    tables: [{ title: '공급업체별 점수', rows: OPS, rowKey: (r) => r.no, cols: [
      { key: 'n', label: '공급업체', w: 200, render: (r) => `${r.name} (${r.no})` },
      { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty }, { key: 'p', label: '가격', w: 60, align: 'right', render: (r) => r.price },
      { key: 't', label: '시간', w: 60, align: 'right', render: (r) => r.time + (r.no === OPS[1].no ? adj : 0) },
      { key: 'l', label: '검사 로트', w: 70, align: 'right', render: (r) => r.lot }, { key: 'qn', label: '품질 통지', w: 70, align: 'right', render: (r) => r.qn },
      { key: 'o', label: '운영 점수', w: 80, align: 'right', render: (r) => <b>{opScore(r, r.no === OPS[1].no ? adj : 0)}</b> },
    ] }],
    info: s.vals.trend ? '추세: 최근 6개월 운영 점수가 안정적으로 유지되고 있습니다 (PO 품목 128건 · PO 41건).' : '차원을 바꿔 추세·구매 그룹·자재 그룹별로 볼 수 있습니다.',
    actions: [{ label: '차원: 추세', gui: '📈 추세', disabled: !!s.vals.trend, onClick: () => s.setVal('trend', true) }],
  };
});

export const [adjustF, adjustG] = pair(() => {
  const { s, d } = use();
  const o = OPS[1];
  return {
    app: '운영 공급업체 평가 점수 조정', appId: 'F2312', title: `PO 4500001234 / 10 – ${o.name}`, gtitle: '운영 평가 점수 조정',
    fields: [{ label: '공급업체', value: `${o.name} (${o.no})` }, { label: '기준', value: '시간 (납기)' }, { label: '현재 점수', value: String(o.time) },
      { label: '새 점수', value: String(o.time + 10) }, { label: '설명', value: '공장 휴무로 인한 지연 – 공급업체 귀책 아님' }],
    footer: true, done: d('adjust'), doneMsg: `${o.name}의 시간 점수가 ${o.time} → ${o.time + 10}으로 조정되었습니다 (사유 기록됨).`,
    actions: [{ label: '확인', gui: '💾 저장', disabled: d('adjust'), onClick: () => s.mark('adjust'), toast: '점수 조정' }],
  };
});

export const [questionnaireF, questionnaireG] = pair(() => {
  const { s, n, d } = use();
  const saved = !!s.vals.qSaved || d('questionnaire');
  return {
    app: '평가 설문지 관리', appId: 'F2194', title: saved ? `설문지 ${n.quest} – 원자재 공급업체 정기 평가` : '새 설문지', gtitle: '평가 설문지 유지보수',
    status: d('questionnaire') ? ['Positive', '릴리스됨'] : saved ? ['Information', '저장됨'] : undefined,
    fields: [{ label: '설문지 이름', value: '원자재 공급업체 정기 평가', help: 'questionnaire' }, { label: '구매 범주', value: '원자재' }, { label: '목표 / 최소 점수', value: '80 / 60' }],
    tables: [{ title: '섹션: 협업 · 품질', rows: QUESTIONS, rowKey: (r) => r.k, cols: [
      { key: 't', label: '질문', w: 280, render: (r) => r.text }, { key: 'ty', label: '유형', w: 120, render: (r) => r.type },
      { key: 'm', label: '필수', w: 50, render: () => '☑' },
    ] }],
    footer: true, done: d('questionnaire'), doneMsg: `설문지 ${n.quest}이(가) 릴리스되었습니다 – 평가 템플릿에 사용할 수 있습니다.`,
    actions: [
      { label: '저장', gui: '💾 저장', disabled: saved, onClick: () => s.setVal('qSaved', true), toast: '설문지 저장' },
      { label: '릴리스', gui: '📤 릴리스', disabled: !saved || d('questionnaire'), onClick: () => s.mark('questionnaire'), toast: '릴리스' },
    ],
  };
});

export const [requestF, requestG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '평가 템플릿 관리', appId: 'F2193', title: `템플릿 ${n.tmpl} – 그룹 기반 평가`, gtitle: '그룹 기반 평가 요청: 신규',
    status: d('request') ? ['Positive', '요청 제출됨'] : ['Information', '릴리스됨'],
    fields: [
      { label: '공급업체', value: SUPT, help: 'supplier' }, { label: '설문지', value: `${n.quest} 원자재 공급업체 정기 평가` },
      { label: '평가자', value: `${ROLE_USER.Employee.name} (EMPLOYEE_PROCURE)` },
      { label: '평가 기간', value: `${fmtDate(addDays(todayIso(), -90), c.dateFormat)} ~ ${fmtDate(todayIso(), c.dateFormat)}` },
      { label: '평가 요청 이름', value: `분기 평가 ${SUP.no}` },
    ],
    footer: true, done: d('request'), doneMsg: `평가 요청 ${n.req}이(가) 제출되었습니다 – 평가자에게 이메일과 작업이 전달되었습니다.`,
    actions: [{ label: '평가 요청 제출', gui: '📤 요청 제출', disabled: d('request'), onClick: () => s.mark('request'), toast: `요청 ${n.req}` }],
  };
});

export const [respondF, respondG] = pair(() => {
  const { s, n, d } = use();
  return {
    app: '공급업체 평가', appId: 'F1650', title: `평가 응답 ${n.resp} – 분기 평가 ${SUP.no}`, gtitle: '공급업체 평가 응답',
    sub: `${ROLE_USER.Employee.name} · 평가자`,
    status: d('respond') ? ['Positive', '제출됨'] : ['Critical', '신규'],
    tables: [{ title: '질문', rows: QUESTIONS, rowKey: (r) => r.k, cols: [
      { key: 't', label: '질문', w: 280, render: (r) => r.text },
      { key: 'a', label: '응답', w: 120, render: (r) => (r.type === 'Yes/No' ? '예' : `${Math.round(r.score / 20)} / 5`) },
      { key: 's', label: '점수', w: 60, align: 'right', render: (r) => r.score },
    ] }],
    footer: true, done: d('respond'), doneMsg: `평가 응답이 제출되었습니다 – 설문 점수 ${QUEST_SCORE}점.`,
    actions: [{ label: '제출', gui: '📤 제출', disabled: d('respond'), onClick: () => s.mark('respond'), toast: '응답 제출' }],
  };
});

export const [scorecardF, scorecardG] = pair(() => {
  const { n } = use();
  return {
    app: '스코어카드 표시', appId: 'F2191', title: `스코어카드 – ${SUP.name}`, gtitle: '평가 스코어카드',
    kpis: [{ label: '설문 점수', value: <>{QUEST_SCORE}<Help k="scorecard" /></> }, { label: '목표 / 최소', value: '80 / 60' }],
    tables: [{ title: `응답 ${n.resp}`, rows: QUESTIONS, rowKey: (r) => r.k, cols: [
      { key: 't', label: '질문', w: 300, render: (r) => r.text }, { key: 's', label: '점수', w: 60, align: 'right', render: (r) => r.score },
    ] }],
    info: '여러 평가자의 응답이 모이면 스코어카드에서 평균과 편차를 함께 봅니다.',
  };
});

export const [overallF, overallG] = pair(() => {
  const { d } = use();
  const rows = OPS.map((o, i) => {
    const op = opScore(o, d('adjust') && i === 1 ? 10 : 0);
    const q = i === 0 ? QUEST_SCORE : null;
    const overall = q === null ? op : Math.round((op * 80 + q * 10) / 90);
    return { ...o, op, q, overall };
  });
  return {
    app: '종합 공급업체 평가 - 점수', appId: 'F2019', title: '종합 공급업체 평가', gtitle: '종합 공급업체 평가 점수',
    tables: [{ title: '공급업체별 종합 점수', rows, rowKey: (r) => r.no, cols: [
      { key: 'n', label: '공급업체', w: 200, render: (r) => `${r.name} (${r.no})` },
      { key: 'o', label: '운영 점수', w: 80, align: 'right', render: (r) => r.op }, { key: 'q', label: '설문 점수', w: 80, align: 'right', render: (r) => r.q ?? '–' },
      { key: 't', label: '종합 점수', w: 80, align: 'right', render: (r) => <b>{r.overall}</b> }, { key: 'c', label: '등급', w: 50, render: (r) => classOf(r.overall) },
    ] }],
    info: '운영 데이터(수량·가격·납기·품질)와 설문 결과가 하나의 점수로 합쳐져 공급업체를 같은 기준으로 비교합니다.',
  };
});

export const [outputF, outputG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '공급업체 평가 점수 출력', appId: 'F5061', title: '활성 점수 생성 및 발송', gtitle: '공급업체 평가 점수 출력',
    fields: [{ label: '공급업체', value: SUPT }, { label: '평가 기간', value: `${fmtDate(addDays(todayIso(), -365), c.dateFormat)} ~ ${fmtDate(todayIso(), c.dateFormat)}` }, { label: '통화', value: c.currency }, { label: '출력 채널', value: '이메일 · 인쇄' }],
    done: d('output'), doneMsg: `출력 ${n.out}이(가) 공급업체 이메일로 발송되었습니다 – 공급업체와 개선 과제를 논의할 근거가 됩니다.`,
    actions: [{ label: '활성 점수 생성·발송', gui: '📧 발송', disabled: d('output'), onClick: () => s.mark('output'), toast: '점수 발송' }],
  };
});
