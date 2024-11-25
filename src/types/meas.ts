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
import { isTimestamp, isTimestampSet, JsonSerializable, SanityCheckable, Timestamp } from './common'
import { IMeasurementType, MeasurementType, isIMeasurementType } from './meas-types'
import { assert } from '../utils'

export interface IMeasurement {
  type :IMeasurementType
  time :Timestamp
  value :number
}
export function isIMeasurement(o :unknown) :o is IMeasurement {
  if (!o || typeof o !== 'object') return false
  if (Object.keys(o).length!==3 || !('type' in o && 'time' in o && 'value' in o)) return false  // keys
  if (!isIMeasurementType(o.type) || !isTimestamp(o.time) || typeof o.value !== 'number') return false  // types
  return true
}

/** Records an actual recorded measurement. */
export class Measurement extends JsonSerializable implements IMeasurement, SanityCheckable {
  type :MeasurementType
  time :Timestamp
  /** The actual measurement value. May be NaN when the measurement is first created. */
  value :number
  constructor(o :IMeasurement) {
    super()
    assert(isTimestamp(o.time))
    this.type = new MeasurementType(o.type)
    this.time = o.time
    this.value = o.value
  }
  override toJSON(_key: string): IMeasurement {
    return { type: this.type.toJSON('type'), time: this.time, value: this.value }
  }
  static override fromJSON(obj :object) :Measurement {
    assert(isIMeasurement(obj))
    return new Measurement(obj)
  }
  sanityCheck() :string[] {
    const rv = []  // this.type is sanityChecked as part of the templates check
    if (!isTimestampSet(this.time)) rv.push('No timestamp set on this measurement')
    if (Number.isFinite(this.value)) {
      if (Number.isFinite(this.type.min) && this.value < this.type.min) rv.push(`This value is below the minimum (${this.value} < ${this.type.min})`)
      if (Number.isFinite(this.type.max) && this.value > this.type.max) rv.push(`This value is above the maximum (${this.value} > ${this.type.max})`)
      //if (Number.isFinite(this.type.fractionalDigits)) ... can't really check this here since it applies to `string` inputs
    }
    else rv.push('No value set on this measurement')
    return rv
  }
}
