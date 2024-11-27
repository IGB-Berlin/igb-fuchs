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
import { ISamplingLocationTemplate } from './location'
import { ISamplingTripTemplate } from './trip'
import { IMeasurementType } from './meas-type'

/* TODO: Implement the templates dictionary.
 * Note Sample Templates are just a part of the Sampling Location Template and don't need their own list.
 * However, when building the list of Sampling Location Templates and deduplicating them, the comparisons
 * of the objects need to exclude the samples, so the main dict should just hold the Sampling Location Templates
 * with the Sample Templates set to an empty Array [].
 * Note we still need to implement checks that the `names`s of the above objects are always unique.
 */

export interface ITemplates {
  measTypes: { [name :string] :IMeasurementType }
  locations: { [name :string] :ISamplingLocationTemplate }
  trips: { [name :string] :ISamplingTripTemplate }
}
