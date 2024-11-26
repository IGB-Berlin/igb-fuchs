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
import { Identifier, isIdentifier, isTimestamp, isTimestampSet, JsonSerializable, NO_TIMESTAMP, SanityCheckable, Timestamp, timestampNow } from './common'
import { ISample, isISample, isISampleTemplate, ISampleTemplate, Sample, SampleTemplate } from './sample'
import { AbstractCoordinates, ICoordinates, isICoordinates } from './coords'
import { assert } from '../utils'

export interface ISamplingLocation {
  id :Identifier
  name :string
  description ?:string|null
  coordinates :ICoordinates
  startTime :Timestamp
  endTime :Timestamp
  samples :ISample[]
  notes ?:string|null
  photos ?:string[]
}
const samplingLocationKeys = ['id','name','description','coordinates','startTime','endTime','samples','notes','photos'] as const
type SamplingLocationKey = typeof samplingLocationKeys[number] & keyof ISamplingLocation
export function isISamplingLocation(o :unknown) :o is ISamplingLocation {
  if (!o || typeof o !== 'object') return false
  if (!('id' in o && 'name' in o && 'coordinates' in o && 'startTime' in o && 'endTime' in o && 'samples' in o)) return false  // required keys
  for (const k of Object.keys(o)) if (!samplingLocationKeys.includes(k as SamplingLocationKey)) return false  // extra keys
  // type checks
  if (!isIdentifier(o.id) || typeof o.name !== 'string' || !isICoordinates(o.coordinates) || !isTimestamp(o.startTime) || !isTimestamp(o.endTime)
    || !Array.isArray(o.samples)) return false
  for (const s of o.samples) if (!isISample(s)) return false
  if ('description' in o && !( o.description===null || typeof o.description === 'string' )) return false
  if ('notes' in o && !( o.notes===null || typeof o.notes === 'string' )) return false
  if ('photos' in o) {
    if (!Array.isArray(o.photos)) return false
    for (const p of o.photos) if (typeof p !== 'string') return false
  }
  return true
}

/** Records and actual sampling point. */
export class SamplingLocation extends JsonSerializable implements ISamplingLocation, SanityCheckable {
  id :Identifier
  name :string
  description :string
  /* TODO: On the one hand, could merge wgs84lat and wgs84lon attrs into here, on the other,
   * should probably record nominal location (from the template) vs. actual location.
   * Also, should we discourage users from editing values like `id`, `name` etc. from template?
   */
  coordinates :ICoordinates
  startTime :Timestamp
  endTime :Timestamp
  samples :Sample[]
  notes :string
  /** Pictures taken at this location - TODO Later: how to represent as JSON? Filenames? */
  photos :string[]
  constructor(o :ISamplingLocation) {
    super()
    assert(isIdentifier(o.id) && isTimestamp(o.startTime) && isTimestamp(o.endTime))
    this.id = o.id
    this.name = o.name
    this.description = 'description' in o && o.description!==null ? o.description : ''
    this.coordinates = o.coordinates
    this.startTime = o.startTime
    this.endTime = o.endTime
    this.samples = o.samples.map(s => new Sample(s))
    this.notes = 'notes' in o && o.notes!==null ? o.notes : ''
    this.photos = 'photos' in o ? o.photos : []
  }
  get coords() :AbstractCoordinates { return AbstractCoordinates.fromJSON(this.coordinates) }
  override toJSON(_key: string): ISamplingLocation {
    const rv :ISamplingLocation = {
      id: this.id, name: this.name, coordinates: this.coordinates, startTime: this.startTime, endTime: this.endTime,
      samples: this.samples.map((s,si) => s.toJSON(si.toString())) }
    if (this.description.trim().length) rv.description = this.description
    if (this.notes.trim().length) rv.notes = this.notes
    if (this.photos.length) rv.photos = this.photos
    return rv
  }
  static override fromJSON(obj: object): SamplingLocation {
    assert(isISamplingLocation(obj))
    return new SamplingLocation(obj)
  }
  sanityCheck() :string[] {
    const rv :string[] = []
    if (!isTimestampSet(this.startTime)) rv.push(`No start time set for location ${this.id}`)
    if (!isTimestampSet(this.endTime)) rv.push(`No end time set for location ${this.id}`)
    if (this.samples.length) rv.push(`No samples at location ${this.id}`)
    return rv.concat( this.samples.flatMap(s => s.sanityCheck()) )
  }
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISamplingLocationTemplate {
  id :Identifier
  name :string
  description ?:string|null
  coordinates :ICoordinates
  samples :ISampleTemplate[]
}
const samplingLocationTemplateKeys = ['id','name','description','coordinates','samples'] as const
type SamplingLocationTemplateKey = typeof samplingLocationTemplateKeys[number] & keyof ISamplingLocationTemplate
export function isISamplingLocationTemplate(o :unknown) :o is ISamplingLocationTemplate {
  if (!o || typeof o !== 'object') return false
  if (!('id' in o && 'name' in o && 'coordinates' in o && 'samples' in o)) return false  // required keys
  for (const k of Object.keys(o)) if (!samplingLocationTemplateKeys.includes(k as SamplingLocationTemplateKey)) return false  // extra keys
  // type checks
  if (!isIdentifier(o.id) || typeof o.name !== 'string' || !isICoordinates(o.coordinates) || !Array.isArray(o.samples)) return false
  for (const s of o.samples) if (!isISampleTemplate(s)) return false
  if ('description' in o && !( o.description===null || typeof o.description === 'string' )) return false
  return true
}

export class SamplingLocationTemplate extends JsonSerializable implements ISamplingLocationTemplate {
  id :Identifier
  name :string
  description :string
  coordinates :ICoordinates
  /** The typical samples taken at this location. */
  samples :SampleTemplate[]
  constructor(o :ISamplingLocationTemplate) {
    super()
    assert(isIdentifier(o.id))
    this.id = o.id
    this.name = o.name
    this.description = 'description' in o && o.description!==null ? o.description : ''
    this.coordinates = o.coordinates
    this.samples = o.samples.map(s => new SampleTemplate(s))
  }
  get coords() :AbstractCoordinates { return AbstractCoordinates.fromJSON(this.coordinates) }
  override toJSON(_key: string): ISamplingLocationTemplate {
    const rv :ISamplingLocationTemplate = {
      id: this.id, name: this.name, coordinates: this.coordinates,
      samples: this.samples.map((s,si) => s.toJSON(si.toString())) }
    if (this.description.trim().length) rv.description = this.description
    return rv
  }
  static override fromJSON(obj: object): SamplingLocationTemplate {
    assert(isISamplingLocationTemplate(obj))
    return new SamplingLocationTemplate(obj)
  }
  toSamplingLocation(actualCoords :AbstractCoordinates|ICoordinates|null, startNow :boolean) :SamplingLocation {
    const rv :ISamplingLocation = { id: this.id, name: this.name,
      coordinates: actualCoords===null ? this.coordinates : actualCoords instanceof AbstractCoordinates ? actualCoords.toWgs84Coords() : actualCoords,
      startTime: startNow?timestampNow():NO_TIMESTAMP, endTime: NO_TIMESTAMP, samples: [] }
    if (this.description.trim().length) rv.description = this.description
    return new SamplingLocation(rv)
  }
}
