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

// The backslash is required when RE.source is used as <input type="text" pattern={...} />
// eslint-disable-next-line no-useless-escape
export const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_\-]*$/

export abstract class JsonSerializable {
  abstract toJSON(key :string) :object
  static fromJSON(_obj :object) { throw new Error('not implemented') }  /* Implementations must override! */
}

export interface SanityCheckable {
  /** Returns a list of warnings on the object. */
  sanityCheck() :string[]
}
export function isSanityCheckable(o :unknown) :o is SanityCheckable {
  if (!o || typeof o !== 'object') return false
  return 'sanityCheck' in o && typeof o.sanityCheck === 'function'
}

/** Identifier stored as string */
export type Identifier = string
export function isIdentifier(v :unknown) :v is Identifier {
  return typeof v === 'string' && !!v.match(IDENTIFIER_RE)
}

/** Timestamp stored as string */
export type Timestamp = string
export const NO_TIMESTAMP :Timestamp = ''
export function isTimestamp(v :unknown) :v is Timestamp {
  return typeof v === 'string'  //TODO Later: enforce ISO 8601 format (remember empty string is acceptable too)
}
export function timestampNow() :Timestamp {
  return new Date().toISOString()  //TODO
}
export function isTimestampSet(t :Timestamp) :boolean {
  return t !== NO_TIMESTAMP
}
