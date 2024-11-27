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
import { isTimestamp, isTimestampSet, Timestamp, validateTimestamp, DataObjectWithTemplate } from './common'
import { IMeasurementType, MeasurementType, isIMeasurementType } from './meas-type'

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
export class Measurement extends DataObjectWithTemplate<MeasurementType> implements IMeasurement {
  type :MeasurementType
  time :Timestamp
  /** The actual measurement value. May be NaN when the measurement is first created. */
  value :number
  get template() { return this.type }
  constructor(o :IMeasurement) {
    super()
    this.type = new MeasurementType(o.type)
    this.time = o.time
    this.value = o.value
    this.validate()
  }
  formattedValue() {
    return Number.isFinite(this.type.precision) ? this.value.toFixed(this.type.precision) : this.value.toString() }
  override validate() { validateTimestamp(this.time) }
  override summaryDisplay() :[string,null] {
    return [ `${this.type.name} = ${this.formattedValue()} ${this.type.unit}`, null ] }
  override equals(o: unknown) {
    return isIMeasurement(o) && this.type.equals(o.type) && this.time===o.time && this.value===o.value }
  override toJSON(_key: string): IMeasurement {
    return { type: this.type.toJSON('type'), time: this.time, value: this.value }
  }
  override warningsCheck() {
    const rv = []  // this.type should be checked as part of the templates check
    if (!isTimestampSet(this.time)) rv.push(tr('No timestamp'))
    if (Number.isFinite(this.value)) {
      if (Number.isFinite(this.type.min) && this.value < this.type.min) rv.push(`${tr('meas-below-min')}: ${this.value} < ${this.type.min}`)
      if (Number.isFinite(this.type.max) && this.value > this.type.max) rv.push(`${tr('meas-above-max')}: ${this.value} > ${this.type.max}`)
      if (Number.isFinite(this.type.precision)) { /* can't check this here since it applies to `string` inputs - check via input box pattern */ }
    } else rv.push(tr('No measurement value'))
    return rv
  }
  override extractTemplate() :MeasurementType { return this.type }
}
