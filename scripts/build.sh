#!/bin/bash
# exit when any command fails
set -e
git clean -fx -d
yarn install
yarn lint-verify
yarn build
yarn test
if [[ `git status --porcelain` ]]; then
    echo "change in project after build detected, build the package locally and submit changed files in your PR" 1>&2
    echo "this could be because you didn't lint or rebuild NPM package, or didn't commit all changed files in your PR" 1>&2
    echo "files changed: "
    git status
  exit 1
else
  # No changes
  echo "NPM package built successfully with no changes"
fi