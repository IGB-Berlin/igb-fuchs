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
import { isTimestamp, isTimestampSet, NO_TIMESTAMP, Timestamp, timestampNow, DataObjectTemplate, dataSetsEqual, validateTimestamp, validateName, DataObjectWithTemplate } from './common'
import { ISamplingLocation, ISamplingLocationTemplate, isISamplingLocation, isISamplingLocationTemplate, SamplingLocation, SamplingLocationTemplate } from './location'
import { ISampleTemplate, isISampleTemplate, SampleTemplate } from './sample'
import { i18n, tr } from '../i18n'
import { assert } from '../utils'

export interface ISamplingTrip {
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
  if (typeof o.name !== 'string' || !isTimestamp(o.startTime) || !isTimestamp(o.endTime)
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
export class SamplingTrip extends DataObjectWithTemplate<SamplingTrip, SamplingTripTemplate> implements ISamplingTrip {
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
  readonly template :SamplingTripTemplate|null
  constructor(o :ISamplingTrip, template :SamplingTripTemplate|null) {
    super()
    this.name = o.name
    this.description = 'description' in o && o.description!==null ? o.description.trim() : ''
    this.startTime = o.startTime
    this.endTime = o.endTime
    this.lastModified = 'lastModified' in o && o.lastModified!==null && isTimestampSet(o.lastModified) ? o.lastModified : timestampNow()
    this.persons = 'persons' in o && o.persons!==null ? o.persons.trim() : ''
    this.weather = 'weather' in o && o.weather!==null ? o.weather.trim() : ''
    this.notes = 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.locations = o.locations.map(l => new SamplingLocation(l, null))
    this.template = template
    this.validate()
  }
  override validate() {
    validateName(this.name)
    validateTimestamp(this.startTime)
    validateTimestamp(this.endTime)
    validateTimestamp(this.lastModified)
  }
  override summaryDisplay() :[string,string] {
    const dt = isTimestampSet(this.startTime) ? new Date(this.startTime).toLocaleDateString()+'; ' : ''
    return [ this.name, dt+i18n.t('sampling-locations', {count: this.locations.length})]
  }
  override equals(o: unknown) {
    return isISamplingTrip(o) && this.name===o.name && this.description.trim()===o.description?.trim()
      && this.startTime===o.startTime && this.endTime===o.endTime && this.persons.trim()===o.persons?.trim()
      && this.weather.trim()===o.weather?.trim() && this.notes.trim()===o.notes?.trim()
      && dataSetsEqual(this.locations, o.locations.map(l => new SamplingLocation(l, null)))
  }
  override toJSON(_key: string): ISamplingTrip {
    const rv :ISamplingTrip = {
      name: this.name, startTime: this.startTime, endTime: this.endTime,
      locations: this.locations.map((l,li) => l.toJSON(li.toString())) }
    if (this.description.trim().length) rv.description = this.description.trim()
    if (isTimestampSet(this.lastModified)) rv.lastModified = this.lastModified
    if (this.persons.trim().length) rv.persons = this.persons.trim()
    if (this.weather.trim().length) rv.weather = this.weather.trim()
    if (this.notes.trim().length) rv.notes = this.notes.trim()
    return rv
  }
  override warningsCheck() {
    const rv :string[] = []
    if (!isTimestampSet(this.startTime)) rv.push(tr('No start time'))
    if (!isTimestampSet(this.endTime)) rv.push(tr('No end time'))
    if (this.locations.length) rv.push(tr('No sampling locations'))
    return rv.concat( this.locations.flatMap(l => l.warningsCheck()) )
  }
  override extractTemplate() :SamplingTripTemplate {
    /* If all location templates have the same set of samples, then we
     * can deduplicate them into the trip template's `commonSamples`. */
    const locs = this.locations.map(l => l.extractTemplate())
    const l0 = locs[0]
    const allLocsHaveSameSamples =
      l0 && locs.slice(1).every( l => dataSetsEqual( l0.samples, l.samples ) )
    if (allLocsHaveSameSamples) locs.forEach(l => l.samples.length = 0)
    const common = allLocsHaveSameSamples ? l0.samples : []
    return new SamplingTripTemplate({ name: this.name, description: this.description.trim(),
      locations: locs, commonSamples: common })
  }
  override deepClone() :SamplingTrip {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingTrip(clone))
    return new SamplingTrip(clone, this.template)
  }
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISamplingTripTemplate {
  name :string
  description ?:string|null
  locations :ISamplingLocationTemplate[]
  commonSamples :ISampleTemplate[]
}
export function isISamplingTripTemplate(o :unknown) :o is ISamplingTripTemplate {
  if (!o || typeof o !== 'object') return false
  if (!( 'name' in o && 'locations' in o && 'commonSamples' in o
    && ( Object.keys(o).length===3 || Object.keys(o).length===4 && 'description' in o ) )) return false // keys
  // type checks
  if ( typeof o.name !== 'string' || !Array.isArray(o.locations) || !Array.isArray(o.commonSamples) ) return false
  for (const l of o.locations) if (!isISamplingLocationTemplate(l)) return false
  for (const s of o.commonSamples) if (!isISampleTemplate(s)) return false
  if ('description' in o && !( o.description===null || typeof o.description === 'string' )) return false
  return true
}

export class SamplingTripTemplate extends DataObjectTemplate<SamplingTripTemplate, SamplingTrip> implements ISamplingTripTemplate {
  name :string
  description :string
  /** The typical sampling locations on this trip. */
  locations :SamplingLocationTemplate[]
  /** This array is used when the location template's samples array is empty. */
  commonSamples :SampleTemplate[]
  constructor(o :ISamplingTripTemplate) {
    super()
    this.name = o.name
    this.description = 'description' in o && o.description!==null ? o.description.trim() : ''
    this.locations = o.locations.map(l => new SamplingLocationTemplate(l))
    this.commonSamples = o.commonSamples.map(s => new SampleTemplate(s))
    this.validate()
  }
  override validate() { validateName(this.name) }
  override summaryDisplay() :[string,string] {
    return [ this.name, i18n.t('sampling-locations', {count: this.locations.length}) ] }
  override equals(o: unknown) {
    return isISamplingTripTemplate(o) && this.name===o.name && this.description.trim()===o.description?.trim()
      && dataSetsEqual(this.locations, o.locations.map(l => new SamplingLocationTemplate(l)))
  }
  override toJSON(_key: string): ISamplingTripTemplate {
    const rv :ISamplingTripTemplate = { name: this.name,
      locations: this.locations.map((l,li) => l.toJSON(li.toString())),
      commonSamples: this.commonSamples.map((s,si) => s.toJSON(si.toString())),
    }
    if (this.description.trim().length) rv.description = this.description.trim()
    return rv
  }
  override warningsCheck() {
    const rv :string[] = []
    if (!this.locations.length) rv.push(tr('no-trip-loc'))
    this.locations.forEach(l => l.samples.forEach(s => s.measurementTypes.forEach( t => rv.push(...t.warningsCheck()) )))
    return rv
  }
  override templateToObject(startNow :boolean) :SamplingTrip {
    const rv :ISamplingTrip = { name: this.name, locations: [],
      startTime: startNow ? timestampNow() : NO_TIMESTAMP, endTime: NO_TIMESTAMP, lastModified: timestampNow() }
    if (this.description.trim().length) rv.description = this.description.trim()
    return new SamplingTrip(rv, this)
  }
  override deepClone() :SamplingTripTemplate {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingTripTemplate(clone))
    return new SamplingTripTemplate(clone)
  }
}
