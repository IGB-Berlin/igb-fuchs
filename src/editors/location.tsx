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
import { ListEditorWithTemp, SelectedItemContainer } from './list-edit'
import { areWgs84CoordsValid, EMPTY_COORDS } from '../types/coords'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { DateTimeInput, getTzOffsetStr } from './date-time'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingLocation } from '../types/location'
import { makeCoordinateEditor } from './coords'
import { Editor, EditorParent } from './base'
import { CustomChangeEvent } from '../events'
import { setRemove } from '../types/set'
import { SampleEditor } from './sample'
import { makeHelp } from '../help'
import { tr } from '../i18n'

let _taskId = 0

class TaskList {
  readonly el
  private readonly taskStates
  private readonly taskItems :[HTMLElement, HTMLInputElement][]
  constructor(initialTaskStates :{ [key :string]: boolean }) {
    this.taskStates = initialTaskStates
    const tasks = Object.keys(initialTaskStates)
    const taskHelp = <div class="form-text my-0">{tr('tasklist-help')}</div>
    const [_taskHelpId, taskHelpBtn] = makeHelp(taskHelp)
    this.taskItems = tasks.map(c => {
      const id = `tasklistCheckbox${_taskId++}`
      const cb = safeCastElement(HTMLInputElement,
        <input class="form-check-input me-2" type="checkbox" autocomplete="off"
          id={id} checked={!!this.taskStates[c]} onchange={()=>{
            this.taskStates[c] = cb.checked
            this.el.dispatchEvent(new CustomChangeEvent())  //TODO: bubble
          }} />)
      const btn = <div class="custom-cb-btn" onclick={(event: Event) => { if (event.target===btn) cb.click() } }>
        {cb}<label class="form-check-label" for={id}>{tr('Completed')}</label></div>
      const li = <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="me-auto">{c}</div>
        <div class="ms-3">{btn}</div>
      </li>
      return [li, cb]
    })
    this.el = <div class="my-3">
      <hr class="mt-4 mb-2" />
      <h5 class="mb-0">{tr('Task List')} {taskHelpBtn}</h5>
      {taskHelp}
      <ul class="list-group custom-tasklist my-2">
        {this.taskItems.map(i=>i[0])}
      </ul>
    </div>
  }
  completedTasks() :string[] {
    return Object.entries(this.taskStates).flatMap(([k,v]) => v ? [k] : [])
  }
  /** Intended only for use as a scroll or focus target. */
  firstUncheckedEl() :HTMLInputElement|undefined {
    return this.taskItems.find(i => !i[1].checked)?.[1]
  }
}

export class SamplingLocationEditor extends Editor<SamplingLocation> {
  private readonly inpName
  private readonly inpDesc
  private readonly actCoords
  private readonly inpActCoords
  private readonly inpStart
  private readonly inpEnd
  private readonly cbAutoEnd
  private readonly inpNotes
  private readonly sampEdit
  private readonly taskEditor
  private readonly selItem :SelectedItemContainer = { el: null }
  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLocation>, targetObj :SamplingLocation|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    this.inpName = safeCastElement(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    this.inpDesc = safeCastElement(HTMLInputElement, <input type="text" value={this.initObj.shortDesc.trim()}></input>)

    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{this.initObj.template?.instructions.trim()??''}</textarea>)
    const rowInst = this.makeRow(inpInst, tr('Instructions'), <>{tr('loc-inst-help')} {tr('temp-copied-readonly')} {tr('inst-see-notes')}</>, null)
    if (!this.initObj.template?.instructions.trim().length)
      rowInst.classList.add('d-none')

    const nomCoords = this.initObj.template?.nomCoords.deepClone() ?? EMPTY_COORDS
    const inpNomCoords = makeCoordinateEditor(nomCoords, true)
    const rowNomCoords = this.makeRow(inpNomCoords, tr('nom-coord'), <>{tr('nom-coord-help')} {tr('temp-copied-readonly')} {tr('coord-ref')}</>, null)
    if (!areWgs84CoordsValid(nomCoords))
      rowNomCoords.classList.add('d-none')

    this.actCoords = this.initObj.actCoords.deepClone()  // don't modify the original object directly!
    this.inpActCoords = makeCoordinateEditor(this.actCoords, false)

    const tzOff = getTzOffsetStr(new Date())
    this.inpStart = new DateTimeInput(this.initObj.startTime, true)
    this.inpEnd = new DateTimeInput(this.initObj.endTime, false)
    const rowEnd = this.makeRow(this.inpEnd.el, tr('End time'), <><em>{tr('Recommended')}.</em> {tr('loc-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp'))
    rowEnd.classList.remove('mb-2','mb-sm-3')
    this.cbAutoEnd = safeCastElement(HTMLInputElement, <input class="form-check-input" type="checkbox" id="checkAutoLocEnd" />)
    if (!this.isUnsaved && !isTimestampSet(this.initObj.endTime)) this.cbAutoEnd.checked = true
    const rowAutoEnd = <div class="row mb-3">
      <div class="col-sm-3"></div>
      <div class="col-sm-9"><div class="form-check"> {this.cbAutoEnd}
        <label class="form-check-label" for="checkAutoLocEnd">{tr('auto-set-end-time')}</label>
      </div></div>
    </div>

    this.inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.notes.trim()}</textarea>)

    const sampStore = new ArrayStore(this.initObj.samples)
    this.sampEdit = new ListEditorWithTemp(this, sampStore, SampleEditor, this.selItem,
      { title:tr('saved-pl')+' '+tr('Samples'), planned:tr('planned-pl')+' '+tr('Samples') }, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, this.initObj.samples.map(s => s.extractTemplate()))),
      this.initObj.template?.samples )

    const tasks = this.initObj.template?.tasklist ?? []
    this.taskEditor = new TaskList( Object.fromEntries(tasks.map(c => [c, this.initObj.completedTasks.includes(c) ])) )
    if (!tasks.length) this.taskEditor.el.classList.add('d-none')

    this.initialize([
      this.makeRow(this.inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(this.inpDesc, tr('Short Description'), <>{tr('loc-short-desc-help')}</>, null),
      rowInst, rowNomCoords,
      this.makeRow(this.inpActCoords, tr('act-coord'), <><strong>{tr('Required')}.</strong> {tr('act-coord-help')} {tr('coord-help')} {tr('dot-minus-hack')} {tr('coord-ref')}</>,
        tr('invalid-coords')),
      this.makeRow(this.inpStart.el, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('loc-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      rowEnd, rowAutoEnd,
      this.makeRow(this.inpNotes, tr('Notes'), <>{tr('loc-notes-help')} {tr('notes-help')}</>, null),
      this.sampEdit.elWithTitle,
      this.taskEditor.el,
    ])
  }

  protected override newObj() { return new SamplingLocation(null) }

  protected override form2obj(saving :boolean) {
    if (saving && this.cbAutoEnd.checked) {
      this.inpEnd.timestamp = timestampNow()
      this.cbAutoEnd.checked = false
    }
    return new SamplingLocation({ template: this.initObj.template, name: this.inpName.value,
      shortDesc: this.inpDesc.value, actualCoords: this.actCoords.deepClone(),
      startTime: this.inpStart.timestamp, endTime: this.inpEnd.timestamp,
      samples: this.initObj.samples, notes: this.inpNotes.value.trim(),
      completedTasks: this.taskEditor.completedTasks(),
      photos: [/*TODO Later*/] })
  }

  override currentName() { return this.inpName.value }

  protected override doScroll() {
    this.ctx.scrollTo( this.isNew || !this.inpName.value.trim().length ? this.inpName
      : !areWgs84CoordsValid(this.actCoords) ? this.inpActCoords
        : this.sampEdit.plannedLeftCount ? this.sampEdit.plannedTitleEl
          : ( this.taskEditor.firstUncheckedEl() ?? ( this.selItem.el ?? this.btnSaveClose ) ) )
  }

}