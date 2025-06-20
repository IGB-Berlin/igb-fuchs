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
import { isTimestamp, isTimestampSet, NO_TIMESTAMP, Timestamp, timestampNow, DataObjectTemplate, validateName, validateTimestamp,
  DataObjectWithTemplate, timestampsEqual, isArrayOf, StyleValue } from './common'
import { RawWgs84Coordinates, Wgs84Coordinates, areWgs84CoordsValid, isRawWgs84Coordinates } from './coords'
import { ISample, isISample, isISampleTemplate, ISampleTemplate, Sample, SampleTemplate } from './sample'
import { distanceBearing } from '../geo-func'
import { i18n, tr } from '../i18n'
import { assert } from '../utils'

const MAX_NOM_ACT_DIST_M = 200

export interface ISamplingLocation {
  name :string
  shortDesc ?:string|null
  actualCoords :RawWgs84Coordinates
  startTime :Timestamp|null
  endTime ?:Timestamp|null
  notes ?:string|null
  readonly samples :ISample[]
  /** Which items from `.template.tasklist` have been marked completed. Items in this list that are not in the other are ignored; only exact string matches are considered. */
  readonly completedTasks ?:string[]|null
  readonly photos ?:string[]
  readonly template ?:ISamplingLocationTemplate|null
}
const samplingLocationKeys = ['name','shortDesc','actualCoords','startTime','endTime','notes','samples','completedTasks','photos','template'] as const
type SamplingLocationKey = typeof samplingLocationKeys[number] & keyof ISamplingLocation
export function isISamplingLocation(o :unknown) :o is ISamplingLocation {
  return !!( o && typeof o === 'object'
    && 'name' in o && 'actualCoords' in o && 'startTime' in o && 'samples' in o  // required keys
    && Object.keys(o).every(k => samplingLocationKeys.includes(k as SamplingLocationKey))  // extra keys
    // type checks
    && typeof o.name === 'string' && isRawWgs84Coordinates(o.actualCoords)
    && ( o.startTime===null || isTimestamp(o.startTime) )
    && Array.isArray(o.samples) && o.samples.every(s => isISample(s))
    && ( !('endTime' in o) || o.endTime===null || isTimestamp(o.endTime) )
    && ( !('shortDesc' in o) || o.shortDesc===null || typeof o.shortDesc === 'string' )
    && ( !('notes' in o) || o.notes===null || typeof o.notes === 'string' )
    && ( !('completedTasks' in o) || o.completedTasks===null || Array.isArray(o.completedTasks) && o.completedTasks.every(t => typeof t === 'string') )
    && ( !('photos' in o) || Array.isArray(o.photos) && o.photos.every(p => typeof p === 'string') )
    && ( !('template' in o) || o.template===null || isISamplingLocationTemplate(o.template) )
  )
}

/** Records and actual sampling point. */
export class SamplingLocation extends DataObjectWithTemplate<SamplingLocation, SamplingLocationTemplate> implements ISamplingLocation {
  static readonly sStyle :StyleValue = { isTemplate: false, opposite: null,
    fullTitle: tr('Sampling Location'), briefTitle: tr('Location'),
    cssId: 'location', icon: 'pin-map-fill' }  // alternative icon might be geo-fill
  override get style() { return SamplingLocation.sStyle }
  name :string
  shortDesc :string
  actualCoords :RawWgs84Coordinates
  get actCoords() :Wgs84Coordinates { return new Wgs84Coordinates(this.actualCoords) }
  startTime :Timestamp
  endTime :Timestamp
  notes :string
  readonly samples :Sample[]
  readonly completedTasks :string[]
  /** Pictures taken at this location */
  readonly photos :string[]
  readonly template :SamplingLocationTemplate|null
  constructor(o :ISamplingLocation|null) {
    super()
    this.name = o?.name ?? ''
    this.shortDesc = o && 'shortDesc' in o && o.shortDesc!==null ? o.shortDesc.trim() : ''
    this.actualCoords = o?.actualCoords ?? new Wgs84Coordinates(null)
    this.startTime = isTimestampSet(o?.startTime) ? o.startTime : NO_TIMESTAMP
    this.endTime = isTimestampSet(o?.endTime) ? o.endTime : NO_TIMESTAMP
    this.notes = o && 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.samples = o===null ? [] : isArrayOf(Sample, o.samples) ? o.samples : o.samples.map(s => new Sample(s))
    this.completedTasks = o && 'completedTasks' in o && o.completedTasks ? o.completedTasks : []
    this.photos = o && 'photos' in o ? o.photos : []
    this.template = o && 'template' in o ? ( o.template instanceof SamplingLocationTemplate ? o.template : new SamplingLocationTemplate(o.template) ) : null
  }
  override validate(others :SamplingLocation[]) {
    validateName(this.name)
    this.actCoords.validate([])  // b/c the coords don't have their own Editor
    validateTimestamp(this.startTime)
    if (others.some(o => o.name === this.name))
      throw new Error(`${tr('duplicate-name')}: ${this.name}`)
  }
  override warningsCheck(skipInitWarns :boolean) {
    const rv :string[] = []
    if (!isTimestampSet(this.startTime)) rv.push(tr('No start time'))
    if (isTimestampSet(this.startTime) && isTimestampSet(this.endTime) && this.endTime < this.startTime) rv.push(tr('times-order'))
    if (this.template) {
      if (areWgs84CoordsValid(this.actualCoords) && areWgs84CoordsValid(this.template.nominalCoords)) {
        const distM = distanceBearing(this.actualCoords, this.template.nominalCoords).distKm*1000
        if (distM > MAX_NOM_ACT_DIST_M)
          rv.push(`${tr('large-coord-diff')} (${distM.toFixed(0)}m > ${MAX_NOM_ACT_DIST_M.toFixed(0)}m)`)
      }
    }
    if (!skipInitWarns) {
      if (this.template) {
        let taskCount = 0
        for (const c of this.template.tasklist)
          if (!this.completedTasks.includes(c))
            taskCount++
        if (taskCount) rv.push(i18n.t('task-not-completed', { count: taskCount }))
        if (this.template.samples.length) rv.push(i18n.t('planed-samp-remain', { count: this.template.samples.length }))
      } // else, no template
      else if (!this.samples.length) rv.push(tr('No samples'))
    }
    return rv
  }
  override equals(o :unknown) {
    return isISamplingLocation(o) && this.name === o.name
      && this.shortDesc.trim() === ( o.shortDesc?.trim() ?? '' )
      && this.actCoords.equals(o.actualCoords)
      && timestampsEqual(this.startTime, o.startTime)
      && timestampsEqual(this.endTime, o.endTime)
      && this.notes.trim() === ( o.notes?.trim() ?? '' )
      && this.samples.length === o.samples.length && this.samples.every((s,i) => s.equals(o.samples[i]))
      && ( !o.completedTasks && !this.completedTasks.length
        || this.completedTasks.length === o.completedTasks?.length && this.completedTasks.every((t,i) => t===o.completedTasks?.[i]) )
      && ( !o.photos && !this.photos.length
        || this.photos.length === o.photos?.length && this.photos.every((p,i) => p===o.photos?.[i]) )
    // not comparing template
  }
  override toJSON(_key :string) :ISamplingLocation {
    return { name: this.name,
      actualCoords: this.actCoords.toJSON('actualCoords'),
      startTime: this.startTime,
      samples: this.samples.map((s,si) => s.toJSON(si.toString())),
      ...( isTimestampSet(this.endTime) && { endTime: this.endTime } ),
      ...( this.shortDesc.trim().length && { shortDesc: this.shortDesc.trim() } ),
      ...( this.notes.trim().length && { notes: this.notes.trim() } ),
      ...( this.completedTasks.length && { completedTasks: Array.from(this.completedTasks) } ),
      ...( this.photos.length && { photos: Array.from(this.photos) } ),
      ...( this.template!==null && { template: this.template.toJSON('template') } ) }
  }
  override deepClone() :SamplingLocation {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingLocation(clone))
    return new SamplingLocation(clone)
  }
  override extractTemplate() :SamplingLocationTemplate {
    return new SamplingLocationTemplate({
      name: this.name,
      nominalCoords: this.actCoords.deepClone(),
      samples: this.samples.map(s => s.extractTemplate()),
      ...( this.shortDesc.trim().length && { shortDesc: this.shortDesc.trim() } ),
      ...( this.template?.instructions.trim().length && { instructions: this.template.instructions.trim() } ),
      ...( this.template?.tasklist.length && { tasklist: Array.from(this.template.tasklist) } ) })
  }
  override summaryDisplay() { return locSummary(this) }
}

function locSummary(loc :SamplingLocation|SamplingLocationTemplate) :[string,string] {
  let samp = i18n.t('samples', {count:loc.samples.length})
  if (loc.samples.length===1) {
    const s0 = loc.samples[0]
    assert(s0)
    const ss = s0.summaryDisplay()
    samp = ss[0]+': '+ss[1]
  } else if (!loc.samples.length) samp = ''
  const ts = loc instanceof SamplingLocationTemplate && loc.tasklist.length
    ? i18n.t('tasks', {count:loc.tasklist.length})
    : loc instanceof SamplingLocation && loc.completedTasks.length
      ? i18n.t('comp-tasks', {count:loc.completedTasks.length}) : ''
  return [ loc.name + ( loc.shortDesc.trim().length ? ' / '+loc.shortDesc.trim() : '' ),
    [samp, ts].filter(s => s.length).join('; ')
    /*+'\u2003['+loc.nomCoords.summaryDisplay()[0]+']'*/ ]
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISamplingLocationTemplate {
  name :string
  shortDesc ?:string|null
  instructions ?:string|null
  nominalCoords :RawWgs84Coordinates
  readonly samples :ISampleTemplate[]
  readonly tasklist ?:string[]|null
}
const locationTemplateKeys = ['name','shortDesc','instructions','nominalCoords','samples','tasklist'] as const
type LocationTemplateKey = typeof locationTemplateKeys[number] & keyof ISample
export function isISamplingLocationTemplate(o :unknown) :o is ISamplingLocationTemplate {
  return !!( o && typeof o === 'object'
    && 'name' in o && 'nominalCoords' in o && 'samples' in o  // required keys
    && Object.keys(o).every(k => locationTemplateKeys.includes(k as LocationTemplateKey))  // extra keys
    // type checks
    && typeof o.name === 'string' && isRawWgs84Coordinates(o.nominalCoords)
    && Array.isArray(o.samples) && o.samples.every(s => isISampleTemplate(s))
    && ( !('shortDesc' in o) || o.shortDesc===null || typeof o.shortDesc === 'string' )
    && ( !('instructions' in o) || o.instructions===null || typeof o.instructions === 'string' )
    && ( !('tasklist' in o) || o.tasklist===null || Array.isArray(o.tasklist) && o.tasklist.every(c => typeof c === 'string') )
  )
}

export class SamplingLocationTemplate extends DataObjectTemplate<SamplingLocationTemplate, SamplingLocation> implements ISamplingLocationTemplate {
  static readonly sStyle :StyleValue = { isTemplate: true, opposite: SamplingLocation.sStyle,
    fullTitle: tr('Sampling Location Template'), briefTitle: tr('loc-temp'),
    cssId: 'loc-temp', icon: 'pin-map' }
  static { SamplingLocation.sStyle.opposite = this.sStyle }
  override get style() { return SamplingLocationTemplate.sStyle }
  name :string
  shortDesc :string
  instructions :string
  nominalCoords :RawWgs84Coordinates
  get nomCoords() :Wgs84Coordinates { return new Wgs84Coordinates(this.nominalCoords) }
  /** The typical samples taken at this location. */
  readonly samples :SampleTemplate[]
  readonly tasklist :string[]
  constructor(o :ISamplingLocationTemplate|null) {
    super()
    this.name = o?.name ?? ''
    this.shortDesc = o && 'shortDesc' in o && o.shortDesc!==null ? o.shortDesc.trim() : ''
    this.instructions = o && 'instructions' in o && o.instructions!==null ? o.instructions : ''
    this.nominalCoords = o?.nominalCoords ?? new Wgs84Coordinates(null)
    this.samples = o===null ? [] : isArrayOf(SampleTemplate, o.samples) ? o.samples : o.samples.map(s => new SampleTemplate(s))
    this.tasklist = o && 'tasklist' in o && o.tasklist ? o.tasklist : []
  }
  override validate(others :SamplingLocationTemplate[]) {
    validateName(this.name)
    this.nomCoords.validate([])  // b/c the coords don't have their own Editor
    if (others.some(o => o.name === this.name))
      throw new Error(`${tr('duplicate-name')}: ${this.name}`)
  }
  override warningsCheck(_skipInitWarns :boolean) {
    const rv :string[] = []
    const ts = this.tasklist.map(c => c.trim())
    if ( new Set(ts).size !== ts.length ) rv.push(tr('tasklist-duplicates'))
    if ( ts.some(t => !t.length) ) rv.push(tr('tasklist-empty-lines'))
    // temporarily disabled (see GH issue #13): if (!skipInitWarns && !this.samples.length) rv.push(tr('No samples'))
    return rv
  }
  override equals(o: unknown) {
    return isISamplingLocationTemplate(o) && this.name===o.name
      && this.shortDesc.trim() === ( o.shortDesc?.trim() ?? '' )
      && this.instructions.trim() === (o.instructions?.trim() ?? '')
      && this.nomCoords.equals(o.nominalCoords)
      && this.samples.length === o.samples.length && this.samples.every((s,i) => s.equals(o.samples[i]))
      && ( !o.tasklist && !this.tasklist.length
        || this.tasklist.length === o.tasklist?.length && this.tasklist.every((t,i) => t===o.tasklist?.[i]) )
  }
  override toJSON(_key: string): ISamplingLocationTemplate {
    return { name: this.name, nominalCoords: this.nomCoords.toJSON('nominalCoords'),
      samples: this.samples.map((s,si) => s.toJSON(si.toString())),
      ...( this.shortDesc.trim().length && { shortDesc: this.shortDesc.trim() } ),
      ...( this.instructions.trim().length && { instructions: this.instructions.trim() } ),
      ...( this.tasklist.length && { tasklist: Array.from(this.tasklist) } ) }
  }
  override deepClone() :SamplingLocationTemplate {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingLocationTemplate(clone))
    return new SamplingLocationTemplate(clone)
  }
  override templateToObject() :SamplingLocation {
    return new SamplingLocation({ template: this.deepClone(), name: this.name,
      shortDesc: this.shortDesc, actualCoords: this.nomCoords.deepClone(),
      startTime: timestampNow(), samples: [], completedTasks: [], photos: [] })
  }
  override summaryDisplay() { return locSummary(this) }
  cloneNoSamples() :SamplingLocationTemplate {
    const clone = this.deepClone()
    clone.samples.length = 0
    clone.tasklist.length = 0  // treat tasks like samples
    return clone
  }
}
