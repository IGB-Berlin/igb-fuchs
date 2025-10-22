// @ts-check
/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024-2025 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * IGB-FUCHS is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * IGB-FUCHS is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * IGB-FUCHS. If not, see <https://www.gnu.org/licenses/>.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  // Jest uses *.test.ts and *.spec.ts, so we configure Playwright to use *.play.ts
  testRegex: '[^/]+\\.(test|spec)\\.ts$',  // https://jestjs.io/docs/configuration#testregex-string--arraystring
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': ['ts-jest', {
      diagnostics: {
        ignoreCodes: [  ]
      },
    }],
  },
  collectCoverage: true,
}