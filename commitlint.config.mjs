// PR 제목 규칙 (Conventional Commits)
// .github/workflows/pr-check.yml 에서 PR 제목을 이 규칙으로 검사한다.
// squash 머지 시 PR 제목이 커밋 메시지가 되고, release-please가 이걸로 버전과 CHANGELOG를 만든다.
// 브랜치 안의 개별 커밋 메시지는 검사하지 않는다 (릴리스 노트에 쓰이지 않음).
//
// 로컬에서 제목을 미리 확인하려면:
//   echo "feat: 대화 기록 검색 추가" | pnpm exec commitlint

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        // 릴리스 노트에 표시
        'feat', // 새 기능, 화면 변경 → minor
        'fix', // 버그 수정 → patch
        'perf', // 성능 개선 → patch
        'revert', // 되돌리기 → patch
        // 릴리스 노트에서 숨김 (이것만 머지되면 Release PR이 생기지 않음)
        'refactor',
        'style', // 코드 포맷만 변경 (화면 디자인 변경은 feat / fix)
        'docs',
        'test',
        'build',
        'ci',
        'chore',
        // Promote 워크플로 전용 (단계 전환 기록). 사람이 쓰는 PR 제목에는 쓰지 않는다.
        'release', // develop: 다음 버전 alpha 시작
        'promote', // release/*: beta / rc / 정식 전환
      ],
    ],
  },
};
