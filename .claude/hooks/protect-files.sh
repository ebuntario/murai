#!/bin/bash
# Blocks Claude Code from editing sensitive or configuration files.
# Exit code 2 = block the tool use and show the error message.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROTECTED_PATTERNS=(
  ".env"
  "pnpm-lock.yaml"
  "package-lock.json"
  "bun.lockb"
  ".git/"
  ".github/"
  ".claude/settings.json"
  ".claude/hooks/"
  "lefthook.yml"
  "biome.json"
  "turbo.json"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: '$FILE_PATH' matches protected pattern '$pattern'." >&2
    echo "This file must not be modified by Claude. Modify it manually if needed." >&2
    exit 2
  fi
done

exit 0
