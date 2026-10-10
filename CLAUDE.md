# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

공통 안내는 `AGENTS.md`에 있습니다. 다른 에이전트와 함께 쓰는 파일이라, 저장소 규칙은 그쪽에 적습니다.

@AGENTS.md

## Claude Code 전용

- 스킬은 `.claude/skills/<이름>` 심링크로 등록되어 있어서 Skill 도구로 부를 수 있습니다. 새 스킬은 `.agents/skills/`에 만든 뒤 `ln -s ../../.agents/skills/<이름> .claude/skills/<이름>`으로 연결합니다.
