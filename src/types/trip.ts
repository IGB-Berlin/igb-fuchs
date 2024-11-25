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
import { ISamplingLocation, ISamplingLocationTemplate, isISamplingLocation, isISamplingLocationTemplate, SamplingLocation, SamplingLocationTemplate } from './location'
import { Identifier, isIdentifier, isTimestamp, isTimestampSet, JsonSerializable, NO_TIMESTAMP, SanityCheckable, Timestamp, timestampNow } from './common'
import { assert } from '../utils'

interface ISamplingTrip {
  id :Identifier
  name :string
  description ?:string|null
  startTime :Timestamp
  endTime :Timestamp
  lastModified ?:Timestamp|null
  persons ?:string|null
  weather ?:string|null
  notes ?:string|null
  locations :ISamplingLocation[]
}
const samplingTripKeys = ['id','name','description','startTime','endTime','lastModified','persons','weather','notes','locations'] as const
type SamplingTripKey = typeof samplingTripKeys[number] & keyof ISamplingTrip
function isISamplingTrip(o :unknown) :o is ISamplingTrip {
  if (!o || typeof o !== 'object') return false
  if (!('id' in o && 'name' in o && 'startTime' in o && 'endTime' in o && 'locations' in o)) return false  // required keys
  for (const k of Object.keys(o)) if (!samplingTripKeys.includes(k as SamplingTripKey)) return false  // extra keys
  // type checks
  if (!isIdentifier(o.id) || typeof o.name !== 'string' || !isTimestamp(o.startTime) || !isTimestamp(o.endTime)
    || !Array.isArray(o.locations)) return false
  for (const l of o.locations) if (!isISamplingLocation(l)) return false
  if ('description' in o && !( o.description===null || typeof o.description === 'string' )) return false
  if ('lastModified' in o && !( o.lastModified===null || isTimestamp(o.lastModified) )) return false
  if ('persons' in o && !( o.persons===null || typeof o.persons === 'string' )) return false
  if ('weather' in o && !( o.weather===null || typeof o.weather === 'string' )) return false
  if ('notes' in o && !( o.notes===null || typeof o.notes === 'string' )) return false
  return true
}

/** Records an entire sampling trip. */
export class SamplingTrip extends JsonSerializable implements ISamplingTrip, SanityCheckable {
  id :Identifier
  name :string
  description :string
  startTime :Timestamp
  endTime :Timestamp
  /** Last modification time, should always be updated e.g. in case of edits after the `endTime`. */
  lastModified :Timestamp
  persons :string
  weather :string
  notes :string
  locations :SamplingLocation[]
  constructor(o :ISamplingTrip) {
    super()
    assert(isIdentifier(o.id) && isTimestamp(o.startTime) && isTimestamp(o.endTime))
    this.id = o.id
    this.name = o.name
    this.description = 'description' in o && o.description!==null ? o.description : ''
    this.startTime = o.startTime
    this.endTime = o.endTime
    this.lastModified = 'lastModified' in o && o.lastModified!==null ? o.lastModified : timestampNow()
    assert(isTimestamp(this.lastModified))
    this.persons = 'persons' in o && o.persons!==null ? o.persons : ''
    this.weather = 'weather' in o && o.weather!==null ? o.weather : ''
    this.notes = 'notes' in o && o.notes!==null ? o.notes : ''
    this.locations = o.locations.map(l => new SamplingLocation(l))
  }
  override toJSON(_key: string): ISamplingTrip {
    const rv :ISamplingTrip = {
      id: this.id, name: this.name, startTime: this.startTime, endTime: this.endTime,
      locations: this.locations.map((l,li) => l.toJSON(li.toString())) }
    if (this.description.trim().length) rv.description = this.description
    if (isTimestampSet(this.lastModified)) rv.lastModified = this.lastModified
    if (this.persons.trim().length) rv.persons = this.persons
    if (this.weather.trim().length) rv.weather = this.weather
    if (this.notes.trim().length) rv.notes = this.notes
    return rv
  }
  static override fromJSON(obj: object): SamplingTrip {
    assert(isISamplingTrip(obj))
    return new SamplingTrip(obj)
  }
  sanityCheck() :string[] {
    const rv :string[] = []
    if (!isTimestampSet(this.startTime)) rv.push(`No start time set for location ${this.id}`)
    if (!isTimestampSet(this.endTime)) rv.push(`No end time set for location ${this.id}`)
    if (this.locations.length) rv.push(`No locations for trip ${this.id}`)
    return rv.concat( this.locations.flatMap(l => l.sanityCheck()) )
  }
}

/* ********** ********** ********** Template ********** ********** ********** */

interface ISamplingTripTemplate {
  name :string
  description ?:string|null
  locations :ISamplingLocationTemplate[]
}
function isISamplingTripTemplate(o :unknown) :o is ISamplingTripTemplate {
  if (!o || typeof o !== 'object') return false
  if (!( 'name' in o && 'locations' in o && ( Object.keys(o).length===2 || Object.keys(o).length===3 && 'description' in o ) )) return false // keys
  // type checks
  if ( typeof o.name !== 'string' || !Array.isArray(o.locations) ) return false
  for (const l of o.locations) if (!isISamplingLocationTemplate(l)) return false
  if ('description' in o && !( o.description===null || typeof o.description === 'string' )) return false
  return true
}

export class SamplingTripTemplate extends JsonSerializable implements ISamplingTripTemplate, SanityCheckable {
  name :string
  description :string
  /** The typical sampling locations on this trip. */
  locations :SamplingLocationTemplate[]
  constructor(o :ISamplingTripTemplate) {
    super()
    this.name = o.name
    this.description = 'description' in o && o.description!==null ? o.description : ''
    this.locations = o.locations.map(l => new SamplingLocationTemplate(l))
  }
  override toJSON(_key: string): ISamplingTripTemplate {
    const rv :ISamplingTripTemplate = { name: this.name,
      locations: this.locations.map((l,li) => l.toJSON(li.toString())) }
    if (this.description.trim().length) rv.description = this.description
    return rv
  }
  static override fromJSON(obj: object): SamplingTripTemplate {
    assert(isISamplingTripTemplate(obj))
    return new SamplingTripTemplate(obj)
  }
  toSamplingTrip(id :Identifier, startNow :boolean) :SamplingTrip {
    const rv :ISamplingTrip = { id: id, name: this.name, locations: [],
      startTime: startNow?timestampNow():NO_TIMESTAMP, endTime: NO_TIMESTAMP, lastModified: timestampNow() }
    if (this.description.trim().length) rv.description = this.description
    return new SamplingTrip(rv)
  }
  sanityCheck() :string[] {
    const rv :string[] = []
    if (!this.locations.length) rv.push(`No locations for sampling trip template ${this.name}`)
    this.locations.forEach(l => l.samples.forEach(s => s.measurementTypes.forEach( t => rv.push(...t.sanityCheck()) )))
    return rv
  }
}
