#!/bin/bash
set -euxo pipefail
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"

# spell-checker: ignore venv pyinstaller onefile

# 1. Build the pages into the `web` folder
if [ ! -e web/index.html ]; then
  ( cd ../.. && npm run build )  # NOTE this cleans out this directory as well (except .venv)
  cp -r ../../dist/default web
fi

# 2. Set up Python
test -d .venv || python -m venv .venv
PY_DIR=".venv/$(test -d .venv/Scripts && echo Scripts || echo bin)"
"$PY_DIR/python" -m pip --disable-pip-version-check install --upgrade --upgrade-strategy=eager pyinstaller

# 3. Name of the executable
build_name="igb-fuchs-local-dev"
if [ -n "${CUSTOM_DEV_VERSION:-}" ] && [ "$CUSTOM_DEV_VERSION" != "local-dev" ]
  then build_name+="-$CUSTOM_DEV_VERSION"; fi

# 4. Build the executable
"$PY_DIR/pyinstaller" --onefile --add-data "web:web" --name "$build_name" run-local.py
