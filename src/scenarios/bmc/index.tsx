/** BMC – Core Inventory Management: scenario definition, guide and briefing. */
import type { Briefing } from '../types';
import { B, GX, L, defineChain, launchGuide } from '../shared/define';
import { MAT, MOVES, OPTS, STEPS, moveOf, stockOf, useBmc } from './store';

const WHY: Record<string, [string, string]> = {
  init: ['반품 저장 위치 101R에 처음 재고를 올립니다 (시연 준비 단계).', '이후 폐기·이전 단계에서 쓸 재고가 생깁니다.'],
  grnoref: ['PO 없이 들어온 물품(샘플·무상 공급)을 재고로 받습니다.', '참조 문서 없이도 공급업체를 기록해 추적할 수 있습니다.'],
  scrapcopa: ['고객이 반품한 불량품을 폐기합니다.', '폐기 손실이 CO-PA에 반영되어 고객·제품별 수익성에 나타납니다.'],
  scrapcc: ['손상된 재고를 폐기하고 비용을 코스트 센터에 부담시킵니다.', '재고 앱 한 화면에서 폐기와 비용 처리가 끝납니다.'],
  block: ['재작업이 필요한 재고를 쓰지 못하게 막습니다.', '보류 재고는 출고와 MRP에서 제외됩니다.'],
  unblock: ['재작업이 끝난 재고를 다시 사용할 수 있게 합니다.', 'MRP와 출고에 다시 포함됩니다.'],
  toqi: ['보류 재고 일부를 품질 검사로 보냅니다.', '검사 결과가 나올 때까지 사용은 못 하지만 MRP에는 포함됩니다.'],
  transfer1: ['같은 플랜트 안에서 저장 위치를 옮깁니다.', '한 번의 전기로 이전이 끝납니다.'],
  remove: ['저장 위치가 멀어 이동에 시간이 걸립니다. 보내는 쪽에서 먼저 출고합니다.', '이동 중 재고가 따로 보여 분실·누락을 막습니다.'],
  place: ['받는 쪽에서 물품을 확인하고 입고합니다.', '이전 중 재고가 가용 재고로 바뀝니다.'],
};

function useGuide(id: string) {
  const s = useBmc();
  const d = (k: string) => !!s.done[k];
  if (WHY[id]) {
    const m = moveOf(id);
    const [sit, why] = WHY[id];
    return GX(sit, [
      L(`이동 유형 ${m.mvt}·재고 표 설명`, `${m.text} ${m.qty} PC – 아래 표가 전기 전후 재고를 보여 줍니다.`),
      B('전기', ['init', 'scrapcc', 'block', 'unblock', 'toqi', 'transfer1', 'remove', 'place'].includes(id) ? '💾 전기' : '전기', why, d(id)),
    ], '재고 수량과 가치가 전기 즉시 정확히 반영됩니다.');
  }
  const total = stockOf(s.done).reduce((a, r) => a + r.total, 0);
  switch (id) {
    case 'overview': return GX('지금까지 한 이동의 결과를 확인합니다.', [
      L('저장 위치·재고 유형별 수량 설명', `플랜트 총 재고 ${total} PC가 가용·품질 검사·보류·이전 중으로 나뉘어 보입니다.`),
    ], '재고가 어디에 어떤 상태로 있는지 한눈에 봅니다.');
    case 'matdocs': return GX('전기한 자재 전표를 찾아봅니다.', [
      L('자재 전표 목록 설명', `이 시나리오에서 전기한 ${MOVES.filter((m) => s.done[m.id]).length}건이 이동 유형과 함께 보입니다.`),
    ], '모든 재고 변동의 근거가 전표로 남습니다.');
    case 'slow': return GX('재고 관리자가 오래 소비되지 않은 자재를 점검합니다.', [B('실행', '▶ 실행', '90일 이상 소비가 없는 재고를 찾습니다.', d('slow'))], '재고 회전율을 높이고 보관 비용을 줄입니다.');
    case 'dead': return GX('1년간 움직임이 없는 불용 재고를 찾습니다.', [B('실행', '▶ 실행', '기초·기말 가치와 무이동 일수를 봅니다.', d('dead'))], '재고 감액·처분 의사 결정을 돕습니다.');
    case 'gma': return GX('재고 이동 패턴을 분석합니다.', [B('측정값 추가: 이동 건수', '＋ 이동 건수', '이동 유형별 건수를 추가합니다.', d('gma'))], '반복 수작업과 프로세스 개선점을 찾습니다.');
    case 'range': return GX('기간 시작·종료 시점 재고를 비교합니다.', [B('실행 (최근 30일)', '▶ 최근 30일', '최근 30일 재고 변동을 봅니다.', d('range'))], '기간별 재고 증감을 근거와 함께 설명할 수 있습니다.');
    default: return launchGuide('bmc', STEPS, `창고에서 상품 ${MAT}의 입고·폐기·보류·이전을 처리합니다.`, '재고 관리의 기본 업무를 Fiori 앱으로 처리합니다.');
  }
}

function useBriefing(): Briefing {
  return {
    headline: '입고·폐기·재고 유형 변경·저장 위치 이전과 재고 분석까지 – 핵심 재고 관리 업무입니다.',
    story: <>상품 <b>{MAT}</b> 하나로 참조 없는 입고, 폐기(CO-PA·코스트 센터), 보류·해제·품질 검사, 1단계·2단계 이전을 차례로 전기하고, 재고 현황·자재 전표·저회전·불용 재고 분석으로 결과를 확인합니다.</>,
    phases: [
      { icon: 'shipping-status', t: '입고 · 폐기', d: '501 · 551 (CO-PA / 코스트 센터)' },
      { icon: 'inventory', t: '재고 유형', d: '보류 344 · 해제 343 · 품질 검사 350' },
      { icon: 'outbox', t: '이전', d: '1단계 311 · 2단계 313/315' },
      { icon: 'monitor-payments', t: '조회 · 분석', d: '재고 현황 · 전표 · 저회전 · 불용' },
    ],
    cast: [
      { role: 'Warehouse Clerk', does: '입고 · 재고 이전 · 조회', steps: '2, 5–12' },
      { role: 'Inventory Manager', does: '초기 재고 · 폐기 · 재고 분석', steps: '1, 3–4, 13–16' },
    ],
  };
}

export const CIM = defineChain({
  id: 'bmc', code: 'BMC', title: '핵심 재고 관리', titleEn: 'Core Inventory Management',
  summary: '참조 없는 입고 → 폐기 → 보류·해제 → 저장 위치 이전 → 재고 조회·분석',
  source: 'BMC_S4HANA2025-FPS2_BPD', steps: STEPS, load: () => import('./screens'), use: useBmc, opts: OPTS,
  view: ['overview', 'matdocs'], tcodes: { MIGO_GR: 'grnoref', MB52: 'overview', MB03: 'matdocs' },
  summaryOf: (s) => [
    { label: '자재 전표', value: String(MOVES.filter((m) => s.done[m.id]).length) },
    { label: `${MAT} 총 재고`, value: `${stockOf(s.done).reduce((a, r) => a + r.total, 0)} PC` },
  ],
  useGuide, useBriefing,
});
