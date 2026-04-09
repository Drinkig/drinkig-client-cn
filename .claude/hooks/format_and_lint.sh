#!/usr/bin/env bash
# PostToolUse hook: auto-format & lint files that Claude just edited.
#
# Claude Code passes the tool-call payload as JSON on stdin. We extract the
# file_path and, if it's a JS/TS source, run prettier --write and eslint --fix
# against it. Failures never block the session — we always exit 0 and write
# diagnostics to stderr so Claude can see them in the next turn.

set -u

# Read JSON payload from stdin (may be empty if invoked manually).
PAYLOAD="$(cat || true)"

# Extract the file_path field without requiring jq.
FILE="$(printf '%s' "$PAYLOAD" \
  | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
  | head -n1)"

if [ -z "${FILE:-}" ]; then
  exit 0
fi

# Only format JS/TS sources.
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# Only operate on files inside the project (defensive).
case "$FILE" in
  /Users/wiseungju/dev/drinkig-client-cn/*) ;;
  *) exit 0 ;;
esac

if [ ! -f "$FILE" ]; then
  exit 0
fi

cd /Users/wiseungju/dev/drinkig-client-cn || exit 0

{
  echo "[format_and_lint] $FILE"

  if [ -x "node_modules/.bin/prettier" ]; then
    node_modules/.bin/prettier --write "$FILE" 2>&1 \
      || echo "[format_and_lint] prettier failed (non-blocking)"
  fi

  if [ -x "node_modules/.bin/eslint" ]; then
    node_modules/.bin/eslint --fix "$FILE" 2>&1 \
      || echo "[format_and_lint] eslint reported remaining issues (non-blocking)"
  fi
} 1>&2

exit 0
