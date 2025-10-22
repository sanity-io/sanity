#!/usr/bin/env bash

slugify() {
  local input="$1"

  # Trim leading/trailing whitespace
  input="$(printf '%s' "$input" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"

  # Convert to lowercase
  input="$(echo "$input" | tr '[:upper:]' '[:lower:]')"

  # Replace slashes and whitespace with dashes
  input="$(echo "$input" | tr '/ ' '-')"

  # Remove everything that's not a-z, 0-9, or dash
  input="$(echo "$input" | sed -E 's/[^a-z0-9-]+/-/g')"

  # Collapse multiple dashes and trim leading/trailing ones
  input="$(echo "$input" | sed -E 's/-+/-/g; s/^-+//; s/-+$//')"

  printf '%s\n' "$input"
}

PKG_VERSION=$(jq -r .version package.json)
COMMIT_HASH=$(git rev-parse --short HEAD)
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
CLEAN_BRANCH_NAME=$(slugify "$BRANCH_NAME")

# Note:
# slugified branch names used in semver cannot be mapped back to their original branch name
if [[ -n "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]]; then
  echo "$PKG_VERSION-pr.$VERCEL_GIT_PULL_REQUEST_ID+$COMMIT_HASH"
elif [[ -n "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]]; then
  echo "$PKG_VERSION-git.$CLEAN_BRANCH_NAME+$COMMIT_HASH"
else
  # In dev, we don't want to use commit hash or branch name because it quickly gets out of date,
  # e.g if the server runs across commits or switching branches
  :
fi
