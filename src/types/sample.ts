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
import { DataObjectTemplate, DataObjectWithTemplate } from './common'
import { IMeasurement, isIMeasurement, Measurement } from './meas'
import { dataSetsEqual } from './set'
import { i18n, tr } from '../i18n'
import { assert } from '../utils'

export const sampleTypes = ['undefined',  // Remember to keep in sync with translations 'st-*' !
  'surface-water-stream', 'surface-water-pond', 'ground-water', 'water-precipitation',
  'sediment', 'soil', 'vegetation', 'organism', 'fish', 'insect',
] as const

type SampleType = typeof sampleTypes[number]
export function isSampleType(v :unknown) :v is SampleType {
  return typeof v==='string' && sampleTypes.includes(v as SampleType) }

export interface ISample {
  type :SampleType
  measurements :IMeasurement[]
  notes ?:string|null
}
export function isISample(o :unknown) :o is ISample {
  if (!o || typeof o !== 'object') return false
  //TODO: Allow 'template' key here - though it's not a member of the interface, this type checker is used on the objects too!
  if (Object.keys(o).length!==3 || !('type' in o && 'measurements' in o && 'notes' in o)) return false  // keys
  // type checks
  if (!isSampleType(o.type) || !Array.isArray(o.measurements)) return false
  for (const m of o.measurements) if (!isIMeasurement(m)) return false
  if ('notes' in o && !( o.notes===null || typeof o.notes === 'string' )) return false
  return true
}

/** Records an actual sample taken. */
export class Sample extends DataObjectWithTemplate<Sample, SampleTemplate> implements ISample {
  type :SampleType
  measurements :Measurement[]
  notes :string
  readonly template :SampleTemplate|null
  constructor(o :ISample|null, template :SampleTemplate|null) {
    super()
    this.type = o?.type ?? 'undefined'
    this.measurements = o ? o.measurements.map(m => new Measurement(m)) : []
    this.notes = o && 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.template = template
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Sample':'Sample') }
  override validate(_others :Sample[]) {
    if (!isSampleType(this.type)) throw new Error(`${tr('Invalid sample type')} ${String(this.type)}`) }
  override summaryDisplay() { return sampSummary(this) }
  override equals(o: unknown) {
    return isISample(o)
      && this.type === o.type
      && this.notes.trim() === ( o.notes?.trim() ?? '' )
      && dataSetsEqual(this.measurements, o.measurements.map(m => new Measurement(m)))
  }
  override toJSON(_key: string): ISample {
    const rv :ISample = { type: this.type, measurements: this.measurements.map((m,mi) => m.toJSON(mi.toString())) }
    if (this.notes.trim().length) rv.notes = this.notes.trim()
    return rv
  }
  override warningsCheck(isBrandNew :boolean) {
    const rv :string[] = []
    if (this.type==='undefined') rv.push(tr('samp-type-undef'))
    if (!isBrandNew && !this.measurements.length) rv.push(tr('No measurements'))  //TODO Later: only warn if the template defines measurements?
    return rv
  }
  override extractTemplate() :SampleTemplate {
    return new SampleTemplate({ type: this.type, measurementTypes: this.measurements.map(m => m.extractTemplate()) })
  }
  override deepClone() :Sample {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISample(clone))
    return new Sample(clone, this.template)
  }
}

function sampSummary(samp :Sample|SampleTemplate) :[string,string] {
  const meas = 'measurementTypes' in samp ? samp.measurementTypes : samp.measurements
  let m = i18n.t('measurements', {count: meas.length})
  if (meas.length===1) {
    const m0 = meas[0]
    assert(m0)
    m += ': '+m0.summaryDisplay()[0]
  }
  return [ i18n.t('st-'+samp.type), m ]
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISampleTemplate {
  type :SampleType
  /* TODO: More fields in sample template? like amount? (e.g. in case only a sample is taken back to the lab without measurements)
   * Or "other type" for a freeform type definition? */
  measurementTypes :IMeasurementType[]
}
export function isISampleTemplate(o :unknown) :o is ISampleTemplate {
  if (!o || typeof o !== 'object') return false
  if (Object.keys(o).length!==2 || !('type' in o && 'measurementTypes' in o)) return false  // keys
  if (!isSampleType(o.type) || !Array.isArray(o.measurementTypes)) return false // types
  for (const m of o.measurementTypes) if (!isIMeasurementType(m)) return false // types in array
  return true
}

export class SampleTemplate extends DataObjectTemplate<SampleTemplate, Sample> implements ISampleTemplate {
  type :SampleType
  /** The typical measurement types performed on this sample. */
  measurementTypes :MeasurementType[]
  constructor(o :ISampleTemplate|null) {
    super()
    this.type = o?.type ?? 'undefined'
    this.measurementTypes = o ? o.measurementTypes.map(m => new MeasurementType(m)) : []
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Sample Template':'samp-temp') }
  override validate(_others :SampleTemplate[]) {
    if (!isSampleType(this.type)) throw new Error(`${tr('Invalid sample type')} ${String(this.type)}`) }
  override summaryDisplay() { return sampSummary(this) }
  override equals(o: unknown) {
    return isISampleTemplate(o)
      && this.type === o.type
      && dataSetsEqual(this.measurementTypes, o.measurementTypes.map(m => new MeasurementType(m)))
  }
  override warningsCheck() {
    const rv :string[] = []
    if (this.type==='undefined') rv.push(tr('samp-type-undef'))
    return rv
  }
  override toJSON(_key: string): ISampleTemplate {
    return { type: this.type, measurementTypes: this.measurementTypes.map((m,mi) => m.toJSON(mi.toString())) } }
  override templateToObject() :Sample {
    return new Sample({ type: this.type, measurements: [] }, this) }
  override deepClone() :SampleTemplate {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISampleTemplate(clone))
    return new SampleTemplate(clone)
  }
}
