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
import { DataObjectBase } from './common'
import { tr } from '../i18n'

export interface IWgs84Coordinates {
  wgs84lat :number
  wgs84lon :number
}
export function isIWgs84Coordinates(o :unknown) :o is IWgs84Coordinates {
  if (!o || typeof o !== 'object') return false
  if (Object.keys(o).length!==2 || !('wgs84lat' in o && 'wgs84lon' in o)) return false  // keys
  if (!Number.isFinite(o.wgs84lat) || !Number.isFinite(o.wgs84lon)) return false  // types
  return true
}

/** EPSG:4326 Coordinates ("WGS 84")
 *
 * Used by many GPS devices and the API of many online maps, like OSM and Google Maps.
 * Note KML requires "Lon,Lat" while many others (like Google Maps) require "Lat,Lon".
 * For reference, Berlin's Lat,Lon is roughly 52.5,13.4.
 *
 * Precision: <https://gis.stackexchange.com/a/8674>: eight decimal places ~1.1mm, Google Maps now gives six for ~11cm
 */
export class Wgs84Coordinates extends DataObjectBase<Wgs84Coordinates> implements IWgs84Coordinates {
  wgs84lat :number
  wgs84lon :number
  constructor(o :IWgs84Coordinates|null) {
    super()
    this.wgs84lat = o?.wgs84lat ?? NaN
    this.wgs84lon = o?.wgs84lon ?? NaN
  }
  override validate(_others :Wgs84Coordinates[]) {
    if (!( Number.isFinite(this.wgs84lat) && this.wgs84lat >=  -90 && this.wgs84lat <=  90 ))
      throw new Error(`${tr('invalid-latitude')}: ${this.wgs84lat}`)
    if (!( Number.isFinite(this.wgs84lon) && this.wgs84lon >= -180 && this.wgs84lon <= 180 ))
      throw new Error(`${tr('invalid-longitude')}: ${this.wgs84lon}`)
  }
  override typeName(kind :'full'|'short') { return tr(kind==='full'?'Coordinates':'Coords') }
  override warningsCheck() { return [] }
  /** Note display should include the hint "Lat,Lon" somewhere. */
  override summaryDisplay() :[string,null] {
    return [ this.wgs84lat.toFixed(6)+','+this.wgs84lon.toFixed(6), null ] }
  override equals(o: unknown) {
    return isIWgs84Coordinates(o) && this.wgs84lat===o.wgs84lat && this.wgs84lon===o.wgs84lon }
  override toJSON(_key :string) :IWgs84Coordinates {
    return { wgs84lat: this.wgs84lat, wgs84lon: this.wgs84lon } }
  override deepClone() { return new Wgs84Coordinates(this.toJSON('')) }
}
