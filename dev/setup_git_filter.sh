#!/bin/bash
set -euxo pipefail
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/..

# Sets up git_commit_filter.pl (which handles $Commit$)

git config --worktree filter.git_commit.clean "\$PWD/dev/git_commit_filter.pl clean"
git config --worktree filter.git_commit.smudge "\$PWD/dev/git_commit_filter.pl smudge"
perl -i dev/git_commit_filter.pl smudge worker/service-worker.ts src/main.ts
