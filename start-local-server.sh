#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$script_dir"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to run the Astro development server." >&2
  echo "Install Node.js 24, then run this script again." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required to run the Astro development server." >&2
  echo "Install pnpm 11, then run this script again." >&2
  exit 1
fi

# Astro 7 otherwise auto-backgrounds when it detects an agent environment.
export ASTRO_DEV_BACKGROUND=0
exec pnpm dev "$@"
