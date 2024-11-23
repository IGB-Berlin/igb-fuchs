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

export function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg)
}

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#testing_for_availability
export const CAN_LOCAL_STORAGE :boolean = (() => {
  let storage :Storage|undefined
  try {
    storage = window['localStorage']
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return !!( e instanceof DOMException && e.name === 'QuotaExceededError' && storage && storage.length>0 )
  }
})()
