# React

기준 문서: `reactjs/ko.react.dev`, 경로 `src/content` (226개 .md/.mdx)

아래 수치는 전부 아래 명령으로 재현됩니다. 표기가 갈리는 항목은 어느 쪽이 관행인지 보고 고르면 됩니다.

```bash
scripts/measure-terms.sh https://github.com/reactjs/ko.react.dev.git src/content
```

공통 용어와 조사 일반 규칙은 [common.md](common.md)에 있습니다. 두 곳이 어긋나면 이 파일이 우선입니다.

## 1. 원문 유지: React 개념어

한글로 옮기면 산문과 코드의 연결이 끊어집니다.

| 영어 | 표기 | 실측 |
|---|---|---|
| state | `state` | 문장 첫머리·헤딩·제목에서는 `State`로 대문자화 (State 3,165 / state 2,033) |
| props | `props` | 707 |
| ref | `ref` | |
| key | `key` | |
| context | `context` | |
| Hook | `Hook` | 645 (훅 43). 대문자로 씁니다 |
| Effect | `Effect` | 1,975 (이펙트 80). 대문자로 씁니다 |
| JSX | `JSX` | |
| React | `React` | |

Hook 이름(`useState`, `useEffect`, `useMemo` …)과 API 이름(`memo`, `createContext`, `Suspense`, `StrictMode` …)도 전부 원문 유지입니다.

## 2. React 고유 개념

| 영어 | 한국어 | 실측 |
|---|---|---|
| custom Hook | 커스텀 Hook | 120 (사용자 정의 Hook 10) |
| lifting state up | state 끌어올리기 | 4 |
| controlled / uncontrolled component | 제어 / 비제어 컴포넌트 | 7 / 14 |
| side effect | 사이드 이펙트 | 46 (부수 효과 32). `Effect`와 시각적으로 이어집니다 |
| dependency array | 의존성 배열 | 의존성 497 |
| cleanup function | 클린업 함수 | 클린업 88 |
| render / commit | 렌더링 / 커밋 | 렌더링 2,365 |
| reconciliation | 재조정 | |
| Server Component | `Server Component` | 원문 유지 |
| Strict Mode | `Strict Mode` | 원문 유지 |

## 3. 조사 결정표

발음 기준입니다. 갈리는 표기는 두 조사를 각각 세어 확인했습니다.

| 표기 | 한글 발음 | 받침 | 을/를 | 은/는 | 이/가 | 실측 |
|---|---|---|---|---|---|---|
| `state` | 스테이트 | 없음 | 를 | 는 | 가 | `state를` 342 / `state을` 1 |
| `props` | 프롭스 | 없음 | 를 | 는 | 가 | `props를` 77 / `props을` 1 |
| `JSX` | 제이에스엑스 | 없음 | 를 | 는 | 가 | `JSX를` 87 / `JSX을` 0 |
| `Effect` | 이펙트 | 없음 | 를 | 는 | 가 | `Effect를` 173 / `Effect을` 1 |
| `Hook` | 훅 | ㄱ | 을 | 은 | 이 | `Hook을` 169 / `Hook를` 0 |
| `DOM` | 돔 | ㅁ | 을 | 은 | 이 | `DOM을` 52 / `DOM를` 0 |
| `React` | 리액트 | 없음 | 를 | 는 | 가 | |
| `ref` | 레프 | 없음 | 를 | 는 | 가 | |
| `key` | 키 | 없음 | 를 | 는 | 가 | |
| `context` | 컨텍스트 | 없음 | 를 | 는 | 가 | |

## 4. react.dev 문서 구조에서 손대면 안 되는 것

react.dev는 MDX 기반이고 자체 컴포넌트를 씁니다. 태그는 그대로 두고 **안의 산문만** 번역합니다.

**헤딩 앵커**: `## Adding a state variable {/*adding-a-state-variable*/}`

`{/*...*/}` 안은 URL 프래그먼트입니다. 번역하면 문서 안팎의 모든 링크가 깨집니다. 헤딩 텍스트만 번역합니다.

**문서 사이트 MDX 컴포넌트**: 출현이 잦은 순서

`<Sandpack>` 733, `<Intro>` 217, `<Note>` 198, `<Pitfall>` 94, `<Solution>` 93, `<DeepDive>` 87, `<Heading>` 66, `<Hint>` 47, `<TerminalBlock>` 40, `<YouWillLearn>` 39, `<Section>` 32, `<Recap>` 30, `<Challenges>` 28, `<DiagramGroup>` 19

`<Sandpack>` 안은 실행되는 코드입니다. 주석만 번역하고 식별자·문자열·파일 경로는 건드리지 않습니다.

> 주의: 실측 스크립트의 태그 집계에는 `<StrictMode>`, `<Suspense>`, `<ViewTransition>`, `<Profiler>` 같은 것도 섞여 나옵니다. 이건 문서 사이트 컴포넌트가 아니라 **예제 코드 안의 React API**입니다. 어느 쪽이든 번역 대상이 아니라는 결론은 같지만, 새 프레임워크 규칙을 만들 때는 둘을 구분해서 적어야 오해가 없습니다.

**프론트매터**: `title` 값은 번역합니다. 콜론이 들어간 제목은 따옴표가 필요합니다.

```
---
title: "State: 컴포넌트의 기억 저장소"
---
```

`canary:`, `version:` 같은 플래그성 키와 값은 유지합니다.

**내부 링크**: `/learn/managing-state` 같은 상대 경로는 그대로 둡니다. ko.react.dev도 같은 경로 체계를 씁니다. 라벨만 번역합니다.

## 5. 문체 실측

| 항목 | 수치 |
|---|---|
| `~합니다.` / `~습니다.` | 4,299 / 5,136 |
| `~됩니다.` | 1,352 |
| `~하세요.` (지시문) | 999 |
| `~해요.` (해요체) | 0 |
| `~한다.` (한다체) | 1 |
| `~십시오.` | 7 |
| 헤딩(h2~h3) 중 `~하기` 형태 | 1,959개 중 366개 |
| 코드 주석 중 한국어 | 1,748줄 중 959줄 |

번역투 흔적도 세어봤습니다. `되어집니다`·`보여집니다`·`불려집니다`·`쓰여집니다` 전부 0회입니다. 이중피동은 쓰지 않는다고 봐도 됩니다.

## 6. React 생태계 라이브러리

Next.js, TanStack Query, Zustand 등 React 위에서 도는 라이브러리 문서를 번역할 때:

1. 그 라이브러리에 **공식 한국어 문서**가 있으면 거기 표기를 따릅니다.
2. 없으면 이 문서 + 공통 용어집을 적용합니다.
3. 라이브러리 고유 개념(Next.js의 Server Component·Route Handler, TanStack Query의 query key·stale time 등)은 **원문 유지**가 안전합니다. 검색 가능성이 유지되고 코드에 그대로 등장합니다.

자주 번역하게 되는 라이브러리라면 `terms/` 아래에 별도 파일을 만드는 편이 낫습니다. 절차는 [adding.md](adding.md)에 있습니다.
