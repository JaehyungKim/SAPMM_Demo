# J45 직접 자재 조달 – Click-Through Demo

SAP S/4HANA Cloud Public Edition Scope Item **J45 – Procurement of Direct Materials (2608)** 의 인터랙티브 시연 도구입니다.
모든 화면을 **SAP Fiori (Horizon)** 와 **클래식 SAP GUI** 두 가지 UI로 보여 주며, 데이터는 브라우저 안에서만 동작합니다 (백엔드·외부 API 없음).

## 실행 방법

```bash
npm install        # 최초 1회
npm run dev        # http://localhost:5173 자동 오픈
```

또는 Finder에서 **`start-demo.command`** 를 더블클릭하세요. `index.html` 을 직접 열면 빈 화면만 나옵니다 (반드시 개발 서버로 실행).

배포용 정적 빌드: `npm run build` → `dist/` 폴더를 아무 웹 서버(또는 `npm run preview`)로 제공. HashRouter를 사용하므로 서버 라우팅 설정이 필요 없습니다.

> 이 폴더가 OneDrive 안에 있으면 `node_modules`(수백 MB)도 동기화됩니다. 필요하면 OneDrive에서 `node_modules`를 "이 장치에만 유지"로 설정하거나 프로젝트를 로컬 폴더로 옮기세요.

## 시연 흐름

| # | 단계 | Fiori 앱 | SAP GUI | 역할 |
|---|---|---|---|---|
| 0 | Launchpad 홈 | Spaces & Pages | SAP Easy Access | 구매 담당자 |
| 1 | 구매 요청 → 구매 오더 전환 | F1048A | ME57 | 구매 담당자 |
| 2 | 구매 오더 생성 | F0842A | ME21N | 구매 담당자 |
| 3 | 구매 오더 승인 *(선택)* | F0862 My Inbox | SBWP | 구매 관리자 |
| 4 | 구매 오더 미리보기 *(선택)* | F0842A 출력 관리 | ME23N | 구매 담당자 |
| 5 | 구매 오더 변경 *(선택)* | F0842A | ME22N | 구매 담당자 |
| 6 | 구매 오더 품목 모니터링 *(선택)* | F2358 | ME2M | 구매 담당자 |
| 7 | 입고 전기 | F0843 | MIGO (101) | 창고 담당자 |
| 8 | 입고 전표·라벨 미리보기 *(선택)* | F1077 | MB90 | 창고 담당자 |
| 9 | 입고 상세 확인 *(선택)* | F1077 | MB03 | 창고 담당자 |
| 10 | 공급업체 송장 생성 | F0859 | MIRO | AP 회계 담당자 |
| 11 | 공급업체 송장 확인 *(선택)* | F1060A | MIR4 | AP 회계 담당자 |
| 12 | GR/IR 청산 *(선택)* | MR11 (WebGUI) | MR11 | AP 회계 담당자 |

### 발표자 기능
- **상단 바**: `Fiori | SAP GUI | 비교` 모드 전환(비교 = 50/50 분할), `설명`(필드 ? 도움말 켜기/끄기), `데모 데이터 편집`, `데모 초기화`(새 문서 번호로 문서 체인 재생성).
- **사이드바**: 단계 이동, 선택 단계 포함/제외 스위치, 현재 문서 번호 요약. ☰ 버튼으로 접기.
- **SAP GUI 명령 필드**: 실제 T-Code 입력 가능 (`ME21N`, `MIGO`, `MIRO`, `/nME23N` …).
- **아무 단계로 점프**: 선행 문서가 없으면 "선행 단계 자동 완료" 버튼으로 PO/입고/송장을 즉시 생성.
- 진행 중인 입력(입고 수량, 송장 참조 등)은 Fiori ↔ GUI 전환 시에도 유지됩니다.
- 상태는 `localStorage`에 저장되어 새로 고침해도 유지됩니다.

## 데모 데이터 커스터마이징

- 화면에서: **데모 데이터 편집** (`#/setup`) – 모든 값이 모든 화면에 즉시 반영됩니다.
- 코드에서: `src/store.ts` 의 `defaultConfig()` – 기본값은 J45_DE BPD 샘플 데이터(회사 코드·플랜트 1010, 저장 위치 101A, 자재 TG0011, 공급업체 10300003, 구매정보레코드 단가 25 EUR) 기준입니다.
- 배경 문서(다른 PO/PR/송장): `src/demoData.ts`.
- G/L 계정(재고 13100000 / GR/IR 21300000 / 매입채무 21100000)은 **시연 시스템의 계정과목표로 확인 후** 설정 화면에서 조정하십시오.

## 새 프로세스 단계 추가

1. `src/steps.ts` 의 `STEPS` 배열에 항목 추가 (`id`, 앱 ID, T-Code, 역할, `optional`, `requires`).
2. `src/steps/<이름>.tsx` 에 `XxxFiori` / `XxxGui` 컴포넌트 작성 (`StepProps` 수신, 데이터는 `useDemo()` 에서만 읽기).
   - Fiori 부품: `components/fiori/Fiori.tsx` (`FioriShell`, `PageHeader`, `FilterBar`, `FTable`, `FormGroup`, `FooterBar` …)
   - GUI 부품: `components/gui/Gui.tsx` (`GuiWindow`, `GField`, `GTable`, `GTabs`, `GLight` …)
   - Fiori ↔ GUI 공유 입력값은 `useSharedState()` 사용.
3. `src/steps/index.tsx` 의 `SCREENS` 에 등록, 필요하면 `TCODE_MAP` 에 T-Code 추가.
4. 새 문서 상태가 필요하면 `src/store.ts` 에 상태와 액션 추가.

## 구조

```
src/
  store.ts            데모 상태(Zustand, persist) – config + 문서 체인 + 액션
  steps.ts            단계 메타데이터, 역할, T-Code 매핑
  sharedState.ts      Fiori/GUI 공유 입력값
  components/         DemoLayout(발표자 크롬), Help(?), fiori/*, gui/*
  steps/              단계별 Fiori + SAP GUI 화면
  pages/Setup.tsx     데모 환경 설정
  styles/             app.css(크롬) · fiori.css(Horizon) · gui.css(SAP GUI) · print.css(PDF 미리보기)
```
