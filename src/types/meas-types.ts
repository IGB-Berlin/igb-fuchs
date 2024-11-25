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
import { Identifier, isIdentifier, JsonSerializable, SanityCheckable } from './common'
import { assert } from '../utils'

export interface IMeasurementType {
  id :Identifier
  unit :string
  min ?:number|null
  max ?:number|null
  fractionalDigits ?:number|null
  notes ?:string|null
}
const measurementTypeKeys = ['id','unit','min','max','fractionalDigits','notes'] as const
type MeasurementTypeKey = typeof measurementTypeKeys[number] & keyof IMeasurementType
export function isIMeasurementType(o :unknown) :o is IMeasurementType {
  if (!o || typeof o !== 'object') return false
  if (!('id' in o && 'unit' in o)) return false  // required keys
  for (const k of Object.keys(o)) if (!measurementTypeKeys.includes(k as MeasurementTypeKey)) return false  // extra keys
  // type checks
  if (isIdentifier(o.id) || typeof o.unit !== 'string') return false
  if ('min' in o && !( o.min===null || typeof o.min === 'number' )) return false
  if ('max' in o && !( o.max===null || typeof o.max === 'number' )) return false
  if ('fractionalDigits' in o && !( o.fractionalDigits===null || typeof o.fractionalDigits === 'number' )) return false
  if ('notes' in o && !( o.notes===null || typeof o.notes !== 'string' )) return false
  return true
}

/** Describes a type of measurement (not a specific measurement value). */
export class MeasurementType extends JsonSerializable implements IMeasurementType, SanityCheckable {
  //TODO Later: MeasurementType.id should have translations (?)
  id :Identifier
  unit :string
  /** Option: Minimum value, for input validation. */
  min :number
  /** Optional: Maximum value, for input validation. */
  max :number
  /** Optional: Number of places after the decimal point (both for input validation and for display rounding). */
  fractionalDigits :number
  notes :string
  constructor(o :IMeasurementType) {
    super()
    assert(isIdentifier(o.id))
    this.id = o.id
    this.unit = o.unit
    this.min = 'min' in o && o.min!==null && Number.isFinite(o.min) ? o.min : -Infinity
    this.max = 'max' in o && o.max!==null && Number.isFinite(o.max) ? o.max : +Infinity
    this.fractionalDigits = 'fractionalDigits' in o && o.fractionalDigits!==null && Number.isFinite(o.fractionalDigits) ? o.fractionalDigits : NaN
    this.notes = 'notes' in o && o.notes!==null ? o.notes : ''
  }
  override toJSON(_key :string) :IMeasurementType {
    const rv :IMeasurementType = { id: this.id, unit: this.unit }
    if (Number.isFinite(this.min)) rv.min = this.min
    if (Number.isFinite(this.max)) rv.max = this.max
    if (Number.isFinite(this.fractionalDigits)) rv.fractionalDigits = this.fractionalDigits
    if (this.notes.trim().length) rv.notes = this.notes
    return rv
  }
  static override fromJSON(obj :object) :MeasurementType {
    //TODO: When reading from json, we should really deduplicate all the MeasurementTypes, Samples, ...
    assert(isIMeasurementType(obj))
    return new MeasurementType(obj)
  }
  sanityCheck() :string[] {
    const rv :string[] = []
    if (!Number.isFinite(this.min)) rv.push(`No minimum value specified for measurement type ${this.id}`)
    if (!Number.isFinite(this.max)) rv.push(`No maximum value specified for measurement type ${this.id}`)
    if (!Number.isFinite(this.fractionalDigits)) rv.push(`No number of places after the decimal point specified for measurement type ${this.id}`)
    return rv
  }
}
