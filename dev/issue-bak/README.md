
This directory contains a backup of GitHub issues, created
via the Python tool [`gh2md`](https://pypi.org/project/gh2md/),
so that commits which reference GitHub issue numbers (`#123`)
retain their context even when this repository is viewed elsewhere.

**Developers should regularly run `./run-bak.sh`**
to keep the issue backups up-to-date.

`gh2md` can be installed via `pip install gh2md`.
A GitHub access token is required for it to run
as per its docs; a read-only token is enough.
