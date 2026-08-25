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
├── i18n/           # i18next 리소스 (KR/EN — ZH는 미등록, 추가 시 index.ts에 등록 필요)
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
10. **UX 카피 톤** (2026-08-25 전면 통일, 대표 승인): ①전 화면 **해요체** — 합니다체는 법적 고지(자동갱신·약관 동의)·문의 메일 본문·어드민 화면만 ②이모지는 소믈리에 챗 '드링키' 말풍선에만 허용 ③과장·유행어 금지("취향 저격", "실패 없는", "운명" 류) ④'온보딩' 등 내부 용어 유저 노출 금지 ⑤Alert 제목 "성공" 금지 → "저장 완료" 등 맥락 있는 제목 ⑥느낌표는 축하 순간(구독 시작 등)에만 ⑦"~해 주세요" → "~해주세요"로 붙여쓰기 통일 ⑧빈 상태 짧은 라벨은 마침표 없이. EN도 동일 기조(이모지·과장 제거, "Success" 제목 금지).

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
| 2026-07-15 | 스캔 횟수 | 스캔해도 카메라의 3/3 잔여 횟수가 안 줄어듦 | 3/3 표시는 서버 `/scan/remaining`(DB ScanUsage) 값인데, 카운터를 올리는 `POST /scan/use`를 클라가 어디서도 호출 안 함(`api/subscription.ts`에 `useScan` 래퍼만 있고 미배선). 로컬 AsyncStorage 카운트는 폴백 표시용이라 평소 미노출. 실제 제한은 menu-scan의 redis 카운터(10회/일, 실패 포함)가 별도로 동작 | **서버가 직접 차감** (클라 신뢰 X): `scanMenu`에서 `canScan` 사전 차단(초과 시 429) + 성공·와인 1건 이상 추출 시에만 `useScan` 기록. redis 10회/일은 어뷰징 백스톱으로 유지. 클라: 실패 화면에 "실패한 스캔은 횟수 차감 안 됨" 안내(무료 유저·429 제외), 로컬 폴백 카운트도 동일 정책. `/scan/use` 엔드포인트는 이제 미사용(정리 후보) |
| 2026-07-15 | 테스트 | `npm test` 시 `__tests__/App.test.tsx`가 항상 실패 (`NativeModule: AsyncStorage is null`) | jest 설정에 `@react-native-async-storage/async-storage` mock 미등록 — App.tsx가 AsyncStorage를 직접 import해서 렌더 테스트가 네이티브 모듈을 요구함 (HEAD에서도 동일, 로딩 UX 작업과 무관) | **해결(2026-08-25)**: `jest.setup.js` 신설 — async-storage 공식 mock + 네이티브 모듈 전반(mobile-ads·iap·firebase·kakao·apple·keychain·vision-camera·config·device-info·haptic 등) mock, `transformIgnorePatterns` 확장. 2 스위트 8 테스트 전부 통과 |
| 2026-07-21 | 어드민 웹 | Drinkig-Web에 어드민(/admin) 신설 과정에서 확인: ①앱의 리뷰/가격 "신고"가 API가 아닌 mailto(이메일)라 서버에 데이터가 안 남음 ②서버 Member에 createdAt이 없어 가입 추이 집계 불가 ③어드민 로그인 수단 부재(소셜만) | 신고는 `reportUtils.ts`가 mailto로만 발송, Member는 BaseEntity 미상속, ROLE_ADMIN은 DB 수동 설정뿐 | 서버: `/login/admin`(env ADMIN_USERNAME/PASSWORD 부트스트랩) + report 도메인(`POST /report`, `/admin/report`) + `/admin/stats/*`(overview·timeseries·funnel·downloads) + `/admin/scan-feedback` + Member→BaseEntity 상속 + ASC Sales 리포트 수집 스캐폴딩(`apple.asc.*`). 앱: `sendContentReport`가 `POST /report` 호출(사유 입력 Alert.prompt). 웹: `/admin` 라우트(프리렌더 제외), `lib/adminApi.ts`, 대시보드/등록요청/신고/피드백 화면. **배포 전 필요: 서버 env(ADMIN_USERNAME·ADMIN_PASSWORD, CORS_ALLOWED_ORIGINS에 웹 도메인 추가, 선택 ASC_* 4종)** |
| 2026-08-05 | 내 와인 | 라벨 사진이 있는 와인(몬테스 알파 등)이 검색/상세에선 잘 뜨는데 내 와인 목록·상세에서만 기본 병 이미지로 표시 | 신규 마스터 와인은 DB `image_url`이 비어 있고 URL은 `WineImageUrlResolver`(sourceId 기반 S3 키 조립)가 만드는데, 서버 `MyWineResponse.of`만 raw `wine.getImageUrl()`을 사용 → null 응답 | 서버 `MyWineResponse.of`를 `WineImageUrlResolver.resolve(wine)`로 교체. `WineRequestResponse` 2종도 raw 사용이지만 유저 등록 와인은 규칙 키에 S3 객체가 없어 의도된 것으로 보고 유지 |
| 2026-08-05 | 라벨/메뉴 스캔 | 서버 스캔 개선 배포(7037ee8: gpt-4o+detail high, 이미지 전처리, 매칭 정규화 전면 수정)로 **HEIC 업로드가 400 `MENU_SCAN4002`로 명시 거부**됨 → 클라 대응 필요 | 갤러리 에셋에 width/height 메타데이터가 없으면 `handleGallery`가 원본 URI를 그대로 전송(주석 "원본 그대로 서버에 맡긴다") → PhotoManipulator JPEG 재인코딩을 건너뛰어 HEIC이 서버로 감. 정상 경로(카메라 촬영·갤러리+메타데이터)는 `cropRegionAndResize`가 항상 JPEG로 재인코딩해 안전 | 메타데이터 없으면 `Image.getSize`로 크기를 얻어 항상 ScanAdjust(JPEG 재인코딩) 경로로 통일. `MENU_SCAN4002` 응답은 `menuScanResult.error.unsupportedFormat`(ko/en)으로 분리 안내(재촬영 유도 아님). 참고: list 3072px는 서버가 2048로 재축소하지만 OpenAI도 내부적으로 2048 상한이라 손실 없음 |
| 2026-08-11 | 테이스팅 노트 사진 | 노트에 유저 사진 첨부(최대 5장) + 마이페이지 3열 인스타 그리드 신설. 서버에 사진 개념 자체가 없었고, `POST /new-note`가 생성된 noteId를 버리고 문자열만 반환해 "생성 후 업로드" 플로우가 불가능했음 | — | 서버: `tasting_note_image`(noteId·imageUrl·sortOrder, ddl-auto로 자동 생성) + `POST/DELETE /tasting-note/{id}/images`(S3 `tasting-note/` 경로, 누적 5장 초과 시 NOTE4004) + `/my`에 `thumbnailUrl`(대표사진) + 상세에 `images[]` + **create가 noteId 반환**(구 클라는 result 미사용이라 안전, 테스트 6건 기대값 갱신). 노트/사진 삭제 시 S3 정리는 실패해도 로그만(고아 파일 허용). 클라: 작성 총평 스텝·상세 화면에서 카메라/갤러리 멀티 첨부 — **어떤 출처든 `prepareNotePhoto`로 JPEG 재인코딩**(§7 2026-08-05 HEIC 400 재발 방지, 1600px q85), 업로드 실패해도 노트 저장은 유지(안내 토스트+상세에서 재첨부). 그리드는 사진=cover, 라벨 폴백=imageWell+contain. 참고: 서버 `TastingNoteRepositoryImplTest` 등 8건은 HEAD에서도 깨지는 기존 플레이키(정렬·날짜 의존) |
| 2026-08-11 | 소셜(팔로우·피드) | 팔로우/팔로잉 + 공개 프로필 + 홈 소셜 피드 신설 | — | 서버: `Member.isProfilePublic`(기본 비공개, `PATCH /member/info` 부분 업데이트), `follow` 도메인(팔로우/언팔/카운트, FOLLOW4001~3), `GET /tasting-note/feed`(공개+사진 노트, 본인 제외), 노트 상세 타인 열람 허용(`mine`/작성자 필드, 구 클라는 mine 미존재→내 노트 취급), `GET /member/profile/{id}`(비공개도 헤더는 조회), `GET /tasting-note/member/{id}`(비공개면 MEMBER4014). 클라: 프로필 수정에 공개 토글, 마이페이지 헤더 팔로워/팔로잉 카운트+비공개 자물쇠, 홈 "최근 본 와인"·"최근 리뷰" 섹션 → 피드 섹션 대체(RecentReviewsSection 삭제), UserProfileScreen 신설(팔로우 버튼+3열 그리드), 노트 상세 읽기 전용 모드(타인 노트는 삭제→신고 메뉴, 작성자 행). **버그**: 사진 업로드 응답 imageId null — IDENTITY id는 flush 전 미생성이라 `saveAndFlush` 후 DTO 생성으로 수정. **잔여**: 피드는 본인 노트 제외라 단일 계정으론 확인 불가(테스트 계정 필요), 차단(block) 기능 미구현(App Store UGC 심사 대비 필요), 피드 "더보기" 전체 화면·팔로워/팔로잉 리스트 화면·취향 비교 미구현 |
| 2026-08-25 | 소셜·사진 UX 일괄 개선 | 3갈래 유저 관점 감사(소셜/노트 사진/내비 횡단)에서 30여 건 발견 — 높음: ①차단해도 피드·프로필에 미반영(피드는 빈 목록일 때만 재조회, 프로필은 mount 1회 로드) ②카메라 촬영 노트 사진이 업로드 실패 시 영구 유실(`saveToPhotos` 미지정이라 임시 폴더에만 존재) | 에러 위장 패턴 다수(§7 2026-07-07 재발): 홈 피드 섹션 로딩·에러 시 통째 사라짐, 피드 refresh 실패 시 목록이 에러 화면으로 교체, 타인 프로필 노트 실패가 "노트 없음"으로 위장, 크롭이 파괴적(원본 교체로 재크롭 불가), 제출 중 이탈 가드가 "저장 안 함" 거짓 안내, 친구 검색 응답 레이스 등 | `appEvents`(memberBlocked) 이벤트 버스로 차단 시 피드 즉시 제거+프로필 `useFocusEffect` 재검증, `launchCamera saveToPhotos:true`+`NSPhotoLibraryAddUsageDescription` 추가, 비파괴 크롭(`NotePhoto{uri,croppedUri,cropRegion}` — 원본 보존, 재크롭 시 프레이밍 복원, 드래프트 구형식 정규화), FeedSection 스켈레톤+blur 가드+EN 폴백+에러 행, FeedScreen refresh 실패 토스트화+footer 재시도+`useScrollToTop`, UserProfile 노트 에러 분리+unblock 연타 가드+BLOCK 코드 전용 카피(`getApiErrorCode` 공용 헬퍼), 상세 NOTE4004 분기+업로드 성공 토스트+타임아웃 시 재조회로 실제 저장 확인+처리 중 페이지, 친구 검색 시퀀스 가드+재시도, 팔로워 카운트 미로드 시 "-", 스캔 0건도 차감 안 됨 안내, `surfaces.scrim`/`withAlpha` 토큰 신설(스크림 hex 5종 통일)+스피너 `accent.text` 통일, 데드코드 삭제(NotificationScreen·returnScreen 분기·tab.search), CLAUDE.md ZH 표기 정정. 서버(drinkig-server, 05fbbd7로 커밋·배포됨): 업로드 시 480px 썸네일 파생본(`tasting-note/thumb/`) 생성, 프리뷰 응답 `thumbnailUrl ?? imageUrl` 폴백(피드는 풀사이즈 유지) |
| 2026-08-25 | 소셜 피드 (2차) | 대표 확인: 본인이 쓴 노트가 피드에 안 뜸 — "미노출 버그"로 오인 | 8/11 피드 설계가 본인 노트를 쿼리에서 제외(`m.username <> :username`)한 의도적 정책이었으나, 유저 입장에선 "내가 올린 게 왜 없지"로 읽힘 | **정책 변경: 본인 노트도 피드 포함**(비공개 프로필이어도 본인에겐 노출 — `(isProfilePublic OR 본인)` 조건). 서버: 피드 응답에 `mine` 플래그 추가(클라는 자기 memberId를 모르므로 서버가 판별, 시드 계정 username null 대비 viewer 쪽 비교). 클라: 피드/홈 피드 섹션에서 `mine` 작성자 탭 시 UserProfile(팔로우·차단 버튼 노출) 대신 마이페이지 탭으로 이동 — `MainTabParamList` 신설로 중첩 내비 타입 지원. 구버전 조합 안전: 구 서버는 `mine` 미전달→타인 취급(기존 동작), 구 클라는 `mine` 무시(본인 UserProfile 진입 가능하나 치명적이진 않음) |
| 2026-06-19 | 결제(IAP) | 실제 구매가 활성화 안 됨 + 실패인데 "구독 성공" 토스트 | (1) 클라가 보내는 product ID는 `.v2`인데 백엔드(`SubscriptionPlan.fromProductId`)는 `.v2` 없는 ID만 인식 → 무조건 `FREE`/`INVALID_RECEIPT`. (2) 클라 `verifyReceipt`가 응답의 `result.success`를 검사 안 함 → 실패해도 성공 처리. (3) 백엔드가 Apple에 영수증 검증을 전혀 안 하고 클라 값 그대로 신뢰(보안 구멍), 웹훅도 서명 미검증 | 백엔드 `.v2` ID 추가 + Apple `app-store-server-library 5.2.0`로 `getTransactionInfo`+서명검증(프로덕션→샌드박스 폴백) 도입(`AppleAppStoreClient`), 실제 만료일 반영, 웹훅 `signedPayload` 서명검증. 클라는 `result.success` 확인 후에만 `finishTransaction`/성공 토스트. **운영 전 `apple.iap.*`(In-App Purchase 키 .p8/issuer/key-id/app-apple-id) 환경변수 설정 필요** |
| 2026-08-13 | 노트 사진 UX | 총평 스텝에서 사진 선택 후 재인코딩 동안 로딩 표시가 없어 멈춘 것처럼 보임 + 미리보기가 84px 썸네일이라 그리드(3:4)에 어떻게 잘릴지 알 수 없음 | `prepareNotePhoto` 재인코딩(수 초)이 hourglass 아이콘 하나로만 표시됨 | 작성 화면 사진 영역을 그리드와 동일한 3:4 풀폭 캐러셀(pagingEnabled+dots)로 교체, 처리 중엔 스피너 페이지 자동 표시+자동 스크롤. `PhotoCropModal` 신설(PanResponder 드래그 크롭, 3분할 가이드) — 적용 시 `cropNotePhoto`로 실제 3:4 JPEG 크롭 업로드. 상세 화면 페이저도 1:1→3:4 통일(크롭 프레이밍 보존). 크롭은 v1 드래그만(핀치 줌 없음) |
| 2026-08-13 | 소셜(피드 탭·차단·친구 검색) | 피드가 기본 비공개 정책 탓에 빈 화면 + 검색 탭이 홈 검색바와 중복 + App Store UGC 대비 차단 미구현 | — | **정책: 프로필 기본 공개 전환** — 서버 `Member.isProfilePublic=true`(신규), 기존 유저는 `scripts/make_profiles_public_default.sql` 1회 실행 필요(앱 공지 권장), 클라 폴백도 `?? true`. **탭 개편**: 검색 탭 → 피드 탭(`FeedScreen` 무한스크롤+빈 상태 CTA, `people` 아이콘), 검색은 루트 스택으로 이동(홈 검색바·위시리스트 CTA 진입, back 버튼+autoFocus 추가), 홈 피드 섹션에 "더보기"→피드 탭. **친구 검색**: `GET /member/search?keyword=`(닉네임 부분 일치, 본인·시드 제외, 최대 20) + `FriendSearchScreen`(400ms 디바운스) — 피드 헤더 👤+ 아이콘 진입. **차단**: `member_block` 도메인(`POST/DELETE/GET /block`, BLOCK4001~4) — 차단 시 팔로우 양방향 자동 해제, 피드 쿼리·타인 노트·프로필에서 양방향 숨김(상대가 나를 차단하면 비공개 계정으로 위장, 내가 차단하면 `isBlocked`+차단 해제 UI), 차단 관계 팔로우 시도는 BLOCK4004. 노트 상세 메뉴에 "작성자 차단" 추가. **버그 발견/수정**: 회원 탈퇴가 follow/block 행을 정리 안 해 FK 위반으로 실패 — `deleteAllByMemberId` 양방향 정리 추가(팔로우 기능 출시 때부터 있던 구멍). **배포 순서**: 서버 push(CD 1~2분 502) → prod DB에서 마이그레이션 SQL 실행 → 클라 배포. **잔여**: 차단 계정 목록 화면(서버 `GET /block`은 준비됨), 팔로워/팔로잉 리스트, 취향 비교, 피드 검증용 테스트 계정 |

## 8. 자동화 훅 요약

`.claude/settings.local.json`의 `hooks.PostToolUse`가 `Edit|Write|MultiEdit` 도구 사용 직후 스크립트를 실행:

- 수정된 `.ts/.tsx/.js/.jsx` 파일에 대해
  - `npx prettier --write <file>` (들여쓰기 / 공백 정리)
  - `npx eslint --fix <file>` (lint 에러 자동 수정 + 남은 에러 리포트)
- 실패해도 Claude 세션을 블로킹하지 않고 stderr로 결과만 알린다.

자세한 구현은 `.claude/hooks/format_and_lint.sh` 참고.

---

_마지막 업데이트: 2026-04-09 (위승주 대표 요청으로 초기 세팅)_
