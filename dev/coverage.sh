#!/bin/bash
set -euxo pipefail
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/..

# clean only the directories that this build uses
rm -rf dist-tsc/ dist-inst/ dist-test/ .nyc_output coverage

# use tsc to compile .ts/x to .js
( cd src && npx tsc --outDir ../dist-tsc/ )
# then use nyc to instrument the code coverage collection
npx nyc instrument --compact=false --all dist-tsc/ dist-inst/

# build a directory structure that mirrors the original,
# with all the required files, so Parcel can build normally
cp -r src/index.html src/styles.scss src/manifest.json src/images dist-inst/
cp src/types/igb-fuchs.schema.json dist-inst/types/

# use parcel to bundle; builds to dist/test/
npx parcel build --target test dist-inst/index.html
cp -v src/types/igb-fuchs.schema.json dist-test/

# the `playwright-test-coverage` that is used in the tests will gather the code coverage data from
# `window.__coverage__` into files in the `.nyc_output` directory, which `nyc report` will then use
WEB_SERVER_PATH=dist-test npx playwright test --project Chromium --project Firefox --project Webkit
npx nyc report -r html -r lcov -r text
