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
import { isTimestampSet, timestampNow, VALID_NAME_RE } from '../types/common'
import { ListEditorWithTemp, SelectedItemContainer } from './list-edit'
import { jsx, jsxFragment, safeCast } from '@haukex/simple-jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingLocation } from '../types/location'
import { SamplingLocationEditor } from './location'
import { StartEndTimeEditor } from './date-time'
import { SamplingLog } from '../types/sampling'
import { Editor, EditorParent } from './base'
import { CustomChangeEvent } from '../events'
import { setRemove } from '../types/set'
import { GlobalContext } from '../main'
import { i18n, tr } from '../i18n'

class CheckList {
  readonly el
  private readonly checkStates
  private readonly checkItems :[HTMLElement, HTMLInputElement][]
  constructor(initialCheckStates :{ [key :string]: boolean }) {
    this.checkStates = initialCheckStates
    const checks = Object.keys(initialCheckStates)
    let allChecked = true as boolean
    this.checkItems = checks.map(c => {
      if (!this.checkStates[c]) allChecked = false
      const id = GlobalContext.genId('ChecklistCb')
      const cb = safeCast(HTMLInputElement, <input class="form-check-input me-2" type="checkbox" id={id}
        checked={!!this.checkStates[c]} onchange={()=>{
          this.checkStates[c] = cb.checked
          this.el.dispatchEvent(new CustomChangeEvent())
        }} />)
      const li = <li class="list-group-item" onclick={(event: Event) => { if (event.target===li) cb.click() } }>
        {cb}<label class="form-check-label" for={id}>{c}</label></li>
      return [li, cb]
    })
    const theList = <ul class="list-group custom-checklist">{this.checkItems.map(i=>i[0])}</ul>
    const lnkShowList = <a href="#">{tr('Show checklist')}</a>
    const showList = <ul class="list-group"><li class="list-group-item">
      <span class="text-success-emphasis me-1">{i18n.t('checklist-complete', { count: this.checkItems.length })}.</span>
      {lnkShowList} </li></ul>
    lnkShowList.addEventListener('click', event => {
      event.preventDefault()
      theList.classList.remove('d-none')
      showList.classList.add('d-none')
    })
    if ( allChecked && this.checkItems.length>1 ) theList.classList.add('d-none')
    else showList.classList.add('d-none')
    this.el = safeCast(HTMLDivElement, <div>{showList}{theList}</div> )
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
  private readonly edTimes :StartEndTimeEditor<SamplingLog>
  private readonly inpPersons
  private readonly inpWeather
  private readonly inpNotes
  private readonly checkList
  private readonly locEdit
  private readonly selItem :SelectedItemContainer = { el: null }
  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLog>, targetObj :SamplingLog|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    this.inpName = safeCast(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    const rowInst = this.makeTextAreaRow(this.initObj.template?.instructions, {
      label: tr('Instructions'), helpText: <>{tr('proc-inst-help')} {tr('temp-copied-readonly')} {tr('inst-see-notes')}</>,
      readonly: true, startExpanded: this.isNew, hideWhenEmpty: true })[0]

    this.edTimes = new StartEndTimeEditor(this, this.initObj.startTime, this.initObj.endTime,
      !this.isUnsaved && !isTimestampSet(this.initObj.endTime), 'log')

    this.inpPersons = safeCast(HTMLInputElement, <input type="text" value={this.initObj.persons.trim()} />)
    this.inpWeather = safeCast(HTMLInputElement, <input type="text" value={this.initObj.weather.trim()} />)
    const [rowNotes, inpNotes] = this.makeTextAreaRow(this.initObj.notes, {
      label: tr('Notes'), helpText: <>{tr('log-notes-help')} {tr('notes-help')}</>, startExpanded: true })
    this.inpNotes = inpNotes

    const checklist = this.initObj.template?.checklist ?? []
    this.checkList = new CheckList(Object.fromEntries(checklist.map(c => [c, this.initObj.checkedTasks.includes(c)] )) )
    this.checkList.el.addEventListener(CustomChangeEvent.NAME, () => this.el.dispatchEvent(new CustomChangeEvent()))
    const rowCheck = this.makeRow(this.checkList.el, { label: tr('Checklist'), helpText: tr('checklist-help') })
    if (!checklist.length) rowCheck.classList.add('d-none')

    this.locEdit = new ListEditorWithTemp({ parent: this, theStore: new ArrayStore(this.initObj.locations), editorClass: SamplingLocationEditor, editorStyle: SamplingLocation.sStyle,
      selItem: this.selItem, title: tr('saved-pl')+' '+tr('Sampling Locations'), txtPlanned: tr('planned-pl')+' '+tr('Sampling Locations'), dialogTitle: tr('new-loc-from-temp'),
      templateSource: ()=>Promise.resolve(setRemove(this.ctx.storage.allLocationTemplates, this.initObj.locations.map(l => l.extractTemplate().cloneNoSamples()))),
      planned: this.initObj.template?.locations })

    this.setFormContents([
      this.makeRow(this.inpName, { label: tr('Name'),
        helpText: <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, invalidText: tr('Invalid name') }),
      rowInst, this.edTimes.el,
      this.makeRow(this.inpPersons, { label: tr('Persons'), helpText: <>{tr('persons-help')}</> }),
      this.makeRow(this.inpWeather, { label: tr('Weather'), helpText: <>{tr('weather-help')}</> }),
      rowNotes, rowCheck, this.locEdit.elWithTitle,
    ])
  }
  override async initialize() {
    await this.locEdit.initialize()
    await this.initDone()
    return this
  }

  protected override newObj() { return new SamplingLog(null) }

  protected override form2obj(saving :boolean) {
    if (saving) this.edTimes.doSaveEnd()
    return new SamplingLog({ id: this.initObj.id, template: this.initObj.template,
      name: this.inpName.value, startTime: this.edTimes.getStart(), endTime: this.edTimes.getEnd(),
      lastModified: timestampNow(), persons: this.inpPersons.value.trim(), weather: this.inpWeather.value.trim(),
      notes: this.inpNotes.value.trim(), locations: this.initObj.locations,
      checkedTasks: this.checkList.checkedTasks() })
  }

  protected override customValidation(skipInitWarns :boolean) {
    return skipInitWarns || isTimestampSet(this.edTimes.getEnd()) || this.edTimes.isAutoSetEndOn() ? [] : [tr('No end time')]
  }

  override currentName() { return this.inpName.value }

  protected override doScroll(pushNotPop :boolean) {
    this.ctx.scrollTo( this.isNew && pushNotPop || !this.inpName.value.trim().length ? this.inpName
      : ( this.checkList.firstUncheckedEl() ?? (
        this.locEdit.plannedLeftCount ? this.locEdit.plannedTitleEl : ( this.selItem.el ?? this.btnSaveClose )
      ) ) )
  }

  override nextButtonText() {
    return this.locEdit.plannedLeftCount ? <>{tr('Save') + ' & ' + tr('Next')+' '+tr('Sampling Location')}</> : null }
  override async doNext() { return this.locEdit.startFirstPlannedItem() }

}