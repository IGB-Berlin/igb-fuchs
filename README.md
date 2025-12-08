IGB-FUCHS
=========

**<https://fuchs.igb-berlin.de>**

IGB-FUCHS is an Electronic Lab Notebook with a focus on fieldwork, developed at
the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB) in Berlin.

The name means "fox" in German (a smart animal that knows its way around fields)
and is a backronym for "**F**eld- und **U**mweltdaten-**Ch**eck-**S**ystem".

Installation on Mobile
----------------------

Please see [the installation instructions](src/images/IGB-FUCHS_Mobile-Installation.pdf).
The installation on mobile devices is useful to ensure the app still works even when there
is no Internet connection.

Beta Version
------------

This is a **beta version** which certainly still contains bugs.

**DATA MAY BE LOST.**
You should always perform regular backups via the "Export" function.

This message will be updated according to the current state of development.

Development Environment
-----------------------

Requirements:
- Latest Node.js LTS, currently v24 (see also [my notes on that](https://github.com/haukex/toolshed/blob/main/notes/TypeScript.md))
- Strongly recommended: VSCode and Git Bash (see also [my notes on that](https://github.com/haukex/toolshed/blob/main/notes/DevEnv.md))

Setup and notes:
- `dev/setup_git_filter.sh` to set up git filter config
- `npm ci` to install all dependencies
- `npx playwright install` to install Playwright browsers for tests (on Linux: `--with-deps`)
- See the following places for things that can be run:
  - `package.json` section `scripts` for things that can be run with `npm run ...`
  - Various scripts in `dev/`


<!-- spell-checker: ignore Mojolicious backronym mweltdaten -->

Author, Copyright, and License
------------------------------

Copyright © 2024-2025 Hauke Dämpfling (haukex@zero-g.net)
at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
Berlin, Germany, <https://www.igb-berlin.de/>

IGB-FUCHS is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later version.

IGB-FUCHS is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
IGB-FUCHS. If not, see <https://www.gnu.org/licenses/>.