
SHELL = /bin/bash
.ONESHELL:  # each recipe is executed as a single script

.PHONY: build
build: web/index.html
	@set -euxo pipefail
	test -d .venv || python -m venv .venv
	PY_DIR=".venv/$$(test -d .venv/Scripts && echo Scripts || echo bin)"
	"$$PY_DIR/python" -m pip --disable-pip-version-check install pyinstaller
	"$$PY_DIR/pyinstaller" --onefile --add-data "web:web" --name igb-field-dev-local run-local.py

web/index.html:
	@set -euxo pipefail
	( cd ../.. && npm run build )
	cp -r ../../dist web

.PHONY: clean
clean:
	rm -rf web .venv build dist *.spec
