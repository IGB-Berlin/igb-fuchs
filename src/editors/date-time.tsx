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
import { isTimestamp, isTimestampSet, isValidAndSetTs, NO_TIMESTAMP, Timestamp, timestampNow } from '../types/common'
import { jsx, safeCastElement } from '../jsx-dom'
import { CustomChangeEvent } from '../events'
import { GlobalContext } from '../main'
import { tr } from '../i18n'

// I used to have a separate `date.ts` utility function file but for now all the utils are in one place in this file.

export function getTzOffsetStr(date :Date) :string {
  const off = date.getTimezoneOffset()
  const hrs = Math.abs(Math.floor(off/60))
  const mins = Math.abs(off) % 60
  return (!off?'':off<0?'+':'-')+hrs.toString().padStart(2,'0')+':'+mins.toString().padStart(2,'0')
}

export const dateToLocalString = (date :Date) :string =>
  `${date.getFullYear().toString().padStart(4,'0')}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`

/** For use in `<input type="datetime-local">` */
const dateTimeToLocalString = (date :Date) :string =>
  dateToLocalString(date)+`T${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`

/** Turn a date into a string suitable for use in a filename (local time). */
export const dateTimeToLocalFilenameString = (date :Date) :string => dateToLocalString(date)+'-'
  + date.getHours().toString().padStart(2, '0')
  + date.getMinutes().toString().padStart(2, '0')
  + date.getSeconds().toString().padStart(2, '0')

/** Return the timestamp formatted as "YYYY-MM-DD HH:MM:SS" in UTC - user must add the "Z"/"UTC" suffix or equivalent! */
export function toIsoUtc(t :Timestamp) {
  if (!isValidAndSetTs(t)) return ''
  const d = new Date(t)
  return d.getUTCFullYear().toString().padStart(4,'0')
    +'-'+(d.getUTCMonth() + 1).toString().padStart(2,'0')
    +'-'+d.getUTCDate().toString().padStart(2,'0')
    +' '+d.getUTCHours().toString().padStart(2,'0')
    +':'+d.getUTCMinutes().toString().padStart(2,'0')
    +':'+d.getUTCSeconds().toString().padStart(2,'0')
}
/** Return the timestamp in UTC formatted as "HH:MM:SS" - no "Z"/"UTC" suffix! */
export function toUtcTime(t :Timestamp) {
  if (!isValidAndSetTs(t)) return ''
  const d = new Date(t)
  return d.getUTCHours().toString().padStart(2,'0')
    +':'+d.getUTCMinutes().toString().padStart(2,'0')
    +':'+d.getUTCSeconds().toString().padStart(2,'0')
}
/** Return the timestamp in UTC formatted as "DD.MM.YYYY" - no "Z"/"UTC" suffix! */
export function toDMYUtc(t :Timestamp) {
  if (!isValidAndSetTs(t)) return ''
  const d = new Date(t)
  return d.getUTCDate().toString().padStart(2,'0')
    +'.'+(d.getUTCMonth() + 1).toString().padStart(2,'0')
    +'.'+d.getUTCFullYear().toString().padStart(4,'0')
}

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
  protected readonly _el
  get el() { return this._el }
  private _ts
  private readonly input
  constructor(initialTs :Timestamp|null, required :boolean) {
    this._ts = isTimestamp(initialTs) && isValidAndSetTs(initialTs) ? initialTs : NO_TIMESTAMP
    this.input = safeCastElement(HTMLInputElement, <input class="form-control" type="datetime-local" />)
    if (required) this.input.setAttribute('required','required')
    this.input.addEventListener('change', () => {
      const dt = dateTimeLocalInputToDate(this.input)
      this._ts = dt===null ? NO_TIMESTAMP : dt.getTime()
      console.debug('Retrieved datetime-local value',dt,'TS',this._ts)
      this._el.dispatchEvent(new CustomChangeEvent())
    })
    this.timestamp = this._ts
    const btnClock = <button type="button" class="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown"
      aria-expanded="false"><i class="bi-clock"/><span class="visually-hidden"> {tr('Time')}</span></button>
    const btnNow = <button type="button" class="dropdown-item">{tr('Use current time')}</button>
    btnNow.addEventListener('click', () => {
      this.timestamp = Date.now()
      this._el.dispatchEvent(new CustomChangeEvent())
    })
    this._el = safeCastElement(HTMLDivElement,
      <div class="input-group"> {btnClock}<ul class="dropdown-menu">{btnNow}</ul> {this.input} </div>)
  }
  set timestamp(value :Timestamp) {
    this._ts = value
    const newVal = isTimestampSet(value) ? dateTimeToLocalString(new Date(value)) : ''
    console.debug('Setting datetime-local to value',newVal,'TS',this._ts)
    this.input.value = newVal
  }
  get timestamp() :Timestamp {
    return this._ts
  }
}

export class DateTimeInputAutoSet extends DateTimeInput {
  private readonly _el2
  private readonly checkBox
  override get el() { return this._el2 }
  get isAutoSetOn() { return this.checkBox.checked }
  constructor(ctx :GlobalContext, initialTs :Timestamp|null, required :boolean, autoSet :boolean) {
    super(initialTs, required)
    const id = ctx.genId('cbAutoSet')
    this.checkBox = safeCastElement(HTMLInputElement, <input class="form-check-input" type="checkbox" id={id} />)
    this.checkBox.checked = autoSet
    this.checkBox.addEventListener('change', () => this.el.dispatchEvent(new CustomChangeEvent()) )
    this._el.addEventListener(CustomChangeEvent.NAME, () => this._el2.dispatchEvent(new CustomChangeEvent()))  // bubble event
    this._el2 = safeCastElement(HTMLDivElement,
      <div> {this._el}
        <div class="form-check mt-1"> {this.checkBox}
          <label class="form-check-label" for={id}>{tr('auto-set-end-time')}</label>
        </div>
      </div>)
  }
  doSave() {
    if (this.checkBox.checked) {
      this.timestamp = timestampNow()
      this.checkBox.checked = false
    }
  }
}
