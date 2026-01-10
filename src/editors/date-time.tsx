/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024-2025 Hauke Dämpfling (haukex@zero-g.net)
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
import { DataObjectBase, isTimestamp, isTimestampSet, isValidAndSetTs, NO_TIMESTAMP, Timestamp, timestampNow } from '../types/common'
import { jsx, jsxFragment, safeCast } from '@haukex/simple-jsx-dom'
import { CustomChangeEvent } from '../events'
import { GlobalContext } from '../main'
import { assert } from '../utils'
import { Editor } from './base'
import { tr } from '../i18n'

// I used to have a separate `date.ts` utility function file but for now all the utils are in one place in this file.

/** Returns the current local time zone offset and name as a descriptive string. */
export function getTzOffsetStr() :string {
  const date = new Date()
  const off = date.getTimezoneOffset()
  const hrs = Math.abs(Math.floor(off/60))
  const mins = Math.abs(off) % 60
  return (!off?'':off<0?'+':'-')+hrs.toString().padStart(2,'0')+':'+mins.toString().padStart(2,'0')
    + ' (' + Intl.DateTimeFormat().resolvedOptions().timeZone + ')'
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

/** Return the timestamp in local time formatted as "HH:MM:SS" - no TZ suffix! */
export function toLocalTime(t :Timestamp, seconds :boolean = true) {
  if (!isValidAndSetTs(t)) return ''
  const d = new Date(t)
  return d.getHours().toString().padStart(2,'0')
    +':'+d.getMinutes().toString().padStart(2,'0')
    +( seconds ? ':'+d.getSeconds().toString().padStart(2,'0') : '' )
}
/** Return the timestamp in local time formatted as "DD.MM.YYYY" - no TZ suffix! */
export function toLocalDMY(t :Timestamp) {
  if (!isValidAndSetTs(t)) return ''
  const d = new Date(t)
  return d.getDate().toString().padStart(2,'0')
    +'.'+(d.getMonth() + 1).toString().padStart(2,'0')
    +'.'+d.getFullYear().toString().padStart(4,'0')
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
 * Note that because we have to call .getTimezoneOffset() on a live object, there *may* be problems if
 * the date happens to fall exactly on a summer/winter time change, which is unlikely enough in this
 * application that we can safely ignore the chance.
 *
 * On top of that, the inputs only have minute precision, and we can do better than that.
 */
export class DateTimeInput {
  protected readonly _el
  get el() { return this._el }
  private _ts :Timestamp
  readonly input
  constructor(initialTs :Timestamp|null, required :boolean) {
    this._ts = isTimestamp(initialTs) && isValidAndSetTs(initialTs) ? initialTs : NO_TIMESTAMP
    this.input = safeCast(HTMLInputElement, <input class="form-control" type="datetime-local" />)
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
    this._el = safeCast(HTMLDivElement,
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
  constructor(initialTs :Timestamp|null, required :boolean, autoSet :boolean) {
    super(initialTs, required)
    const id = GlobalContext.genId('cbAutoSet')
    this.checkBox = safeCast(HTMLInputElement, <input class="form-check-input" type="checkbox" id={id} />)
    this.checkBox.checked = autoSet
    this.checkBox.addEventListener('change', () => this.el.dispatchEvent(new CustomChangeEvent()) )
    this._el.addEventListener(CustomChangeEvent.NAME, () => this._el2.dispatchEvent(new CustomChangeEvent()))  // bubble event
    this._el2 = safeCast(HTMLDivElement,
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

export class StartEndTimeEditor<B extends DataObjectBase<B>> {
  readonly el
  protected readonly inpStart
  protected readonly inpEnd
  constructor(parent :Editor<B>, initialStart :Timestamp, initialEnd :Timestamp, autoSetEnd :boolean, prefix :'log'|'loc') {
    this.inpStart = new DateTimeInput(initialStart, true)
    this.inpStart.el.setAttribute('data-test-id', prefix+'StartTime')
    this.inpEnd = new DateTimeInputAutoSet(initialEnd, false, autoSetEnd)
    this.inpEnd.el.setAttribute('data-test-id', prefix+'EndTime')

    const rowStart = parent.makeRow(this.inpStart.el, { label: tr('Start time'), invalidText: tr('Invalid timestamp'),
      helpText: <><strong>{tr('Required')}.</strong> {tr(prefix==='log'?'log-start-time-help':'loc-start-time-help')}</> })
    const rowEnd = parent.makeRow(this.inpEnd.el, { label: tr('End time'), invalidText: tr('Invalid timestamp'),
      helpText: <><em>{tr('Recommended')}.</em> {tr(prefix==='log'?'log-end-time-help':'loc-end-time-help')}</> })

    const rowTz = parent.makeRow(
      safeCast(HTMLInputElement, <input type="text" readonly value={getTzOffsetStr()} data-test-id={prefix+'-tz'}/>),
      { label: tr('Timezone'), helpText: tr('timezone-help') })

    const lblCommon = <span></span>
    const lblStart = <span>?</span>
    const lblEnd = <span>?</span>
    const [acc, coll] = parent.makeAccordion({ label: tr('Times'),
      title: <>{lblCommon} {lblStart} – {lblEnd}</>, rows: [rowStart, rowEnd, rowTz], testId: prefix+'-times-accord' })
    this.el = acc

    const updateLabels = (inp :DateTimeInput, lbl :HTMLElement) => {
      assert( Object.is(inp, this.inpStart) && Object.is(lbl, lblStart) || Object.is(inp, this.inpEnd) && Object.is(lbl, lblEnd) )
      let sameDate :boolean = false
      if ( isValidAndSetTs(this.inpStart.timestamp) && isValidAndSetTs(this.inpEnd.timestamp)
        && toLocalDMY(this.inpStart.timestamp)===toLocalDMY(this.inpEnd.timestamp)
        || isValidAndSetTs(this.inpStart.timestamp) && this.inpEnd.isAutoSetOn
        && toLocalDMY(this.inpStart.timestamp)===toLocalDMY(timestampNow()) ) {
        lblCommon.innerText = toLocalDMY(this.inpStart.timestamp)
        sameDate = true
      } else lblCommon.innerText = ''
      if ( Object.is(inp, this.inpEnd) && this.inpEnd.isAutoSetOn ) {
        lbl.title = tr('auto-set-end-time')
        lbl.innerText = tr('auto')
        lbl.classList.add('fst-italic')
        lbl.classList.remove('text-warning')
      }
      else if (isValidAndSetTs(inp.timestamp)) {
        lbl.title = toLocalDMY(inp.timestamp)+' '+toLocalTime(inp.timestamp)+' '+getTzOffsetStr()
        lbl.innerText = ( sameDate ? '' : toLocalDMY(inp.timestamp)+' ' ) + toLocalTime(inp.timestamp, false)
        lbl.classList.remove('fst-italic','text-warning')
      }
      else {
        lbl.title = tr('not set')
        lbl.innerText = '?'
        lbl.classList.remove('fst-italic')
        lbl.classList.add('text-warning')
      }
    }
    const changeEventHandler = (event ?:Event) => {
      updateLabels(this.inpStart, lblStart)
      updateLabels(this.inpEnd, lblEnd)
      if (event instanceof Event)
        this.el.dispatchEvent(new CustomChangeEvent())  // bubble
    }
    this.inpStart.el.addEventListener(CustomChangeEvent.NAME, changeEventHandler)
    this.inpEnd.el.addEventListener(CustomChangeEvent.NAME, changeEventHandler)
    changeEventHandler()

    setTimeout(() => {  // needs to be deferred because the Elements need to be in the DOM
      if ( !isTimestamp(initialStart) || !isValidAndSetTs(initialStart) ||
        !autoSetEnd && (!isTimestamp(initialEnd) || !isValidAndSetTs(initialEnd)) )
        coll().show()
      this.inpStart.input.addEventListener('invalid', () => coll().show())
      this.inpEnd.input.addEventListener('invalid', () => coll().show())
    })

  }
  getStart() { return this.inpStart.timestamp }
  getEnd() { return this.inpEnd.timestamp }
  doSaveEnd() { this.inpEnd.doSave() }
  isAutoSetEndOn() { return this.inpEnd.isAutoSetOn }
}
