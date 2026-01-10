🦊 <span style="color: #819F00;">IGB</span>-<span style="color: #006EB7;">FUCHS</span>
===========================================================================================

**<https://fuchs.igb-berlin.de>**

IGB-FUCHS is an Electronic Lab Notebook with a focus on fieldwork, developed at
the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB) in Berlin.

The name means "fox" in German (a smart animal that knows its way around fields)
and is a backronym for "**F**eld- und **U**mweltdaten-**Ch**eck-**S**ystem"
(Field and Environmental Data Check System) or "**F**eld-, **U**mwelt- und
**CH**emiedaten **S**peichersystem" (Field, Environmental, and Chemistry
Data Storage System).


📲 Installation on Mobile
--------------------------

Please see [the installation instructions](src/images/IGB-FUCHS_Mobile-Installation.pdf).
The installation on mobile devices is useful to ensure the app still works even when there
is no Internet connection.


🚧 Beta Version
----------------

This is a **beta version** which certainly still contains bugs.

**DATA MAY BE LOST.**
You should always perform regular backups via the "Export" function.

This message will be updated according to the current state of development.


📥 WTW® Import
---------------

⚠️ **This feature is in alpha.** Please see [GitHub Issue #63](https://github.com/IGB-Berlin/igb-fuchs/issues/63).

This feature is only available in browsers that support the "Web Serial API",
[see this link](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).
At the time of writing, this is only Chromium-based browsers on desktop systems, and Chrome on Android
for Bluetooth-based serial ports. In the Chrome browser, the website must be given permission to use
the serial port. On Android, the Chrome app needs to be given the "Nearby devices" ("Geräte in der Nähe")
permission. Then, when on a "Sample" ("Probe") page, the user can click the "Connect" button in the
"WTW" section to connect to the port that the WTW device is connected to, and on the WTW device
press the button labeled "PRT" to transmit data, which should appear in IGB-FUCHS after a short delay.

*WTW® is a registered trademark of Xylem Analytics Germany GmbH.*
*This project is not affiliated with, endorsed by, or sponsored by Xylem or its subsidiaries.*


🛠️ Development Environment
---------------------------

Requirements:
- Latest Node.js LTS, currently v24 (see also [my notes on that](https://github.com/haukex/toolshed/blob/main/notes/TypeScript.md))
- Strongly recommended: VSCode and Git Bash (see also [my notes on that](https://github.com/haukex/toolshed/blob/main/notes/DevEnv.md))
  - Install the various recommended VSCode extensions too

Setup and notes:
- On older Git versions, use `git lfs clone` to get LFS files
- `dev/setup_git_filter.sh` to set up git filter config
- `npm ci` to install dependencies
- `npx playwright install` to install Playwright browsers for tests (on Linux: `--with-deps`)
- See the following places for things that can be run:
  - `package.json` section `scripts` for things that can be run with `npm run ...`
    - *Note* that several `npm run` targets (`build`, `prod-test`, `full-test`, ...) can't be used while
      the live server (`npm start`) is running due to the `clean` step, while `lint` and `coverage` can.
  - Various scripts in `dev/`

Normal development for me:
- One terminal in which I run `npm start`, and a second terminal to run `dev/coverage.sh -s`
  (faster version of `npm run coverage` b/c it only uses Chrome) and `npm run lint`
  (though VSCode should be linting too); can run Playwright tests from VSCode plugin
- Before commit / push, kill the `npm start` and run `npm full-test` (takes a while)


<!-- spell-checker: ignore Mojolicious backronym mweltdaten ystem emiedaten mwelt peichersystem -->

⚖️ Author, Copyright, and License
----------------------------------

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