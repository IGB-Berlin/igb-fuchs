#!/bin/bash
set -euo pipefail
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/..

usage() { echo "Usage: $0 [-s]" 1>&2; exit 1; }
test_args=( --project Chromium --project Firefox --project Webkit )
while getopts "s" opt; do
    case "${opt}" in
        s) test_args=( --project Chromium ) ;;
        *) usage ;;
    esac
done
shift $((OPTIND-1))
[[ $# -eq 0 ]] || usage
set -x

# clean only the directories that this build uses
rm -rf dist-tsc/ dist-inst/ dist-test/ .nyc_output coverage

# use tsc to compile .ts/x to .js
( cd src && npx tsc --removeComments false --outDir ../dist-tsc/ )
# then use nyc to instrument the code coverage collection
npx nyc instrument --compact=false --all dist-tsc/ dist-inst/

# build a directory structure that mirrors the original,
# with all the required files, so Parcel can build normally
cp -r src/index.html src/styles.scss src/manifest.json src/images dist-inst/
cp src/types/igb-fuchs.schema.json dist-inst/types/

# use parcel to bundle; builds to dist-test/
npx parcel build --target test dist-inst/index.html
cp -v dist-inst/types/igb-fuchs.schema.json dist-test/

# the `playwright-test-coverage` that is used in the tests will gather the code coverage data from
# `window.__coverage__` into files in the `.nyc_output` directory, which `nyc report` will then use
WEB_SERVER_PATH=dist-test npx playwright test "${test_args[@]}"
npx nyc report -r html -r lcov -r text
