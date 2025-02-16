#!/bin/bash
set -euxo pipefail
git config set --local filter.git_commit.clean "\$PWD/dev/git_commit_filter.pl clean"
git config set --local filter.git_commit.smudge "\$PWD/dev/git_commit_filter.pl smudge"
perl -i dev/git_commit_filter.pl smudge worker/service-worker.ts src/main.ts