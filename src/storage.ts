/** IGB-Field
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { assert } from './utils'

// VALID_KEY_RE.source is used as <input type="text" pattern={VALID_KEY_RE.source} /> where the backslash is required
// eslint-disable-next-line no-useless-escape
export const VALID_KEY_RE = /^[a-zA-Z_][a-zA-Z0-9_\-]*$/
const PREFIX = 'IGB-Field'

function path2key(path :string[]) {
  path.forEach(p => { if (!p.match(VALID_KEY_RE)) throw new Error(`invalid path element "${p}"`) })
  return PREFIX+'/'+path.join('/')
}

export function get(path :string[]) :string|null {
  return localStorage.getItem(path2key(path))
}

export function set(path :string[], value :string) :void {
  localStorage.setItem(path2key(path), value)
}

export function list(path :string[]) :string[][] {
  const re = new RegExp(`^(${path2key(path)}/[^/]+)(?:/.+)?$`)
  const s :Set<string> = new Set()
  for (let i=0; i<localStorage.length; i++) {
    const key = localStorage.key(i)
    assert(key)
    const m = key.match(re)
    if (m) {
      const k = m[1]
      assert(k)
      s.add(k)
    }
  }
  return Array.from(s.values()).sort().map(k => k.split('/'))
}