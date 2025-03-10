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
import { isTimestamp, isTimestampSet, Timestamp, validateTimestamp, DataObjectWithTemplate, NO_TIMESTAMP,
  makeValidNumberPat, timestampsEqual, StyleValue, DataObjectTemplate, validateName, timestampNow,
  numbersEqual} from './common'
import { assert } from '../utils'
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
  static readonly sStyle :StyleValue = { isTemplate: false, opposite: null,
    fullTitle: tr('Measurement'), briefTitle: tr('meas'),
    cssId: 'meas', icon: 'thermometer-half' }  // alternative icon might be speedometer
  override get style() { return Measurement.sStyle }
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
    return isIMeasurement(o) && this.type.equals(o.type) && timestampsEqual(this.time, o.time) && this.value === o.value
  }
  override toJSON(_key: string): IMeasurement {
    return { type: this.type.toJSON('type'), time: this.time, value: this.value }
  }
  override deepClone() :Measurement {
    return new Measurement({ type: this.type.deepClone(), time: this.time, value: this.value })
  }
  override extractTemplate() :MeasurementType { return this.type.deepClone() }
  override summaryDisplay() :[string,null] {
    return [ `${this.type.name} = ${this.value} ${this.type.unit}`, null ]
  }
}

/* ********** ********** ********** Template ********** ********** ********** */

export const VALID_UNIT_RE = /^[^\s](?:.*[^\s])?$/u

export interface IMeasurementType {
  name :string
  unit :string
  min ?:number|null
  max ?:number|null
  precision ?:number|null
  instructions ?:string|null
}
const measurementTypeKeys = ['name','unit','min','max','precision','instructions'] as const
type MeasurementTypeKey = typeof measurementTypeKeys[number] & keyof IMeasurementType
export function isIMeasurementType(o :unknown) :o is IMeasurementType {
  return !!( o && typeof o === 'object'
    && 'name' in o && 'unit' in o  // required keys
    && Object.keys(o).every(k => measurementTypeKeys.includes(k as MeasurementTypeKey))  // extra keys
    // type checks
    && typeof o.name === 'string' && typeof o.unit === 'string'
    && ( !( 'min' in o ) || o.min===null || typeof o.min === 'number' )
    && ( !( 'max' in o ) || o.max===null || typeof o.max === 'number' )
    && ( !( 'precision' in o ) || o.precision===null || typeof o.precision === 'number' )
    && ( !( 'instructions' in o ) || o.instructions===null || typeof o.instructions === 'string' )
  )
}

/* TODO Later: Consider (hard)coding a table of abbreviations of measurement type names for shorter titles:
 * "Temperatur" -> "Temp."
 * "Leitfähigkeit" -> "EC"
 * "Sauerstoffsättigung" -> "O2-Sätt."
 * "Sauerstoffkonzentration" -> "O2-Konz."
 * etc.
 */

/** Describes a type of measurement (not a specific measurement value). */
export class MeasurementType extends DataObjectTemplate<MeasurementType, Measurement> implements IMeasurementType {
  static readonly sStyle :StyleValue = { isTemplate: true, opposite: Measurement.sStyle,
    fullTitle: tr('Measurement Type'), briefTitle: tr('meas-type'),
    cssId: 'meas-type', icon: 'moisture' }
  static { Measurement.sStyle.opposite = this.sStyle }
  override get style() { return MeasurementType.sStyle }
  name :string
  unit :string
  /** Minimum value, for input validation. (Optional but recommended.) */
  min :number
  /** Maximum value, for input validation. (Optional but recommended.) */
  max :number
  /** Number of places after the decimal point, both for input validation and for display rounding. (Optional but recommended.) */
  precision :number
  instructions :string
  constructor(o :IMeasurementType|null) {
    super()
    this.name = o?.name ?? ''
    this.unit = o?.unit ?? ''
    this.min = o && 'min' in o && o.min!==null && Number.isFinite(o.min) ? o.min : -Infinity
    this.max = o && 'max' in o && o.max!==null && Number.isFinite(o.max) ? o.max : +Infinity
    this.precision = o && 'precision' in o && o.precision!==null && Number.isFinite(o.precision) && o.precision>=0 ? Math.floor(o.precision) : NaN
    this.instructions = o && 'instructions' in o && o.instructions!==null ? o.instructions.trim() : ''
  }
  override validate(others :MeasurementType[]) {
    validateName(this.name)
    if (!this.unit.match(VALID_UNIT_RE)) throw new Error(`${tr('Invalid unit')}: ${this.unit}`)
    if (this.min>this.max) throw new Error(`${tr('Invalid min/max value')}: ${this.min}>${this.max}`)
    if (this.precision<0 || !isNaN(this.precision) && Math.floor(this.precision)!==this.precision)
      throw new Error(`${tr('Invalid precision')}: ${this.precision}`)
    if (others.some(o => o.name === this.name))
      throw new Error(`${tr('duplicate-name')}: ${this.name}`)
  }
  override warningsCheck() {
    const rv :string[] = []
    if (!Number.isFinite(this.min)) rv.push(tr('No minimum value'))
    if (!Number.isFinite(this.max)) rv.push(tr('No maximum value'))
    if (!Number.isFinite(this.precision)) rv.push(tr('No precision'))
    return rv
  }
  override equals(o: unknown) {
    return isIMeasurementType(o)
      && this.name===o.name && this.unit===o.unit
      && numbersEqual(this.min, o.min)
      && numbersEqual(this.max, o.max)
      && numbersEqual(this.precision, o.precision)
      && this.instructions.trim() === ( o.instructions?.trim() ?? '' )
  }
  override toJSON(_key :string) :IMeasurementType {
    return { name: this.name, unit: this.unit,
      ...( Number.isFinite(this.min) && { min: this.min } ),
      ...( Number.isFinite(this.max) && { max: this.max } ),
      ...( Number.isFinite(this.precision) && { precision: this.precision } ),
      ...( this.instructions.trim().length && { instructions: this.instructions.trim() } ) }
  }
  override deepClone() :MeasurementType {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isIMeasurementType(clone))
    return new MeasurementType(clone)
  }
  override templateToObject() :Measurement {
    return new Measurement({ type: this.deepClone(), time: timestampNow(), value: '' })
  }
  override summaryDisplay() :[string,string] {
    return [ this.name, this.rangeAsText+' '+this.unit ]
  }
  get rangeAsText() {
    const mn = Number.isFinite(this.precision) && this.precision>=0 ? this.min.toFixed(this.precision) : this.min.toString()
    const mx = Number.isFinite(this.precision) && this.precision>=0 ? this.max.toFixed(this.precision) : this.max.toString()
    const detail = Number.isFinite(this.min) && Number.isFinite(this.max)
      ? `${mn} - ${mx}`
      : Number.isFinite(this.min)
        ? `>= ${mn}`
        : Number.isFinite(this.max)
          ? `<= ${mx}`
          : ''
    return detail
  }
  get typeId() {
    const n = this.name.trim()
    const u = this.unit.trim()
    // e.g. `ph` instead of `ph[pH]`:
    return n.length && ( u === n || u.toLowerCase() === 'unitless' || u.toLowerCase() === 'dimensionless' || u === '-' )
      ? this.name : `${ n.length ? this.name : '?' }[${ u.length ? this.unit : '?' }]`
  }
}
