# AGENTS.md

이 저장소에서 작업하는 코딩 에이전트(Claude Code, Codex 등)가 공통으로 읽는 안내입니다. 에이전트별 설정 파일(`CLAUDE.md` 등)은 이 파일을 불러오고, 그 에이전트에만 해당하는 내용만 덧붙입니다.

## 명령어

```bash
pnpm dev              # renderer HMR + main/preload watch 빌드 + Electron 실행
pnpm typecheck        # typecheck:node(main, preload) + typecheck:web(renderer)
pnpm lint             # ESLint (lint:fix로 자동 수정)
pnpm format:check     # Prettier 검사 (format으로 자동 수정)
pnpm build            # typecheck 후 main → preload → renderer 순서로 out/에 빌드
pnpm build:unpack     # 설치 파일 없이 패키징 폴더만 생성 (release/<version>/)
```

- 테스트 러너는 아직 없습니다. PR CI(`pr-check.yml`)는 `format:check`, `lint`, `build`를 돌립니다.
- Node 24.21.0 이상이 필요합니다(`.nvmrc`). `pnpm-workspace.yaml`의 `engineStrict` 때문에 Node 버전이 낮으면 `pnpm run`과 `pnpm install`이 실패하니, 먼저 `nvm use`를 실행하세요.
- 커밋할 때 husky가 lint-staged로 ESLint와 Prettier를 적용합니다. `commit-msg` hook은 없어서 커밋 메시지는 검사하지 않습니다.

## 구조

Electron의 세 영역을 Vite 설정 파일 세 개로 따로 빌드합니다. Electron 전용 빌드 도구(electron-vite 등)는 쓰지 않고, `scripts/dev.mjs`와 `scripts/build.mjs`가 Vite API를 직접 호출합니다.

| 영역     | 설정                      | 출력           | 특징                                        |
| -------- | ------------------------- | -------------- | ------------------------------------------- |
| main     | `vite.main.config.ts`     | `out/main`     | Node용 CJS 단일 파일                        |
| preload  | `vite.preload.config.ts`  | `out/preload`  | sandbox에서 돌도록 CJS 단일 파일            |
| renderer | `vite.renderer.config.ts` | `out/renderer` | React 앱. `file://`로 열리므로 `base: './'` |

- **의존성은 모두 번들됩니다.** main과 preload는 `ssr.noExternal: true`라서 `electron`만 빼고 전부 한 파일에 들어갑니다. electron-builder는 `out/`만 패키징하므로 런타임 라이브러리도 `devDependencies`에 추가합니다.
- **개발 모드 동작.** `dev.mjs`는 renderer를 dev 서버(5173, `strictPort`)로 띄웁니다. preload가 다시 빌드되면 renderer를 새로고침하고, main이 다시 빌드되면 Electron을 재시작합니다. main은 `VITE_DEV_SERVER_URL` 환경 변수가 있으면 dev 서버를, 없으면 `out/renderer/index.html`을 엽니다. 디버거 포트는 main 9229, renderer 9222입니다.
- **renderer는 Node API에 접근할 수 없습니다.** `contextIsolation`과 `sandbox`가 켜져 있어서, renderer는 preload가 노출한 `window.api`로만 main과 통신합니다. IPC 기능을 추가할 때는 세 곳을 함께 고칩니다.
  1. `src/main/index.ts`에서 `ipcMain`으로 채널을 처리합니다.
  2. `src/preload/index.ts`의 `api`에 그 채널을 감싸는 함수를 추가합니다. `ipcRenderer`를 통째로 노출하지 않습니다.
  3. `src/preload/index.d.ts`의 `Api` 타입을 고칩니다. 이 파일이 `tsconfig.web.json`에 포함되어 있어서 renderer가 `window.api` 타입을 받습니다.
- **tsconfig는 둘로 나뉩니다.** `tsconfig.node.json`은 main과 preload, `vite.*.config.ts`를 다룹니다. `tsconfig.web.json`은 renderer와 `src/preload/*.d.ts`를 다룹니다. renderer에서는 `@renderer/*` 별칭으로 `src/renderer/src`를 가리킵니다.
- `src/main/index.ts`의 `setAppUserModelId` 값은 `electron-builder.yml`의 `appId`(`com.aibuddy.app`)와 같아야 합니다.

## 브랜치 전략과 릴리스

간소화한 Git Flow 위에서 release-please가 버전, 태그, CHANGELOG, GitHub Release를 만듭니다. 자세한 절차는 README의 "브랜치 전략과 릴리스"에 있습니다.

| 브랜치                     | 갈라지는 곳                           | PR base            | 머지 방식                                      | 나오는 버전       |
| -------------------------- | ------------------------------------- | ------------------ | ---------------------------------------------- | ----------------- |
| `feature/*`                | `develop`                             | `develop`          | squash                                         | `develop`의 alpha |
| `hotfix/*`                 | `main`                                | `main`             | squash                                         | `main`의 patch    |
| `fix/*`                    | `release/x.y.0`                       | 그 `release/x.y.0` | squash                                         | beta, rc          |
| `release/x.y.0`            | Promote 워크플로가 `develop`에서 만듦 | `main`             | merge commit                                   | 정식 버전         |
| Release PR, `back-merge/*` | 워크플로가 자동 생성                  | 각 브랜치          | Release PR은 squash, back-merge는 merge commit |                   |

- **PR 제목이 곧 릴리스 노트 한 줄입니다.** 저장소 설정상 squash 커밋은 제목이 PR 제목이고 본문이 비어 있어서, release-please는 PR 제목만 읽습니다. 사용자에게 바뀌는 점을 Conventional Commits 형식으로 씁니다. `pr-check.yml`이 `commitlint.config.mjs`로 검사합니다.
- **`release`, `promote` 타입은 쓰지 않습니다.** Promote 워크플로만 쓰는 타입입니다. 단계 전환(beta 시작, rc, stable)도 Promote 워크플로로만 합니다. 이 워크플로가 브랜치의 release-please 설정에 `release-as`를 넣고, 릴리스가 끝나면 `release-please.yml`이 지웁니다. `Release-As:` 커밋 footer는 back-merge로 다른 브랜치에 퍼지므로 쓰지 않습니다.
- **버전 파일은 브랜치마다 값이 다릅니다.** `package.json`의 `version`, `.release-please-manifest.json`, `release-please-config*.json`, `CHANGELOG.md`는 손으로 고치지 않습니다. back-merge 스크립트(`.github/scripts/back-merge.sh`)가 대상 브랜치의 값을 유지합니다.
- **hotfix는 브랜치 이름이 `hotfix/`로 시작해야 합니다.** `hotfix-back-merge.yml`은 head 브랜치 이름을 보고 `develop`과 진행 중인 `release/*`에 back-merge합니다.
- **`release/x.y.0` → `main` PR은 정식 버전 Release PR을 머지한 뒤에 엽니다.** 제목은 `Release x.y.0`처럼 Conventional Commits 형식이 아니게 씁니다. 그래야 main CHANGELOG에 중복 기록되지 않습니다.
- `develop`에는 바로 나가도 되는 코드만 머지합니다. 큰 기능은 사용자에게 보이는 연결(버튼, 메뉴, 라우트)을 마지막 PR로 분리합니다.

## 스킬

반복 작업의 절차는 `.agents/skills/<이름>/SKILL.md`에 있습니다. 해당 작업을 할 때는 먼저 그 파일을 읽고 따르세요. 스킬을 불러오는 기능이 있는 에이전트는 그 기능으로 불러와도 됩니다. SKILL.md 안에서 다른 파일을 가리키는 경로는 저장소 루트 기준입니다.

| 스킬                  | 쓰는 때                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `commit`              | 커밋. 커밋할 때 commitlint를 돌리지 않으므로 스킬의 형식 규칙(설명 첫 글자를 대문자로 쓰지 않기 등)을 직접 지킵니다 |
| `pr`                  | PR 생성. base 판단, 릴리스 노트용 제목, `.github/PULL_REQUEST_TEMPLATE.md` 채우기                                   |
| `korean-tech-writing` | 한국어 문서, PR 본문, 커밋 메시지, 주석                                                                             |
| `humanizer`           | 한국어 글의 AI 말투 점검. `korean-tech-writing`이 긴 문서에서 부릅니다                                              |

- 스킬 원본은 `.agents/skills/` 한 곳에만 둡니다. 에이전트별 스킬 폴더(예: `.claude/skills/`)에는 원본을 가리키는 스킬별 심링크만 둡니다. 스킬을 추가하거나 고칠 때도 `.agents/skills/`에서 작업합니다.
- `.agents`는 `.prettierignore`에 들어 있습니다. 외부에서 가져온 스킬을 원본 그대로 두기 위해서입니다.
