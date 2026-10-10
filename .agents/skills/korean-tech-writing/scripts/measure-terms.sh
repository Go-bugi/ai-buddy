#!/usr/bin/env bash
#
# 번역된 공식 문서 저장소에서 문체·번역투·용어 표기 빈도를 셉니다.
# 새 프레임워크 규칙 파일을 만들 때 근거 수치를 뽑는 용도입니다.
#
# 사용법:
#   measure-terms.sh <git-url> <content-path> [terms-file]
#
# 예시:
#   measure-terms.sh https://github.com/reactjs/ko.react.dev.git src/content/learn
#   measure-terms.sh https://github.com/vuejs-translations/docs-ko.git src my-terms.txt
#
# terms-file: 한 줄에 하나씩 적은 추가 검색어 목록 (선택).
#             빈 줄과 '#'으로 시작하는 줄은 무시합니다.

set -euo pipefail

if [ $# -lt 2 ]; then
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi

REPO_URL="$1"
CONTENT_PATH="$2"
TERMS_FILE="${3:-}"

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/measure-terms.XXXXXX")"
trap 'rm -rf "$WORKDIR"' EXIT

echo "저장소를 받는 중: $REPO_URL ($CONTENT_PATH)" >&2

# blob:none + sparse-checkout 으로 필요한 경로만 받습니다. 문서 저장소는
# 이미지 에셋이 커서 전체 클론은 느립니다.
git clone --depth 1 --quiet --filter=blob:none --sparse "$REPO_URL" "$WORKDIR/repo" >&2
git -C "$WORKDIR/repo" sparse-checkout set "$CONTENT_PATH" >&2

TARGET="$WORKDIR/repo/$CONTENT_PATH"
if [ ! -d "$TARGET" ]; then
  echo "경로를 찾을 수 없습니다: $CONTENT_PATH" >&2
  echo "저장소 최상위 목록:" >&2
  ls "$WORKDIR/repo" >&2
  exit 1
fi

DOC_COUNT="$(find "$TARGET" \( -name '*.md' -o -name '*.mdx' \) | wc -l | tr -d ' ')"

# 검색어 하나의 출현 횟수. 파일 수가 아니라 총 출현 횟수를 셉니다.
count() {
  grep -rFo --include='*.md' --include='*.mdx' -- "$1" "$TARGET" 2>/dev/null | wc -l | tr -d ' '
}

report() {
  local label="$1"; shift
  echo
  echo "## $label"
  echo
  printf '| 검색어 | 횟수 |\n|---|---|\n'
  for t in "$@"; do
    printf '| `%s` | %s |\n' "$t" "$(count "$t")"
  done
}

echo "# 표기 실측: $REPO_URL"
echo
echo "- 경로: \`$CONTENT_PATH\`"
echo "- 문서 수: ${DOC_COUNT}개 (.md, .mdx)"

report "문체" \
  "합니다." "습니다." "해요." "한다." "이다." "하세요." "십시오." "됩니다."

report "번역투 흔적" \
  "되어집니다" "보여집니다" "불려집니다" "쓰여집니다" \
  "당신의" "당신은" "우리는" "그것은" "그들은" \
  "하나의" "필요가 있습니다" "가지고 있습니다" "허용합니다" \
  "제공합니다" "에 대해서" "에 있어서" "만약"

report "공통 용어" \
  "컴포넌트" "렌더링" "리렌더링" "어트리뷰트" "속성" "프로퍼티" \
  "핸들러" "마크업" "콜백" "브라우저" "업데이트" "갱신" \
  "마운트" "클린업" "메모이제이션" "래퍼" "템플릿" "디렉티브" \
  "반환" "리턴" "호출" "선언" "부모" "자식" "중첩" "순수" \
  "불변" "의존성" "동기화" "구독" "배열" "매개변수" "인수" "인자" \
  "구조 분해" "전개" "스프레드" "최상위" "성능" "최적화" "재사용" \
  "목록" "리스트" "상태"

if [ -n "$TERMS_FILE" ]; then
  if [ ! -f "$TERMS_FILE" ]; then
    echo "검색어 파일을 찾을 수 없습니다: $TERMS_FILE" >&2
    exit 1
  fi
  echo
  echo "## 추가 검색어"
  echo
  printf '| 검색어 | 횟수 |\n|---|---|\n'
  while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue
    case "$line" in \#*) continue ;; esac
    printf '| `%s` | %s |\n' "$line" "$(count "$line")"
  done < "$TERMS_FILE"
fi

# 헤딩 형태: '~하기'로 끝나는 헤딩의 비율을 봅니다.
ALL_HEADINGS="$(grep -rh --include='*.md' --include='*.mdx' -E '^#{2,3} ' "$TARGET" 2>/dev/null | wc -l | tr -d ' ')"
DOING_HEADINGS="$(grep -rh --include='*.md' --include='*.mdx' -E '^#{2,3} ' "$TARGET" 2>/dev/null | grep -c '하기' || true)"

# 코드 주석: '//' 로 시작하는 줄 중 한글이 포함된 비율.
ALL_COMMENTS="$(grep -rh --include='*.md' --include='*.mdx' -E '^[[:space:]]*//' "$TARGET" 2>/dev/null | wc -l | tr -d ' ')"
KO_COMMENTS="$(grep -rh --include='*.md' --include='*.mdx' -E '^[[:space:]]*//' "$TARGET" 2>/dev/null | grep -c '[가-힣]' || true)"

echo
echo "## 구조"
echo
printf '| 항목 | 값 |\n|---|---|\n'
printf '| 헤딩(h2~h3) 총수 | %s |\n' "$ALL_HEADINGS"
printf '| 그중 `~하기` 형태 | %s |\n' "$DOING_HEADINGS"
printf '| `//` 주석 줄 총수 | %s |\n' "$ALL_COMMENTS"
printf '| 그중 한국어 주석 | %s |\n' "$KO_COMMENTS"

echo
echo "## 문서 사이트 확장 태그 (상위 20)"
echo
printf '| 태그 | 횟수 |\n|---|---|\n'
grep -rho --include='*.md' --include='*.mdx' -E '<[A-Z][A-Za-z]*>' "$TARGET" 2>/dev/null \
  | sort | uniq -c | sort -rn | head -20 \
  | awk '{printf "| `%s` | %s |\n", $2, $1}'

echo
echo "> 해석 요령: 문체는 한 쪽이 압도적이어야 정상입니다. 번역투 수치가 높으면"
echo "> 그 문서는 문체 기준으로 삼기에 부적합하니 용어만 참고하세요."
