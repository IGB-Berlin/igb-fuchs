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
import { assert } from '../utils'
import { tr } from '../i18n'

export interface StyleValue {
  fullTitle :string
  briefTitle :string
  cssId :string
  icon :string
  isTemplate :boolean
  opposite :keyof typeof styleMap
}

const _home :StyleValue = { isTemplate: false, opposite: 'HomePage',
  fullTitle: tr('Home'), briefTitle: tr('Home'), cssId: 'home', icon: 'house-fill' }
const _sampLog :StyleValue = { isTemplate: false, opposite: 'SamplingProcedure',
  fullTitle: tr('Sampling Log'), briefTitle: tr('Log'),
  cssId: 'samp-log', icon: 'journal-text' } as const  // alternative icons might be list-columns-reverse, file-earmark-text
const _sampProc :StyleValue = { isTemplate: true, opposite: 'SamplingLog',
  fullTitle: tr('Sampling Procedure'), briefTitle: tr('proc'),
  cssId: 'samp-proc', icon: 'journals' } as const
const _location :StyleValue = { isTemplate: false, opposite: 'SamplingLocationTemplate',
  fullTitle: tr('Sampling Location'), briefTitle: tr('Location'),
  cssId: 'location', icon: 'pin-map-fill' } as const  // alternativ icon might be geo-fill
const _locTemp :StyleValue = { isTemplate: true, opposite: 'SamplingLocation',
  fullTitle: tr('Sampling Location Template'), briefTitle: tr('loc-temp'),
  cssId: 'loc-temp', icon: 'pin-map' } as const
const _sample :StyleValue = { isTemplate: false,
  fullTitle: tr('Sample'), briefTitle: tr('Sample'), opposite: 'SampleTemplate',
  cssId: 'sample', icon: 'droplet-fill' } as const  // alternative icon might be eyedropper
const _sampTemp :StyleValue = { isTemplate: true, opposite: 'Sample',
  fullTitle: tr('Sample Template'), briefTitle: tr('samp-temp'),
  cssId: 'samp-temp', icon: 'droplet' } as const
const _measType :StyleValue = { isTemplate: true, opposite: 'Measurement',
  fullTitle: tr('Measurement Type'), briefTitle: tr('meas-type'),
  cssId: 'meas-type', icon: 'moisture' } as const
const _meas :StyleValue = { isTemplate: false, opposite: 'MeasurementType',
  fullTitle: tr('Measurement'), briefTitle: tr('meas'),
  cssId: 'meas', icon: 'thermometer-half' } as const  // alternative icon might be speedometer
const _coords :StyleValue = { isTemplate: false, opposite: 'Wgs84Coordinates',
  fullTitle: tr('Coordinates'), briefTitle: tr('Coords'),
  cssId: 'coords', icon: 'crosshair' } as const
export const styleMap = { 'HomePage': _home,
  // keyed by string because I haven't yet found a type-safe way to do this without causing circular dependencies
  'SamplingLog': _sampLog, 'SamplingLogEditor': _sampLog,
  'SamplingProcedure': _sampProc, 'SamplingProcedureEditor': _sampProc,
  'SamplingLocation': _location, 'SamplingLocationEditor': _location,
  'SamplingLocationTemplate': _locTemp, 'LocationTemplateEditor': _locTemp,
  'Sample': _sample, 'SampleEditor': _sample,
  'SampleTemplate': _sampTemp, 'SampleTemplateEditor': _sampTemp,
  'MeasurementType': _measType, 'MeasTypeEditor': _measType,
  'Measurement': _meas, 'MeasurementEditor': _meas,
  'Wgs84Coordinates': _coords,
} as const

/** @param type e.g. `obj.constructor` */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function getStyle(type :Function, opposite ?:boolean) :StyleValue {
  const v = styleMap[type.name as keyof typeof styleMap]
  assert(v, type.name)
  return opposite ? styleMap[v.opposite] : v
}
