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
import { IdbStorage } from '../idb-store'
import { dataSetsEqual } from './set'
import { i18n, tr } from '../i18n'
import { assert } from '../utils'

export interface ISamplingLog extends HasId {
  //TODO Later: Would be good if a log knew whether it has been exported or not, to warn users both of unexported data but also making changes to already exported data
  readonly id :string
  name :string
  startTime :Timestamp
  endTime :Timestamp
  lastModified ?:Timestamp|null
  persons ?:string|null
  weather ?:string|null
  notes ?:string|null
  /** Which items from `.template.checklist` have been checked. Items in this list that are not in the other are ignored; only exact string matches are considered. */
  readonly checkedTasks ?:string[]|null
  readonly locations :ISamplingLocation[]
  readonly template ?:ISamplingProcedure|null
}
const samplingLogKeys = ['id','name','startTime','endTime','lastModified','persons','weather','notes','checkedTasks','locations','template'] as const
type SamplingLogKey = typeof samplingLogKeys[number] & keyof ISamplingLog
export function isISamplingLog(o :unknown) :o is ISamplingLog {
  return !!( o && typeof o === 'object'
    && 'id' in o && 'name' in o && 'startTime' in o && 'endTime' in o && 'locations' in o  // required keys
    && Object.keys(o).every(k => samplingLogKeys.includes(k as SamplingLogKey))  // extra keys
    // type checks
    && typeof o.id === 'string' && typeof o.name === 'string' && isTimestamp(o.startTime) && isTimestamp(o.endTime)
    && Array.isArray(o.locations) && o.locations.every(l => isISamplingLocation(l))
    && ( !('lastModified' in o) || o.lastModified===null || isTimestamp(o.lastModified) )
    && ( !('persons' in o) || o.persons===null || typeof o.persons === 'string' )
    && ( !('weather' in o) || o.weather===null || typeof o.weather === 'string' )
    && ( !('notes' in o) || o.notes===null || typeof o.notes === 'string' )
    && ( !('checkedTasks' in o) || o.checkedTasks===null || Array.isArray(o.checkedTasks) && o.checkedTasks.every(t => typeof t === 'string') )
    && ( !('template' in o) || o.template===null || isISamplingProcedure(o.template) )
  )
}
/* TODO Later: For the future, when this project is released and changes happen to the schema,
 * there should be a Migrator class that upgrades/converts older objects to newer ones. */

export class SamplingLog extends DataObjectWithTemplate<SamplingLog, SamplingProcedure> implements ISamplingLog {
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
  readonly template :SamplingProcedure|null
  constructor(o :ISamplingLog|null) {
    super()
    this.id = o===null ? IdbStorage.newSamplingLogId() : o.id
    this.name = o?.name ?? ''
    this.startTime = o?.startTime ?? NO_TIMESTAMP
    this.endTime = o?.endTime ?? NO_TIMESTAMP
    this.lastModified = o && 'lastModified' in o && o.lastModified!==null && isTimestampSet(o.lastModified) ? o.lastModified : timestampNow()
    this.persons = o && 'persons' in o && o.persons!==null ? o.persons.trim() : ''
    this.weather = o && 'weather' in o && o.weather!==null ? o.weather.trim() : ''
    this.notes = o && 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.checkedTasks = o && 'checkedTasks' in o && o.checkedTasks ? o.checkedTasks : []
    this.locations = o===null ? [] : isArrayOf(SamplingLocation, o.locations) ? o.locations : o.locations.map(l => new SamplingLocation(l))
    this.template = o && 'template' in o ? ( o.template instanceof SamplingProcedure ? o.template : new SamplingProcedure(o.template) ) : null
  }
  override validate(others :SamplingLog[]) {
    validateId(this.id)
    validateName(this.name)
    validateTimestamp(this.startTime)
    validateTimestamp(this.endTime)
    validateTimestamp(this.lastModified)
    if (others.some(o => o.logId === this.logId))
      throw new Error(tr('duplicate-log-id'))
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
    return isISamplingLog(o)
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
  override toJSON(_key: string): ISamplingLog {
    return { id: this.id, name: this.name, startTime: this.startTime, endTime: this.endTime,
      locations: this.locations.map((l,li) => l.toJSON(li.toString())),
      ...( isTimestampSet(this.lastModified) && { lastModified: this.lastModified } ),
      ...( this.persons.trim().length && { persons: this.persons.trim() } ),
      ...( this.weather.trim().length && { weather: this.weather.trim() } ),
      ...( this.checkedTasks.length && { checkedTasks: Array.from(this.checkedTasks) } ),
      ...( this.notes.trim().length && { notes: this.notes.trim() } ),
      ...( this.template!==null && { template: this.template.toJSON('template') } ) }
  }
  override deepClone() :SamplingLog {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingLog(clone))
    return new SamplingLog(clone)
  }
  override extractTemplate() :SamplingProcedure {
    /* If all location templates have the same set of samples, then we
     * can deduplicate them into the Procedure's `commonSamples`. */
    const locTemps = this.locations.map(l => l.extractTemplate())
    const l0 = locTemps[0]
    const allLocsHaveSameSamples =
      l0 && locTemps.slice(1).every( l => dataSetsEqual( l0.samples, l.samples ) )
    const commonSamples = allLocsHaveSameSamples ? Array.from(l0.samples) : []
    if (allLocsHaveSameSamples) locTemps.forEach(l => l.samples.length = 0)
    return new SamplingProcedure({ id: IdbStorage.newSamplingProcedureId(),
      name: this.name, locations: locTemps, commonSamples: commonSamples,
      ...( this.template?.instructions.trim().length && { instructions: this.template.instructions.trim() } ),
      ...( this.template?.checklist.length && { checklist: Array.from(this.template.checklist) } ) })
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Sampling Log':'Log') }
  override summaryDisplay() :[string,string] {
    const dt = isTimestampSet(this.startTime) ? new Date(this.startTime).toLocaleDateString()+'; ' : ''
    return [ this.name, dt+i18n.t('sampling-locations', {count: this.locations.length})]
  }
  get logId() :string {
    const n = this.name.trim().length ? this.name : '?'  // paranoia
    if (isTimestampSet(this.startTime)) {
      const dt = new Date(this.startTime)
      return `${n} [${dt.getFullYear().toString().padStart(4,'0')}-${(dt.getMonth()+1).toString().padStart(2,'0')}-${dt.getDate().toString().padStart(2,'0')}]`
    } else return n
  }
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISamplingProcedure extends HasId {
  readonly id :string
  name :string
  instructions ?:string|null
  readonly checklist ?:string[]|null
  readonly locations :ISamplingLocationTemplate[]
  readonly commonSamples :ISampleTemplate[]
}
const samplingProcedureKeys = ['id','name','instructions','checklist','locations','commonSamples'] as const
type SamplingProcedureKey = typeof samplingProcedureKeys[number] & keyof ISamplingProcedure
export function isISamplingProcedure(o :unknown) :o is ISamplingProcedure {
  return !!( o && typeof o === 'object'
    && 'id' in o && 'name' in o && 'locations' in o && 'commonSamples' in o  // required keys
    && Object.keys(o).every(k => samplingProcedureKeys.includes(k as SamplingProcedureKey))  // extra keys
    // type checks
    && typeof o.id === 'string' && typeof o.name === 'string'
    && Array.isArray(o.locations) && o.locations.every(l => isISamplingLocationTemplate(l))
    && Array.isArray(o.commonSamples) && o.commonSamples.every(s => isISampleTemplate(s))
    && ( !('instructions' in o) || o.instructions===null || typeof o.instructions === 'string' )
    && ( !('checklist' in o) || o.checklist===null || Array.isArray(o.checklist) && o.checklist.every(c => typeof c === 'string') )
  )
}

export class SamplingProcedure extends DataObjectTemplate<SamplingProcedure, SamplingLog> implements ISamplingProcedure {
  readonly id :string
  name :string
  instructions :string
  readonly checklist :string[]
  /** The typical sampling locations in this procedure. */
  readonly locations :SamplingLocationTemplate[]
  /** This array is used when the location template's samples array is empty. */
  readonly commonSamples :SampleTemplate[]
  constructor(o :ISamplingProcedure|null) {
    super()
    this.id = o===null ? IdbStorage.newSamplingProcedureId() : o.id
    this.name = o?.name ?? ''
    this.instructions = o && 'instructions' in o && o.instructions!==null ? o.instructions.trim() : ''
    this.checklist = o && 'checklist' in o && o.checklist ? o.checklist : []
    this.locations = o===null ? [] : isArrayOf(SamplingLocationTemplate, o.locations) ? o.locations :o.locations.map(l => new SamplingLocationTemplate(l))
    this.commonSamples = o===null ? [] : isArrayOf(SampleTemplate, o.commonSamples) ? o.commonSamples : o.commonSamples.map(s => new SampleTemplate(s))
  }
  override validate(others :SamplingProcedure[]) {
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
    if (!skipInitWarns && !this.locations.length) rv.push(tr('no-samp-log-loc'))
    return rv
  }
  override equals(o: unknown) {
    return isISamplingProcedure(o)
      // not comparing id
      && this.name === o.name
      && this.instructions.trim() === ( o.instructions?.trim() ?? '' )
      && ( !o.checklist && !this.checklist.length
        || this.checklist.length === o.checklist?.length && this.checklist.every((t,i) => t===o.checklist?.[i]) )
      && this.locations.length === o.locations.length && this.locations.every((l,i) => l.equals(o.locations[i]))
      && this.commonSamples.length === o.commonSamples.length && this.commonSamples.every((s,i) => s.equals(o.commonSamples[i]))
  }
  override toJSON(_key: string): ISamplingProcedure {
    return { id: this.id, name: this.name,
      locations: this.locations.map((l,li) => l.toJSON(li.toString())),
      commonSamples: this.commonSamples.map((s,si) => s.toJSON(si.toString())),
      ...( this.instructions.trim().length && { instructions: this.instructions.trim() } ),
      ...( this.checklist.length && { checklist: Array.from(this.checklist) } ) }
  }
  override deepClone() :SamplingProcedure {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingProcedure(clone))
    return new SamplingProcedure(clone)
  }
  override templateToObject() :SamplingLog {
    const t = this.deepClone()
    // for locations that have no samples, use commonSamples:
    for (const l of t.locations) if (!l.samples.length) l.samples.push(...t.commonSamples.map(s => s.deepClone()))
    t.commonSamples.length = 0  // no longer needed
    return new SamplingLog({ id: IdbStorage.newSamplingLogId(), template: t,
      name: this.name, locations: [], checkedTasks: [],
      startTime: timestampNow(), endTime: NO_TIMESTAMP, lastModified: timestampNow() })
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Sampling Procedure':'Procedure') }
  override summaryDisplay() :[string,string] {
    return [ this.name, i18n.t('sampling-locations', {count: this.locations.length}) ]
  }
}