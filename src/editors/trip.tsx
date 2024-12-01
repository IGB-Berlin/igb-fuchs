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
import { isTimestampSet, NO_TIMESTAMP, timestampNow, VALID_NAME_RE } from '../types/common'
import { dateTimeLocalInputToDate, dateToLocalString, getTzOffset } from '../date'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingLocationEditor } from './location'
import { ListEditorWithTemp } from './list-edit'
import { SamplingTrip } from '../types/trip'
import { setRemove } from '../types/set'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class SamplingTripEditor extends Editor<SamplingTripEditor, SamplingTrip> {
  override readonly el :HTMLElement
  static override readonly briefTitle: string = tr('trip-temp')
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingTrip>
  protected override readonly form2obj :()=>Readonly<SamplingTrip>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<SamplingTrip>, targetObj :SamplingTrip|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new SamplingTrip(null, null)

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="3">{obj.description.trim()}</textarea>)
    const inpStart = safeCastElement(HTMLInputElement, <input class="form-control" type="datetime-local"
      value={isTimestampSet(obj.startTime) ? dateToLocalString(new Date(obj.startTime)) : ''} required />)
    const grpStart = <div class="input-group">
      <button type="button" class="btn btn-outline-secondary" title={tr('Use current date and time')}
        onclick={()=>inpStart.value=dateToLocalString(new Date())}>
        <i class="bi-clock me-1"/> {tr('Now')}
      </button>
      {inpStart}
    </div>
    const inpEnd = safeCastElement(HTMLInputElement, <input class="form-control" type="datetime-local"
      value={isTimestampSet(obj.endTime) ? dateToLocalString(new Date(obj.endTime)) : ''} />)
    const grpEnd = <div class="input-group">
      <button type="button" class="btn btn-outline-secondary" title={tr('Use current date and time')}
        onclick={()=>inpEnd.value=dateToLocalString(new Date())}>
        <i class="bi-clock me-1"/> {tr('Now')}
      </button> {inpEnd}
    </div>
    const inpPersons = safeCastElement(HTMLInputElement, <input type="text" value={obj.persons.trim()} />)
    const inpWeather = safeCastElement(HTMLInputElement, <input type="text" value={obj.weather.trim()} />)
    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="3">{obj.notes.trim()}</textarea>)

    // see notes in trip-temp.tsx about this:
    const locStore = new ArrayStore(obj.locations)
    const locEdit = new ListEditorWithTemp(ctx, locStore, SamplingLocationEditor, tr('new-loc-from-temp'),
      ()=>Promise.resolve(setRemove(ctx.storage.allLocationTemplates, obj.locations.map(l => l.extractTemplate().cloneNoSamples()))))
    locStore.events.add(() => this.reportMod())
    locEdit.watchEnable(this)
    this.onClose = () => locEdit.close()
    //TODO: how to best use this.obj.template?

    const tzOff = getTzOffset(new Date())
    this.el = this.form = this.makeForm(tr('Sampling Trip'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('trip-desc-help'), null),
      this.makeRow(grpStart, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(grpEnd, tr('End time'), <>{tr('end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(inpPersons, tr('Persons'), <>{tr('persons-help')}</>, null),
      this.makeRow(inpWeather, tr('Weather'), <>{tr('weather-help')}</>, null),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('trip-notes-help')}</>, null),
      locEdit.withBorder(tr('Sampling Locations')),
    ])

    this.form2obj = () => new SamplingTrip({ id: obj.id,
      name: inpName.value, description: inpDesc.value.trim(),
      startTime: dateTimeLocalInputToDate(inpStart)?.getTime() ?? NO_TIMESTAMP,
      endTime:   dateTimeLocalInputToDate(inpEnd)?.getTime() ?? NO_TIMESTAMP,
      lastModified: timestampNow(), persons: inpPersons.value.trim(),
      weather: inpWeather.value.trim(), notes: inpNotes.value.trim(),
      locations: obj.locations }, null)

    this.open()
  }
}