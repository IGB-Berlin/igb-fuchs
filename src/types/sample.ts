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
import { IMeasurementType, isIMeasurementType, MeasurementType } from './meas-types'
import { IMeasurement, isIMeasurement, Measurement } from './meas'
import { JsonSerializable, SanityCheckable } from './common'
import { assert } from '../utils'

const sampleTypes = ['',
  'surface-water-stream', 'surface-water-pond', 'ground-water', 'water-precipitation',
  'sediment', 'soil', 'vegetation', 'organism',  //TODO Later: should this be freeform instead?
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
export class Sample extends JsonSerializable implements ISample, SanityCheckable {
  //TODO Later: Sample.type should have translations (?)
  type :SampleType
  measurements :Measurement[]
  notes :string
  constructor(o :ISample) {
    super()
    this.type = o.type
    this.measurements = o.measurements.map(m => new Measurement(m))
    this.notes = 'notes' in o && o.notes!==null ? o.notes : ''
  }
  override toJSON(_key: string): ISample {
    const rv :ISample = { type: this.type, measurements: this.measurements.map((m,mi) => m.toJSON(mi.toString())) }
    if (this.notes.trim().length) rv.notes = this.notes
    return rv
  }
  static override fromJSON(obj: object): Sample {
    assert(isISample(obj))
    return new Sample(obj)
  }
  sanityCheck() :string[] {
    const rv :string[] = []
    if (!this.measurements.length) rv.push('No measurements')
    return rv.concat( this.measurements.flatMap(m => m.sanityCheck()) )
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

export class SampleTemplate extends JsonSerializable implements ISampleTemplate {
  type :SampleType
  /** The typical measurement types performed on this sample. */
  measurementTypes :MeasurementType[]
  constructor(o :ISampleTemplate) {
    super()
    this.type = o.type
    this.measurementTypes = o.measurementTypes.map(m => new MeasurementType(m))
  }
  override toJSON(_key: string): ISampleTemplate {
    return { type: this.type, measurementTypes: this.measurementTypes.map((m,mi) => m.toJSON(mi.toString())) }
  }
  static override fromJSON(obj: object): SampleTemplate {
    assert(isISampleTemplate(obj))
    return new SampleTemplate(obj)
  }
  toSample() :Sample {
    return new Sample({ type: this.type, measurements: [] })
  }
}
