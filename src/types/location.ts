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
import { isTimestamp, isTimestampSet, NO_TIMESTAMP, Timestamp, timestampNow, DataObjectTemplate, dataSetsEqual, validateName, validateTimestamp, DataObjectWithTemplate } from './common'
import { ISample, isISample, isISampleTemplate, ISampleTemplate, Sample, SampleTemplate } from './sample'
import { IWgs84Coordinates, Wgs84Coordinates, isIWgs84Coordinates } from './coords'
import { distanceBearing } from '../geo-func'
import { assert } from '../utils'
import { tr } from '../i18n'

const MAX_NOM_ACT_DIST_M = 200

export interface ISamplingLocation {
  name :string
  description ?:string|null
  nominalCoords :IWgs84Coordinates
  actualCoords :IWgs84Coordinates
  startTime :Timestamp
  endTime :Timestamp
  samples :ISample[]
  notes ?:string|null
  photos ?:string[]
}
const samplingLocationKeys = ['name','description','nominalCoords','actualCoords','startTime','endTime','samples','notes','photos'] as const
type SamplingLocationKey = typeof samplingLocationKeys[number] & keyof ISamplingLocation
export function isISamplingLocation(o :unknown) :o is ISamplingLocation {
  if (!o || typeof o !== 'object') return false
  if (!('name' in o && 'nominalCoords' in o && 'actualCoords' in o && 'startTime' in o && 'endTime' in o && 'samples' in o)) return false  // required keys
  for (const k of Object.keys(o)) if (!samplingLocationKeys.includes(k as SamplingLocationKey)) return false  // extra keys
  // type checks
  if (typeof o.name !== 'string' || !isIWgs84Coordinates(o.nominalCoords) || !isIWgs84Coordinates(o.actualCoords)
    || !isTimestamp(o.startTime) || !isTimestamp(o.endTime) || !Array.isArray(o.samples)) return false
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
export class SamplingLocation extends DataObjectWithTemplate<SamplingLocation, SamplingLocationTemplate> implements ISamplingLocation {
  name :string
  description :string
  nominalCoords :IWgs84Coordinates
  get nomCoords() :Wgs84Coordinates { return new Wgs84Coordinates(this.nominalCoords) }
  /** If the actual sample was taken at a slightly different location from the nominal location. */
  actualCoords :IWgs84Coordinates
  get actCoords() :Wgs84Coordinates { return new Wgs84Coordinates(this.actualCoords) }
  startTime :Timestamp
  endTime :Timestamp
  samples :Sample[]
  notes :string
  /** Pictures taken at this location - TODO Later: how to represent as JSON? Filenames? */
  photos :string[]
  readonly template :SamplingLocationTemplate|null
  constructor(o :ISamplingLocation, template :SamplingLocationTemplate|null) {
    super()
    this.name = o.name
    this.description = 'description' in o && o.description!==null ? o.description.trim() : ''
    this.nominalCoords = o.nominalCoords
    this.actualCoords = o.actualCoords
    this.startTime = o.startTime
    this.endTime = o.endTime
    this.samples = o.samples.map(s => new Sample(s, null))
    this.notes = 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.photos = 'photos' in o ? o.photos : []
    this.template = template
    this.validate()
  }
  override validate() {
    validateName(this.name)
    validateTimestamp(this.startTime)
    validateTimestamp(this.endTime)
  }
  override warningsCheck() {
    const rv :string[] = []
    if (!isTimestampSet(this.startTime)) rv.push(tr('No start time'))
    if (!isTimestampSet(this.endTime)) rv.push(tr('No end time'))
    if (this.samples.length) rv.push(tr('No samples'))
    const distM = distanceBearing(this.actualCoords, this.nominalCoords).distKm*1000
    if (distM > MAX_NOM_ACT_DIST_M)
      rv.push(`${tr('large-coord-diff')} (${distM.toFixed(0)}m>${MAX_NOM_ACT_DIST_M.toFixed(0)}m)`)
    return rv.concat( this.samples.flatMap(s => s.warningsCheck()) )
  }
  override summaryDisplay() :[string,string] {
    return [ this.name, this.actCoords.summaryDisplay()[0] ] }
  override equals(o :unknown) {
    return isISamplingLocation(o) && this.name===o.name && this.description.trim()===o.description?.trim()
      && this.nomCoords.equals(o.nominalCoords) && this.actCoords.equals(o.actualCoords)
      && this.startTime===o.startTime && this.endTime===o.endTime && this.notes===o.notes
      && dataSetsEqual(this.samples, o.samples.map(s => new Sample(s, null)))
  }
  override toJSON(_key :string) :ISamplingLocation {
    const rv :ISamplingLocation = { name: this.name,
      nominalCoords: this.nominalCoords, actualCoords: this.actualCoords,
      startTime: this.startTime, endTime: this.endTime,
      samples: this.samples.map((s,si) => s.toJSON(si.toString())) }
    if (this.description.trim().length) rv.description = this.description
    if (this.notes.trim().length) rv.notes = this.notes
    if (this.photos.length) rv.photos = this.photos
    return rv
  }
  override extractTemplate() :SamplingLocationTemplate {
    return new SamplingLocationTemplate({
      name: this.name, description: this.description.trim(), nominalCoords: this.nominalCoords,
      samples: this.samples.map(s => s.extractTemplate()) })
  }
  override deepClone() :SamplingLocation {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingLocation(clone))
    return new SamplingLocation(clone, this.template)
  }
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISamplingLocationTemplate {
  name :string
  description ?:string|null
  nominalCoords :IWgs84Coordinates
  samples :ISampleTemplate[]
}
const samplingLocationTemplateKeys = ['name','description','nominalCoords','samples'] as const
type SamplingLocationTemplateKey = typeof samplingLocationTemplateKeys[number] & keyof ISamplingLocationTemplate
export function isISamplingLocationTemplate(o :unknown) :o is ISamplingLocationTemplate {
  if (!o || typeof o !== 'object') return false
  if (!('name' in o && 'nominalCoords' in o && 'samples' in o)) return false  // required keys
  for (const k of Object.keys(o)) if (!samplingLocationTemplateKeys.includes(k as SamplingLocationTemplateKey)) return false  // extra keys
  // type checks
  if (typeof o.name !== 'string' || !isIWgs84Coordinates(o.nominalCoords) || !Array.isArray(o.samples)) return false
  for (const s of o.samples) if (!isISampleTemplate(s)) return false
  if ('description' in o && !( o.description===null || typeof o.description === 'string' )) return false
  return true
}
export function isISamplingLocationTemplateArray(a :unknown) :a is ISamplingLocationTemplate[] {
  return Array.isArray(a) && a.every(o => isISamplingLocationTemplate(o)) }

export class SamplingLocationTemplate extends DataObjectTemplate<SamplingLocationTemplate, SamplingLocation> implements ISamplingLocationTemplate {
  name :string
  description :string
  nominalCoords :IWgs84Coordinates
  get nomCoords() :Wgs84Coordinates { return new Wgs84Coordinates(this.nominalCoords) }
  /** The typical samples taken at this location. */
  samples :SampleTemplate[]
  constructor(o :ISamplingLocationTemplate) {
    super()
    this.name = o.name
    this.description = 'description' in o && o.description!==null ? o.description : ''
    this.nominalCoords = o.nominalCoords
    this.samples = o.samples.map(s => new SampleTemplate(s))
    this.validate()
  }
  override validate() { validateName(this.name) }
  override warningsCheck() { return [] }
  override summaryDisplay() :[string,string] {
    return [ this.name, this.nomCoords.summaryDisplay()[0] ] }
  override equals(o: unknown) {
    return isISamplingLocationTemplate(o) && this.name===o.name && this.description.trim()===o.description?.trim()
      && this.nomCoords.equals(o.nominalCoords)
      && dataSetsEqual(this.samples, o.samples.map(s => new SampleTemplate(s)))
  }
  override toJSON(_key: string): ISamplingLocationTemplate {
    const rv :ISamplingLocationTemplate = {
      name: this.name, nominalCoords: this.nominalCoords,
      samples: this.samples.map((s,si) => s.toJSON(si.toString())) }
    if (this.description.trim().length) rv.description = this.description.trim()
    return rv
  }
  override templateToObject(actualCoords :IWgs84Coordinates|null, startNow :boolean) :SamplingLocation {
    const rv :ISamplingLocation = { name: this.name,
      nominalCoords: this.nominalCoords, actualCoords: actualCoords ?? this.nominalCoords,
      startTime: startNow ? timestampNow() : NO_TIMESTAMP, endTime: NO_TIMESTAMP, samples: [] }
    if (this.description.trim().length) rv.description = this.description.trim()
    return new SamplingLocation(rv, this)
  }
  override deepClone() :SamplingLocationTemplate {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISamplingLocationTemplate(clone))
    return new SamplingLocationTemplate(clone)
  }
}
