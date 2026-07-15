# CLAUDE.md — Drinkig Client (CN) 프로젝트 매뉴얼

> 이 문서는 Claude Code 세션의 '뇌' 역할을 합니다. 아키텍처 요약, 코딩 컨벤션, 그리고 **우리가 작업 중에 마주친 버그/에러/해결책**을 누적 기록해 같은 실수를 반복하지 않도록 합니다.

---

## 1. 프로젝트 개요

- **제품명**: Drinkig (드링키지) — 와인 추천/테이스팅 노트/소믈리에 챗 모바일 앱
- **리포**: `drinkig-client-cn` — 이름의 `cn`은 **React Native(rn)의 오타**. 지역(중국) 빌드 아님. 그대로 두고 사용 중.
- **스택**: React Native `0.82.1` + React `19.1.1` + TypeScript `5.8.3`
- **노드 버전**: `>=20`
- **빌드 타겟**: iOS, Android

## 2. 핵심 아키텍처 & 디렉토리 레이아웃

```
src/
├── animations/     # Reanimated/애니메이션 헬퍼
├── api/            # axios 기반 백엔드 호출 레이어
├── assets/         # 이미지/폰트/로컬 정적 리소스
├── components/     # 재사용 UI
│   ├── common/         # 공통(GlassChip 등) — 신규 UI는 우선 이곳을 참조
│   ├── camera/
│   ├── home/
│   ├── onboarding/
│   ├── tasting_note/
│   ├── wine_detail/
│   └── navigation/
├── constants/      # 테마/색상/레이아웃 상수
├── context/        # React Context providers
├── data/           # 로컬 정적 데이터
├── i18n/           # i18next 리소스 (KR/EN/ZH)
├── navigation/     # @react-navigation 스택/탭 정의
├── screens/        # 라우트-레벨 스크린 컴포넌트
├── types/ types.ts # 전역 타입 정의
└── utils/          # 순수 헬퍼
```

**핵심 라이브러리**
- Navigation: `@react-navigation/native-stack`, `bottom-tabs`
- 상태/저장: `@react-native-async-storage/async-storage`, `react-native-keychain`
- 인증: Firebase Auth, Apple, Kakao
- 결제/광고: `react-native-iap`, `react-native-google-mobile-ads`
- 미디어: `react-native-vision-camera`, `react-native-video`, `react-native-svg`
- 국제화: `i18next` + `react-i18next` + `react-native-localize`

## 3. 코딩 컨벤션

1. **언어**: TypeScript 엄격 사용. `any`는 최후 수단.
2. **컴포넌트**: 함수형 + hooks. 파일명은 `PascalCase.tsx`.
3. **스타일**: `StyleSheet.create` 선호. 색상/간격은 `src/constants/`에 정의된 테마 값을 사용 — 하드코딩된 hex는 지양.
4. **i18n**: 사용자에게 노출되는 모든 문자열은 `t('...')`로. 리터럴 문자열 금지.
5. **공통 UI**: 신규 칩/버튼 등을 만들기 전에 `src/components/common/`을 먼저 확인 (예: `GlassChip`).
6. **import 경로**: `babel-plugin-module-resolver` 설정된 alias가 있다면 alias 우선, 없으면 상대 경로.
7. **커밋 메시지**: 기존 컨벤션 유지 — `feat:`, `refactor:`, `fix:`, `chore:` 접두어.
8. **불필요한 파일 금지**: `fix_jsx.js`, `replace_colors.js` 같은 일회성 스크립트를 반복 생성하지 않는다.
9. **포매팅**: Prettier `2.8.8` + `@react-native/eslint-config`. 수정 후에는 항상 `npm run lint`로 검증.

## 4. 자주 쓰는 명령

```bash
npm run lint         # eslint .
npm test             # jest
npx tsc --noEmit     # 타입 체크
npm run ios          # iOS 실행
npm run android      # Android 실행
npm start            # Metro
```

## 5. 작업 워크플로우 (Claude가 지켜야 할 것)

1. 파일을 수정하기 전에 항상 **먼저 Read**로 현재 내용을 확인한다.
2. 수정 후 **PostToolUse 훅**이 자동으로 `prettier --write` + `eslint --fix`를 실행한다 (아래 §8 참조).
3. 작업 범위 밖의 리팩토링/코멘트 추가는 **금지**.
4. 버그를 발견/해결하면 즉시 본 문서의 **§7 버그/해결 로그**에 추가한다.

## 6. 커스텀 슬래시 스킬

- **`/check_drinkig`** — 프로젝트의 구조·타입·린트 상태를 빠르게 스모크 테스트. 자세한 내용은 `.claude/skills/check_drinkig/SKILL.md`.

> 새로운 반복 작업이 생기면 `.claude/skills/<name>/SKILL.md` 형태로 추가한다.

## 7. 버그 / 에러 / 해결책 로그 (누적 기록)

> **규칙**: 작업 중 실패한 빌드, 런타임 에러, 놓친 엣지 케이스 등은 아래 표에 추가한다. "어떻게 재현하는지 → 원인 → 해결"을 한 줄로 남긴다.

| 날짜 | 영역 | 증상 | 원인 | 해결 |
|------|------|------|------|------|
| 2026-04-09 | 초기화 | — | — | CLAUDE.md, `/check_drinkig` 스킬, PostToolUse 훅 초기 설정 |
| 2026-06-10 | iOS 빌드 | `npm run ios` 시 fmt/glog 컴파일 실패 (`call to consteval function 'fmt::basic_format_string' is not a constant expression`, xcodebuild code 65) | Xcode 26.5 Clang에서 fmt 11.0.2의 consteval 포맷 검사가 깨짐. `base.h`가 `FMT_USE_CONSTEVAL`을 `#ifndef` 가드 없이 무조건 `#define`해서 `-D` 컴파일 플래그가 무시됨 | `ios/Podfile` `post_install`에서 `Pods/fmt/include/fmt/base.h`의 `#define FMT_USE_CONSTEVAL 1` → `0` 치환 (pod install마다 자동 재적용, 런타임 영향 없음) |
| 2026-06-10 | Metro | 앱 실행 후 `Unable to resolve module ./index from /Users/wiseungju/salary-fyi/.` 빨간 화면 | 8081 포트에 **다른 프로젝트(salary-fyi)의 Metro**가 떠있어 엉뚱한 번들을 서빙. run-ios의 "8082 쓸까요?" 프롬프트는 이 충돌 신호 | 8081 점유 프로세스(`lsof -iTCP:8081`) kill 후 `npm start`로 drinkig Metro 재기동, 앱 재실행 |
| 2026-06-22 | 라벨/메뉴 스캔 | TestFlight에서 카메라·갤러리 모두 스캔 직후 즉시 "메뉴판을 인식하지 못했습니다 / 더 또렷하게 찍으세요" 에러 (선명한 사진도 실패) | prod nginx `client_max_body_size`가 기본 1MB라, 스캔 이미지(라벨 2048px·메뉴 3072px, q90~92, 보통 1.5~5MB)가 **인증 이전 nginx 단에서 413 Request Entity Too Large**로 거부됨. 클라가 429 외 모든 에러를 "인식 실패"로 뭉개서 진짜 원인(413)이 가려짐. (저장된 토큰으로 prod 직접 호출해 확인: 1.3MB→413/0.2s, 163KB→백엔드 도달) | **서버: nginx `client_max_body_size 20m;` 상향 후 reload (진짜 원인, 1순위).** 클라: 413을 `menuScanResult.error.tooLarge`로 분리 표시, 라벨 스캔 안내문구를 메뉴판과 분리(`*Label` 키), 갤러리 사진은 중앙 프레임 크롭 제거하고 다운사이즈만 |
| 2026-07-07 | UI/UX 전반 | 전면 UI/UX 감사(6개 관점 병렬)에서 높음 17건·중간 20건·낮음 10건 발견 | 횡단 패턴 5종: ①에러가 "빈 상태/인식 실패"로 위장(silent failure 12곳+) ②이탈 가드 전무(BackHandler/usePreventRemove 0건) ③접근성 prop 4줄/Touchable 444건 ④테마 토큰 우회(hex 79건, 별점 골드 4종) ⑤dead-end(스캔 실패·검색 0건 등 후속 CTA 없음) | 6개 커밋(c32c77d2~36df636a)으로 수정: 공용 `ListStateView`+`getErrorMessageKey`, 세션만료→로그아웃 연결(`SessionExpiredHandler`), `useExitGuard` 훅(4개 화면), 드래프트 와인별 키 분리, IAP 리스너 전역화(`iapManager`), 폴백 KRW 가격 제거, 카메라 권한 dead-end 탈출구, 다시 스캔 CTA, 온보딩 진행 영속화+제출 플래그, textTertiary/타입칩 대비 AA 통과, 탈퇴 구독해지 안내+i18n, 고아 스크린 4종 삭제. **잔여 과제는 세션 최종 보고 참조** (typography 토큰, 바텀시트 통합, GlassHeader 라벨 전수, 검색 페이지네이션, 온보딩·챗 선택지 데이터 i18n 등) |
| 2026-07-13 | 취향 추천 | 취향 추천 3개 로직 감사에서 오류 3건 발견: ①온보딩 예산(monthPrice)이 추천에 미반영 ②추천 API 에러/0건 시 결과 화면이 빈 화면(dead-end, `saveRecommendations([])`가 기존 추천 덮어씀) ③취향 재설정이 `isNewbie:true` 하드코딩+`name:""` 전송으로 데이터 오염 가능 | ①서버 `findRecommendations`가 price 파라미터를 받고도 쿼리에서 미사용 ②`fetchRecommendations`가 에러를 console로만 삼킴 ③서버 `updateFirstUser`는 name!=null이면 무조건 덮어씀 | ①서버 PR [drinkig-server#5](https://github.com/Drinkig/drinkig-server/pull/5): 예산 내 우선+부족 시 예산 밖으로 채움+id tie-breaker ②`ListStateView` 에러(재시도)/빈 상태 표시, 빈 배열은 저장 안 함 ③재설정 요청에서 name/isNewbie 제거(서버는 null이면 유지). **잔여**: `wine_recommend.price` KRW 단위 검증(서버 PR #5 머지 전) |
| 2026-07-13 | 취향 추천 (2차) | 추가 감사에서 발견: ①재설정 7일 쿨다운이 dead code(프리미엄 조기해제 vs `isPremium && cooldown` 조건 모순) ②신규 유저 로그인 시 기본값 기준 무의미한 추천이 저장됨 ③멀티디바이스에서 추천 stale(로컬 우선 복원) ④타입 칩이 EN UI에서 한글 노출 ⑤top-3에 다양성 없음("색다른 시도" 카피 불일치) | — | **정책 변경: 프리미엄 무제한, 무료 30일 쿨다운(재설정 자체는 무료 개방, 쿨다운 중 탭→페이월 업셀).** 서버 PR #5(+다양성·모르는축 가중치), PR #6(lastTasteResetAt 기록/노출·취향 부분업데이트 보존·`GET /wine/recommend/wines` 실와인 추천 — `officialAlcohol`은 1~5 단계로 확인, 스케일 버그 아님). 클라: 쿨다운 서버값(max(서버,로컬)) 검증, 홈 추천 실와인 API 우선+검색 폴백, 캐시 키를 추천 시그니처로(재설정 시 자동 무효화), 온보딩 전 추천 fetch 스킵, 서버 우선 복원, `getWineTypeLabel` 공용 i18n, dead code 제거(getRecommendedWines·wineArea/wineVariety·WINE_AREAS). **잔여**: 페이월에 "무제한 재설정" 혜택 카피 반영, 서버 PR 배포 후 실와인 API 실기기 확인 |
| 2026-07-13 | 와인 상세 | 검색에서 특정 와인(예: 돔 페리뇽 234351) 상세 진입 시 500 | 통계 컬럼이 전부 NULL인 임포트 와인은 `@Embedded WineNoteStatistics`가 null로 하이드레이션되는데 `WineInfoResponse.of`가 널 체크 없이 접근 → NPE. 노트 통계 갱신 경로(`updateWineNoteStatics`)도 동일 구멍 | 서버 main 직접 푸시(3ad3213): Wine/WineVintage에 널 세이프 getter(null이면 0-통계 초기화). CD 자동 배포 후 프로드 200 확인 |
| 2026-07-15 | 페이월 UI | ①CTA 시머가 안 움직임 ②진입 직후 CTA가 죽은 버튼처럼 비활성→활성 깜빡임 ③footer 하단 여백 과다 | ①`useNativeDriver` 애니메이션은 시작 시점에 붙어있는 뷰에만 적용되는데, 시머 뷰가 `ctaWidth>0` 이후에 마운트되어 이미 시작된 루프가 안 먹음 ②StoreKit 상품 로드 완료까지 `disabled+opacity` 처리 ③`paddingBottom:40` 고정+간격 과다 | ①시머 뷰 (재)마운트 시점에 루프 재시작(`shimmerVisible` 의존) ②앱 시작 시 `iapManager.loadSubscriptions()`로 상품 프리로드·캐시, 페이월은 캐시 즉시 사용(로딩 미노출), 로딩 시엔 dim 대신 스피너 ③footer `Math.max(insets.bottom,12)`+간격 압축. **연간 결제창 미표시는 원인 추적 중** — `requestSubscription` catch가 에러를 삼키던 것 디버그 토스트로 노출+`getPendingPurchasesIOS` 로깅 추가(§7 확정 후 제거) |
| 2026-06-19 | 결제(IAP) | 실제 구매가 활성화 안 됨 + 실패인데 "구독 성공" 토스트 | (1) 클라가 보내는 product ID는 `.v2`인데 백엔드(`SubscriptionPlan.fromProductId`)는 `.v2` 없는 ID만 인식 → 무조건 `FREE`/`INVALID_RECEIPT`. (2) 클라 `verifyReceipt`가 응답의 `result.success`를 검사 안 함 → 실패해도 성공 처리. (3) 백엔드가 Apple에 영수증 검증을 전혀 안 하고 클라 값 그대로 신뢰(보안 구멍), 웹훅도 서명 미검증 | 백엔드 `.v2` ID 추가 + Apple `app-store-server-library 5.2.0`로 `getTransactionInfo`+서명검증(프로덕션→샌드박스 폴백) 도입(`AppleAppStoreClient`), 실제 만료일 반영, 웹훅 `signedPayload` 서명검증. 클라는 `result.success` 확인 후에만 `finishTransaction`/성공 토스트. **운영 전 `apple.iap.*`(In-App Purchase 키 .p8/issuer/key-id/app-apple-id) 환경변수 설정 필요** |

## 8. 자동화 훅 요약

`.claude/settings.local.json`의 `hooks.PostToolUse`가 `Edit|Write|MultiEdit` 도구 사용 직후 스크립트를 실행:

- 수정된 `.ts/.tsx/.js/.jsx` 파일에 대해
  - `npx prettier --write <file>` (들여쓰기 / 공백 정리)
  - `npx eslint --fix <file>` (lint 에러 자동 수정 + 남은 에러 리포트)
- 실패해도 Claude 세션을 블로킹하지 않고 stderr로 결과만 알린다.

자세한 구현은 `.claude/hooks/format_and_lint.sh` 참고.

---

_마지막 업데이트: 2026-04-09 (위승주 대표 요청으로 초기 세팅)_
