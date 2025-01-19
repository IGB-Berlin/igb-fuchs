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
import { isTimestampSet, timestampNow, VALID_NAME_RE } from '../types/common'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { DateTimeInput, getTzOffsetStr } from './date-time'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingLocationEditor } from './location'
import { ListEditorWithTemp } from './list-edit'
import { SamplingLog } from '../types/sampling'
import { Editor, EditorParent } from './base'
import { CustomChangeEvent } from '../events'
import { setRemove } from '../types/set'
import { tr } from '../i18n'

let _checkId = 0

class CheckList {
  readonly el
  private readonly checkStates
  private readonly checkItems :[HTMLElement, HTMLInputElement][]
  constructor(initialCheckStates :{ [key :string]: boolean }) {
    this.checkStates = initialCheckStates
    const checks = Object.keys(initialCheckStates)
    this.checkItems = checks.map(c => {
      const id = `checklistCheckbox${_checkId++}`
      const cb = safeCastElement(HTMLInputElement, <input class="form-check-input me-2" type="checkbox" id={id}
        checked={!!this.checkStates[c]} onchange={()=>{
          this.checkStates[c] = cb.checked
          this.el.dispatchEvent(new CustomChangeEvent()) //TODO: bubble
        }} />)
      const li = <li class="list-group-item" onclick={(event: Event) => { if (event.target===li) cb.click() } }>
        {cb}<label class="form-check-label" for={id}>{c}</label></li>
      return [li, cb]
    })
    this.el = safeCastElement(HTMLDivElement,
      <div><ul class="list-group custom-checklist">
        {this.checkItems.map(i=>i[0])}
      </ul></div> )
  }
  checkedTasks() :string[] {
    return Object.entries(this.checkStates).flatMap(([k,v]) => v ? [k] : [])
  }
  /** Intended only for use as a scroll or focus target. */
  firstUncheckedEl() :HTMLInputElement|undefined {
    return this.checkItems.find(i => !i[1].checked)?.[1]
  }
}

export class SamplingLogEditor extends Editor<SamplingLog> {
  private readonly inpName
  private readonly inpStart
  private readonly inpEnd
  private readonly cbAutoEnd
  private readonly inpPersons
  private readonly inpWeather
  private readonly inpNotes
  private readonly checkList
  private readonly locEdit
  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLog>, targetObj :SamplingLog|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    //TODO Later: Consider hiding those inputs that have already been edited/completed in an accordion? (or is better scroll + collapsing textareas enough?)
    this.inpName = safeCastElement(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{this.initObj.template?.instructions.trim()??''}</textarea>)
    const rowInst = this.makeRow(inpInst, tr('Instructions'), <>{tr('proc-inst-help')} {tr('temp-copied-readonly')} {tr('inst-see-notes')}</>, null)
    if (!this.initObj.template?.instructions.trim().length)
      rowInst.classList.add('d-none')

    const tzOff = getTzOffsetStr(new Date())
    this.inpStart = new DateTimeInput(this.initObj.startTime, true)
    this.inpEnd = new DateTimeInput(this.initObj.endTime, false)
    const rowEnd = this.makeRow(this.inpEnd.el, tr('End time'), <><em>{tr('Recommended')}.</em> {tr('log-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp'))
    rowEnd.classList.remove('mb-2','mb-sm-3')
    this.cbAutoEnd = safeCastElement(HTMLInputElement, <input class="form-check-input" type="checkbox" id="checkAutoLogEnd" />)
    if (!this.isUnsaved && !isTimestampSet(this.initObj.endTime)) this.cbAutoEnd.checked = true
    const rowAutoEnd = <div class="row mb-3">
      <div class="col-sm-3"></div>
      <div class="col-sm-9"><div class="form-check"> {this.cbAutoEnd}
        <label class="form-check-label" for="checkAutoLogEnd">{tr('auto-set-end-time')}</label>
      </div></div>
    </div>

    this.inpPersons = safeCastElement(HTMLInputElement, <input type="text" value={this.initObj.persons.trim()} />)
    this.inpWeather = safeCastElement(HTMLInputElement, <input type="text" value={this.initObj.weather.trim()} />)
    this.inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.notes.trim()}</textarea>)

    const checklist = this.initObj.template?.checklist ?? []
    this.checkList = new CheckList( Object.fromEntries(checklist.map(c => [c, this.initObj.checkedTasks.includes(c)] )) )
    const rowCheck = this.makeRow(this.checkList.el, tr('Checklist'), tr('checklist-help'), null)
    if (!checklist.length) rowCheck.classList.add('d-none')

    /* TODO Later: The location list should also be sorted by distance from our current location.
     * This also applies to all other places where locations lists occur! (e.g. From Template dialog) */
    //TODO Later (low prio): Consider how difficult it would be to show all sampling locations on a map
    // TODO Later: In general, when deduplicating lists of templates, do we need a less strict `equals`?
    this.locEdit = new ListEditorWithTemp(this, new ArrayStore(this.initObj.locations), SamplingLocationEditor, null,
      { title:tr('saved-pl')+' '+tr('Sampling Locations'), planned:tr('planned-pl')+' '+tr('Sampling Locations') }, tr('new-loc-from-temp'),
      //TODO Later: In general, maybe don't filter out options, e.g. for cases where there are multiple temperature measurements
      ()=>Promise.resolve(setRemove(this.ctx.storage.allLocationTemplates, this.initObj.locations.map(l => l.extractTemplate().cloneNoSamples()))),
      this.initObj.template?.locations )

    this.initialize([
      this.makeRow(this.inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      rowInst,
      this.makeRow(this.inpStart.el, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('log-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      rowEnd, rowAutoEnd,
      this.makeRow(this.inpPersons, tr('Persons'), <>{tr('persons-help')}</>, null),
      this.makeRow(this.inpWeather, tr('Weather'), <>{tr('weather-help')}</>, null),
      this.makeRow(this.inpNotes, tr('Notes'), <>{tr('log-notes-help')} {tr('notes-help')}</>, null),
      rowCheck,
      this.locEdit.elWithTitle,
    ])
  }

  protected override newObj() { return new SamplingLog(null) }

  protected override form2obj(saving :boolean) {
    if (saving && this.cbAutoEnd.checked) {
      this.inpEnd.timestamp = timestampNow()
      this.cbAutoEnd.checked = false
    }
    return new SamplingLog({ id: this.initObj.id, template: this.initObj.template,
      name: this.inpName.value, startTime: this.inpStart.timestamp, endTime: this.inpEnd.timestamp,
      lastModified: timestampNow(), persons: this.inpPersons.value.trim(), weather: this.inpWeather.value.trim(),
      notes: this.inpNotes.value.trim(), locations: this.initObj.locations,
      checkedTasks: this.checkList.checkedTasks() })
  }

  override currentName() { return this.inpName.value }

  protected override doScroll() {
    this.ctx.scrollTo( this.isNew || !this.inpName.value.trim().length ? this.inpName
      : ( this.checkList.firstUncheckedEl() ?? (
        //TODO: scrolling to the save button is probably not correct for objects created without templates
        this.locEdit.plannedLeftCount ? this.locEdit.plannedTitleEl : this.btnSaveClose
      ) ) )
  }

}