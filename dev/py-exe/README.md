
This is a quick way to build a binary for running a **development* server with
this application locally. Requires *GNU Make* and a recent version of Python 3
to be installed and available as `python`.

Just run `make` to build a binary into the `dist` folder. If you wish to set a
custom version to be displayed in the "About" dialog,
run `CUSTOM_DEV_VERSION=... make`.

WARNING
-------

For development only, **not for production, it is not secure!**

See the warnings at <https://docs.python.org/3/library/http.server.html>
