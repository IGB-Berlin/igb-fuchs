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

const PREFIX = 'IGB-Field'
export const MEAS_TYPES = 'measurement-types'
export const SAMP_TRIPS = 'sampling-trips'
export const TRIP_TEMPLATES = 'trip-templates'
export const LOC_TEMPLATES = 'location-templates'

function path2key(path :string|string[]) {
  const paths = Array.isArray(path) ? path : [path]
  paths.forEach(p => { if (p.includes('/')) throw new Error(`invalid path element "${p}"`) })
  return PREFIX+'/'+paths.join('/')
}

export function get(path :string|string[]) :string|null {
  return localStorage.getItem(path2key(path))
}

export function set(path :string|string[], value :string) :void {
  localStorage.setItem(path2key(path), value)
}

export function list(path :string|string[]) :string[][] {
  //TODO: the following is likely to break now that we allow almost every key, better to just split on / and match the arrays
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