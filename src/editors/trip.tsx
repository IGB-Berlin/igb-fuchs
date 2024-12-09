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
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { timestampNow, VALID_NAME_RE } from '../types/common'
import { SamplingLocationTemplate } from '../types/location'
import { DateTimeInput, getTzOffsetStr } from './date-time'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingLocationEditor } from './location'
import { ListEditorWithTemp } from './list-edit'
import { Editor, EditorParent } from './base'
import { SamplingTrip } from '../types/trip'
import { setRemove } from '../types/set'
import { tr } from '../i18n'

let _checkId = 0

export class SamplingTripEditor extends Editor<SamplingTripEditor, SamplingTrip> {
  protected override readonly form2obj :()=>Readonly<SamplingTrip>
  protected override newObj() { return new SamplingTrip(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingTrip>, targetObj :SamplingTrip|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{obj.template?.description.trim()??''}</textarea>)
    const inpStart = new DateTimeInput(obj.startTime, true)
    const inpEnd = new DateTimeInput(obj.endTime, false)
    const inpPersons = safeCastElement(HTMLInputElement, <input type="text" value={obj.persons.trim()} />)
    const inpWeather = safeCastElement(HTMLInputElement, <input type="text" value={obj.weather.trim()} />)
    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.notes.trim()}</textarea>)

    const checks = obj.template?.checklist ?? []
    const checkStates :{ [key :string]: boolean } = Object.fromEntries(checks.map(c => [c, obj.checkedTasks.includes(c) ]))
    const grpCheck = safeCastElement(HTMLDivElement,
      <div><ul class="list-group custom-checklist">
        {checks.map(c => {
          const id = `checklistCheckbox${_checkId++}`
          const cb = safeCastElement(HTMLInputElement, <input class="form-check-input me-2" type="checkbox" id={id} />)
          cb.checked = checkStates[c] ?? false
          cb.addEventListener('change', () => checkStates[c] = cb.checked )
          return <li class="list-group-item" onclick={(event :Event) => { if (event.target!==cb) cb.click() }}>
            {cb}<label class="form-check-label" for={id}>{c}</label></li>
        })}
      </ul></div>)
    const rowCheck = this.makeRow(grpCheck, tr('Checklist'), tr('checklist-help'), null)
    if (!checks.length) rowCheck.classList.add('d-none')

    const getPlannedLocs = async () => {
      if (!obj.template) return []
      /* We want to get a list of the locations planned in the trip template,
       * remove the locations we already have records for (ignoring the number of samples),
       * and populate any locations that have no samples from commonSamples.
       * TODO: All of the "planned template" code should now use the object's template and (delete items from there as they are added!)
       */
      /* TODO Later: The location list should also be sorted by distance from our current location.
       * This also applies to all other places where locations lists occur! (e.g. From Template dialog) */
      const visitedLocs = obj.locations.map(l => l.extractTemplate().cloneNoSamples())
      const plannedLocs :SamplingLocationTemplate[] = []
      for(const loc of obj.template.locations) {
        const locNoSamp = loc.cloneNoSamples()
        if ( visitedLocs.findIndex(e => e.equals(locNoSamp)) < 0 ) {  // not seen before
          const l = loc.deepClone()
          if (!l.samples.length) l.samples.push(...obj.template.commonSamples)
          plannedLocs.push(l)
        }
      }
      return plannedLocs
    }

    // see notes in trip-temp.tsx about this:
    const locStore = new ArrayStore(obj.locations)
    const locEdit = new ListEditorWithTemp(this, locStore, SamplingLocationEditor, tr('new-loc-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allLocationTemplates, obj.locations.map(l => l.extractTemplate().cloneNoSamples()))),
      getPlannedLocs )

    this.form2obj = () => new SamplingTrip({ id: obj.id, template: obj.template,
      name: inpName.value, startTime: inpStart.timestamp, endTime: inpEnd.timestamp,
      lastModified: timestampNow(), persons: inpPersons.value.trim(), weather: inpWeather.value.trim(),
      notes: inpNotes.value.trim(), locations: obj.locations,
      checkedTasks: Object.entries(checkStates).flatMap(([k,v]) => v ? [k] : []) })

    const tzOff = getTzOffsetStr(new Date())
    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), <>{tr('trip-desc-help')} {tr('desc-help')} {tr('desc-see-notes')}</>, null),
      rowCheck,
      this.makeRow(inpStart.el, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('trip-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(inpEnd.el, tr('End time'), <>{tr('trip-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(inpPersons, tr('Persons'), <>{tr('persons-help')}</>, null),
      this.makeRow(inpWeather, tr('Weather'), <>{tr('weather-help')}</>, null),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('trip-notes-help')} {tr('notes-help')}</>, null),
      locEdit.withBorder(tr('Sampling Locations')),
    ])
  }
}