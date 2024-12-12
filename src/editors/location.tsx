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
import { SamplingLocation } from '../types/location'
import { ListEditorWithTemp } from './list-edit'
import { makeCoordinateEditor } from './coords'
import { EMPTY_COORDS } from '../types/coords'
import { Editor, EditorParent } from './base'
import { setRemove } from '../types/set'
import { SampleEditor } from './sample'
import { tr } from '../i18n'

export class SamplingLocationEditor extends Editor<SamplingLocationEditor, SamplingLocation> {
  protected override readonly form2obj :(saving :boolean)=>Readonly<SamplingLocation>
  protected override newObj() { return new SamplingLocation(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLocation>, targetObj :SamplingLocation|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLInputElement, <input type="text" value={obj.shortDesc.trim()}></input>)
    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{obj.template?.instructions.trim()??''}</textarea>)
    //TODO Later: Users request a bigger "Navigate to" button
    const nomCoords = obj.template?.nomCoords.deepClone() ?? EMPTY_COORDS
    const inpNomCoords = makeCoordinateEditor(nomCoords, true)
    const actCoords = obj.actCoords.deepClone()  // don't modify the original object directly!
    const inpActCoords = makeCoordinateEditor(actCoords, false)

    const tzOff = getTzOffsetStr(new Date())
    const inpStart = new DateTimeInput(obj.startTime, true)
    const inpEnd = new DateTimeInput(obj.endTime, false)
    const rowEnd = this.makeRow(inpEnd.el, tr('End time'), <>{tr('loc-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp'))
    rowEnd.classList.remove('mb-3')
    const cbAutoEnd = safeCastElement(HTMLInputElement, <input class="form-check-input" type="checkbox" id="checkAutoLocEnd" />)
    if (!this.isBrandNew && !isTimestampSet(obj.endTime)) cbAutoEnd.checked = true
    const rowAutoEnd = <div class="row mb-3">
      <div class="col-sm-3"></div>
      <div class="col-sm-9"><div class="form-check"> {cbAutoEnd}
        <label class="form-check-label" for="checkAutoLocEnd">{tr('auto-set-end-time')}</label>
      </div></div>
    </div>

    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.notes.trim()}</textarea>)

    // see notes in procedure.tsx about this:
    const sampStore = new ArrayStore(obj.samples)
    const sampEdit = new ListEditorWithTemp(this, sampStore, SampleEditor, tr('new-samp-from-temp'),
      //TODO Later: Multiple samples of the same type are allowed, don't filter them out here?
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, obj.samples.map(s => s.extractTemplate()))),
      obj.template?.samples )

    this.form2obj = (saving :boolean) => {
      if (saving && cbAutoEnd.checked) {
        inpEnd.timestamp = timestampNow()
        cbAutoEnd.checked = false
      }
      return new SamplingLocation({ template: obj.template, name: inpName.value,
        shortDesc: inpDesc.value, actualCoords: actCoords.deepClone(),
        startTime: inpStart.timestamp, endTime: inpEnd.timestamp,
        samples: obj.samples, notes: inpNotes.value.trim(),
        photos: [/*TODO Later*/] })
    }

    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Short Description'), <>{tr('loc-short-desc-help')}</>, null),
      this.makeRow(inpInst, tr('Instructions'), <>{tr('loc-inst-help')} {tr('inst-help')} {tr('inst-see-notes')}</>, null),
      this.makeRow(inpNomCoords, tr('nom-coord'), <>{tr('nom-coord-help')}</>, null),
      this.makeRow(inpActCoords, tr('act-coord'), <><strong>{tr('Required')}.</strong> {tr('act-coord-help')}</>, tr('invalid-coords')),
      this.makeRow(inpStart.el, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('loc-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      rowEnd, rowAutoEnd,
      this.makeRow(inpNotes, tr('Notes'), <>{tr('loc-notes-help')} {tr('notes-help')}</>, null),
      sampEdit.withBorder(tr('Samples')),
    ])
  }
}