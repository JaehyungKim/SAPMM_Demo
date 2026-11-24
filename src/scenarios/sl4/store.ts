/** SL4 – Supplier Evaluation and Performance Monitoring: steps, sample data and chain. */
import { makeChain, step, type ChainOpts } from '../shared/chain';
import { rnd } from '../shared/persist';

export const SUP = { no: '10300001', name: 'Domestic 10 Supplier 1', city: 'Hamburg' };
/** Criterion weights from the BPD example (total 100 %). */
export const WEIGHTS = [
  { k: 'lot', label: '품질 – 검사 로트', w: 10 }, { k: 'qty', label: '수량', w: 20 }, { k: 'time', label: '시간(납기)', w: 20 },
  { k: 'price', label: '가격', w: 20 }, { k: 'quest', label: '설문', w: 10 }, { k: 'qn', label: '품질 통지', w: 10 },
  { k: 'ret', label: '반품 (사용자 정의)', w: 4 }, { k: 'disc', label: '합리적 할인 (사용자 정의)', w: 1 }, { k: 'ppm', label: 'PPM (사용자 정의)', w: 5 },
];
/** Operational scores per supplier (0–100). */
export const OPS = [
  { no: '10300001', name: 'Domestic 10 Supplier 1', qty: 100, price: 95, time: 90, lot: 92, qn: 90 },
  { no: '10300002', name: 'Domestic 10 Supplier 2', qty: 96, price: 88, time: 72, lot: 85, qn: 80 },
  { no: '10300003', name: 'Domestic 10 Supplier 3', qty: 90, price: 80, time: 65, lot: 70, qn: 60 },
];
export const QUESTIONS = [
  { k: 'q1', text: '납기 약속을 지켰습니까?', type: 'Yes/No', score: 100 },
  { k: 'q2', text: '문의 응답 속도는 어떻습니까?', type: '단일 선택 (1–5)', score: 80 },
  { k: 'q3', text: '품질 문제 개선 조치가 충분했습니까?', type: '단일 선택 (1–5)', score: 90 },
];
export const QUEST_SCORE = Math.round(QUESTIONS.reduce((a, q) => a + q.score, 0) / QUESTIONS.length);
export const classOf = (s: number) => (s >= 80 ? 'A' : s >= 60 ? 'B' : 'C');

export const STEPS = [
  step(0, 'launchpad', 'SAP Fiori Launchpad 홈', 'Home', '2.1', 'Home', 'Shell', 'S000', 'Purchaser', false, 'none'),
  step(1, 'weighting', '평가 가중치·점수 규칙 생성', 'Create Supplier Evaluation Weighting and Scoring', '4.1.1', 'Supplier Evaluation Weighting and Scoring', 'F2551', 'F2551', 'Purchaser', false, 'none'),
  step(2, 'opeval', '운영 공급업체 평가 확인', 'Operational Supplier Evaluation', '4.1.7', 'Operational Supplier Evaluation - Based on Score and Variance', 'F1662A', 'F1662A', 'Purchaser', true, 'weighting'),
  step(3, 'adjust', '운영 평가 점수 수동 조정', 'Adjust Supplier Evaluation Scores Manually', '4.1.9', 'Adjust Operational Supplier Evaluation Score', 'F2312', 'F2312', 'Purchaser', true, 'opeval'),
  step(4, 'questionnaire', '평가 설문지 생성·릴리스', 'Create Evaluation Questionnaire', '4.2.2', 'Manage Evaluation Questionnaires - Evaluation', 'F2194', 'F2194', 'Purchaser', false, 'none'),
  step(5, 'request', '그룹 평가 템플릿·평가 요청', 'Create Template and Start Group-Based Evaluation', '4.2.3 / 4.2.4', 'Manage Evaluation Templates - Evaluation', 'F2193', 'F2193', 'Purchaser', false, 'questionnaire'),
  step(6, 'respond', '평가자 응답 (설문 작성)', 'Maintain Evaluation Response as Appraiser', '4.2.5', 'Evaluate Suppliers', 'F1650', 'F1650', 'Employee', false, 'request'),
  step(7, 'scorecard', '스코어카드 확인', 'Display Scorecards', '4.2.6', 'Display Scorecards - Evaluation Questionnaires', 'F2191', 'F2191', 'Purchaser', true, 'respond'),
  step(8, 'overall', '종합 공급업체 평가 점수', 'Display Overall Supplier Evaluation Score', '4.3.3', 'Overall Supplier Evaluation - Score', 'F2019', 'F2019', 'Purchaser', true, 'respond'),
  step(9, 'output', '평가 점수 공급업체 발송', 'Output Supplier Evaluation Score', '4.4.2', 'Supplier Evaluation Score Output', 'F5061', 'F5061', 'Purchaser', true, 'respond'),
];

export const OPTS: ChainOpts = {
  scn: 'sl4',
  numbers: () => ({ quest: String(rnd(100, 999)), tmpl: String(rnd(1000, 1999)), req: String(rnd(2000, 2999)), resp: String(rnd(3000, 3999)), out: String(rnd(4000, 4999)) }),
  msgs: {
    weighting: () => '가중치 및 점수 규칙이 저장되었습니다',
    adjust: () => '운영 평가 점수가 조정되었습니다',
    questionnaire: (n) => `설문지 ${n.quest}이(가) 릴리스되었습니다`,
    request: (n) => `그룹 기반 평가 요청 ${n.req}이(가) 제출되었습니다`,
    respond: (n) => `평가 응답 ${n.resp}이(가) 제출되었습니다`,
    output: (n) => `평가 점수 출력 ${n.out}이(가) 발송되었습니다`,
  },
};

export const useSl4 = makeChain(OPTS);
