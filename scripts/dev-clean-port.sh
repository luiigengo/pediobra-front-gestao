#!/usr/bin/env bash
set -euo pipefail

PORT="${FRONTEND_PORT:-3001}"

find_port_pids() {
  if command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "$PORT" 2>/dev/null | tr ' ' '\n' | sed '/^$/d' || true
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true
    return
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :$PORT" 2>/dev/null |
      sed -nE 's/.*pid=([0-9]+).*/\1/p' |
      sort -u || true
  fi
}

port_is_busy() {
  if command -v ss >/dev/null 2>&1; then
    ss -H -ltn "sport = :$PORT" 2>/dev/null | grep -q .
    return
  fi

  [ -n "$(find_port_pids)" ]
}

pids="$(find_port_pids | sort -u | tr '\n' ' ' | sed 's/[[:space:]]*$//')"

if [ -n "$pids" ]; then
  echo "[frontend-dev] Liberando porta ${PORT}: ${pids}"
  kill $pids 2>/dev/null || true

  for _ in $(seq 1 30); do
    if ! port_is_busy; then
      break
    fi

    sleep 0.2
  done

  if port_is_busy; then
    echo "[frontend-dev] Forcando encerramento na porta ${PORT}: ${pids}"
    kill -9 $pids 2>/dev/null || true
  fi
fi

exec bash ./scripts/use-node.sh next dev --port "$PORT"
