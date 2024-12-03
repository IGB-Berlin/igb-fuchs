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
import { isTimestampSet, NO_TIMESTAMP, Timestamp } from '../types/common'
import { jsx, safeCastElement } from '../jsx-dom'
import { tr } from '../i18n'

export function getTzOffsetStr(date :Date) :string {
  const off = date.getTimezoneOffset()
  const hrs = Math.abs(Math.floor(off/60))
  const mins = Math.abs(off) % 60
  return (off<0?'+':'-')+hrs.toString().padStart(2,'0')+':'+mins.toString().padStart(2,'0')
}

const dateToLocalString = (date :Date) :string =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    +`T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

function dateTimeLocalInputToDate(el :HTMLInputElement) :Date|null {
  const t = el.valueAsNumber
  if (!Number.isFinite(t)) return null
  const d = new Date(t)
  return new Date(t + d.getTimezoneOffset()*60*1000)
}

/** Work around some quirks of "datetime-local" inputs.
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
 *
 * On top of that, the inputs only have minute precision, and we can do better than that.
 */
export class DateTimeInput {
  readonly el :HTMLDivElement
  protected _ts :Timestamp
  protected input :HTMLInputElement
  constructor(initialTs :Timestamp|null, required :boolean) {
    this._ts = initialTs===null ? NO_TIMESTAMP : initialTs
    this.input = safeCastElement(HTMLInputElement, <input class="form-control" type="datetime-local" />)
    if (required) this.input.setAttribute('required','required')
    this.input.addEventListener('change', () => {
      const dt = dateTimeLocalInputToDate(this.input)
      this._ts = dt===null ? NO_TIMESTAMP : dt.getTime()
    })
    this.timestamp = this._ts
    const btnNow = <button type="button" class="btn btn-outline-secondary" title={tr('Use current date and time')}>
      <i class="bi-clock me-1"/> {tr('Now')} </button>
    btnNow.addEventListener('click', () => this.timestamp = Date.now() )
    this.el = safeCastElement(HTMLDivElement, <div class="input-group">
      {btnNow} {this.input} </div>)
  }
  set timestamp(value :Timestamp) {
    this._ts = value
    this.input.value = isTimestampSet(value) ? dateToLocalString(new Date(value)) : ''
  }
  get timestamp() :Timestamp {
    return this._ts
  }
}
