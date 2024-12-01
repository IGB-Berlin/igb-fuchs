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
import { isTimestamp, isTimestampSet, Timestamp, validateTimestamp, DataObjectWithTemplate, NO_TIMESTAMP } from './common'
import { IMeasurementType, MeasurementType, isIMeasurementType } from './meas-type'
import { tr } from '../i18n'

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
export class Measurement extends DataObjectWithTemplate<Measurement, MeasurementType> implements IMeasurement {
  type :MeasurementType
  time :Timestamp
  /** The actual measurement value. May be NaN when the measurement is first created. */
  value :number
  get template() { return this.type }
  constructor(o :IMeasurement|null) {
    super()
    this.type = new MeasurementType(o?.type??null)
    this.time = o?.time ?? NO_TIMESTAMP
    this.value = o?.value ?? NaN
  }
  formattedValue() {
    return Number.isFinite(this.type.precision) ? this.value.toFixed(this.type.precision) : this.value.toString() }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Measurement':'meas') }
  override validate(_others :Measurement[]) {
    this.type.validate([])
    validateTimestamp(this.time)
  }
  override summaryDisplay() :[string,null] {
    return [ `${this.type.name} = ${this.formattedValue()} ${this.type.unit}`, null ] }
  override equals(o: unknown) {
    return isIMeasurement(o)
    && this.type.equals(o.type)
    && this.time === o.time
    && ( Number.isNaN(this.value) && Number.isNaN(o.value) || this.value === o.value )
  }
  override toJSON(_key: string): IMeasurement {
    return { type: this.type.toJSON('type'), time: this.time, value: this.value } }
  override warningsCheck(_isBrandNew :boolean) {
    const rv = []
    if (!isTimestampSet(this.time)) rv.push(tr('No timestamp'))
    if (Number.isFinite(this.value)) {
      if (Number.isFinite(this.type.min) && this.value < this.type.min) rv.push(`${tr('meas-below-min')}: ${this.value} < ${this.type.min}`)
      if (Number.isFinite(this.type.max) && this.value > this.type.max) rv.push(`${tr('meas-above-max')}: ${this.value} > ${this.type.max}`)
      if (Number.isFinite(this.type.precision)) { /* can't check this here since it applies to `string` inputs - rely on form validation */ }
    } else rv.push(tr('No measurement value'))
    return rv
  }
  override extractTemplate() :MeasurementType { return this.type }
  override deepClone() :Measurement {
    return new Measurement({ type: this.type.deepClone(), time: this.time, value: this.value }) }
}
