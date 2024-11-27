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
import { ISamplingLocationTemplate, isISamplingLocationTemplate } from './location'
import { ISamplingTripTemplate, isISamplingTripTemplate } from './trip'
import { IMeasurementType, isIMeasurementType } from './meas-type'
import { assert } from '../utils'

/* TODO: Implement the templates dictionary.
 * Note Sample Templates are just a part of the Sampling Location Template and don't need their own list.
 * However, when building the list of Sampling Location Templates and deduplicating them, the comparisons
 * of the objects need to exclude the samples, so the main dict should just hold the Sampling Location Templates
 * with the Sample Templates set to an empty Array [].
 * Note we still need to implement checks that the `names`s of the above objects are always unique.
 */

interface ITemplates {
  measTypes: { [name :string] :IMeasurementType }
  locations: { [name :string] :ISamplingLocationTemplate }
  trips: { [name :string] :ISamplingTripTemplate }
}
function isITemplates(o :unknown) :o is ITemplates {
  if (!o || typeof o !== 'object') return false
  if (Object.keys(o).length!==3 || !('measTypes' in o && 'locations' in o && 'trips' in o)) return false  // keys
  if (typeof o.measTypes !== 'object' || typeof o.locations !== 'object' || typeof o.trips !== 'object') return false  // types
  if (!o.measTypes || !o.locations || !o.trips) return false  // values
  // objects
  if (!Object.entries(o.measTypes).every(([k,v]) => typeof k === 'string' && isIMeasurementType(v))) return false
  if (!Object.entries(o.locations).every(([k,v]) => typeof k === 'string' && isISamplingLocationTemplate(v))) return false
  if (!Object.entries(o.trips).every(([k,v]) => typeof k === 'string' && isISamplingTripTemplate(v))) return false
  return true
}

export class Templates implements ITemplates {
  measTypes: { [name: string]: IMeasurementType } = {}
  locations: { [name: string]: ISamplingLocationTemplate } = {}
  trips: { [name: string]: ISamplingTripTemplate } = {}

  static fromJSON(o :unknown) :Templates {
    assert(isITemplates(o))
    //TODO: deduplication, also need to extract from all projects
    const n = new Templates()
    n.measTypes = o.measTypes
    n.locations = o.locations
    n.trips = o.trips
    return n
  }

  toJSON(_key :string) :ITemplates {
    return { measTypes: this.measTypes, locations: this.locations, trips: this.trips }
  }

  validate() {
    const checkNames :(obj :{ [key :string]: { name :string } })=>void = obj =>
      Object.entries(obj).forEach(([k,v]) => {
        if (k!==v.name) throw new Error(`Name mismatch: key=${k}, name=${v.name}`) })
    checkNames(this.measTypes)
    checkNames(this.locations)
    checkNames(this.trips)
  }

}