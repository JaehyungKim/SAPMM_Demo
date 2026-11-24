/** 41F – Pipeline Materials screens (Fiori + SAP GUI from one spec per step). */
import { fmtAmt, fmtDate, todayIso } from '../../format';
import { useOrg } from '../types';
import { autoLaunchpad, pair } from '../shared/kit';
import { JournalTable } from '../shared/ui';
import { CC, GL, MAT, MAT_TX, PRICE, QTY, STEPS, SUP, UNIT, VALUE, use41f } from './store';

const SUPT = `${SUP.name} (${SUP.no})`;
const use = () => { const s = use41f(); return { s, n: s.numbers, d: (id: string) => !!s.done[id], c: useOrg() }; };
const row = { k: '1', material: MAT, text: MAT_TX, qty: QTY, unit: UNIT };

export const [launchpadF, launchpadG] = autoLaunchpad(STEPS, <>파이프라인 자재는 <b>정보 레코드(ME11)</b> → <b>소비 기록(MIGO 201P)</b> → <b>정산 작업(MRKO)</b> 순서로 처리합니다. 발주·입고가 없습니다.</>);

export const [inforecordF, inforecordG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '구매 정보 레코드 생성', appId: 'ME11', title: d('inforecord') ? `정보 레코드 ${n.info}` : '정보 레코드 생성: 일반 데이터', gtitle: '정보 레코드 생성: 구매 조직 데이터 1',
    status: d('inforecord') ? ['Positive', '저장됨'] : undefined,
    fields: [
      { label: '공급업체', value: SUPT, help: 'supplier' }, { label: '자재', value: `${MAT} ${MAT_TX}`, help: 'material' },
      { label: '구매 조직 / 플랜트', value: `${c.purchasingOrg} / ${c.plant}` }, { label: '정보 범주', value: '☑ 파이프라인', help: 'pipeline' },
      { label: '구매 그룹', value: '001', help: 'purchGroup' }, { label: '계획 납품 시간', value: '2 일' },
      { label: '표준 수량', value: `1 ${UNIT}` }, { label: '세금 코드', value: 'V1', help: 'taxCode' },
      { label: '순 가격', value: `${fmtAmt(PRICE, c.currency)} / ${UNIT}`, help: 'infoRecord' },
    ],
    footer: true, done: d('inforecord'), doneMsg: `구매 정보 레코드 ${n.info}이(가) 저장되었습니다 – 파이프라인 출고 시 이 가격으로 공급업체 채무가 계산됩니다.`,
    actions: [{ label: '저장', gui: '💾 저장', disabled: d('inforecord'), onClick: () => s.mark('inforecord'), toast: `정보 레코드 ${n.info}` }],
  };
});

export const [consumeF, consumeG] = pair(() => {
  const { s, n, d, c } = use();
  return {
    app: '재고 이동 전기', appId: 'MIGO', title: '출고 기타 – 파이프라인 소비', gtitle: '출고 기타 - 창고 담당자',
    fields: [
      { label: '실행 작업 / 참조 문서', value: 'A07 출고 / R10 기타' }, { label: '이동 유형', value: '201P 코스트 센터 소비 (파이프라인)', help: 'movementType' },
      { label: '플랜트', value: `${c.plant} ${c.plantName}`, help: 'plant' }, { label: '공급업체', value: SUPT, help: 'supplier' },
      { label: 'G/L 계정', value: GL, help: 'glAccount' }, { label: '코스트 센터', value: CC, help: 'costCenter' },
    ],
    tables: [{ title: '품목', rows: [row], rowKey: (r) => r.k, cols: [
      { key: 'm', label: '자재', w: 70, render: (r) => r.material }, { key: 't', label: '내역', w: 200, render: (r) => r.text },
      { key: 'q', label: '수량', w: 80, align: 'right', render: (r) => `${r.qty} ${r.unit}` }, { key: 'v', label: '금액', w: 90, align: 'right', render: () => fmtAmt(VALUE, c.currency) },
      { key: 'ok', label: '품목 OK', w: 60, render: () => '✓' },
    ] }],
    footer: true, done: d('consume'), doneMsg: `자재 전표 ${n.md}이(가) 전기되었습니다 – 재고 없이 바로 비용이 되고, 공급업체 ${SUP.no}에 대한 파이프라인 채무가 쌓였습니다.`,
    actions: [{ label: '전기', gui: '전기', disabled: d('consume'), onClick: () => s.mark('consume'), toast: `자재 전표 ${n.md}` }],
    extra: d('consume') ? <JournalTable lines={[
      { acc: GL, text: '소모성 비용 (파이프라인)', dc: '차변', amt: VALUE, cc: CC },
      { acc: '21000000', text: `파이프라인 채무 – 공급업체 ${SUP.no}`, dc: '대변', amt: VALUE },
    ]} /> : undefined,
  };
});

export const [settleF, settleG] = pair(() => {
  const { s, n, d, c } = use();
  const checked = !!s.vals.checked || d('settle');
  return {
    app: '공급업체 송장 작업 예약 - 고급', appId: 'F1683', title: '새 작업: 위탁 및 파이프라인 정산', gtitle: '위탁 및 파이프라인 정산',
    fields: [
      { label: '작업 템플릿', value: 'Logistic Consignment and Pipeline Settlement' }, { label: '즉시 시작', value: '☑' },
      { label: '회사 코드 / 플랜트', value: `${c.companyCode} / ${c.plant}` }, { label: '공급업체 / 자재', value: `${SUP.no} / ${MAT}` },
      { label: '자재 전표', value: n.md }, { label: '위탁 / 파이프라인', value: '☐ / ☑', help: 'pipelineSettle' },
      { label: '미정산 출고만', value: '☑' }, { label: '세금 기준일', value: fmtDate(todayIso(), c.dateFormat) },
    ],
    info: checked && !d('settle') ? '점검 완료: 작업을 예약할 수 있습니다 (You can go ahead and schedule the job).' : undefined,
    footer: true, done: d('settle'), doneMsg: `작업 ${n.job}이(가) 예약·완료되었습니다 – 정산 문서 ${n.inv}, 회계 전표 ${n.invFi} (${fmtAmt(VALUE, c.currency)}).`,
    actions: [
      { label: '점검', gui: '✔ 점검', disabled: checked, onClick: () => s.setVal('checked', true) },
      { label: '정산 예약', gui: '▶ 예약', disabled: !checked || d('settle'), onClick: () => s.mark('settle'), toast: `작업 ${n.job}` },
    ],
  };
});

export const [resultF, resultG] = pair(() => {
  const { n, c } = use();
  return {
    app: '공급업체 송장 작업 예약 - 고급', appId: 'F1683', title: `작업 ${n.job} – 결과`, gtitle: `정산 로그: 작업 ${n.job}`,
    status: ['Positive', '완료'],
    tables: [{ title: '문서 (ID, 결과)', rows: [{ k: '1' }], rowKey: (r) => r.k, cols: [
      { key: 'md', label: '자재 전표', w: 100, render: () => n.md }, { key: 'i', label: '정산 문서', w: 100, render: () => n.inv },
      { key: 'f', label: '회계 전표', w: 100, render: () => n.invFi }, { key: 'v', label: '금액', w: 90, align: 'right', render: () => fmtAmt(VALUE, c.currency) },
    ] }],
    info: '정기적으로 작업을 예약하면 파이프라인 사용량이 공급업체 송장 없이 자동으로 정산됩니다 (Evaluated Settlement).',
  };
});
