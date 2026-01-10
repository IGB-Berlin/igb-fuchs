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
import { ListEditorWithTemp, SelectedItemContainer } from './list-edit'
import { jsx, jsxFragment, safeCast } from '@haukex/simple-jsx-dom'
import { isTimestampSet, VALID_NAME_RE } from '../types/common'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingLocation } from '../types/location'
import { StartEndTimeEditor } from './date-time'
import { EMPTY_COORDS } from '../types/coords'
import { Editor, EditorParent } from './base'
import { CustomChangeEvent } from '../events'
import { SuperCoordEditor } from './coords'
import { Sample } from '../types/sample'
import { setRemove } from '../types/set'
import { SampleEditor } from './sample'
import { GlobalContext } from '../main'
import { makeHelp } from '../help'
import { tr } from '../i18n'

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
      const id = GlobalContext.genId('TasklistCb')
      const cb = safeCast(HTMLInputElement,
        <input class="form-check-input me-2" type="checkbox" autocomplete="off"
          id={id} checked={!!this.taskStates[c]} onchange={()=>{
            this.taskStates[c] = cb.checked
            this.el.dispatchEvent(new CustomChangeEvent())
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
      <h5 class="mb-0"><i class="bi-clipboard-check"/> {tr('Task List')} {taskHelpBtn}</h5>
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
  private readonly coordEditor :SuperCoordEditor<SamplingLocation>
  private readonly edTimes :StartEndTimeEditor<SamplingLocation>
  private readonly inpNotes
  private readonly sampEdit
  private readonly taskEditor
  private readonly selItem :SelectedItemContainer = { el: null }
  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLocation>, targetObj :SamplingLocation|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    this.inpName = safeCast(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    this.inpDesc = safeCast(HTMLInputElement, <input type="text" value={this.initObj.shortDesc.trim()}></input>)

    const rowInst = this.makeTextAreaRow(this.initObj.template?.instructions, {
      label: tr('Instructions'), helpText: <>{tr('loc-inst-help')} {tr('temp-copied-readonly')} {tr('inst-see-notes')}</>,
      readonly: true, startExpanded: this.isNew, hideWhenEmpty: true })[0]

    this.coordEditor = new SuperCoordEditor(this, this.initObj.template?.nomCoords ?? EMPTY_COORDS, this.initObj.actCoords)

    this.edTimes = new StartEndTimeEditor(this, this.initObj.startTime, this.initObj.endTime,
      !this.isUnsaved && !isTimestampSet(this.initObj.endTime), 'loc')

    const [rowNotes, inpNotes] = this.makeTextAreaRow(this.initObj.notes, {
      label: tr('Notes'), helpText: <>{tr('loc-notes-help')} {tr('notes-help')}</>, startExpanded: true })
    this.inpNotes = inpNotes

    const sampStore = new ArrayStore(this.initObj.samples)
    this.sampEdit = new ListEditorWithTemp({ parent: this, theStore: sampStore, editorClass: SampleEditor, editorStyle: Sample.sStyle, selItem: this.selItem,
      title: tr('saved-pl')+' '+tr('Samples'), txtPlanned: tr('planned-pl')+' '+tr('Samples'), dialogTitle: tr('new-samp-from-temp'),
      templateSource: ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, this.initObj.samples.map(s => s.extractTemplate()))),
      planned: this.initObj.template?.samples })

    const tasks = this.initObj.template?.tasklist ?? []
    this.taskEditor = new TaskList(Object.fromEntries(tasks.map(c => [c, this.initObj.completedTasks.includes(c) ])) )
    this.taskEditor.el.addEventListener(CustomChangeEvent.NAME, () => this.el.dispatchEvent(new CustomChangeEvent()))
    if (!tasks.length) this.taskEditor.el.classList.add('d-none')

    this.setFormContents([
      this.makeRow(this.inpName, { label: tr('Name'),
        helpText: <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, invalidText: tr('Invalid name') }),
      this.makeRow(this.inpDesc, { label: tr('Short Description'), helpText: <>{tr('loc-short-desc-help')}</> }),
      rowInst, this.coordEditor.el, this.edTimes.el, rowNotes, this.sampEdit.elWithTitle, this.taskEditor.el,
    ])
  }
  override async initialize() {
    await this.sampEdit.initialize()
    await this.initDone()
    return this
  }

  protected override newObj() { return new SamplingLocation(null) }

  protected override form2obj(saving :boolean) {
    if (saving) this.edTimes.doSaveEnd()
    return new SamplingLocation({ template: this.initObj.template, name: this.inpName.value,
      shortDesc: this.inpDesc.value, actualCoords: this.coordEditor.getActCoords(),
      startTime: this.edTimes.getStart(), endTime: this.edTimes.getEnd(),
      samples: this.initObj.samples, notes: this.inpNotes.value.trim(),
      completedTasks: this.taskEditor.completedTasks(),
      photos: [/*...*/] })
  }

  protected override customValidation(skipInitWarns :boolean) {
    return skipInitWarns || isTimestampSet(this.edTimes.getEnd()) || this.edTimes.isAutoSetEndOn() ? [] : [tr('No end time')]
  }

  override currentName() { return this.inpName.value }

  protected override doScroll(pushNotPop :boolean) {
    this.ctx.scrollTo( this.isNew && pushNotPop || !this.inpName.value.trim().length ? this.inpName
      : !this.coordEditor.isActValid() ? this.coordEditor.el
        : this.sampEdit.plannedLeftCount ? this.sampEdit.plannedTitleEl
          : ( this.taskEditor.firstUncheckedEl() ?? ( this.selItem.el ?? this.btnSaveClose ) ) )
  }

  override nextButtonText() {
    return this.sampEdit.plannedLeftCount ? <>{tr('Save') + ' & ' + tr('Next')+' '+tr('Sample')}</> : null }
  override async doNext() { return this.sampEdit.startFirstPlannedItem() }

}