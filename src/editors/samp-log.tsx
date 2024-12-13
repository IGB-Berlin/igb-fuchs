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

export class SamplingLogEditor extends Editor<SamplingLogEditor, SamplingLog> {
  override readonly currentName :()=>string
  protected override readonly form2obj :(saving :boolean)=>Readonly<SamplingLog>
  protected override newObj() { return new SamplingLog(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLog>, targetObj :SamplingLog|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{obj.template?.instructions.trim()??''}</textarea>)

    const tzOff = getTzOffsetStr(new Date())
    const inpStart = new DateTimeInput(obj.startTime, true)
    const inpEnd = new DateTimeInput(obj.endTime, false)
    const rowEnd = this.makeRow(inpEnd.el, tr('End time'), <>{tr('log-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp'))
    rowEnd.classList.remove('mb-3')
    const cbAutoEnd = safeCastElement(HTMLInputElement, <input class="form-check-input" type="checkbox" id="checkAutoLogEnd" />)
    if (!this.isBrandNew && !isTimestampSet(obj.endTime)) cbAutoEnd.checked = true
    const rowAutoEnd = <div class="row mb-3">
      <div class="col-sm-3"></div>
      <div class="col-sm-9"><div class="form-check"> {cbAutoEnd}
        <label class="form-check-label" for="checkAutoLogEnd">{tr('auto-set-end-time')}</label>
      </div></div>
    </div>

    const inpPersons = safeCastElement(HTMLInputElement, <input type="text" value={obj.persons.trim()} />)
    const inpWeather = safeCastElement(HTMLInputElement, <input type="text" value={obj.weather.trim()} />)
    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.notes.trim()}</textarea>)

    const checks = obj.template?.checklist ?? []
    const checkStates :{ [key :string]: boolean } = Object.fromEntries(checks.map(c => [c, obj.checkedTasks.includes(c) ]))
    const grpCheck = safeCastElement(HTMLDivElement,
      <div><ul class="list-group custom-checklist">
        {checks.map(c => {
          const id = `checklistCheckbox${_checkId++}`
          const cb = safeCastElement(HTMLInputElement, <input class="form-check-input me-2" type="checkbox" id={id}
            checked={!!checkStates[c]} onchange={()=>{
              checkStates[c] = cb.checked
              this.el.dispatchEvent(new CustomChangeEvent())
            }} />)
          const li = <li class="list-group-item" onclick={(event: Event) => { if (event.target===li) cb.click() } }>
            {cb}<label class="form-check-label" for={id}>{c}</label></li>
          return li
        })}
      </ul></div>)
    const rowCheck = this.makeRow(grpCheck, tr('Checklist'), tr('checklist-help'), null)
    if (!checks.length) rowCheck.classList.add('d-none')

    /* TODO Later: The location list should also be sorted by distance from our current location.
     * This also applies to all other places where locations lists occur! (e.g. From Template dialog) */
    // TODO Later: In general, when deduplicating lists of templates, do we need a less strict `equals`?
    // see notes in procedure.tsx about this:
    const locStore = new ArrayStore(obj.locations)
    const locEdit = new ListEditorWithTemp(this, locStore, SamplingLocationEditor,
      { title:tr('saved-pl')+' '+tr('Sampling Locations'), planned:tr('planned-pl')+' '+tr('Sampling Locations') }, tr('new-loc-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allLocationTemplates, obj.locations.map(l => l.extractTemplate().cloneNoSamples()))),
      obj.template?.locations )

    this.form2obj = (saving :boolean) => {
      if (saving && cbAutoEnd.checked) {
        inpEnd.timestamp = timestampNow()
        cbAutoEnd.checked = false
      }
      return new SamplingLog({ id: obj.id, template: obj.template,
        name: inpName.value, startTime: inpStart.timestamp, endTime: inpEnd.timestamp,
        lastModified: timestampNow(), persons: inpPersons.value.trim(), weather: inpWeather.value.trim(),
        notes: inpNotes.value.trim(), locations: obj.locations,
        checkedTasks: Object.entries(checkStates).flatMap(([k,v]) => v ? [k] : []) })
    }
    this.currentName = () => inpName.value

    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      rowCheck,
      this.makeRow(inpInst, tr('Instructions'), <>{tr('proc-inst-help')} {tr('inst-help')} {tr('inst-see-notes')}</>, null),
      this.makeRow(inpStart.el, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('log-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      rowEnd, rowAutoEnd,
      this.makeRow(inpPersons, tr('Persons'), <>{tr('persons-help')}</>, null),
      this.makeRow(inpWeather, tr('Weather'), <>{tr('weather-help')}</>, null),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('log-notes-help')} {tr('notes-help')}</>, null),
      locEdit.elWithBorder,
    ])
  }
}