#!/usr/bin/env bash
# SOURCE_SHA의 변경을 TARGET 브랜치에 반영한다 (back-merge).
#
# 버전 관련 파일(package.json의 version, release-please manifest/설정, CHANGELOG)은
# 브랜치마다 값이 다르므로, 머지 전에 소스 쪽을 TARGET 값으로 맞춘 커밋을 만들어 충돌을 없앤다.
# (release-please는 브랜치의 manifest 버전으로 최신 릴리스를 찾으므로 반드시 TARGET 값을 유지해야 함)
#
# env:
#   SOURCE_SHA   반영할 커밋
#   SOURCE_NAME  표시용 이름 (예: hotfix/1.3.1)
#   SOURCE_PR    원본 PR 번호
#   TARGET       반영할 브랜치 (예: develop)
#   MODE         push: 충돌 없으면 바로 push / pr: 항상 PR 생성
set -euo pipefail

VERSION_FILES=(
  .release-please-manifest.json
  CHANGELOG.md
  release-please-config.json
  release-please-config.develop.json
  release-please-config.release.json
)

slug="${SOURCE_NAME//\//-}"
work_branch="back-merge/${slug}-into-${TARGET//\//-}"

git fetch origin "$TARGET"

if git merge-base --is-ancestor "$SOURCE_SHA" "origin/$TARGET"; then
  echo "result=up-to-date" >> "$GITHUB_OUTPUT"
  exit 0
fi

# 1. 소스 쪽 버전 파일을 TARGET 값으로 맞춘다
git switch -C "$work_branch" "$SOURCE_SHA"

target_version="$(git show "origin/$TARGET:package.json" | node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).version')"
node -e '
  const fs = require("fs");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  pkg.version = process.argv[1];
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
' "$target_version"

for file in "${VERSION_FILES[@]}"; do
  if git cat-file -e "origin/$TARGET:$file" 2>/dev/null; then
    git show "origin/$TARGET:$file" > "$file"
  else
    git rm -q --ignore-unmatch "$file"
  fi
done

git add -A package.json "${VERSION_FILES[@]}"
if ! git diff --cached --quiet; then
  git commit -q -m "chore: keep ${TARGET} version files for back-merge"
fi

open_pr() {
  local reason="$1"
  git push --force origin "HEAD:refs/heads/${work_branch}"

  local existing
  existing="$(gh pr list --base "$TARGET" --head "$work_branch" --state open --json url --jq '.[].url')"
  if [ -n "$existing" ]; then
    echo "result=pr-exists ${existing}" >> "$GITHUB_OUTPUT"
    return
  fi

  local url
  url="$(gh pr create \
    --base "$TARGET" \
    --head "$work_branch" \
    --title "chore: back-merge ${SOURCE_NAME} into ${TARGET}" \
    --body "#${SOURCE_PR} (\`${SOURCE_NAME}\`)의 변경을 \`${TARGET}\`에 반영합니다.

- 버전 파일(package.json version, release-please manifest/설정, CHANGELOG)은 \`${TARGET}\` 값을 유지하도록 자동 처리했습니다.
- ${reason}
- **merge commit** 방식으로 머지해 주세요. (squash 금지)")"
  echo "result=pr ${url}" >> "$GITHUB_OUTPUT"
}

# 2. TARGET에 머지
git switch -C back-merge-result "origin/$TARGET"
if ! git merge --no-ff "$work_branch" -m "chore: back-merge ${SOURCE_NAME} into ${TARGET}"; then
  git merge --abort
  git switch "$work_branch"
  open_pr "⚠️ 충돌이 있습니다. 충돌을 해결한 뒤 머지해 주세요."
  exit 0
fi

if [ "$MODE" = "push" ]; then
  if git push origin "HEAD:${TARGET}"; then
    echo "result=pushed" >> "$GITHUB_OUTPUT"
  else
    open_pr "브랜치 보호 규칙으로 바로 push하지 못했습니다. 충돌은 없습니다."
  fi
else
  open_pr "충돌 없이 머지되는 상태입니다."
fi
