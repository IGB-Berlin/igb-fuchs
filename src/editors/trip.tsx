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
import { NO_TIMESTAMP, timestampNow, VALID_NAME_RE } from '../types/common'
import { dateTimeLocalInputToDate, getTzOffset } from '../date'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { SamplingLocationTemplate } from '../types/location'
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
  static override readonly briefTitle: string = tr('Trip')
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingTrip>
  protected override readonly form2obj :()=>Readonly<SamplingTrip>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<SamplingTrip>, targetObj :SamplingTrip|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new SamplingTrip(null, null)
    //TODO Later: A reload causes us to lose association with obj.template. Is there any way to persist that?

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.description.trim()}</textarea>)
    const [inpStart, grpStart] = this.makeDtSelect(obj.startTime)
    inpStart.setAttribute('required', 'required')
    const [inpEnd, grpEnd] = this.makeDtSelect(obj.endTime)
    const inpPersons = safeCastElement(HTMLInputElement, <input type="text" value={obj.persons.trim()} />)
    const inpWeather = safeCastElement(HTMLInputElement, <input type="text" value={obj.weather.trim()} />)
    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.notes.trim()}</textarea>)

    const getPlannedLocs = async () => {
      if (!obj.template) return []
      /* We want to get a list of the locations planned in the trip template,
       * remove the locations we already have records for (ignoring the number of samples),
       * and populate any locations that have no samples from commonSamples.
       * TODO Later: The location list should also be sorted by distance from our current location.
       */
      const visitedLocs = obj.locations.map(l => l.extractTemplate().cloneNoSamples())
      const plannedLocs :SamplingLocationTemplate[] = []
      for(const loc of obj.template.locations) {
        const locNoSamp = loc.cloneNoSamples()
        if ( visitedLocs.findIndex(e => e.equals(locNoSamp)) < 0 ) {  // not seen before
          const l = loc.deepClone()
          if (!l.samples.length) l.samples = obj.template.commonSamples
          plannedLocs.push(l)
        }
      }
      return plannedLocs
    }

    // see notes in trip-temp.tsx about this:
    const locStore = new ArrayStore(obj.locations)
    const locEdit = new ListEditorWithTemp(ctx, locStore, SamplingLocationEditor, tr('new-loc-from-temp'),
      ()=>Promise.resolve(setRemove(ctx.storage.allLocationTemplates, obj.locations.map(l => l.extractTemplate().cloneNoSamples()))),
      getPlannedLocs )
    locStore.events.add(() => this.reportMod())
    locEdit.watchEnable(this)
    this.onClose = () => locEdit.close()

    const tzOff = getTzOffset(new Date())
    this.el = this.form = this.makeForm(tr('Sampling Trip'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), <>{tr('trip-desc-help')} {tr('desc-help')}</>, null),
      this.makeRow(grpStart, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('trip-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(grpEnd, tr('End time'), <>{tr('trip-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(inpPersons, tr('Persons'), <>{tr('persons-help')}</>, null),
      this.makeRow(inpWeather, tr('Weather'), <>{tr('weather-help')}</>, null),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('trip-notes-help')} {tr('notes-help')}</>, null),
      locEdit.withBorder(tr('Sampling Locations')),
    ])

    this.form2obj = () => new SamplingTrip({ id: obj.id,
      name: inpName.value, description: inpDesc.value.trim(),
      startTime: dateTimeLocalInputToDate(inpStart)?.getTime() ?? NO_TIMESTAMP,
      endTime:   dateTimeLocalInputToDate(inpEnd)?.getTime() ?? NO_TIMESTAMP,
      lastModified: timestampNow(), persons: inpPersons.value.trim(),
      weather: inpWeather.value.trim(), notes: inpNotes.value.trim(),
      locations: obj.locations }, obj.template)

    this.open()
  }
}