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
import { IMeasurementType, isIMeasurementType, MeasurementType } from './meas-type'
import { IMeasurement, isIMeasurement, Measurement } from './meas'
import { dataSetsEqual, DataObjectTemplate, DataObjectWithTemplate } from './common'
import { i18n, tr } from '../i18n'

const sampleTypes = ['undefined',  // Remember to keep in sync with translations 'st-*' !
  'surface-water-stream', 'surface-water-pond', 'ground-water', 'water-precipitation',
  'sediment', 'soil', 'vegetation', 'organism', 'fish', 'insect',  //TODO Later: should this be freeform instead?
] as const

type SampleType = typeof sampleTypes[number]
function isSampleType(v :unknown) :v is SampleType {
  return typeof v==='string' && sampleTypes.includes(v as SampleType) }

export interface ISample {
  type :SampleType
  measurements :IMeasurement[]
  notes ?:string|null
}
export function isISample(o :unknown) :o is ISample {
  if (!o || typeof o !== 'object') return false
  if (Object.keys(o).length!==3 || !('type' in o && 'measurements' in o && 'notes' in o)) return false  // keys
  // type checks
  if (!isSampleType(o.type) || !Array.isArray(o.measurements)) return false
  for (const m of o.measurements) if (!isIMeasurement(m)) return false
  if ('notes' in o && !( o.notes===null || typeof o.notes === 'string' )) return false
  return true
}

/** Records an actual sample taken. */
export class Sample extends DataObjectWithTemplate<SampleTemplate> implements ISample {
  type :SampleType
  measurements :Measurement[]
  notes :string
  readonly template :SampleTemplate|null
  constructor(o :ISample, template :SampleTemplate|null) {
    super()
    this.type = o.type
    this.measurements = o.measurements.map(m => new Measurement(m))
    this.notes = 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.template = template
    this.validate()
  }
  override validate() {
    if (!isSampleType(this.type)) throw new Error(`${tr('Invalid sample type')} ${String(this.type)}`) }
  override summaryDisplay() :[string,string] {
    return [ this.type, i18n.t('measurements', {count: this.measurements.length}) ] }
  override equals(o: unknown) {
    return isISample(o) && this.type===o.type && this.notes.trim()===o.notes?.trim()
      && dataSetsEqual(this.measurements, o.measurements.map(m => new Measurement(m)))
  }
  override toJSON(_key: string): ISample {
    const rv :ISample = { type: this.type, measurements: this.measurements.map((m,mi) => m.toJSON(mi.toString())) }
    if (this.notes.trim().length) rv.notes = this.notes.trim()
    return rv
  }
  override warningsCheck() {
    const rv :string[] = []
    if (!this.measurements.length) rv.push(tr('No measurements'))
    return rv.concat( this.measurements.flatMap(m => m.warningsCheck()) )
  }
  override extractTemplate() :SampleTemplate {
    return new SampleTemplate({ type: this.type, measurementTypes: this.measurements.map(m => m.extractTemplate()) })
  }
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISampleTemplate {
  type :SampleType
  measurementTypes :IMeasurementType[]
}
export function isISampleTemplate(o :unknown) :o is ISampleTemplate {
  if (!o || typeof o !== 'object') return false
  if (Object.keys(o).length!==2 || !('type' in o && 'measurementTypes' in o)) return false  // keys
  if (!isSampleType(o.type) || !Array.isArray(o.measurementTypes)) return false // types
  for (const m of o.measurementTypes) if (!isIMeasurementType(m)) return false // types in array
  return true
}

export class SampleTemplate extends DataObjectTemplate implements ISampleTemplate {
  type :SampleType
  /** The typical measurement types performed on this sample. */
  measurementTypes :MeasurementType[]
  constructor(o :ISampleTemplate) {
    super()
    this.type = o.type
    this.measurementTypes = o.measurementTypes.map(m => new MeasurementType(m))
    this.validate()
  }
  override validate() {
    if (!isSampleType(this.type)) throw new Error(`${tr('Invalid sample type')} ${String(this.type)}`) }
  override summaryDisplay() :[string,string] {
    return [ this.type, i18n.t('measurements', {count: this.measurementTypes.length}) ] }
  override equals(o: unknown) {
    return isISampleTemplate(o) && this.type===o.type
      && dataSetsEqual(this.measurementTypes, o.measurementTypes.map(m => new MeasurementType(m)))
  }
  override warningsCheck() { return [] }
  override toJSON(_key: string): ISampleTemplate {
    return { type: this.type, measurementTypes: this.measurementTypes.map((m,mi) => m.toJSON(mi.toString())) } }
  templateToObject() :Sample {
    return new Sample({ type: this.type, measurements: [] }, this) }
}
