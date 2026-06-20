#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$script_dir"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to run the local web server." >&2
  echo "Install Node.js, then run this script again." >&2
  exit 1
fi

exec node "./scripts/local-web-server.mjs" "$@"
