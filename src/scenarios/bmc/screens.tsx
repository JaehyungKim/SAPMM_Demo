/** BMC – Core Inventory Management screens (Fiori + SAP GUI from one spec per step). */
import { jo, pc } from '../../josa';
import { addDays, fmtAmt, fmtDate, todayIso } from '../../format';
import { Help } from '../../components/Help';
import { useOrg } from '../types';
import { autoLaunchpad, pair, type KCol, type KField, type KSpec } from '../shared/kit';
import { JournalTable } from '../shared/ui';
import { MAT, MAT_TX, MOVES, PRICE, STEPS, SUP, moveOf, stockOf, useBmc } from './store';

type Stock = ReturnType<typeof stockOf>[number];
const use = () => { const s = useBmc(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };
const stockCols: KCol<Stock>[] = [
  { key: 's', label: '저장 위치', w: 180, render: (r) => `${r.sl} ${r.name}` },
  { key: 'u', label: '가용', w: 70, align: 'right', render: (r) => r.unr },
  { key: 'q', label: '품질 검사', w: 70, align: 'right', render: (r) => r.qi },
  { key: 'b', label: '보류', w: 70, align: 'right', render: (r) => r.blk },
  { key: 't', label: '이전 중(저장 위치)', w: 110, align: 'right', render: (r) => r.tr },
];

/** One goods-movement screen: header fields, the affected storage locations' stock, post button. */
function movement(id: string, o: { app: string; appId: string; title: string; gtitle: string; fields: KField[]; button: string; gui: string; slocs: string[]; journal?: [string, string, string][]; info?: string; footer?: boolean }) {
  return pair((): KSpec => {
    const { s, n, d, c } = use();
    const m = moveOf(id);
    const rows = stockOf(s.done).filter((r) => o.slocs.includes(r.sl));
    const amt = m.qty * PRICE;
    return {
      app: o.app, appId: o.appId, title: o.title, gtitle: o.gtitle,
      kpis: [{ label: '수량', value: `${m.qty} PC` }, { label: '이동 유형', value: m.mvt }],
      fields: [{ label: '자재 / 플랜트', value: `${MAT} / ${c.plant} ${c.plantName}`, help: 'material' }, ...o.fields],
      tables: [{ title: d(id) ? '재고 (전기 후)' : '재고 (현재)', rows, rowKey: (r) => r.sl, cols: stockCols }],
      info: o.info, footer: o.footer ?? true,
      done: d(id), doneMsg: `자재 전표 ${jo(n[id], '이')} 생성되었습니다 – ${m.text} ${m.qty} PC.`,
      actions: [{ label: o.button, gui: o.gui, disabled: d(id), onClick: () => s.mark(id), toast: `자재 전표 ${n[id]}` }],
      extra: d(id) && o.journal ? <JournalTable lines={o.journal.map(([acc, text, dc]) => ({ acc, text, dc: dc as '차변' | '대변', amt, cc: acc === '61000000' ? '10101202' : undefined }))} /> : undefined,
    };
  });
}

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>재고 관리는 <b>입고·출고·폐기</b>, <b>재고 유형 변경(보류·품질 검사)</b>, <b>저장 위치 이전</b>, <b>재고 조회·분석</b>으로 구성됩니다. 자재 {MAT} 하나로 모든 이동을 따라갑니다.</>);

export const [initF, initG] = movement('init', {
  app: '재고 관리', appId: 'F1062', title: `${MAT} – 재고 관리`, gtitle: '기타 입고: 초기 재고 입력 (561)', button: '전기', gui: '💾 전기', slocs: ['101R'],
  fields: [{ label: '저장 위치 / 재고 유형', value: '101R / 가용', help: 'sloc' }, { label: '재고 변경', value: '초기 입력 (Initial Entry)' }, { label: '전기일', value: fmtDate(todayIso(), 'KR') }],
  journal: [['13100000', `재고 ${MAT}`, '차변'], ['39910000', '초기 재고 대체', '대변']],
});

export const [grnorefF, grnorefG] = movement('grnoref', {
  app: '참조 없는 입고 전기', appId: 'F3244', title: '참조 없는 입고', gtitle: '입고 기타 (501)', button: '전기', gui: '전기', slocs: ['101A'],
  fields: [{ label: '저장 위치', value: '101A Std. storage 1', help: 'sloc' }, { label: '재고 유형', value: '가용', help: 'stockType' }, { label: '공급업체', value: `${SUP.name} (${SUP.no})`, help: 'supplier' }],
  journal: [['13100000', `재고 ${MAT}`, '차변'], ['21300000', 'GR/IR (참조 없는 입고)', '대변']],
  info: 'PO 없이 받은 물품(샘플·무상 공급 등)을 바로 재고로 입고합니다.',
});

export const [scrapcopaF, scrapcopaG] = movement('scrapcopa', {
  app: '재고 이동 전기', appId: 'MIGO', title: '출고 기타 – 고객 반품 폐기', gtitle: '출고 기타 - 재고 관리자', button: '전기', gui: '전기', slocs: ['101R'],
  fields: [{ label: '이동 유형', value: '551 폐기', help: 'movementType' }, { label: '저장 위치', value: '101R 반품', help: 'sloc' }, { label: '이동 사유', value: '0001' }, { label: '코스트 센터 / 수익성 세그먼트', value: '10101202 / 파생됨 (CO-PA)' }],
  journal: [['61000000', '폐기 비용 (CO-PA)', '차변'], ['13100000', `재고 ${MAT}`, '대변']],
  info: '폐기 금액이 수익성 분석(CO-PA)에도 반영되어 고객·제품별 손실을 볼 수 있습니다.',
});

export const [scrapccF, scrapccG] = movement('scrapcc', {
  app: '재고 관리', appId: 'F1062', title: `${MAT} – 재고 관리`, gtitle: '출고 기타: 폐기 (551)', button: '전기', gui: '💾 전기', slocs: ['101A'],
  fields: [{ label: '재고 변경', value: '폐기 (Scrapping)' }, { label: '저장 위치', value: '101A', help: 'sloc' }, { label: '코스트 센터', value: '10101202 R&D', help: 'costCenter' }, { label: '사유 코드', value: '자재 손상 (Material Damage)' }],
  journal: [['61000000', '폐기 비용', '차변'], ['13100000', `재고 ${MAT}`, '대변']],
});

const transferFields = (from: string, to: string): KField[] => [{ label: '보낸 곳', value: from }, { label: '받는 곳', value: to }];

export const [blockF, blockG] = movement('block', {
  app: '재고 이전 - 플랜트 내', appId: 'F1061', title: `${MAT} 재고 이전`, gtitle: '이전 전기 344', button: '전기', gui: '💾 전기', slocs: ['101A'],
  fields: transferFields('101A 가용', '101A 보류'), info: '보류 재고는 출고·MRP 계산에서 제외됩니다 (재작업 대기 등).',
});
export const [unblockF, unblockG] = movement('unblock', {
  app: '재고 이전 - 플랜트 내', appId: 'F1061', title: `${MAT} 재고 이전`, gtitle: '이전 전기 343', button: '전기', gui: '💾 전기', slocs: ['101A'],
  fields: transferFields('101A 보류', '101A 가용'), info: '보류가 풀린 재고는 다시 MRP와 출고에 사용됩니다.',
});
export const [toqiF, toqiG] = movement('toqi', {
  app: '재고 이전 - 플랜트 내', appId: 'F1061', title: `${MAT} 재고 이전`, gtitle: '이전 전기 350', button: '전기', gui: '💾 전기', slocs: ['101A'],
  fields: transferFields('101A 보류', '101A 품질 검사'), info: '품질 검사 재고는 사용 결정 전까지 사용할 수 없지만 MRP에는 포함됩니다.',
});
export const [transfer1F, transfer1G] = movement('transfer1', {
  app: '재고 이전 - 플랜트 내', appId: 'F1061', title: `${MAT} 재고 이전`, gtitle: '이전 전기 311', button: '전기', gui: '💾 전기', slocs: ['101A', '101R'],
  fields: transferFields('101A 가용', '101R 가용'), info: '한 번의 전기로 저장 위치 간 이전이 끝납니다.',
});
export const [removeF, removeG] = movement('remove', {
  app: '재고 이전 - 플랜트 내', appId: 'F1061', title: `${MAT} 재고 이전`, gtitle: '이전 전기 313', button: '전기', gui: '💾 전기', slocs: ['101A', '101R'],
  fields: transferFields('101A 가용', '101R 이전 중 재고'), info: '물품이 이동하는 동안 받는 쪽에 "이전 중" 재고로 표시됩니다.',
});
export const [placeF, placeG] = movement('place', {
  app: '재고 이전 - 플랜트 내', appId: 'F1061', title: `${MAT} 재고 이전`, gtitle: '이전 전기 315', button: '전기', gui: '💾 전기', slocs: ['101R'],
  fields: transferFields('101R 이전 중 재고', '101R 가용'), info: '받는 쪽에서 실제로 받은 뒤 가용 재고로 전기합니다.',
});

export const [overviewF, overviewG] = pair(() => {
  const { s, c } = use();
  const rows = stockOf(s.done);
  const total = rows.reduce((a, r) => a + r.total, 0);
  return {
    app: '재고 - 단일 자재', appId: 'F1076', title: `${MAT} – ${MAT_TX}`, gtitle: '재고 개요: 기본 리스트',
    kpis: [{ label: '플랜트 총 재고', value: `${total} PC` }, { label: '재고 가치', value: fmtAmt(total * PRICE, c.currency) }],
    tables: [{ title: `플랜트 ${c.plant} – 저장 위치별 재고`, rows, rowKey: (r) => r.sl, cols: stockCols }],
    info: '이 시나리오에서 전기한 모든 이동이 실시간으로 반영된 재고입니다.',
  };
});

export const [matdocsF, matdocsG] = pair(() => {
  const { s, n, c } = use();
  const rows = MOVES.filter((m) => s.done[m.id]).map((m) => ({ ...m, doc: n[m.id] }));
  return {
    app: '자재 전표 개요', appId: 'F1077', title: `자재 전표 – ${MAT}`, gtitle: '자재 전표 리스트',
    kpis: [{ label: '자재 전표', value: String(rows.length) }],
    tables: [{ title: '자재 전표', rows, rowKey: (r) => r.id, empty: '아직 전기한 자재 전표가 없습니다', cols: [
      { key: 'd', label: '자재 전표', w: 110, render: (r) => r.doc }, { key: 'm', label: '이동 유형', w: 70, render: (r) => <>{r.mvt}<Help k="movementType" /></> },
      { key: 't', label: '내역', w: 240, render: (r) => r.text }, { key: 'q', label: '수량', w: 60, align: 'right', render: (r) => r.qty },
      { key: 'dt', label: '전기일', w: 90, render: () => fmtDate(todayIso(), c.dateFormat) },
    ] }],
    info: '행을 열면 품목·회계 전표·프로세스 흐름이 보이고, 상단 "역분개"로 이동을 취소할 수 있습니다.',
  };
});

const analytic = (id: string, o: { app: string; appId: string; title: string; button: string; gui: string; fields: KField[]; cols: KCol<Record<string, string | number> & { k: string }>[]; rows: (Record<string, string | number> & { k: string })[]; info: string }) => pair((): KSpec => {
  const { s, d } = use();
  return {
    app: o.app, appId: o.appId, title: o.title, gtitle: o.app, fields: o.fields,
    tables: [{ title: '결과', rows: d(id) ? o.rows : [], rowKey: (r) => r.k, empty: `'${o.button}'${pc(o.button, '을')} 누르면 결과가 표시됩니다`, cols: o.cols }],
    info: d(id) ? o.info : undefined,
    actions: [{ label: o.button, gui: o.gui, disabled: d(id), onClick: () => s.mark(id) }],
  };
});

const D = (n: number) => fmtDate(addDays(todayIso(), n), 'KR');

export const [slowF, slowG] = analytic('slow', {
  app: '저회전·무회전 자재', appId: 'F2137', title: '저회전·무회전 자재', button: '실행', gui: '▶ 실행',
  fields: [{ label: '소비 저조 일수', value: '90 일' }, { label: '기준일', value: D(0) }, { label: '표시 통화', value: 'EUR' }, { label: '재고 소비 그룹', value: '000 표준' }],
  cols: [{ key: 'm', label: '자재', w: 80, render: (r) => r.m }, { key: 's', label: '저장 위치', w: 70, render: (r) => r.s }, { key: 'q', label: '재고', w: 70, align: 'right', render: (r) => r.q }, { key: 'v', label: '재고 가치', w: 90, align: 'right', render: (r) => r.v }, { key: 'lc', label: '최종 소비일', w: 90, render: (r) => r.lc }, { key: 'dd', label: '경과 일수', w: 70, align: 'right', render: (r) => r.dd }],
  rows: [
    { k: '1', m: 'TG12', s: '101A', q: 120, v: '1,800.00 EUR', lc: D(-134), dd: 134 },
    { k: '2', m: 'RM14', s: '101C', q: 4000, v: '3,200.00 EUR', lc: D(-97), dd: 97 },
  ],
  info: '90일 넘게 소비가 없는 재고입니다 – 재배치·반품·폐기를 검토합니다.',
});

export const [deadF, deadG] = analytic('dead', {
  app: '불용 재고 분석', appId: 'F2899', title: '불용 재고 분석', button: '실행', gui: '▶ 실행',
  fields: [{ label: '분석 시작일', value: D(-365) }, { label: '분석 종료일', value: D(0) }, { label: '표시 통화', value: 'EUR' }],
  cols: [{ key: 'm', label: '자재', w: 80, render: (r) => r.m }, { key: 's', label: '저장 위치', w: 70, render: (r) => r.s }, { key: 'v0', label: '기초 가치', w: 90, align: 'right', render: (r) => r.v0 }, { key: 'v1', label: '기말 가치', w: 90, align: 'right', render: (r) => r.v1 }, { key: 'dd', label: '무이동 일수', w: 80, align: 'right', render: (r) => r.dd }],
  rows: [{ k: '1', m: 'PIP02', s: '101C', v0: '950.00 EUR', v1: '950.00 EUR', dd: 365 }],
  info: '1년간 소비도 전기도 없는 불용 재고입니다 – 재고 가치 평가 감액 대상입니다.',
});

export const [gmaF, gmaG] = analytic('gma', {
  app: '재고 이동 분석', appId: 'F2912', title: '재고 이동 분석 – 데이터 분석', button: '측정값 추가: 이동 건수', gui: '＋ 이동 건수',
  fields: [{ label: '전기일', value: `${D(-30)} ~ ${D(0)}` }, { label: '행', value: '플랜트 · 이동 유형' }],
  cols: [{ key: 'p', label: '플랜트', w: 70, render: (r) => r.p }, { key: 'm', label: '이동 유형', w: 80, render: (r) => r.m }, { key: 'c', label: '이동 건수', w: 80, align: 'right', render: (r) => r.c }, { key: 'q', label: '수량', w: 70, align: 'right', render: (r) => r.q }],
  rows: [{ k: '1', p: '1010', m: '101', c: 42, q: 3120 }, { k: '2', p: '1010', m: '311', c: 18, q: 640 }, { k: '3', p: '1010', m: '551', c: 6, q: 41 }, { k: '4', p: '1010', m: '201', c: 25, q: 410 }],
  info: '이동 유형별 건수로 반복적인 수작업 이동과 개선 여지를 찾습니다.',
});

export const [rangeF, rangeG] = analytic('range', {
  app: '기간별 재고 분석', appId: 'F6185', title: '기간별 재고 분석', button: '실행 (최근 30일)', gui: '▶ 최근 30일',
  fields: [{ label: '표시 통화', value: 'EUR' }, { label: '분석 기간', value: '최근 30일' }, { label: '플랜트', value: '1010' }],
  cols: [{ key: 'm', label: '자재', w: 80, render: (r) => r.m }, { key: 'q0', label: '기초 수량', w: 80, align: 'right', render: (r) => r.q0 }, { key: 'q1', label: '기말 수량', w: 80, align: 'right', render: (r) => r.q1 }, { key: 'v1', label: '기말 가치', w: 90, align: 'right', render: (r) => r.v1 }],
  rows: [{ k: '1', m: 'TG11', q0: 100, q1: 205, v1: '2,050.00 EUR' }, { k: '2', m: 'TG12', q0: 127, q1: 120, v1: '1,800.00 EUR' }],
  info: '기간 시작·종료 시점 재고를 비교하고, 행의 상세 버튼으로 해당 기간 전기 내역을 봅니다.',
});
