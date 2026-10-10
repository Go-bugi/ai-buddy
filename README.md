# AI Buddy

Electron + React + TypeScript + Vite 데스크톱 앱.

## 요구 사항

- Node.js **24.21.0+** (`.nvmrc` 참고)
- pnpm **10** — 프로젝트에 버전이 고정되어 있으므로 corepack 사용을 권장합니다.

```bash
corepack enable
```

## 시작하기

```bash
pnpm install
pnpm dev
```

## 스크립트

| 스크립트               | 설명                                                   |
| ---------------------- | ------------------------------------------------------ |
| `pnpm dev`             | 개발 모드 (renderer HMR, main 변경 시 Electron 재시작) |
| `pnpm start`           | 빌드된 `out/`으로 앱 실행                              |
| `pnpm build`           | 타입체크 후 main / preload / renderer 빌드             |
| `pnpm build:mac`       | macOS 패키징 (dmg, zip / arm64, x64)                   |
| `pnpm build:win`       | Windows 패키징 (nsis 설치 파일 / x64)                  |
| `pnpm build:win:arm64` | Windows ARM 패키징                                     |
| `pnpm build:unpack`    | 설치 파일 없이 패키징된 폴더만 생성 (빠른 확인용)      |
| `pnpm lint` / `format` | ESLint / Prettier                                      |
| `pnpm typecheck`       | main(node)과 renderer(web) 각각 타입체크               |

결과물은 `release/<version>/`에 생성됩니다.

## 구조

```
src/
  main/       Electron main 프로세스 (Node)
  preload/    contextBridge로 renderer에 API 노출 (index.d.ts에 타입)
  renderer/   React 앱
scripts/
  dev.mjs     Vite dev 서버 + main/preload watch 빌드 + Electron 실행
  build.mjs   main / preload / renderer 프로덕션 빌드
vite.main.config.ts
vite.preload.config.ts
vite.renderer.config.ts
electron-builder.yml
```

- main / preload는 의존성까지 Vite로 번들되므로 패키징된 앱에는 `out/`만 들어갑니다.
  런타임에 쓰는 라이브러리도 `devDependencies`에 추가하면 됩니다.
- renderer는 `contextIsolation` + `sandbox`가 켜져 있어 Node API에 직접 접근할 수 없습니다.
  필요한 기능은 `src/preload/index.ts`의 `api`에 추가하고 `ipcMain`으로 처리하세요.

## 디버깅 (VS Code)

`pnpm dev`를 실행한 뒤 실행 및 디버그 탭에서 **Attach All**을 선택합니다.
main은 9229, renderer는 9222 포트로 연결됩니다.

## 포맷팅 / 커밋 규칙

- 저장 시 Prettier 포맷 + ESLint 자동 수정 (`.vscode/settings.json`)
  — 추천 확장(Prettier, ESLint, EditorConfig)을 설치하세요.
- 커밋 시 husky + lint-staged가 변경된 파일에 ESLint, Prettier를 적용합니다.
- 줄바꿈은 OS와 무관하게 **LF**로 통일됩니다 (`.gitattributes`, `.editorconfig`, Prettier `endOfLine`).

### Windows 개발 시

- 클론하기 전에 아래 설정을 권장합니다. `.gitattributes`가 LF를 강제하지만, 전역 설정까지 맞춰두면 안전합니다.

  ```bash
  git config --global core.autocrlf false
  ```

- husky 훅은 Git for Windows에 포함된 sh로 실행됩니다. GUI Git 클라이언트를 쓴다면 `pnpm`이 PATH에 있어야 합니다.

## 브랜치 전략과 릴리스

간소화한 Git Flow와 [release-please](https://github.com/googleapis/release-please)를 사용합니다.
버전, 태그, CHANGELOG, GitHub Release는 release-please가 자동으로 관리합니다.

### 브랜치

| 브랜치          | 만드는 곳                | 머지하는 곳           | 나오는 버전                  |
| --------------- | ------------------------ | --------------------- | ---------------------------- |
| `main`          | -                        | -                     | 정식 버전, hotfix (`v1.3.1`) |
| `develop`       | `main`                   | -                     | alpha (`v1.4.0-alpha.N`)     |
| `feature/*`     | `develop`                | `develop` (squash)    | -                            |
| `release/x.y.0` | Promote 버튼 (`develop`) | `main` (merge commit) | beta → rc → 정식 (`v1.3.0`)  |
| `hotfix/*`      | `main`                   | `main` (squash)       | -                            |

- `develop`에는 **지금 바로 나가도 되는 코드만** 머지합니다.
  - 작은 기능은 완성된 뒤에 머지합니다.
  - 큰 기능은 사용자에게 보이는 연결(버튼, 메뉴, 라우트)을 마지막 PR로 분리합니다.
- `release/*`에는 버그 수정만 들어갑니다.

### 브랜치별 release-please 설정

`.github/workflows/release-please.yml`이 push된 브랜치에 따라 설정 파일을 골라 실행합니다.

| 브랜치      | 설정 파일                            | 버전 규칙                               |
| ----------- | ------------------------------------ | --------------------------------------- |
| `main`      | `release-please-config.json`         | 기본 (fix → patch, feat → minor)        |
| `develop`   | `release-please-config.develop.json` | prerelease, `alpha.N` 번호 증가         |
| `release/*` | `release-please-config.release.json` | prerelease, `beta.N` / `rc.N` 번호 증가 |

- 현재 버전은 브랜치마다 `.release-please-manifest.json`에 기록되며, 브랜치마다 값이 다릅니다.
- 1.0 전까지는 breaking change가 있어도 minor만 올라갑니다 (`bump-minor-pre-major`).

### 릴리스 방법

**Release PR**: 브랜치에 `feat`, `fix` 등이 머지되면 release-please가 `chore(develop): release 1.4.0-alpha.3` 같은 Release PR을 만들거나 갱신합니다. **이 PR을 머지하는 순간** 태그, GitHub Release, mac / Windows 빌드 업로드가 진행됩니다.

**단계 전환**: Actions → **Promote** 워크플로를 실행합니다.

| 단계            | 하는 일                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| `start-release` | `develop`에서 `release/x.y.0` 생성 → beta.1. `develop`은 다음 버전 alpha.1로 |
| `rc`            | `release/x.y.0`을 rc.1로                                                     |
| `stable`        | `release/x.y.0`을 정식 버전으로                                              |

**출시 순서**

1. Promote `start-release` (버전 `1.3.0`) → beta.1 Release PR 머지
2. 버그 수정은 `release/1.3.0`으로 PR (squash) → beta.N Release PR 머지
3. Promote `rc` → rc.1 Release PR 머지
4. Promote `stable` → `1.3.0` Release PR 머지
5. `release/1.3.0` → `main` PR을 **merge commit**으로 머지 (제목은 `Release 1.3.0`처럼, Conventional Commits 형식 아님)
6. 자동으로 만들어진 `develop` back-merge PR을 **merge commit**으로 머지

**hotfix**

1. `main`에서 `hotfix/x.y.z` 브랜치를 만들어 수정
2. `main`으로 PR (`fix: ...`, **squash**) → `main`의 Release PR 머지
3. `develop`과 진행 중인 `release/*`에는 자동으로 반영됩니다.

### 규칙

| 규칙                                                                   | 이유                                                                        |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| PR 제목은 Conventional Commits (`feat:`, `fix:` 등). `pr-check`가 검사 | squash 시 PR 제목이 커밋 메시지가 되고, release-please가 이걸로 버전을 정함 |
| merge commit은 `release → main`과 `back-merge/*` PR만, 나머지는 squash | hotfix를 merge commit으로 하면 CHANGELOG에 중복 기록됨                      |
| 단계 전환은 Promote 버튼으로만                                         | `release-as` 설정을 넣고 릴리스 후 자동으로 지움                            |
| `release:`, `promote:` 타입은 사람이 쓰지 않음                         | Promote 워크플로 전용 (CHANGELOG의 Release 섹션)                            |

### 자동 back-merge

`.github/scripts/back-merge.sh`를 사용하며, 대상 브랜치의 버전 파일(`package.json`의 version, manifest, release-please 설정, CHANGELOG)은 항상 그대로 유지합니다.

- **hotfix** (`hotfix-back-merge.yml`): `hotfix/*` PR 또는 `main`의 Release PR이 머지되면 `develop`과 진행 중인 `release/*`에 반영합니다. 충돌이 없으면 바로 push하고, 충돌이 있거나 push가 거부되면 PR을 만듭니다.
- **release 출시** (`release-back-merge.yml`): `release/*`가 `main`에 머지되면 `develop`으로 back-merge PR을 만들고 `release/*` 브랜치를 삭제합니다.

> GitHub Actions 기본 토큰(`GITHUB_TOKEN`)으로 만든 PR에서는 다른 워크플로가 실행되지 않습니다. 그래서 Release PR과 back-merge PR에는 `pr-check`가 붙지 않습니다. 브랜치 보호에 "CI 통과 필수"를 걸려면 GitHub App 토큰으로 바꿔야 합니다.

## 빌드 환경

| 대상    | macOS에서 | Windows에서            |
| ------- | --------- | ---------------------- |
| macOS   | ✅        | ❌ (Apple 정책상 불가) |
| Windows | ✅        | ✅                     |

release-please가 릴리스를 만들면 `.github/workflows/release-please.yml`이 macOS / Windows 러너에서 각각 빌드해 GitHub Release에 업로드합니다. PR에서는 `pr-check.yml`이 포맷, 린트, 타입체크, 빌드만 확인합니다.

### 코드 서명

현재는 서명 없이 빌드됩니다. 배포 시 환경변수로 인증서를 지정하세요.

- macOS: `CSC_LINK`, `CSC_KEY_PASSWORD`, 공증용 `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
  (공증하려면 `electron-builder.yml`에서 `mac.notarize`를 `true`로 바꿉니다)
- Windows: `CSC_LINK`, `CSC_KEY_PASSWORD` (또는 `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`)
