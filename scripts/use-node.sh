#!/usr/bin/env bash
set -euo pipefail

if [ -z "${NVM_DIR:-}" ]; then
  export NVM_DIR="$HOME/.nvm"
fi

if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use
else
  echo "nvm is required. Install nvm and run 'nvm install' in this repo." >&2
  exit 1
fi

nvm use --silent
export PATH="$NVM_BIN:$PATH"
hash -r

if [ "$#" -gt 0 ]; then
  exec "$@"
fi
