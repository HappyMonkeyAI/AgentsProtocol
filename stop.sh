#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.tmp/mrpg-realms-dev.pid"

if [[ ! -f "$PID_FILE" ]]; then
  printf 'MRPG Realms is not running (no pid file)\n'
  exit 0
fi

pid="$(<"$PID_FILE")"
if [[ ! "$pid" =~ ^[0-9]+$ ]]; then
  printf 'ERROR invalid pid file: %s\n' "$PID_FILE" >&2
  exit 1
fi

if ! kill -0 "$pid" 2>/dev/null; then
  rm -f "$PID_FILE"
  printf 'MRPG Realms was not running; removed stale pid file\n'
  exit 0
fi

kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid"
for _ in {1..20}; do
  if ! kill -0 "$pid" 2>/dev/null; then
    rm -f "$PID_FILE"
    printf 'MRPG Realms stopped\n'
    exit 0
  fi
  sleep 0.5
done

printf 'ERROR MRPG Realms did not stop cleanly (pid %s); use kill -KILL -- -%s only if required\n' "$pid" "$pid" >&2
exit 1
