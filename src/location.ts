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
import { WGS84_PRECISION } from './types/coords'

export async function query() {
  const state = await navigator.permissions.query({ name: 'geolocation' })
  console.log(state.state)  // "denied" | "granted" | "prompt"
}

const MAX_AGE_MS = 1000*60*10  // 10 mins

export function start() {
  navigator.geolocation.watchPosition(pos => {
    console.log(pos)
    const ageMs = Math.max(0, pos.timestamp - Date.now())
    console.log(`${ageMs}ms ${pos.coords.latitude.toFixed(WGS84_PRECISION)},${pos.coords.longitude.toFixed(WGS84_PRECISION)}`)
  }, err => {
    console.warn(err)
  }, { enableHighAccuracy: true, maximumAge: MAX_AGE_MS })
}
