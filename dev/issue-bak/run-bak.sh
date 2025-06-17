#!/bin/bash
set -euxo pipefail
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"

# gh2md needs an empty directory to write into
temp_dir="$( mktemp --directory --tmpdir=. )"
trap 'rm -rf "$temp_dir"' EXIT

gh2md --idempotent --multiple-files IGB-Berlin/igb-fuchs "$temp_dir"

# if we got here, gh2md didn't fail
rm -rf issues
mv "$temp_dir" issues
