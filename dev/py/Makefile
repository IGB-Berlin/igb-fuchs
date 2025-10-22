
SHELL = /bin/bash
.ONESHELL:  # each recipe is executed as a single script

.PHONY: build
build: web/index.html
	@set -euxo pipefail
	test -d .venv || python -m venv .venv
	PY_DIR=".venv/$$(test -d .venv/Scripts && echo Scripts || echo bin)"
	"$$PY_DIR/python" -m pip --disable-pip-version-check install --upgrade --upgrade-strategy=eager pyinstaller
	"$$PY_DIR/pyinstaller" --onefile --add-data "web:web" --name igb-fuchs-dev-local"$${CUSTOM_DEV_VERSION:+-$$CUSTOM_DEV_VERSION}" run-local.py

web/index.html:
	@set -euxo pipefail
	# NOTE the following cleans out our directory as well (except .venv)
	( cd ../.. && npm run build )
	cp -r ../../dist web

.PHONY: clean dist-clean
clean:
	rm -rf web build dist *.spec
dist-clean: clean
	rm -rf .venv
