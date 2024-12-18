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
import { areWgs84CoordsValid, EMPTY_COORDS } from '../types/coords'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { DateTimeInput, getTzOffsetStr } from './date-time'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingLocation } from '../types/location'
import { ListEditorWithTemp } from './list-edit'
import { makeCoordinateEditor } from './coords'
import { Editor, EditorParent } from './base'
import { CustomChangeEvent } from '../events'
import { setRemove } from '../types/set'
import { SampleEditor } from './sample'
import { makeHelp } from '../help'
import { tr } from '../i18n'

let _taskId = 0

export class SamplingLocationEditor extends Editor<SamplingLocationEditor, SamplingLocation> {
  override readonly currentName
  protected override readonly form2obj
  protected override newObj() { return new SamplingLocation(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLocation>, targetObj :SamplingLocation|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpName = safeCastElement(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLInputElement, <input type="text" value={obj.shortDesc.trim()}></input>)

    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{obj.template?.instructions.trim()??''}</textarea>)
    const rowInst = this.makeRow(inpInst, tr('Instructions'), <>{tr('loc-inst-help')} {tr('temp-copied-readonly')} {tr('inst-see-notes')}</>, null)
    if (!obj.template?.instructions.trim().length)
      rowInst.classList.add('d-none')

    //TODO Later: Users request a bigger "Navigate to" button
    const nomCoords = obj.template?.nomCoords.deepClone() ?? EMPTY_COORDS
    const inpNomCoords = makeCoordinateEditor(nomCoords, true)
    const rowNomCoords = this.makeRow(inpNomCoords, tr('nom-coord'), <>{tr('nom-coord-help')} {tr('temp-copied-readonly')} {tr('coord-ref')}</>, null)
    if (!areWgs84CoordsValid(nomCoords))
      rowNomCoords.classList.add('d-none')

    const actCoords = obj.actCoords.deepClone()  // don't modify the original object directly!
    const inpActCoords = makeCoordinateEditor(actCoords, false)

    const tzOff = getTzOffsetStr(new Date())
    const inpStart = new DateTimeInput(obj.startTime, true)
    const inpEnd = new DateTimeInput(obj.endTime, false)
    const rowEnd = this.makeRow(inpEnd.el, tr('End time'), <><em>{tr('Recommended')}.</em> {tr('loc-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp'))
    rowEnd.classList.remove('mb-2','mb-sm-3')
    const cbAutoEnd = safeCastElement(HTMLInputElement, <input class="form-check-input" type="checkbox" id="checkAutoLocEnd" />)
    if (!this.isBrandNew && !isTimestampSet(obj.endTime)) cbAutoEnd.checked = true
    const rowAutoEnd = <div class="row mb-3">
      <div class="col-sm-3"></div>
      <div class="col-sm-9"><div class="form-check"> {cbAutoEnd}
        <label class="form-check-label" for="checkAutoLocEnd">{tr('auto-set-end-time')}</label>
      </div></div>
    </div>

    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.notes.trim()}</textarea>)

    const sampStore = new ArrayStore(obj.samples)
    const sampEdit = new ListEditorWithTemp(this, sampStore, SampleEditor,
      { title:tr('saved-pl')+' '+tr('Samples'), planned:tr('planned-pl')+' '+tr('Samples') }, tr('new-samp-from-temp'),
      //TODO Later: Multiple samples of the same type are allowed, don't filter them out here?
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, obj.samples.map(s => s.extractTemplate()))),
      obj.template?.samples )

    const tasks = obj.template?.tasklist ?? []
    const taskStates :{ [key :string]: boolean } = Object.fromEntries(tasks.map(c => [c, obj.completedTasks.includes(c) ]))
    const taskHelp = <div class="form-text my-0">{tr('tasklist-help')}</div>
    const [_taskHelpId, taskHelpBtn] = makeHelp(taskHelp)
    const taskEditor = <div class="my-3">
      <hr class="mt-4 mb-2" />
      <h5 class="mb-0">{tr('Task List')} {taskHelpBtn}</h5>
      {taskHelp}
      <ul class="list-group custom-tasklist my-2">
        {tasks.map(c => {
          const id = `tasklistCheckbox${_taskId++}`
          const cb = safeCastElement(HTMLInputElement,
            <input class="form-check-input me-2" type="checkbox" autocomplete="off"
              id={id} checked={!!taskStates[c]} onchange={()=>{
                taskStates[c] = cb.checked
                this.el.dispatchEvent(new CustomChangeEvent())
              }} />)
          const btn = <div class="custom-cb-btn" onclick={(event: Event) => { if (event.target===btn) cb.click() } }>
            {cb}<label class="form-check-label" for={id}>{tr('Completed')}</label></div>
          const li = <li class="list-group-item d-flex justify-content-between align-items-center">
            <div class="me-auto">{c}</div>
            <div class="ms-3">{btn}</div>
          </li>
          return li
        })}
      </ul>
    </div>
    if (!tasks.length) taskEditor.classList.add('d-none')

    this.form2obj = (saving :boolean) => {
      if (saving && cbAutoEnd.checked) {
        inpEnd.timestamp = timestampNow()
        cbAutoEnd.checked = false
      }
      return new SamplingLocation({ template: obj.template, name: inpName.value,
        shortDesc: inpDesc.value, actualCoords: actCoords.deepClone(),
        startTime: inpStart.timestamp, endTime: inpEnd.timestamp,
        samples: obj.samples, notes: inpNotes.value.trim(),
        completedTasks: Object.entries(taskStates).flatMap(([k,v]) => v ? [k] : []),
        photos: [/*TODO Later*/] })
    }
    this.currentName = () => inpName.value

    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Short Description'), <>{tr('loc-short-desc-help')}</>, null),
      rowInst, rowNomCoords,
      this.makeRow(inpActCoords, tr('act-coord'), <><strong>{tr('Required')}.</strong> {tr('act-coord-help')} {tr('coord-help')} {tr('dot-minus-hack')} {tr('coord-ref')}</>,
        tr('invalid-coords')),
      this.makeRow(inpStart.el, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('loc-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      rowEnd, rowAutoEnd,
      this.makeRow(inpNotes, tr('Notes'), <>{tr('loc-notes-help')} {tr('notes-help')}</>, null),
      sampEdit.elWithTitle,
      taskEditor,
    ])
  }
}