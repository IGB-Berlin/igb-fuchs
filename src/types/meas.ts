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
import { isTimestamp, isTimestampSet, Timestamp, validateTimestamp, DataObjectWithTemplate, NO_TIMESTAMP, makeValidNumberPat } from './common'
import { IMeasurementType, MeasurementType, isIMeasurementType } from './meas-type'
import { tr } from '../i18n'

export interface IMeasurement {
  type :IMeasurementType
  time :Timestamp|null
  value :string  // stored as string to avoid any floating-point ambiguities; validated via regex
}
export function isIMeasurement(o :unknown) :o is IMeasurement {
  return !!( o && typeof o === 'object'
    && Object.keys(o).length===3 && 'type' in o && 'time' in o && 'value' in o
    && isIMeasurementType(o.type)
    && ( o.time === null || isTimestamp(o.time) )
    && typeof o.value === 'string'
  )
}

/** Records an actual recorded measurement. */
export class Measurement extends DataObjectWithTemplate<Measurement, MeasurementType> implements IMeasurement {
  type :MeasurementType
  time :Timestamp
  /** The actual measurement value. May be NaN when the measurement is first created. */
  value :string
  get template() { return this.type }
  constructor(o :IMeasurement|null) {
    super()
    this.type = o?.type instanceof MeasurementType ? o.type : new MeasurementType(o?.type??null)
    this.time = isTimestampSet(o?.time) ? o.time : NO_TIMESTAMP
    this.value = o?.value ?? ''
  }
  override validate(_others :Measurement[]) {
    try { this.type.validate([]) }
    catch (ex) { throw new Error(`${tr('Invalid measurement type')}: ${String(ex)}`) }
    validateTimestamp(this.time)
    if (!this.value.match('^'+makeValidNumberPat(this.type.precision)+'$')) throw new Error(tr('Invalid value'))
  }
  override warningsCheck() {
    const rv = []
    if (!isTimestampSet(this.time)) rv.push(tr('No timestamp'))
    if (this.value.match('^'+makeValidNumberPat(this.type.precision)+'$')) {
      const val = Number.parseFloat(this.value)
      if (Number.isFinite(this.type.min) && val < this.type.min) rv.push(`${tr('meas-below-min')}: ${this.value} < ${this.type.min}`)
      if (Number.isFinite(this.type.max) && val > this.type.max) rv.push(`${tr('meas-above-max')}: ${this.value} > ${this.type.max}`)
    } else rv.push(tr('Invalid value'))
    return rv
  }
  override equals(o: unknown) {
    return isIMeasurement(o) && this.type.equals(o.type) && this.time === o.time && this.value === o.value
  }
  override toJSON(_key: string): IMeasurement {
    return { type: this.type.toJSON('type'), time: this.time, value: this.value }
  }
  override deepClone() :Measurement {
    return new Measurement({ type: this.type.deepClone(), time: this.time, value: this.value })
  }
  override extractTemplate() :MeasurementType { return this.type.deepClone() }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Measurement':'meas') }
  override summaryDisplay() :[string,null] {
    return [ `${this.type.name} = ${this.value} ${this.type.unit}`, null ]
  }
}
