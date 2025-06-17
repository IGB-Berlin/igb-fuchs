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
import { IMeasurementType, isIMeasurementType, MeasurementType, IMeasurement, isIMeasurement, Measurement } from './measurement'
import { DataObjectTemplate, DataObjectWithTemplate, isArrayOf, StyleValue } from './common'
import { i18n, tr } from '../i18n'
import { assert } from '../utils'

export const sampleTypes = ['undefined',  // Remember to keep in sync with translations 'st-*' !
  'surface-water', 'surface-water-flowing', 'surface-water-standing', 'ground-water', 'water-precipitation',
  'sediment', 'soil', 'vegetation', 'organism', 'fish', 'insect', 'data-logger', 'probe', 'other'
] as const
type SampleType = typeof sampleTypes[number]
export function isSampleType(v :unknown) :v is SampleType {
  return typeof v==='string' && sampleTypes.includes(v as SampleType) }

//TODO Later: "Subjective quality" maybe there's a better term b/c some ppl use it for completed tasks (also perhaps rename "Good" to indicate "Success")
export const qualityFlags = ['undefined',  // Remember to keep in sync with translations 'qf-*' !
  'good', 'questionable', 'bad'] as const
export type QualityFlag = typeof qualityFlags[number]
export function isQualityFlag(v :unknown) :v is QualityFlag {
  return typeof v==='string' && qualityFlags.includes(v as QualityFlag) }

export interface ISample {
  type :SampleType
  shortDesc ?:string|null
  subjectiveQuality :QualityFlag
  notes ?:string|null
  readonly measurements :IMeasurement[]
  readonly template ?:ISampleTemplate|null
}
const sampleKeys = ['type','shortDesc','subjectiveQuality','notes','measurements','template'] as const
type SampleKey = typeof sampleKeys[number] & keyof ISample
export function isISample(o :unknown) :o is ISample {
  return !!( o && typeof o === 'object'
    && 'type' in o && 'subjectiveQuality' in o && 'measurements' in o  // required keys
    && Object.keys(o).every(k => sampleKeys.includes(k as SampleKey))  // extra keys
    // type checks
    && isSampleType(o.type) && isQualityFlag(o.subjectiveQuality)
    && Array.isArray(o.measurements) && o.measurements.every(m => isIMeasurement(m))
    && ( !('shortDesc' in o) || o.shortDesc===null || typeof o.shortDesc === 'string' )
    && ( !('notes' in o) || o.notes===null || typeof o.notes === 'string' )
    && ( !('template' in o) || o.template===null || isISampleTemplate(o.template) )
  )
}

/** Records an actual sample taken. */
export class Sample extends DataObjectWithTemplate<Sample, SampleTemplate> implements ISample {
  static readonly sStyle :StyleValue = { isTemplate: false, opposite: null,
    fullTitle: tr('Sample'), briefTitle: tr('Sample'),
    cssId: 'sample', icon: 'droplet-fill' }  // alternative icon might be eyedropper
  override get style() { return Sample.sStyle }
  type :SampleType
  shortDesc :string
  subjectiveQuality :QualityFlag
  notes :string
  readonly measurements :Measurement[]
  readonly template :SampleTemplate|null
  constructor(o :ISample|null) {
    super()
    this.type = o?.type ?? 'undefined'
    this.shortDesc = o && 'shortDesc' in o && o.shortDesc!==null ? o.shortDesc.trim() : ''
    this.subjectiveQuality = o?.subjectiveQuality ?? 'undefined'
    this.measurements = o===null ? [] : isArrayOf(Measurement, o.measurements) ? o.measurements : o.measurements.map(m => new Measurement(m))
    this.notes = o && 'notes' in o && o.notes!==null ? o.notes.trim() : ''
    this.template = o && 'template' in o ? ( o.template instanceof SampleTemplate ? o.template : new SampleTemplate(o.template) ) :null
  }
  override validate(_others :Sample[]) {
    if (!isSampleType(this.type)) throw new Error(`${tr('Invalid sample type')} '${String(this.type)}'`)
    if (!isQualityFlag(this.subjectiveQuality)) throw new Error(`${tr('Invalid quality')} '${String(this.subjectiveQuality)}'`)
  }
  override warningsCheck(skipInitWarns :boolean) {
    const rv :string[] = []
    if (!this.type.length || this.type==='undefined') rv.push(tr('samp-type-undef'))
    if (this.type==='other' && !this.shortDesc.trim().length) rv.push(tr('samp-other-no-desc'))
    if (!this.subjectiveQuality.length || this.subjectiveQuality==='undefined') rv.push(tr('quality-undef'))
    if (!(!this.subjectiveQuality.length || this.subjectiveQuality==='undefined' || this.subjectiveQuality==='good')
      && !this.notes.trim().length) rv.push(tr('qual-no-notes'))
    const mtIds = this.measurements.map(m => m.type.typeId)
    if ( new Set(mtIds).size !== mtIds.length ) rv.push(tr('meas-type-duplicate'))
    if (!skipInitWarns) {
      if (this.template) {
        if (this.template.measurementTypes.length) rv.push(i18n.t('planed-meas-remain', { count: this.template.measurementTypes.length }))
      } // else, no template
      else if (!this.measurements.length) rv.push(tr('No measurements'))
    }
    return rv
  }
  override equals(o: unknown) {
    return isISample(o) && this.type === o.type
      && this.shortDesc.trim() === ( o.shortDesc?.trim() ?? '' )
      && this.subjectiveQuality === o.subjectiveQuality
      && this.notes.trim() === ( o.notes?.trim() ?? '' )
      && this.measurements.length === o.measurements.length && this.measurements.every((m,i) => m.equals(o.measurements[i]))
    // not comparing template
  }
  override toJSON(_key: string) :ISample {
    return { type: this.type, subjectiveQuality: this.subjectiveQuality,
      measurements: this.measurements.map((m,mi) => m.toJSON(mi.toString())),
      ...( this.shortDesc.trim().length && { shortDesc: this.shortDesc.trim() } ),
      ...( this.notes.trim().length && { notes: this.notes.trim() } ),
      ...( this.template!==null && { template: this.template.toJSON('template') } ) }
  }
  override deepClone() :Sample {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISample(clone))
    return new Sample(clone)
  }
  override extractTemplate() :SampleTemplate {
    return new SampleTemplate({ type: this.type,
      measurementTypes: this.measurements.map(m => m.extractTemplate()),
      ...( this.shortDesc.trim().length && { shortDesc: this.shortDesc.trim() } ),
      ...( this.template?.instructions.trim().length && { instructions: this.template.instructions.trim() } ) })
  }
  override summaryDisplay() { return sampSummary(this) }
}

function sampSummary(samp :Sample|SampleTemplate) :[string,string] {
  const meas = 'measurementTypes' in samp ? samp.measurementTypes : samp.measurements
  let m = i18n.t('measurements', {count: meas.length})
  if (meas.length===1) {
    const m0 = meas[0]
    assert(m0)
    m += ': '+m0.summaryDisplay()[0]
  } else if (!meas.length) m = ''
  return [ i18n.t('st-'+samp.type, {defaultValue:samp.type}) + ( samp.shortDesc.trim().length ? ' / '+samp.shortDesc.trim() : '' ), m ]
}

/* ********** ********** ********** Template ********** ********** ********** */

export interface ISampleTemplate {
  type :SampleType
  shortDesc ?:string|null
  instructions ?:string|null
  readonly measurementTypes :IMeasurementType[]
}
const sampleTemplateKeys = ['type','shortDesc','instructions','measurementTypes'] as const
type SampleTemplateKey = typeof sampleTemplateKeys[number] & keyof ISample
export function isISampleTemplate(o :unknown) :o is ISampleTemplate {
  return !!( o && typeof o === 'object'
    && 'type' in o && 'measurementTypes' in o  // required keys
    && Object.keys(o).every(k => sampleTemplateKeys.includes(k as SampleTemplateKey))  // extra keys
    && isSampleType(o.type)
    && Array.isArray(o.measurementTypes) && o.measurementTypes.every(m => isIMeasurementType(m))
    && ( !('shortDesc' in o) || o.shortDesc===null || typeof o.shortDesc === 'string' )
    && ( !('instructions' in o) || o.instructions===null || typeof o.instructions === 'string' )
  )
}

export class SampleTemplate extends DataObjectTemplate<SampleTemplate, Sample> implements ISampleTemplate {
  static readonly sStyle :StyleValue = { isTemplate: true, opposite: Sample.sStyle,
    fullTitle: tr('Sample Template'), briefTitle: tr('samp-temp'),
    cssId: 'samp-temp', icon: 'droplet' }
  static { Sample.sStyle.opposite = this.sStyle }
  override get style() { return SampleTemplate.sStyle }
  type :SampleType
  shortDesc :string
  instructions :string
  /** The typical measurement types performed on this sample. */
  readonly measurementTypes :MeasurementType[]
  constructor(o :ISampleTemplate|null) {
    super()
    this.type = o?.type ?? 'undefined'
    this.shortDesc = o && 'shortDesc' in o && o.shortDesc!==null ? o.shortDesc.trim() : ''
    this.instructions =  o && 'instructions' in o && o.instructions!==null ? o.instructions.trim() : ''
    this.measurementTypes = o===null ? [] : isArrayOf(MeasurementType, o.measurementTypes) ? o.measurementTypes : o.measurementTypes.map(m => new MeasurementType(m))
  }
  override validate(_others :SampleTemplate[]) {
    if (!isSampleType(this.type)) throw new Error(`${tr('Invalid sample type')} ${String(this.type)}`)
  }
  override warningsCheck() {
    const rv :string[] = []
    if (this.type==='undefined') rv.push(tr('samp-type-undef'))
    if (this.type==='other' && !this.shortDesc.trim().length) rv.push(tr('samp-other-no-desc'))
    const mtIds = this.measurementTypes.map(t => t.typeId)
    if ( new Set(mtIds).size !== mtIds.length ) rv.push(tr('meas-type-duplicate'))
    return rv
  }
  override equals(o: unknown) {
    return isISampleTemplate(o) && this.type === o.type
      && this.shortDesc.trim() === ( o.shortDesc?.trim() ?? '' )
      && this.instructions.trim() === ( o.instructions?.trim() ?? '' )
      && this.measurementTypes.length === o.measurementTypes.length && this.measurementTypes.every((t,i) => t.equals(o.measurementTypes[i]))
  }
  override toJSON(_key: string) :ISampleTemplate {
    return { type: this.type,
      measurementTypes: this.measurementTypes.map((m, mi) => m.toJSON(mi.toString())),
      ...( this.shortDesc.trim().length && { shortDesc: this.shortDesc.trim() } ),
      ...( this.instructions.trim().length && { instructions: this.instructions.trim() } ) }
  }
  override deepClone() :SampleTemplate {
    const clone :unknown = JSON.parse(JSON.stringify(this))
    assert(isISampleTemplate(clone))
    return new SampleTemplate(clone)
  }
  override templateToObject() :Sample {
    return new Sample({ template: this.deepClone(), type: this.type,
      shortDesc: this.shortDesc, subjectiveQuality: 'good', measurements: [] })
  }
  override summaryDisplay() { return sampSummary(this) }
}
