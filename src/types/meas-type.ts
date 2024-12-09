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
import { validateName, DataObjectTemplate, timestampNow } from './common'
import { Measurement } from './meas'
import { assert } from '../utils'
import { tr } from '../i18n'

export const VALID_UNIT_RE = /^[^\s](?:.*[^\s])?$/u

export interface IMeasurementType {
  name :string
  unit :string
  min ?:number|null
  max ?:number|null
  precision ?:number|null
  description ?:string|null
}
const measurementTypeKeys = ['name','unit','min','max','precision','description'] as const
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
    && ( !( 'description' in o ) || o.description===null || typeof o.description === 'string' )
  )
}

/** Describes a type of measurement (not a specific measurement value). */
export class MeasurementType extends DataObjectTemplate<MeasurementType, Measurement> implements IMeasurementType {
  name :string
  unit :string
  /** Minimum value, for input validation. (Optional but recommended.) */
  min :number
  /** Maximum value, for input validation. (Optional but recommended.) */
  max :number
  /** Number of places after the decimal point, both for input validation and for display rounding. (Optional but recommended.) */
  precision :number
  description :string
  constructor(o :IMeasurementType|null) {
    super()
    this.name = o?.name ?? ''
    this.unit = o?.unit ?? ''
    this.min = o && 'min' in o && o.min!==null && Number.isFinite(o.min) ? o.min : -Infinity
    this.max = o && 'max' in o && o.max!==null && Number.isFinite(o.max) ? o.max : +Infinity
    this.precision = o && 'precision' in o && o.precision!==null && Number.isFinite(o.precision) && o.precision>=0 ? o.precision : NaN
    this.description = o && 'description' in o && o.description!==null ? o.description.trim() : ''
  }
  override validate(others :MeasurementType[]) {
    validateName(this.name)
    if (!this.unit.match(VALID_UNIT_RE)) throw new Error(`${tr('Invalid unit')}: ${this.unit}`)
    if (this.min>this.max) throw new Error(`${tr('Invalid min/max value')}: ${this.min}>${this.max}`)
    if (this.precision<0) throw new Error(`${tr('Invalid precision')}: ${this.precision}<0`)
    if (others.some(o => o.name === this.name))
      throw new Error(`${tr('duplicate-name')}: ${this.name}`)
  }
  override warningsCheck(_isBrandNew :boolean) {
    const rv :string[] = []
    if (!Number.isFinite(this.min)) rv.push(tr('No minimum value'))
    if (!Number.isFinite(this.max)) rv.push(tr('No maximum value'))
    if (!Number.isFinite(this.precision)) rv.push(tr('No precision'))
    return rv
  }
  override equals(o: unknown) {
    return isIMeasurementType(o)
      && this.name===o.name && this.unit===o.unit
      && ( Number.isNaN(this.min) && Number.isNaN(o.min) || this.min === o.min )
      && ( Number.isNaN(this.max) && Number.isNaN(o.max) || this.max === o.max )
      && ( Number.isNaN(this.precision) && Number.isNaN(o.precision) || this.precision === o.precision )
      && this.description.trim() === ( o.description?.trim() ?? '' )
  }
  override toJSON(_key :string) :IMeasurementType {
    return { name: this.name, unit: this.unit,
      ...( Number.isFinite(this.min) && { min: this.min } ),
      ...( Number.isFinite(this.max) && { max: this.max } ),
      ...( Number.isFinite(this.precision) && { precision: this.precision } ),
      ...( this.description.trim().length && { description: this.description.trim() } ) }
  }
  override deepClone() :MeasurementType {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isIMeasurementType(clone))
    return new MeasurementType(clone)
  }
  override templateToObject() :Measurement {
    return new Measurement({ type: this.deepClone(), time: timestampNow(), value: '' })
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Measurement Type':'meas-type') }
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
  /** Return a step value ("1", "0.1", "0.01", etc.) either for the precision specified in the argument, or using this object's precision. */
  precisionAsStep(pr ?:number) :string|undefined {
    const p = pr===undefined ? this.precision : pr
    return Number.isFinite(p) && p>=0 ? ( p ? '0.'+('1'.padStart(p,'0')) : '1' ) : undefined
  }
  /** Regular expression that can be used to validate measurement value inputs of this type. */
  get validPattern() {
    const after = !Number.isFinite(this.precision) || this.precision<0 ? '[0-9]+'
      : this.precision===0 ? ''  // special case: just integers (see below)
        : this.precision===1 ? '[0-9]' : `[0-9]{1,${this.precision}}`  // one or more digits after decimal point
    return after.length ? `^[\\-\\+]?(?:(?!0[0-9])[0-9]+(?:\\.${after})?|\\.${after})$` : '^[\\-\\+]?(?!0[0-9])[0-9]+$'
  }
}
