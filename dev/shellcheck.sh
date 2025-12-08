#!/bin/bash
set -euo pipefail
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/..
# Run shellcheck on all shell scripts in this project
find . \( -type d \( -name '.venv*' -o -name node_modules \) -prune \) -o \( -iname '*.sh' -print -exec shellcheck '{}' + \)