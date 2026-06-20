#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage:
  lfs-guard.sh --index
  lfs-guard.sh --tree <tree-ish>
  lfs-guard.sh --push-stdin <pre-push-stdin-file> <remote-name>
USAGE
}

is_lfs_pointer_blob() {
  local blob=$1
  git cat-file -p "$blob" | git lfs pointer --check --strict --stdin >/dev/null 2>&1
}

report_bad_path() {
  local path=$1
  local context=$2
  printf '::error file=%s::This file matches filter=lfs in .gitattributes but is not stored as a Git LFS pointer in %s. Run git add --renormalize -- %q before committing.\n' "$path" "$context" "$path" >&2
}

check_index() {
  local bad=0
  local path attr blob

  while IFS= read -r -d '' path; do
    attr=$(git check-attr --cached filter -- "$path")
    if [[ "$attr" != *': filter: lfs' ]]; then
      continue
    fi

    blob=":$path"
    if ! is_lfs_pointer_blob "$blob"; then
      report_bad_path "$path" 'the staged index'
      bad=1
    fi
  done < <(git ls-files -z)

  return "$bad"
}

check_tree() {
  local treeish=$1
  local context=${2:-$treeish}
  local bad=0
  local path attr blob

  while IFS= read -r -d '' path; do
    attr=$(git check-attr --source="$treeish" filter -- "$path")
    if [[ "$attr" != *': filter: lfs' ]]; then
      continue
    fi

    blob="$treeish:$path"
    if ! is_lfs_pointer_blob "$blob"; then
      report_bad_path "$path" "$context"
      bad=1
    fi
  done < <(git ls-tree -r -z --name-only "$treeish")

  return "$bad"
}

check_push_stdin() {
  local stdin_file=$1
  local remote_name=$2
  local zero_oid='0000000000000000000000000000000000000000'
  local bad=0
  local local_ref local_oid remote_ref remote_oid
  local rev
  local revs_file

  revs_file=$(mktemp)
  while read -r local_ref local_oid remote_ref remote_oid; do
    [[ -z "${local_ref:-}" ]] && continue
    [[ "$local_oid" == "$zero_oid" ]] && continue

    if [[ "$remote_oid" == "$zero_oid" ]]; then
      git rev-list "$local_oid" --not --remotes="$remote_name" >> "$revs_file"
    else
      git rev-list "${remote_oid}..${local_oid}" >> "$revs_file"
    fi
  done < "$stdin_file"

  sort -u "$revs_file" | while IFS= read -r rev; do
    [[ -z "$rev" ]] && continue
    check_tree "$rev" "commit $rev"
  done || bad=1

  rm -f "$revs_file"
  return "$bad"
}

case "${1:-}" in
  --index)
    check_index
    ;;
  --tree)
    if [[ $# -ne 2 ]]; then
      usage
      exit 2
    fi
    check_tree "$2"
    ;;
  --push-stdin)
    if [[ $# -ne 3 ]]; then
      usage
      exit 2
    fi
    check_push_stdin "$2" "$3"
    ;;
  *)
    usage
    exit 2
    ;;
esac
