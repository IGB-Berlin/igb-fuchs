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

/* TODO: We'll need to keep these three lists/dicts of templates:
 * - Measurement Type
 * - Sampling Location
 * - Sampling Trip
 * Note Sample Templates are just a part of the Sampling Location Template and don't need their own list.
 * However, when building the list of Sampling Location Templates and deduplicating them, the comparisons
 * of the objects need to exclude the samples, so the equals() method will need a parameter
 * or there'll need to be a separate equals method for that comparison.
 * (Actually could just always set the samples Array to [] for the objects that go in the global list.)
 * Note we still need to implement checks that the `id`s of the above objects are always unique.
 */

export abstract class JsonSerializable {
  abstract toJSON(key :string) :object
  static fromJSON(_obj :object) { throw new Error('not implemented') }  /* Implementations must override! */
}

export interface ListEditable {
  listDisplay() :HTMLElement|string
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
export type Timestamp = string  //TODO: should be number (Unix Timestamp), is best for use with JS Date
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
