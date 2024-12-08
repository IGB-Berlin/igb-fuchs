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
import { DateTimeInput, getTzOffsetStr } from './date-time'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingLocation } from '../types/location'
import { Wgs84Coordinates } from '../types/coords'
import { ListEditorWithTemp } from './list-edit'
import { VALID_NAME_RE } from '../types/common'
import { makeCoordinateEditor } from './coords'
import { Editor, EditorParent } from './base'
import { setRemove } from '../types/set'
import { SampleEditor } from './sample'
import { tr } from '../i18n'

export class SamplingLocationEditor extends Editor<SamplingLocationEditor, SamplingLocation> {
  protected override readonly form2obj :()=>Readonly<SamplingLocation>
  protected override newObj() { return new SamplingLocation(null, null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLocation>, targetObj :SamplingLocation|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.description.trim()}</textarea>)
    const nomCoords = obj.nomCoords.deepClone().toJSON('')  // don't modify the original object directly!
    const inpNomCoords = makeCoordinateEditor(nomCoords)
    const actCoords = obj.actCoords.deepClone().toJSON('')  // don't modify the original object directly!
    const inpActCoords = makeCoordinateEditor(actCoords)
    const inpStart = new DateTimeInput(obj.startTime, true)
    const inpEnd = new DateTimeInput(obj.endTime, false)
    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.notes.trim()}</textarea>)

    // see notes in trip-temp.tsx about this:
    const sampStore = new ArrayStore(obj.samples)
    const template = obj.template
    const sampEdit = new ListEditorWithTemp(this, sampStore, SampleEditor, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, obj.samples.map(s => s.extractTemplate()))),
      template ? ()=>Promise.resolve(setRemove(template.samples, obj.samples.map(s => s.extractTemplate()))) : null )

    this.form2obj = () => new SamplingLocation({
      name: inpName.value, description: inpDesc.value.trim(),
      nominalCoords: new Wgs84Coordinates(nomCoords).deepClone(),
      actualCoords: new Wgs84Coordinates(actCoords).deepClone(),
      startTime: inpStart.timestamp, endTime: inpEnd.timestamp,
      samples: obj.samples, notes: inpNotes.value.trim(),
      photos: [], //TODO Later
    }, obj.template)

    const tzOff = getTzOffsetStr(new Date())
    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), <>{tr('loc-desc-help')} {tr('desc-help')} {tr('desc-see-notes')}</>, null),
      this.makeRow(inpNomCoords, tr('nom-coord'), tr('nom-coord-help'), tr('invalid-coords')),
      this.makeRow(inpActCoords, tr('act-coord'), tr('act-coord-help'), tr('invalid-coords')),
      this.makeRow(inpStart.el, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('loc-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(inpEnd.el, tr('End time'), <>{tr('loc-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('loc-notes-help')} {tr('notes-help')}</>, null),
      sampEdit.withBorder(tr('Samples')),
    ])
  }
}