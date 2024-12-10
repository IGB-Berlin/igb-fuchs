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
import { isTimestamp, isTimestampSet, NO_TIMESTAMP, Timestamp, timestampNow, DataObjectTemplate,
  validateTimestamp, validateName, DataObjectWithTemplate, validateId, timestampsEqual, HasId,
  isArrayOf } from './common'
import { ISamplingLocation, ISamplingLocationTemplate, isISamplingLocation, isISamplingLocationTemplate,
  SamplingLocation, SamplingLocationTemplate } from './location'
import { ISampleTemplate, isISampleTemplate, SampleTemplate } from './sample'
import { dataSetsEqual } from './set'
import { IdbStorage } from '../idb-store'
import { i18n, tr } from '../i18n'
import { assert } from '../utils'

export interface ISamplingTrip extends HasId {
  readonly id :string
  name :string
  startTime :Timestamp
  endTime :Timestamp
  //TODO Later: more consistently update trip's lastModified
  lastModified ?:Timestamp|null
  persons ?:string|null
  weather ?:string|null
  notes ?:string|null
  /** Which items from `.template.checklist` have been checked. Items in this list that are not in the other are ignored; only exact string matches are considered. */
  readonly checkedTasks ?:string[]|null
  readonly locations :ISamplingLocation[]
  readonly template ?:ISamplingTripTemplate|null
}
const samplingTripKeys = ['id','name','startTime','endTime','lastModified','persons','weather','notes','checkedTasks','locations','template'] as const
type SamplingTripKey = typeof samplingTripKeys[number] & keyof ISamplingTrip
export function isISamplingTrip(o :unknown) :o is ISamplingTrip {
  return !!( o && typeof o === 'object'
    && 'id' in o && 'name' in o && 'startTime' in o && 'endTime' in o && 'locations' in o  // required keys
    && Object.keys(o).every(k => samplingTripKeys.includes(k as SamplingTripKey))  // extra keys
    // type checks
    && typeof o.id === 'string' && typeof o.name === 'string' && isTimestamp(o.startTime) && isTimestamp(o.endTime)
    && Array.isArray(o.locations) && o.locations.every(l => isISamplingLocation(l))
    && ( !('lastModified' in o) || o.lastModified===null || isTimestamp(o.lastModified) )
    && ( !('persons' in o) || o.persons===null || typeof o.persons === 'string' )
    && ( !('weather' in o) || o.weather===null || typeof o.weather === 'string' )
    && ( !('notes' in o) || o.notes===null || typeof o.notes === 'string' )
    && ( !('checkedTasks' in o) || o.checkedTasks===null || Array.isArray(o.checkedTasks) && o.checkedTasks.every(t => typeof t === 'string') )
    && ( !('template' in o) || o.template===null || isISamplingTripTemplate(o.template) )
  )
}
/* TODO Later: For the future, when this project is released and changes happen to the schema,
 * there should be a Migrator class that upgrades/converts older objects to newer ones. */

/** Records an entire sampling trip. */
export class SamplingTrip extends DataObjectWithTemplate<SamplingTrip, SamplingTripTemplate> implements ISamplingTrip {
  readonly id :string
  name :string
  startTime :Timestamp
  endTime :Timestamp
  /** Last modification time, should always be updated e.g. in case of edits after the `endTime`. */
  lastModified :Timestamp
  persons :string
  weather :string
  notes :string
  readonly checkedTasks :string[]
  readonly locations :SamplingLocation[]
  readonly template :SamplingTripTemplate|null
  constructor(o :ISamplingTrip|null) {
    super()
    this.id = o===null ? IdbStorage.newSamplingTripId() : o.id
    this.name = o?.name ?? ''
    this.startTime = o?.startTime ?? NO_TIMESTAMP
    this.endTime = o?.endTime ?? NO_TIMESTAMP
    this.lastModified = o && 'lastModified' in o && o.lastModified!==null && isTimestampSet(o.lastModified) ? o.lastModified : timestampNow()
    this.persons = o && 'persons' in o && o.persons!==null ? o.persons.trim() : ''
    this.weather = o && 'weather' in o && o.weather!==null ? o.weather.trim() : ''
    this.notes = o && 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.checkedTasks = o && 'checkedTasks' in o && o.checkedTasks ? o.checkedTasks : []
    this.locations = o===null ? [] : isArrayOf(SamplingLocation, o.locations) ? o.locations : o.locations.map(l => new SamplingLocation(l))
    this.template = o && 'template' in o ? ( o.template instanceof SamplingTripTemplate ? o.template : new SamplingTripTemplate(o.template) ) : null
  }
  override validate(others :SamplingTrip[]) {
    validateId(this.id)
    validateName(this.name)
    validateTimestamp(this.startTime)
    validateTimestamp(this.endTime)
    validateTimestamp(this.lastModified)
    if (others.some(o => o.tripId === this.tripId))
      throw new Error(tr('duplicate-trip-id'))
  }
  override warningsCheck(skipInitWarns :boolean) {
    const rv :string[] = []
    if (!isTimestampSet(this.startTime)) rv.push(tr('No start time'))
    if (isTimestampSet(this.startTime) && isTimestampSet(this.endTime) && this.endTime < this.startTime) rv.push(tr('times-order'))
    if (!skipInitWarns) {
      if (!isTimestampSet(this.endTime)) rv.push(tr('No end time'))
      if (this.template) {
        let taskCount = 0
        for (const c of this.template.checklist)
          if (!this.checkedTasks.includes(c))
            taskCount++
        if (taskCount) rv.push(i18n.t('check-not-completed', { count: taskCount }))
        if (this.template.locations.length) rv.push(i18n.t('planed-loc-remain', { count: this.template.locations.length }))
      } // else, no template
      else if (!this.locations.length) rv.push(tr('No sampling locations'))
    }
    return rv
  }
  override equals(o: unknown) {
    return isISamplingTrip(o)
      // not comparing ids
      && this.name === o.name
      && timestampsEqual(this.startTime, o.startTime)
      && timestampsEqual(this.endTime, o.endTime)
      // not comparing lastModified
      && this.persons.trim() === ( o.persons?.trim() ?? '' )
      && this.weather.trim() === ( o.weather?.trim() ?? '' )
      && this.notes.trim() === ( o.notes?.trim() ?? '' )
      && ( !o.checkedTasks && !this.checkedTasks.length
        || this.checkedTasks.length === o.checkedTasks?.length && this.checkedTasks.every((t,i) => t===o.checkedTasks?.[i]) )
      && this.locations.length === o.locations.length && this.locations.every((l,i) => l.equals(o.locations[i]))
    // not comparing template
  }
  override toJSON(_key: string): ISamplingTrip {
    return { id: this.id, name: this.name, startTime: this.startTime, endTime: this.endTime,
      locations: this.locations.map((l,li) => l.toJSON(li.toString())),
      ...( isTimestampSet(this.lastModified) && { lastModified: this.lastModified } ),
      ...( this.persons.trim().length && { persons: this.persons.trim() } ),
      ...( this.weather.trim().length && { weather: this.weather.trim() } ),
      ...( this.checkedTasks.length && { checkedTasks: this.checkedTasks } ),
      ...( this.notes.trim().length && { notes: this.notes.trim() } ),
      ...( this.template!==null && { template: this.template.toJSON('template') } ) }
  }
  override deepClone() :SamplingTrip {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingTrip(clone))
    return new SamplingTrip(clone)
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
    return new SamplingTripTemplate({ id: IdbStorage.newTripTemplateId(),
      name: this.name, locations: locs, commonSamples: common,
      ...( this.template?.description.trim().length && { description: this.template.description.trim() } ),
      ...( this.template?.checklist.length && { checklist: Array.from(this.template.checklist) } ) })
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Sampling Trip':'Trip') }
  override summaryDisplay() :[string,string] {
    const dt = isTimestampSet(this.startTime) ? new Date(this.startTime).toLocaleDateString()+'; ' : ''
    return [ this.name, dt+i18n.t('sampling-locations', {count: this.locations.length})]
  }
  get tripId() :string {
    const n = this.name.trim().length ? this.name : '?'  // paranoia
    if (isTimestampSet(this.startTime)) {
      const dt = new Date(this.startTime)
      return `${n} [${dt.getFullYear().toString().padStart(4,'0')}-${(dt.getMonth()+1).toString().padStart(2,'0')}-${dt.getDate().toString().padStart(2,'0')}]`
    } else return n
  }
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISamplingTripTemplate extends HasId {
  readonly id :string
  name :string
  description ?:string|null
  readonly checklist ?:string[]|null
  readonly locations :ISamplingLocationTemplate[]
  readonly commonSamples :ISampleTemplate[]
}
const samplingTripTemplateKeys = ['id','name','description','checklist','locations','commonSamples'] as const
type SamplingTripTemplateKey = typeof samplingTripTemplateKeys[number] & keyof ISamplingTripTemplate
export function isISamplingTripTemplate(o :unknown) :o is ISamplingTripTemplate {
  return !!( o && typeof o === 'object'
    && 'id' in o && 'name' in o && 'locations' in o && 'commonSamples' in o  // required keys
    && Object.keys(o).every(k => samplingTripTemplateKeys.includes(k as SamplingTripTemplateKey))  // extra keys
    // type checks
    && typeof o.id === 'string' && typeof o.name === 'string'
    && Array.isArray(o.locations) && o.locations.every(l => isISamplingLocationTemplate(l))
    && Array.isArray(o.commonSamples) && o.commonSamples.every(s => isISampleTemplate(s))
    && ( !('description' in o) || o.description===null || typeof o.description === 'string' )
    && ( !('checklist' in o) || o.checklist===null || Array.isArray(o.checklist) && o.checklist.every(c => typeof c === 'string') )
  )
}

export class SamplingTripTemplate extends DataObjectTemplate<SamplingTripTemplate, SamplingTrip> implements ISamplingTripTemplate {
  readonly id :string
  name :string
  description :string
  checklist :string[]
  /** The typical sampling locations on this trip. */
  readonly locations :SamplingLocationTemplate[]
  /** This array is used when the location template's samples array is empty. */
  readonly commonSamples :SampleTemplate[]
  constructor(o :ISamplingTripTemplate|null) {
    super()
    this.id = o===null ? IdbStorage.newTripTemplateId() : o.id
    this.name = o?.name ?? ''
    this.description = o && 'description' in o && o.description!==null ? o.description.trim() : ''
    this.checklist = o && 'checklist' in o && o.checklist ? o.checklist : []
    this.locations = o===null ? [] : isArrayOf(SamplingLocationTemplate, o.locations) ? o.locations :o.locations.map(l => new SamplingLocationTemplate(l))
    this.commonSamples = o===null ? [] : isArrayOf(SampleTemplate, o.commonSamples) ? o.commonSamples : o.commonSamples.map(s => new SampleTemplate(s))
  }
  override validate(others :SamplingTripTemplate[]) {
    validateId(this.id)
    validateName(this.name)
    if (others.some(o => o.name === this.name))
      throw new Error(`${tr('duplicate-name')}: ${this.name}`)
  }
  override warningsCheck(skipInitWarns :boolean) {
    const rv :string[] = []
    const ck = this.checklist.map(c => c.trim())
    if ( new Set(ck).size !== ck.length ) rv.push(tr('checklist-duplicates'))
    if ( ck.some(c => !c.length) ) rv.push(tr('checklist-empty-lines'))
    if (!skipInitWarns && !this.locations.length) rv.push(tr('no-trip-loc'))
    return rv
  }
  override equals(o: unknown) {
    return isISamplingTripTemplate(o)
      // not comparing id
      && this.name === o.name
      && this.description.trim() === ( o.description?.trim() ?? '' )
      && ( !o.checklist && !this.checklist.length
        || this.checklist.length === o.checklist?.length && this.checklist.every((t,i) => t===o.checklist?.[i]) )
      && this.locations.length === o.locations.length && this.locations.every((l,i) => l.equals(o.locations[i]))
      && this.commonSamples.length === o.commonSamples.length && this.commonSamples.every((s,i) => s.equals(o.commonSamples[i]))
  }
  override toJSON(_key: string): ISamplingTripTemplate {
    return { id: this.id, name: this.name,
      locations: this.locations.map((l,li) => l.toJSON(li.toString())),
      commonSamples: this.commonSamples.map((s,si) => s.toJSON(si.toString())),
      ...( this.description.trim().length && { description: this.description.trim() } ),
      ...( this.checklist.length && { checklist: Array.from(this.checklist) } ) }
  }
  override deepClone() :SamplingTripTemplate {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingTripTemplate(clone))
    return new SamplingTripTemplate(clone)
  }
  override templateToObject() :SamplingTrip {
    const t = this.deepClone()
    // for locations that have no samples, use commonSamples:
    for (const l of t.locations) if (!l.samples.length) l.samples.push(...t.commonSamples.map(s => s.deepClone()))
    t.commonSamples.length = 0  // no longer needed
    return new SamplingTrip({ id: IdbStorage.newSamplingTripId(), template: t,
      name: this.name, locations: [], checkedTasks: [],
      startTime: timestampNow(), endTime: NO_TIMESTAMP, lastModified: timestampNow() })
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Sampling Trip Template':'trip-temp') }
  override summaryDisplay() :[string,string] {
    return [ this.name, i18n.t('sampling-locations', {count: this.locations.length}) ]
  }
}
