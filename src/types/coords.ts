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
import { JsonSerializable } from './common'
import { assert } from '../utils'

interface IWgs84Coordinates {
  type :'WGS84'
  lat :number
  lon :number
}
function isIWgs84Coordinates(o :unknown) :o is IWgs84Coordinates {
  if (!o || typeof o !== 'object') return false
  if (Object.keys(o).length!==3 || !('type' in o && 'lat' in o && 'lon' in o)) return false  // keys
  if (!Number.isFinite(o.lat) || !Number.isFinite(o.lon)) return false  // types
  return true
}
function tryWgs84Import(o :unknown) :IWgs84Coordinates|null {
  if (!o || typeof o !== 'object') return null
  if ('wgs84lat' in o && Number.isFinite(o.wgs84lat) && 'wgs84lon' in o && Number.isFinite(o.wgs84lon))
    return { type: 'WGS84', lat: o.wgs84lat as number, lon: o.wgs84lon as number }
  return null
}

export type ICoordinates = IWgs84Coordinates
export function isICoordinates(o :unknown) :o is IWgs84Coordinates {
  return isIWgs84Coordinates(o)
}

/** Abstract coordinate representation.
 *
 * Currently the only implementation is:
 * - EPSG:4326 Coordinates ("WGS 84");
 *   Used by many GPS devices and the API of many online maps, like OSM and Google Maps.
 *   Note KML requires "Lon,Lat" while many others (like Google Maps) require "Lat,Lon".
 *   For reference, Berlin's Lat,Lon is roughly 52.5,13.4.
 *   Precision: <https://gis.stackexchange.com/a/8674>: eight decimal places ~1.1mm, Google Maps now gives six for ~11cm
 */
export abstract class AbstractCoordinates extends JsonSerializable {
  abstract get wgs84lat() :number
  abstract get wgs84lon() :number
  static override fromJSON(obj :object) :AbstractCoordinates {
    if (isIWgs84Coordinates(obj)) return new Wgs84Coordinates(obj)
    const c = tryWgs84Import(obj)
    if (c) return new Wgs84Coordinates(c)
    throw new Error(`not coordinates: ${JSON.stringify(obj)}`)
  }
  override toJSON(_key :string) :object {  /* Implementations should override! */
    return { wgs84lat: this.wgs84lat, wgs84lon: this.wgs84lon }
  }
  toWgs84Coords() :IWgs84Coordinates {
    return { type: 'WGS84', lat: this.wgs84lat, lon: this.wgs84lon }
  }
}

class Wgs84Coordinates extends AbstractCoordinates implements IWgs84Coordinates {
  type = 'WGS84' as const
  lat :number
  lon :number
  constructor(o :IWgs84Coordinates) {
    super()
    assert(Number.isFinite(o.lat) && Number.isFinite(o.lon))
    this.lat = o.lat
    this.lon = o.lon
  }
  get wgs84lat() { return this.lat }
  get wgs84lon() { return this.lon }
  override toJSON(_key :string) :IWgs84Coordinates {
    return { type: 'WGS84', lat: this.lat, lon: this.lon }
  }
}
