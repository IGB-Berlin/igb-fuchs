/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
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
import { Class } from '../utils'
import { tr } from '../i18n'

export function makeValidNumberPat(precision ?:number|null) {
  const p = Math.floor(precision ?? NaN)
  const after = !Number.isFinite(p) || p<0 ? '[0-9]+'
    : p===0 ? ''  // special case: just integers (see below)
      : p===1 ? '[0-9]' : `[0-9]{1,${p}}`  // one or more digits after decimal point
  return after.length ? `[\\-\\+]?(?:(?!0[0-9])[0-9]+(?:\\.${after})?|\\.${after})` : '[\\-\\+]?(?!0[0-9])[0-9]+'
}

export function isArrayOf<T extends object>(cls :Class<T>, o :unknown) :o is T[] {
  return Array.isArray(o) && o.every(e => e instanceof cls) }

export type HasId = { readonly id :string }
export function hasId(o :unknown) :o is HasId {
  return !!( o && typeof o === 'object' && 'id' in o && typeof o.id === 'string' ) }

export type HasEquals = { equals(other :unknown) :boolean }

export type HasHtmlSummary = { summaryAsHtml(withTypeName :boolean) :HTMLElement }

export abstract class DataObjectBase<B extends DataObjectBase<B>> implements HasHtmlSummary {
  /** Validate the properties of this object (e.g. after setting them), and throw an error if something is wrong. */
  abstract validate(others :B[]) :void
  /** Returns a list of warnings on the object.
   *
   * @param skipInitWarns Some warnings may not apply on the very first save, for example because the UI requires
   *  a save on brand new objects before its arrays can be populated, so some warnings should be suppressed then.
   */
  abstract warningsCheck(skipInitWarns :boolean) :string[]
  /** Whether this object holds the same value as another. */
  abstract equals(o :unknown) :boolean
  /** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description */
  abstract toJSON(_key :string) :object
  /** Return a deep clone of this object.
   *
   * For `DataObjectWithTemplate`s, the `template` attribute does not need to be cloned.
   */
  abstract deepClone() :B

  /** Return the display name of this type. */
  abstract typeName(kind :'full'|'short') :string
  /** Returns a summary of this object, e.g. for display in a list. */
  abstract summaryDisplay() :[string,string|null]
  /** Helper to turn the `summaryDisplay` into one or two <div>s. */
  summaryAsHtml(withTypeName :boolean) :HTMLElement {
    const [pri,sub] = this.summaryDisplay()
    const div = document.createElement('div')
    div.classList.add('d-flex','flex-row','justify-content-start','flex-wrap','column-gap-3')
    if (withTypeName) {
      const n = document.createElement('div')
      n.innerText = this.typeName('full')+':'
      div.appendChild(n)
    }
    const one = document.createElement('div')
    one.innerText = pri
    div.appendChild(one)
    if (sub) {
      const two = document.createElement('div')
      two.classList.add('text-body-secondary')
      two.innerText = sub
      div.appendChild(two)
    }
    return div
  }
}

export abstract class DataObjectTemplate<T extends DataObjectTemplate<T, D>, D extends DataObjectWithTemplate<D, T>> extends DataObjectBase<T> {
  /** Generate a new data object based on this template. */
  abstract templateToObject() :D
}
export abstract class DataObjectWithTemplate<D extends DataObjectWithTemplate<D, T>, T extends DataObjectTemplate<T, D>> extends DataObjectBase<D> {
  /** The template on which this object was based. */
  abstract get template() :T|null
  //TODO Later: extractTemplate() is not made use of in the UI yet
  /** Generate a new template based on this object. */
  abstract extractTemplate() :T
}

export function validateId(id :string) {
  if (!id.length) throw new Error(`${tr('invalid-id')}: ${id}`) }

// Also https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
// The backslash is required when RE.source is used as <input type="text" pattern={...} />
// eslint-disable-next-line no-useless-escape
export const VALID_NAME_RE = /^(?!CON|PRN|AUX|NUL|COM[0-9¹²³]|LPT[0-9¹²³])[a-zA-Z0-9][a-zA-Z0-9\.\-_\(\)\u0020ÄäÜüÖöß]+(?<![\.\u0020])$/u
export function validateName(s :string) {
  if (!s.match(VALID_NAME_RE)) throw new Error(`${tr('Invalid name')}: ${s}`) }

/** Timestamp stored as number of milliseconds (like Unix Timestamp) */
export type Timestamp = number
export const NO_TIMESTAMP :Timestamp = NaN
const MIN_TIMESTAMP :Timestamp = 0  // midnight at the beginning of January 1, 1970, UTC
const MAX_TIMESTAMP :Timestamp = new Date(3000,1,1,0,0,0,0).getTime() // Y3K problem ;-)
export function isTimestamp(v :unknown) :v is Timestamp {
  return typeof v === 'number' }
export function timestampNow() :Timestamp {
  return Date.now() }
export function isTimestampSet(t :Timestamp) :boolean {
  return Number.isFinite(t) }
export function validateTimestamp(t :Timestamp) {
  if (!( !Number.isFinite(t) || t > MIN_TIMESTAMP && t < MAX_TIMESTAMP ))
    throw new Error(`${tr('Invalid timestamp')}: ${t} (${new Date(t).toISOString()})`) }
export function isValidAndSetTs(t :Timestamp) {
  return Number.isFinite(t) && t > MIN_TIMESTAMP && t < MAX_TIMESTAMP }
export function timestampsEqual(a :Timestamp, b :Timestamp) {
  return Number.isNaN(a) && Number.isNaN(b) || a===b }
