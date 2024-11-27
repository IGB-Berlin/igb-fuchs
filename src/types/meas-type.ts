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
import { validateName, NO_TIMESTAMP, DataObjectTemplate, timestampNow } from './common'
import { Measurement } from './meas'

export const VALID_UNIT_RE = /^[^\s](?:.*[^\s])?$/u

export interface IMeasurementType {
  name :string
  unit :string
  min ?:number|null
  max ?:number|null
  precision ?:number|null
  notes ?:string|null
}
const measurementTypeKeys = ['name','unit','min','max','precision','notes'] as const
type MeasurementTypeKey = typeof measurementTypeKeys[number] & keyof IMeasurementType
export function isIMeasurementType(o :unknown) :o is IMeasurementType {
  if (!o || typeof o !== 'object') return false
  if (!('name' in o && 'unit' in o)) return false  // required keys
  for (const k of Object.keys(o)) if (!measurementTypeKeys.includes(k as MeasurementTypeKey)) return false  // extra keys
  // type checks
  if (typeof o.name !== 'string' || typeof o.unit !== 'string') return false
  if ('min' in o && !( o.min===null || typeof o.min === 'number' )) return false
  if ('max' in o && !( o.max===null || typeof o.max === 'number' )) return false
  if ('precision' in o && !( o.precision===null || typeof o.precision === 'number' )) return false
  if ('notes' in o && !( o.notes===null || typeof o.notes !== 'string' )) return false
  return true
}

/** Describes a type of measurement (not a specific measurement value). */
export class MeasurementType extends DataObjectTemplate implements IMeasurementType {
  name :string
  unit :string
  /** Minimum value, for input validation. (Optional but recommended.) */
  min :number
  /** Maximum value, for input validation. (Optional but recommended.) */
  max :number
  /** Number of places after the decimal point, both for input validation and for display rounding. (Optional but recommended.) */
  precision :number
  notes :string
  constructor(o :IMeasurementType) {
    super()
    this.name = o.name
    this.unit = o.unit
    this.min = 'min' in o && o.min!==null && Number.isFinite(o.min) ? o.min : -Infinity
    this.max = 'max' in o && o.max!==null && Number.isFinite(o.max) ? o.max : +Infinity
    this.precision = 'precision' in o && o.precision!==null && Number.isFinite(o.precision) ? o.precision : NaN
    this.notes = 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.validate()
  }
  override validate() {
    validateName(this.name)
    if (!this.unit.match(VALID_UNIT_RE)) throw new Error(`${tr('Invalid unit')}: ${this.unit}`)
    if (this.min>this.max) throw new Error(`${tr('Invalid min/max value')}: ${this.min}>${this.max}`)
    if (this.precision<0) throw new Error(`${tr('Invalid precision')}: ${this.precision}<0`)
  }
  override equals(o: unknown) {
    return isIMeasurementType(o) && this.name===o.name && this.unit===o.unit && this.min===o.min && this.max===o.max
      && ( Number.isNaN(this.precision) && Number.isNaN(o.precision) || this.precision===o.precision )
      && this.notes.trim() === o.notes?.trim()
  }
  override toJSON(_key :string) :IMeasurementType {
    const rv :IMeasurementType = { name: this.name, unit: this.unit }
    if (Number.isFinite(this.min)) rv.min = this.min
    if (Number.isFinite(this.max)) rv.max = this.max
    if (Number.isFinite(this.precision)) rv.precision = this.precision
    if (this.notes.trim().length) rv.notes = this.notes.trim()
    return rv
  }
  override summaryDisplay() :[string,null] {
    return [ `${this.name} [${this.unit}]`, null ] }
  override warningsCheck() {
    const rv :string[] = []
    if (!this.unit.length) rv.push(tr('No units'))
    if (!Number.isFinite(this.min)) rv.push(tr('No minimum value'))
    if (!Number.isFinite(this.max)) rv.push(tr('No maximum value'))
    if (!Number.isFinite(this.precision)) rv.push(tr('No precision'))
    return rv
  }
  templateToObject(value :number, timeNow :boolean) :Measurement {
    return new Measurement({ type: this.toJSON('type'), time: timeNow ? timestampNow() : NO_TIMESTAMP, value: value }) }
  /** Regular expression that can be used to validate measurement value inputs of this type. */
  get validPattern() {
    const after = !Number.isFinite(this.precision)
      ? '[0-9]+'
      : this.precision===0 ? ''
        : this.precision===1 ? '[0-9]'
          : `[0-9]{1,${this.precision}}`
    return after.length ? `^[\\-\\+]?(?:[0-9]+(?:\\.${after})?|\\.${after})$` : '^[\\-\\+]?[0-9]+$'
  }
}
