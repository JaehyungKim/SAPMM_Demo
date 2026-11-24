# SAP S/4HANA Cloud 조달 – Click-Through Demo (8 Scope Items)

SAP S/4HANA Cloud 조달 Scope Item 8개(J45 · BMD · BNX · 18J · 22Z · BMR · BMY · BMK)를 한 페이지에서 시연하는 인터랙티브 도구입니다.
모든 화면을 **SAP Fiori (Horizon)** 와 **클래식 SAP GUI** 두 가지 UI로 보여 주며, 데이터는 브라우저 안에서만 동작합니다 (백엔드·외부 API 없음).

| 코드 | 시나리오 | 흐름 | 출처 |
|---|---|---|---|
| **J45** | 직접 자재 조달 (Procurement of Direct Materials) | 구매 요청 → PO → 승인 → 입고(재고) → 송장 → GR/IR 청산 | J45_S4CLD2608_BPD |
| **BMD** | 구매 계약 (Purchase Contract) | 계약용 요청(RV) → 수량 계약(MK) → 승인 → 출력 → 템플릿·참조 계약 → 알림 → 일괄 변경 → 소스 리스트 → 릴리스 오더 → PO 승인 → 입고 → 부분 역분개 → 송장 → 계약 버전 | BMD_S4HANA2025-FPS2_BPD |
| **BNX** | 소모품 구매 (Consumable Purchasing) | 요청(계정 지정 K) → 업무량 재배분 → PO → 텍스트 품목·다중 계정 지정 → Limit 품목 → 일괄 변경 → 승인 → 비용 입고 → 송장 보류 → 릴리스 → 송장 축소 · 송장 계획 | BNX_S4HANA2025-FPS2_BPD |
| **18J** | 현업 구매 요청 (Requisitioning) | 카탈로그 → 셀프서비스 요청 → 일괄 변경 · 모니터링 → 관리자 승인 → 업무량 재배분 → PO → 승인 → 요청자 수령 확인 → 송장 · 재고 자재 예약 → 출고(201) | 18J_S4CLD2502_BPD |
| **22Z** | 서비스 조달 (Procurement of Services) | 서비스 계약 → 요청(서비스 + Limit 품목) → PO 자동/수동 생성 → 승인 → 서비스 입력 시트 → SES 승인 → 확인 → 송장(보류) → 릴리스 | 22Z_S4CLD2502_BPD |
| **BMR** | 납품 일정 계약 (Scheduling Agreements) | LPA 계약 → 일괄 변경 → 일정 라인 → 쿼터 → MRP → FRC/JIT 릴리스 → 출력 → 소요 현황 → 입고 → 송장 | BMR_S4CLD2502_BPD |
| **BMY** | 외주 가공 (Subcontracting) | MRP → 외주 PO(품목 범주 L) → 모니터링 → 승인 → 외주 콕핏 납품 → 출고 541 → 입고 101/543 → 외주 재고 확인 → 가공비 송장 | BMY_S4CLD2502_BPD |
| **BMK** | 공급업체 반품 (Return to Supplier) | 재고 분석 → 반품 저장 위치 이전 → 반품 PO(NB2) → 납품 → 출고 161 → 모니터링 → 대변 메모 / 대체 자재 수령 → 입고 → 후속 조치 → 반품 개요 | BMK_S4CLD2502_BPD |

상단 바의 **시나리오 이름(⌄)** 을 누르면 시나리오를 고를 수 있습니다. 맨 왼쪽 **☰** 버튼은 프로세스 단계 패널을 열고 닫습니다(패널 오른쪽 위 **X** 로도 닫기). 시나리오마다 문서 체인과 진행 상태가 따로 저장됩니다.

## 온라인 데모

👉 **https://jaehyungkim.github.io/SAPMM_Demo/** (설치 없이 브라우저에서 바로 실행)

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 자동으로 빌드·배포합니다.

## 실행 방법

```bash
npm install        # 최초 1회
npm run dev        # http://localhost:5173 자동 오픈
```

또는 Finder에서 **`start-demo.command`** 를 더블클릭하세요. `index.html` 을 직접 열면 빈 화면만 나옵니다 (반드시 개발 서버로 실행).

배포용 정적 빌드: `npm run build` → `dist/` 폴더를 아무 웹 서버(또는 `npm run preview`)로 제공. HashRouter를 사용하므로 서버 라우팅 설정이 필요 없습니다.
주소: J45 `#/step/<단계>`, 그 외 `#/<코드 소문자>/step/<단계>` (예: `#/bmd/step/po`, `#/22z/step/ses`).

> 이 폴더가 OneDrive 안에 있으면 `node_modules`(수백 MB)도 동기화됩니다. 필요하면 OneDrive에서 `node_modules`를 "이 장치에만 유지"로 설정하거나 프로젝트를 로컬 폴더로 옮기세요.

## 시연 흐름

### J45 – 직접 자재 조달
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

### BMD – 구매 계약 (TG10/TG11, 공급업체 10300001, 계약 단가 10 EUR)
| # | 단계 | Fiori 앱 | SAP GUI | 역할 |
|---|---|---|---|---|
| 0 | Launchpad 홈 | Spaces & Pages | SAP Easy Access | 구매 담당자 |
| 1 | 계약용 구매 요청 생성 (RV, 추적 번호 Test_Track) | F2229 | ME51N | 구매 담당자 |
| 2 | 구매 요청 참조 계약 생성 (MK, 목표 500/100) | F1048A | ME31K | 구매 담당자 |
| 3 | 구매 계약 승인 (2,000 EUR 초과) *(선택)* | F0862 | SBWP | 구매 관리자 |
| 4 | 구매 계약 출력 | F1600A 출력 관리 | ME33K | 구매 담당자 |
| 5 | 계약 템플릿 · 참조 계약 (공급업체 10300002, 10.5 EUR) *(선택)* | F1600A | ME31K (참조) | 구매 담당자 |
| 6 | 계약 알림 모니터링 (만료 예정) *(선택)* | F1600A 알림 | ME80RN | 구매 담당자 |
| 7 | 구매 계약 일괄 변경 (유효 기간 연장) *(선택)* | F2667 | MEMASSCONTRACT | 구매 담당자 |
| 8 | 소스 리스트 생성 *(선택)* | F1859 | ME05 / ME01 | 구매 담당자 |
| 9 | 구매 요청 → 계약 릴리스 오더 | F1048 | ME57 | 구매 담당자 |
| 10 | 구매 오더 승인 (500 EUR 초과) *(선택)* | F0862 | SBWP | 구매 관리자 |
| 11 | 추적 번호로 구매 문서 검색 *(선택)* | F2905 | ME2N | 구매 담당자 |
| 12 | 계약 품목 모니터링 *(선택)* | F2423 | ME3M | 구매 담당자 |
| 13 | 입고 전기 | F0843 | MIGO | 창고 담당자 |
| 14 | 입고 부분 역분개 (TG11 5 PC, 102) *(선택)* | F0843 | MBST | 창고 담당자 |
| 15 | 공급업체 송장 생성 (순 입고 수량 기준) | F0859 | MIRO | AP 회계 담당자 |
| 16 | 계약 변경 및 버전 이력 *(선택)* | F1600A | ME32K | 구매 담당자 |

### BNX – 소모품 구매 (NS0001 + 텍스트 품목, 코스트 센터 10101101/10101401)
| # | 단계 | Fiori 앱 | SAP GUI | 역할 |
|---|---|---|---|---|
| 0 | Launchpad 홈 | Spaces & Pages | SAP Easy Access | 구매 담당자 |
| 1 | 소모품 구매 요청 생성 (계정 지정 K, 계약 소스) | F2229 | ME51N | 구매 담당자 |
| 2 | 구매 담당자 업무량 재배분 (그룹 001 → 003) *(선택)* | F2504 | ME5W | 구매 관리자 |
| 3 | 구매 요청 → 구매 오더 전환 | F1048A | ME57 | 구매 담당자 |
| 4 | 텍스트 품목 추가 · 다중 계정 지정 20/80 *(선택)* | F0842A | ME22N | 구매 담당자 |
| 5 | Limit 품목 추가 (예상 300 / 한도 500) *(선택)* | F0842A | ME22N | 구매 담당자 |
| 6 | 구매 오더 일괄 변경 (지급 조건 0003) *(선택)* | F2593 | MEMASSPO | 구매 담당자 |
| 7 | 구매 오더 승인 (그룹 003, 500 EUR 초과) *(선택)* | F0862 | SBWP | 구매 관리자 |
| 8 | 계정 지정별 PO 품목 모니터링 *(선택)* | F2420 | ME2K | AP 회계 담당자 |
| 9 | 입고 전기 (코스트 센터 비용 전기) | F0843 | MIGO | 창고 담당자 |
| 10 | 입고 전표 미리보기 *(선택)* | F1077 | MB90 | 창고 담당자 |
| 11 | 공급업체 송장 생성 (수동 보류) | F0859 | MIRO | AP 회계 담당자 |
| 12 | 보류된 송장 릴리스 *(선택)* | F0862 | MRBR | 구매 관리자(코스트 센터 책임자) |
| 13 | 송장 축소 (Limit 품목 560 → 500, 대변 메모 60) *(선택)* | F0859 | MIRO | AP 회계 담당자 |
| 14 | 송장 계획 (커피 머신 임대 50 EUR × 12개월, 정산) *(선택)* | F0842A | MRIS | 구매 담당자 |

### 18J · 22Z · BMR · BMY · BMK
각 시나리오의 단계·앱·T-Code·역할은 데모 화면 왼쪽 프로세스 단계 패널과 시나리오 브리핑에서 확인할 수 있습니다 (단계 목록: `src/scenarios/<코드>/store.ts` 의 `STEPS`).

- **18J** (사무용품 YBMM00 10 EA × 100 EUR, 코스트 센터 40/60, 공급업체 10300002): 13단계, 현업 직원·부서 관리자 역할 포함
- **22Z** (서비스 SM0001 50 H × 20 EUR + Limit 품목 예상 200 / 한도 400, 공급업체 10300001): 11단계
- **BMR** (RM129, 공급업체 10300001 17.55 EUR / 10300002 18 EUR, 목표 120,000 PC): 11단계
- **BMY** (SG23 1,000 PC × 가공비 0.59 EUR, 구성품 RM13·RM14, 외주처 10300007): 10단계
- **BMK** (TG12 반품 5 PC 대변 메모 + 2 PC 대체 자재, 공급업체 10300006): 12단계

BPD 중 데모에서 단순화·생략한 부분: BMY 일련번호(Serial Number) 처리 파트, 22Z MPS·품목 계층(Hierarchy)·서비스 수행자 셀프서비스, BMR EDI 전송·LP 승인, BNX 클레임 레터 출력.

### 발표자 기능
- **시나리오 메뉴**(상단 바의 시나리오 이름): SAP 조달 Scope Item 맵(Sourcing and Contract Mgmt. · Operational Procurement and Invoice Mgmt. · Central Procurement · Procurement Analytics · Supplier Mgmt.) 기준으로 구현된 시나리오만 분류해 보여 줍니다. 시나리오별 진행률, 데모 환경 설정 바로가기. 맵에 없는 코드는 '기타'에 표시됩니다 (BMK는 운영 구매에 추가 매핑).
- **오늘의 시나리오**: 시나리오 시작 시(및 `초기화` 후) 업무 상황·등장인물·4단계 흐름·진행 방법을 브리핑합니다. 상단 `시나리오` 버튼으로 다시 열 수 있습니다.
- **진행 가이드(오른쪽 패널)**: 단계마다 *상황* → *클릭 순서와 의미* → *업무 효과*를 보여 줍니다.
  - 다음에 클릭할 곳을 SAP 화면에 **파란 테두리**로 표시합니다. 열린 대화 상자를 우선하고, 비활성 버튼이나 아직 보이지 않는 버튼은 그 버튼을 나타나게/활성화하는 앞 클릭부터 안내합니다.
  - 항목에 마우스를 올리면 해당 위치가 주황 점선으로 표시되고, 완료한 항목은 체크됩니다.
  - Fiori / SAP GUI 모드에 따라 클릭 순서가 바뀝니다. 상단 `가이드` 버튼으로 켜고 끕니다.
- **상단 바**: `Fiori | SAP GUI | 비교` 모드 전환(비교 = 50/50 분할), `설명`(필드 ? 도움말), `데이터`(데모 환경 설정), `초기화`(현재 시나리오의 문서를 새 번호로 재생성).
- **프로세스 단계 패널**(왼쪽): 단계 이동, 선택 단계 포함/제외 스위치, 현재 문서 번호 요약. 상단 바 맨 왼쪽 ☰ 로 열고 닫으며, 패널 오른쪽 위 X 로도 닫습니다.
- **다음 단계 이동**: 화면 아래 내비게이션 바의 버튼 하나로 합쳤습니다 (진행 가이드 패널에는 단계 완료 표시만 나옵니다).
- **SAP GUI 명령 필드**: 현재 시나리오의 실제 T-Code 입력 가능 (`ME21N`, `ME31K`, `ME32K`, `MIGO`, `MIRO`, `MRBR`, `/nME23N` …).
- **아무 단계로 점프**: 선행 문서가 없으면 "선행 단계 자동 완료" 버튼으로 필요한 문서를 즉시 생성.
- 진행 중인 입력(입고 수량, 송장 참조 등)은 Fiori ↔ GUI 전환 시에도 유지됩니다.
- 상태는 `localStorage`에 시나리오별로 저장되어 새로 고침해도 유지됩니다.
- **날짜는 항상 데모를 여는 날 기준**입니다. 저장된 문서 체인을 다른 날 열면 모든 날짜(PO·계약 유효 기간·입고·송장·변경 내역)가 같은 간격을 유지한 채 오늘로 옮겨집니다.

## 관리자 · 고객 맞춤 링크 (`#/admin`)

발표자는 전체 시나리오(Full Story)를 쓰고, 고객사에는 그 고객에 맞는 Scope Item만 담은 링크를 보냅니다.
입구: 화면에 버튼은 없고, 주소 끝에 **`#/admin`** 을 직접 입력해 들어갑니다 (예: `https://jaehyungkim.github.io/SAPMM_Demo/#/admin`).

1. **인터뷰 분석** – 인터뷰 파일(txt · md · csv · docx · pptx · xlsx)을 올리거나 내용을 붙여 넣고 `분석`.
   Scope Item 맵(`src/scenarios/catalog.ts`)의 항목별 키워드(한/영)로 점수를 매기고, 근거 문장을 강조 표시합니다.
   "필요 없음·사용하지 않음" 같은 부정 표현이 있는 문장은 감점합니다. 점수 3 이상이면서 시연 가능한 항목은 자동 선택됩니다.
   분석은 브라우저 안에서만 이뤄지며 인터뷰 내용은 외부로 전송되지 않습니다. PDF는 내용을 복사해 붙여 넣으십시오.
2. **Scope Item 선택** – 전체 맵에서 시연 가능한 항목을 체크(인터뷰에서 언급된 항목은 주황 표시).
3. **고객 정보 · 링크** – 고객사명·안내 문구를 넣으면 링크가 생성됩니다 → `링크 복사` / `미리보기 (새 탭)` / `고객 링크 저장`.
   링크(`#/c/<토큰>`)에 선택 항목·고객사명·안내 문구·변경된 설정(담당자 이름 등)이 모두 들어 있어 서버가 필요 없습니다.
4. **저장된 고객 링크** – 고객별로 불러오기·복사·삭제 (이 브라우저에만 저장).

고객이 링크를 열면 **고객 홈**(`#/portal`)이 나오고, 시나리오 메뉴에는 선택된 Scope Item만 보입니다.
미리보기 탭은 탭 전용 저장소(sessionStorage)를 써서 발표자 브라우저의 데모 데이터에 영향을 주지 않습니다.
발표자가 실수로 고객 링크를 그냥 열었다면 `#/admin` 의 **전체 모드로 복귀**로 원래 설정과 전체 시나리오가 돌아옵니다.

> 정적 사이트이므로 `#/admin` 은 비밀번호로 보호되지 않습니다 (화면에 입구 버튼이 없을 뿐, 주소를 아는 사람은 열 수 있음). 민감한 정보는 링크나 설정에 넣지 마십시오.
> 키워드 사전은 `catalog.ts` 의 각 항목 `kw` 배열에서 고객 용어에 맞게 늘릴 수 있습니다.

## 데모 데이터 커스터마이징

- 화면에서: **데모 환경 설정** (`#/setup`) – 회사·조직·플랜트·통화·날짜 형식·G/L 계정·**담당자 이름**은 모든 시나리오가 함께 씁니다. 담당자 이름은 역할별(구매 담당자, 구매 관리자, 창고 담당자 …)로 바꿀 수 있고, 비워 두면 기본 이름을 씁니다 (아바타 이니셜은 자동: Kim Min-jun → KM, 홍길동 → 길동). 자재·수량·단가 등 나머지 항목은 J45용입니다.
- 코드에서:
  - J45: `src/store.ts` 의 `defaultConfig()` (J45_DE BPD 샘플: 1010 / 101A / TG0011 / 공급업체 10300003 / 25 EUR)
  - BMD: `src/scenarios/bmd/store.ts` 상단 상수 (`RV_ITEMS`, `NB_ITEMS`, `CONTRACT_PRICE`, `SUPPLIER` …)
  - BNX: `src/scenarios/bnx/store.ts` 상단 상수 (`ITEM10`, `ITEM20`, `LIMIT_ITEM`, `PLAN`, 코스트 센터 `CC1`/`CC2` …)
  - 18J · 22Z · BMR · BMY · BMK: 각 `src/scenarios/<코드>/store.ts` 상단 상수
- G/L 계정(재고 13100000 / GR/IR 21300000 / 매입채무 21100000)은 **시연 시스템의 계정과목표로 확인 후** 설정 화면에서 조정하십시오. BNX의 비용 계정 51600000 / 65100000은 BPD 값입니다.

## 시나리오 · 단계 추가

새 시나리오는 `src/scenarios/<코드>/` 폴더 하나로 추가합니다.

**간단한 방법 (18J · 22Z · BMR · BMY · BMK 방식)** – 공통 엔진 `scenarios/shared/chain.ts`·`kit.tsx`·`define.ts` 사용:
1. `store.ts` – `step(...)` 으로 `STEPS` 목록(선택 여부·선행 단계 포함), `makeChain(OPTS)` 로 문서 체인 저장소.
2. `screens.tsx` – 단계마다 `export const [idF, idG] = pair(() => spec)` 한 줄 – 같은 spec(필드·표·버튼·완료 메시지)이 Fiori와 SAP GUI 화면으로 동시에 렌더링됩니다. `autoLaunchpad(STEPS, 힌트)` 로 Launchpad 자동 생성.
3. `index.tsx` – `defineChain({...})` + 가이드(`GX` / `B`(버튼) / `L`(설명)) + 브리핑.

**직접 구현 방법 (BMD·BNX 방식)**:
1. `store.ts` – 문서 체인 상태와 액션, `meets()`/`autoComplete()` (zustand persist + `anchoredMerge` 로 날짜 재기준).
2. `screens.tsx` – 단계별 `XxxF` / `XxxG` 화면. 공통 화면은 `scenarios/shared/ui.tsx` (Launchpad, 내 받은 편지함, 입고, 송장, 자재 전표, PDF).
3. `index.tsx` – `ScenarioDef`: 단계 목록, 화면 등록(지연 로딩), T-Code 맵, 런타임(완료 규칙·선행 조건·요약), 가이드 문구(`target` = 버튼에 보이는 글자, `done` = 완료 조건), 브리핑.
4. `src/scenarios/index.ts` 의 `SCENARIOS` 에 추가하면 시나리오 메뉴에 나타납니다. 메뉴의 분류·순서는 `src/scenarios/catalog.ts`(Scope Item 맵)가 `code` 로 자동 결정합니다.
5. 새 아이콘(`<Icon name="...">`)을 쓰면 `src/icons.ts` 에 import 한 줄 추가.

J45에 단계를 추가할 때는 `src/steps.ts`, `src/steps/<이름>.tsx`, `src/steps/index.tsx`, `src/harness/guide.ts` 를 함께 수정합니다.

## 구조

```
src/
  main.tsx              진입점 (라우팅: /step/:id = J45, /:scn/step/:id = 그 외 시나리오)
  store.ts              J45 문서 체인 + 공통 UI 상태(모드·가이드·선택 단계 스위치) + 공통 설정
  scenarioContext.tsx   현재 시나리오 · 단계 경로 · T-Code 맵
  steps.ts / steps/     J45 단계 정의와 화면
  scenarios/
    types.ts              시나리오 계약(ScenarioDef, Runtime, Briefing)
    index.ts              시나리오 목록 (메뉴 순서)
    j45.tsx               J45를 시나리오 계약에 연결
    bmd/ · bnx/           store.ts · screens.tsx · index.tsx
    shared/               공통 SAP 화면(ui.tsx) · 저장/날짜 재기준(persist.ts)
  harness/              ── 발표자 도구 (SAP 화면 바깥) ──
    DemoLayout.tsx        전체 배치 + 시나리오 라우트
    DemoBar.tsx           상단 바 · ScenarioMenu.tsx 시나리오 선택
    ProcessBar.tsx · Sidebar.tsx · GuidePanel.tsx · ScenarioIntro.tsx · RoleBanner.tsx · StepGuard.tsx
    guide.ts              J45 가이드 문구 · highlight.ts 가이드 대상 찾기·테두리 · progress.ts
    Setup.tsx             데모 환경 설정 페이지
  components/           SAP 화면 부품: fiori/*, gui/*, Help(?)
  styles/
    harness/              base · demobar · processbar · sidebar · stage · guide · scenario · scenario-menu · help · setup
    sap/                  fiori(Horizon) · gui(SAP GUI) · print(PDF 미리보기)
```

빌드 결과는 약 0.9 MB입니다. 시나리오 화면은 처음 열 때 불러옵니다 (지연 로딩).
