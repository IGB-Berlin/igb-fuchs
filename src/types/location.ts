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
  DataObjectWithTemplate, timestampsEqual, isArrayOf } from './common'
import { ISample, isISample, isISampleTemplate, ISampleTemplate, Sample, SampleTemplate } from './sample'
import { IWgs84Coordinates, Wgs84Coordinates, isIWgs84Coordinates } from './coords'
import { distanceBearing } from '../geo-func'
import { dataSetsEqual } from './set'
import { assert } from '../utils'
import { i18n, tr } from '../i18n'

const MAX_NOM_ACT_DIST_M = 200

export interface ISamplingLocation {
  name :string
  nominalCoords :IWgs84Coordinates
  actualCoords :IWgs84Coordinates
  startTime :Timestamp
  endTime :Timestamp
  notes ?:string|null
  readonly samples :ISample[]
  readonly photos ?:string[]
  readonly template ?:ISamplingLocationTemplate|null
}
const samplingLocationKeys = ['name','nominalCoords','actualCoords','startTime','endTime','notes','samples','photos','template'] as const
type SamplingLocationKey = typeof samplingLocationKeys[number] & keyof ISamplingLocation
export function isISamplingLocation(o :unknown) :o is ISamplingLocation {
  return !!( o && typeof o === 'object'
    && 'name' in o && 'nominalCoords' in o && 'actualCoords' in o && 'startTime' in o && 'endTime' in o && 'samples' in o  // required keys
    && Object.keys(o).every(k => samplingLocationKeys.includes(k as SamplingLocationKey))  // extra keys
    // type checks
    && typeof o.name === 'string' && isIWgs84Coordinates(o.nominalCoords) && isIWgs84Coordinates(o.actualCoords)
    && isTimestamp(o.startTime) && isTimestamp(o.endTime)
    && Array.isArray(o.samples) && o.samples.every(s => isISample(s))
    && ( !('notes' in o) || o.notes===null || typeof o.notes === 'string' )
    && ( !('photos' in o) || Array.isArray(o.photos) && o.photos.every(p => typeof p === 'string') )
    && ( !('template' in o) || o.template===null || isISamplingLocationTemplate(o.template) )
  )
}

/** Records and actual sampling point. */
export class SamplingLocation extends DataObjectWithTemplate<SamplingLocation, SamplingLocationTemplate> implements ISamplingLocation {
  name :string
  nominalCoords :IWgs84Coordinates
  get nomCoords() :Wgs84Coordinates { return new Wgs84Coordinates(this.nominalCoords) }
  /** If the actual sample was taken at a slightly different location from the nominal location. */
  actualCoords :IWgs84Coordinates
  get actCoords() :Wgs84Coordinates { return new Wgs84Coordinates(this.actualCoords) }
  startTime :Timestamp
  endTime :Timestamp
  notes :string
  readonly samples :Sample[]
  /** Pictures taken at this location - TODO Later: how to represent as JSON? Filenames? */
  readonly photos :string[]
  readonly template :SamplingLocationTemplate|null
  constructor(o :ISamplingLocation|null) {
    super()
    this.name = o?.name ?? ''
    this.nominalCoords = o?.nominalCoords ?? new Wgs84Coordinates(null).toJSON('nominalCoords')
    this.actualCoords = o?.actualCoords ?? new Wgs84Coordinates(null).toJSON('actualCoords')
    this.startTime = o?.startTime ?? NO_TIMESTAMP
    this.endTime = o?.endTime ?? NO_TIMESTAMP
    this.notes = o && 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.samples = o===null ? [] : isArrayOf(Sample, o.samples) ? o.samples : o.samples.map(s => new Sample(s))
    this.photos = o && 'photos' in o ? o.photos : []
    this.template = o && 'template' in o ? ( o.template instanceof SamplingLocationTemplate ? o.template : new SamplingLocationTemplate(o.template) ) : null
  }
  override validate(others :SamplingLocation[]) {
    validateName(this.name)
    this.nomCoords.validate([])  // b/c the coords don't have their own Editor
    this.actCoords.validate([])
    validateTimestamp(this.startTime)
    validateTimestamp(this.endTime)
    //TODO: All duplicates checks shouldn't just be run on their parents, but on the global templates too - and be case insensitive!
    if (others.some(o => o.name === this.name))
      throw new Error(`${tr('duplicate-name')}: ${this.name}`)
  }
  override warningsCheck(isBrandNew :boolean) {
    const rv :string[] = []
    if (!isTimestampSet(this.startTime)) rv.push(tr('No start time'))
    if (!isTimestampSet(this.endTime)) rv.push(tr('No end time'))
    if (isTimestampSet(this.startTime) && isTimestampSet(this.endTime) && this.endTime < this.startTime) rv.push(tr('times-order'))
    if (!isBrandNew && !this.samples.length) rv.push(tr('No samples'))
    const distM = distanceBearing(this.actualCoords, this.nominalCoords).distKm*1000
    if (distM > MAX_NOM_ACT_DIST_M)
      rv.push(`${tr('large-coord-diff')} (${distM.toFixed(0)}m > ${MAX_NOM_ACT_DIST_M.toFixed(0)}m)`)
    return rv
  }
  override equals(o :unknown) {
    return isISamplingLocation(o)
      && this.name === o.name
      && this.nomCoords.equals(o.nominalCoords)
      && this.actCoords.equals(o.actualCoords)
      && timestampsEqual(this.startTime, o.startTime)
      && timestampsEqual(this.endTime, o.endTime)
      && this.notes.trim() === ( o.notes?.trim() ?? '' )
      // not comparing photos (?)
      && dataSetsEqual(this.samples, o.samples.map(s => new Sample(s)))
      // not comparing template
  }
  override toJSON(_key :string) :ISamplingLocation {
    return { name: this.name,
      nominalCoords: this.nominalCoords, actualCoords: this.actualCoords,
      startTime: this.startTime, endTime: this.endTime,
      samples: this.samples.map((s,si) => s.toJSON(si.toString())),
      ...( this.notes.trim().length && { notes: this.notes.trim() } ),
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
      name: this.name, nominalCoords: this.nominalCoords,
      samples: this.samples.map(s => s.extractTemplate()),
      ...( this.template?.description.trim().length && { description: this.template.description } ) })
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Sampling Location':'Location') }
  override summaryDisplay() { return locSummary(this) }
}

function locSummary(loc :SamplingLocation|SamplingLocationTemplate) :[string,string] {
  let samp = i18n.t('samples', {count:loc.samples.length})
  if (loc.samples.length===1) {
    const s0 = loc.samples[0]
    assert(s0)
    const ss = s0.summaryDisplay()
    samp = ss[0]+': '+ss[1]
  }
  return [ loc.name, samp /*+'\u2003['+loc.nomCoords.summaryDisplay()[0]+']'*/ ]
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISamplingLocationTemplate {
  name :string
  description ?:string|null
  nominalCoords :IWgs84Coordinates
  readonly samples :ISampleTemplate[]
}
export function isISamplingLocationTemplate(o :unknown) :o is ISamplingLocationTemplate {
  return !!( o && typeof o === 'object'
    && 'name' in o && 'nominalCoords' in o && 'samples' in o // keys
    && ( Object.keys(o).length===3 || Object.keys(o).length===4 && 'description' in o )
    // type checks
    && typeof o.name === 'string' && isIWgs84Coordinates(o.nominalCoords)
    && Array.isArray(o.samples) && o.samples.every(s => isISampleTemplate(s))
    && ( !('description' in o) || o.description===null || typeof o.description === 'string' )
  )
}

export class SamplingLocationTemplate extends DataObjectTemplate<SamplingLocationTemplate, SamplingLocation> implements ISamplingLocationTemplate {
  name :string
  description :string
  nominalCoords :IWgs84Coordinates
  get nomCoords() :Wgs84Coordinates { return new Wgs84Coordinates(this.nominalCoords) }
  /** The typical samples taken at this location. */
  readonly samples :SampleTemplate[]
  constructor(o :ISamplingLocationTemplate|null) {
    super()
    this.name = o?.name ?? ''
    this.description = o && 'description' in o && o.description!==null ? o.description : ''
    this.nominalCoords = o?.nominalCoords ?? new Wgs84Coordinates(null).toJSON('nominalCoords')
    this.samples = o===null ? [] : isArrayOf(SampleTemplate, o.samples) ? o.samples : o.samples.map(s => new SampleTemplate(s))
  }
  override validate(others :SamplingLocationTemplate[]) {
    validateName(this.name)
    this.nomCoords.validate([])
    if (others.some(o => o.name === this.name))
      throw new Error(`${tr('duplicate-name')}: ${this.name}`)
  }
  override warningsCheck(isBrandNew :boolean) {
    const rv :string[] = []
    //TODO Later: The "No Samples" warning is a little annoying if building a Trip with commonSamples
    if (!isBrandNew && !this.samples.length) rv.push(tr('No samples'))
    return rv
  }
  override equals(o: unknown) {
    return isISamplingLocationTemplate(o)
      && this.name===o.name
      && this.description.trim() === (o.description?.trim() ?? '')
      && this.nomCoords.equals(o.nominalCoords)
      && dataSetsEqual(this.samples, o.samples.map(s => new SampleTemplate(s)))
  }
  override toJSON(_key: string): ISamplingLocationTemplate {
    return {
      name: this.name, nominalCoords: this.nominalCoords,
      samples: this.samples.map((s,si) => s.toJSON(si.toString())),
      ...( this.description.trim().length && { description: this.description.trim() } ) }
  }
  override deepClone() :SamplingLocationTemplate {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingLocationTemplate(clone))
    return new SamplingLocationTemplate(clone)
  }
  override templateToObject() :SamplingLocation {
    return new SamplingLocation({ template: this.deepClone(), name: this.name,
      nominalCoords: this.nominalCoords, actualCoords: this.nominalCoords,
      startTime: timestampNow(), endTime: NO_TIMESTAMP, samples: [], photos: [] })
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Sampling Location Template':'loc-temp') }
  override summaryDisplay() { return locSummary(this) }
  cloneNoSamples() :SamplingLocationTemplate {
    const clone = this.deepClone()
    clone.samples.length = 0
    return clone
  }
}
