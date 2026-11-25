/** SL4 – Supplier Evaluation and Performance Monitoring: definition, guide and briefing. */
import { jo } from '../../josa';
import { ROLE_USER } from '../../steps';
import type { Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { OPTS, QUEST_SCORE, STEPS, SUP, useSl4 } from './store';

function useGuide(id: string) {
  const s = useSl4();
  const n = s.numbers;
  const d = (k: string) => !!s.done[k];
  switch (id) {
    case 'weighting': return GX('원자재 공급업체를 같은 기준으로 평가하기 위해 기준별 가중치를 정합니다.', [
      L('가중치 합계 100% 설명', '수량·가격·시간 각 20%, 품질·설문 10% 등 회사 정책에 맞게 배분합니다.'),
      L('점수 규칙 설명', '예: 3일 지연이면 시간 점수 90점 – 편차를 점수로 바꾸는 규칙입니다.'),
      B('저장', '💾 저장', '이후 PO·입고·송장 데이터로 운영 점수가 자동 계산됩니다.', d('weighting')),
    ], '감이 아닌 데이터와 합의된 기준으로 공급업체를 평가합니다.');
    case 'opeval': return GX('시스템이 계산한 운영 점수를 확인합니다.', [
      L('기준별 점수 설명', '수량·가격·시간·품질 편차가 공급업체별 점수로 나타납니다.'),
      B('차원: 추세', '📈 추세', '기간별 추세를 봅니다.', !!s.vals.trend),
    ], '납기·가격 문제가 있는 공급업체가 한눈에 보입니다.');
    case 'adjust': return GX('공급업체 귀책이 아닌 납기 지연이 있었습니다. 점수를 수동으로 바로잡습니다.', [
      B('확인', '💾 저장', '조정 사유와 함께 점수가 기록됩니다.', d('adjust')),
    ], '예외 상황을 공정하게 반영합니다.');
    case 'questionnaire': return GX('숫자로 측정하기 어려운 협업·대응 품질은 설문으로 평가합니다.', [
      B('저장', '💾 저장', '질문·유형·필수 여부를 담은 설문지를 저장합니다.', !!s.vals.qSaved || d('questionnaire')),
      B('릴리스', '📤 릴리스', `설문지 ${jo(n.quest, '을')} 평가에 쓸 수 있게 합니다.`, d('questionnaire')),
    ], '정성 평가도 표준화된 설문으로 일관되게 수집합니다.');
    case 'request': return GX(`현업 평가자 ${ROLE_USER.Employee.name}에게 분기 평가를 요청합니다.`, [
      L('평가자·기간 설명', '평가자에게 이메일과 작업이 전달됩니다.'),
      B('평가 요청 제출', '📤 요청 제출', `평가 요청 ${jo(n.req, '이')} 제출됩니다.`, d('request')),
    ], '평가 요청과 응답이 시스템에서 추적됩니다.');
    case 'respond': return GX(`${jo(ROLE_USER.Employee.name, '이')} 받은 평가 요청에 응답합니다.`, [
      B('제출', '📤 제출', `설문 점수 ${QUEST_SCORE}점이 반영됩니다.`, d('respond')),
    ], '실제 협업한 현업의 목소리가 평가에 들어갑니다.');
    case 'scorecard': return GX('제출된 응답으로 만들어진 스코어카드를 봅니다.', [
      L('질문별 점수 설명', '어느 부분이 강점·약점인지 바로 보입니다.'),
    ], '개선 과제를 구체적으로 찾습니다.');
    case 'overall': return GX('운영 점수와 설문 점수를 합친 종합 점수를 봅니다.', [
      L('종합 점수·등급 설명', 'A/B/C 등급으로 전략 공급업체와 개선 대상을 구분합니다.'),
    ], '공급업체 포트폴리오를 객관적으로 관리합니다.');
    case 'output': return GX(`평가 결과를 공급업체 ${SUP.no}에 공유합니다.`, [
      B('활성 점수 생성·발송', '📧 발송', '이메일로 점수가 발송되고 출력 이력이 남습니다.', d('output')),
    ], '공급업체와 투명하게 성과를 논의합니다.');
    default: return launchGuide('sl4', STEPS, `구매팀이 주요 공급업체 ${SUP.name}의 성과를 평가하려 합니다.`, '운영 데이터와 설문을 합친 공급업체 평가 체계입니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '운영 데이터와 설문을 합쳐 공급업체 성과를 점수로 관리합니다.',
    story: <>구매 범주별 가중치를 정하면 PO·입고·송장 데이터로 <b>운영 점수</b>가 계산되고, 현업 평가자의 <b>설문 점수</b>와 합쳐 <b>{SUP.name}</b>의 종합 점수와 등급이 나옵니다.</>,
    phases: [
      { icon: 'action-settings', t: '기준', d: '가중치 · 점수 규칙' },
      { icon: 'monitor-payments', t: '운영 평가', d: '자동 계산 · 수동 조정' },
      { icon: 'survey', t: '설문 평가', d: '설문지 · 요청 · 응답' },
      { icon: 'paper-plane', t: '결과', d: '스코어카드 · 종합 · 발송' },
    ],
    cast: [
      { role: 'Purchaser', does: '가중치 · 설문 · 평가 요청 · 결과', steps: '1–5, 7–9' },
      { role: 'Employee', does: '평가자 응답', steps: '6' },
    ],
  };
}

export const SEV = defineChain({
  id: 'sl4', code: 'SL4', title: '공급업체 평가', titleEn: 'Supplier Evaluation and Performance Monitoring',
  summary: '가중치 → 운영 평가 → 설문 평가 → 종합 점수 → 공급업체 발송',
  source: 'SL4_S4HANA2025-FPS2_BPD', steps: STEPS, load: () => import('./screens'), use: useSl4, opts: OPTS,
  view: ['opeval', 'scorecard', 'overall'],
  summaryOf: (s) => [
    { label: '설문지', value: s.done.questionnaire ? s.numbers.quest : '–' },
    { label: '평가 요청', value: s.done.request ? s.numbers.req : '–' },
    { label: '설문 점수', value: s.done.respond ? String(QUEST_SCORE) : '–' },
  ],
  useGuide, useBriefing,
});
