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
import { tr } from '../i18n'

export abstract class DataObjectBase {
  /** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description */
  abstract toJSON(_key :string) :object
  /** Validate the properties of this object (e.g. after setting them), and throw an error if something is wrong. */
  abstract validate() :void
  /** Returns a list of warnings on the object. */
  abstract warningsCheck() :string[]
  /** Returns a summary of this object, e.g. for display in a list. */
  abstract summaryDisplay() :[string,string|null]
  /** Whether this object holds the same value as another. */
  abstract equals(o :unknown) :boolean
  /** Helper to turn the `summaryDisplay` into one or two <div>s. */
  summaryAsHtml() :HTMLElement {
    const div = document.createElement('div')
    const [pri,sub] = this.summaryDisplay()
    if (sub) {
      const one = document.createElement('div')
      one.innerText = pri
      div.appendChild(one)
      const two = document.createElement('div')
      two.classList.add('text-body-secondary')
      two.innerText = sub
      div.appendChild(two)
    } else div.innerText = pri
    return div
  }
}

export abstract class DataObjectTemplate extends DataObjectBase {
  /** Generate a new data object based on this template. */
  abstract templateToObject(...args :unknown[]) :DataObjectBase
}
export abstract class DataObjectWithTemplate<T extends DataObjectTemplate> extends DataObjectBase {
  /** The template on which this object was based. */
  abstract get template() :T|null
  /** Generate a new template based on this object. */
  abstract extractTemplate() :T
}

/** Compares to arrays of objects as sets (i.e. order doesn't matter!), returning `true` if they are the same. */
export function dataSetsEqual<T extends DataObjectBase>(a :T[], b :T[]) :boolean {
  if (a.length!==b.length) return false
  const x = Array.from(a)
  const y = Array.from(b)
  for (let i = x.length-1; i>=0; i--) {
    if (!y.length) return false
    for (let j = y.length-1; j>=0; j--) {
      if (x[i]?.equals(y[j])) {
        x.splice(i,1)
        y.splice(j,1)
        break
      }
    }
  }
  return x.length===0 && y.length===0
}

// The backslash is required when RE.source is used as <input type="text" pattern={...} />
// eslint-disable-next-line no-useless-escape
export const VALID_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9\.,\-_\(\)\u0020ÄäÜüÖöß]*[a-zA-Z0-9\.,\-_\(\)ÄäÜüÖöß]$/u
//TODO Later: how to ensure that names have translations? (same goes for Sample.type)
export function validateName(s :string) {
  if (!s.match(VALID_NAME_RE)) throw new Error(`${tr('Invalid name')}: ${s}`) }

/** Timestamp stored as number of milliseconds (like Unix Timestamp) */
export type Timestamp = number
export const NO_TIMESTAMP :Timestamp = 0
const MIN_TIMESTAMP :Timestamp = 1  // 1ms after midnight at the beginning of January 1, 1970, UTC
const MAX_TIMESTAMP :Timestamp = new Date(3000,1,1,0,0,0,0).getTime() // Y3K problem ;-)
export function isTimestamp(v :unknown) :v is Timestamp {
  return typeof v === 'number' }
export function timestampNow() :Timestamp {
  return Date.now() }
export function isTimestampSet(t :Timestamp) :boolean {
  return t !== NO_TIMESTAMP }
export function validateTimestamp(t :Timestamp) {
  if (!( t === NO_TIMESTAMP || t > MIN_TIMESTAMP && t < MAX_TIMESTAMP ))
    throw new Error(`${tr('Invalid timestamp')}: ${t} (${new Date(t).toISOString()})`) }
