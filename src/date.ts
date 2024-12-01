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

export const dateToLocalString = (date :Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    +`T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

export function getTzOffset(date :Date) {
  const off = date.getTimezoneOffset()
  const hrs = Math.abs(Math.floor(off/60))
  const mins = Math.abs(off) % 60
  return (off<0?'+':'-')+hrs.toString().padStart(2,'0')+':'+mins.toString().padStart(2,'0')
}

/** Get a date from <input type="datetime-local">
 *
 * In Firefox, apparently, datetime-local's .valueAsDate returns (incorrectly?) offset values.
 * For example, setting it to the local time (CET, UTC+1) "2024-12-01T17:33", and then
 * using .valueAsDate, returns "Sun Dec 01 2024 18:33:00 GMT+0100"... ???
 *
 * In Chrome, .valueAsDate just returns null, so we use .valueAsNumber, which has the same offset as above.
 *
 * Note that because we have to do .getTimezoneOffset() on a live object, there *may* be problems if
 * the date happens to fall exactly on a summer/winter time change, which is unlikely enough in this
 * application that we can safely ignore the chance.
 */
export function dateTimeLocalInputToDate(el :HTMLInputElement) :Date|null {
  const t = el.valueAsNumber
  if (!Number.isFinite(t)) return null
  const d = new Date(t)
  return new Date(t + d.getTimezoneOffset()*60*1000)
}