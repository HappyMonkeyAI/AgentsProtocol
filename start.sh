#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.tmp"
PID_FILE="$RUNTIME_DIR/mrpg-realms-dev.pid"
LOG_FILE="$RUNTIME_DIR/mrpg-realms-dev.log"

if [[ -f "$PID_FILE" ]]; then
  pid="$(<"$PID_FILE")"
  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    printf 'MRPG Realms is already running (pid %s)\n' "$pid"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

for port in 9401 9402; do
  if ss -ltn "( sport = :$port )" 2>/dev/null | grep -q LISTEN; then
    printf 'ERROR port %s is already in use\n' "$port" >&2
    exit 1
  fi
done

if [[ ! -x "$ROOT_DIR/node_modules/.bin/concurrently" ]]; then
  printf 'ERROR dependencies are missing; run npm install first\n' >&2
  exit 1
fi

mkdir -p "$RUNTIME_DIR"
: > "$LOG_FILE"
setsid npm run dev >"$LOG_FILE" 2>&1 < /dev/null &
pid=$!
printf '%s\n' "$pid" > "$PID_FILE"

cleanup_failed_start() {
  kill -TERM -- "-$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
}
trap cleanup_failed_start ERR

for _ in {1..20}; do
  if curl -fsS http://127.0.0.1:9402/health >/dev/null 2>&1 \
    && curl -fsS http://127.0.0.1:9401/ >/dev/null 2>&1; then
    trap - ERR
    printf 'MRPG Realms started (pid %s)\n' "$pid"
    printf 'Client: http://127.0.0.1:9401/\nServer: http://127.0.0.1:9402/health\nLog: %s\n' "$LOG_FILE"
    exit 0
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    printf 'ERROR MRPG Realms exited during startup; see %s\n' "$LOG_FILE" >&2
    exit 1
  fi
  sleep 0.5
done

printf 'ERROR MRPG Realms did not become ready; see %s\n' "$LOG_FILE" >&2
exit 1
