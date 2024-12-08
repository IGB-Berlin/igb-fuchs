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
import { CustomChangeEvent, CustomStoreEvent } from '../events'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { MeasurementType } from '../types/meas-type'
import { listSelectDialog } from './list-dialog'
import { Editor, EditorParent } from './base'
import { MeasTypeEditor } from './meas-type'
import { DateTimeInput } from './date-time'
import { Measurement } from '../types/meas'
import { tr } from '../i18n'

export class MeasurementEditor extends Editor<MeasurementEditor, Measurement> {
  protected override readonly form2obj :()=>Readonly<Measurement>
  protected override newObj() { return new Measurement(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<Measurement>, targetObj :Measurement|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const measType :[MeasurementType] = [obj.type]
    const mtStore = new ArrayStore(measType)

    const inpType = safeCastElement(HTMLInputElement, <input class="form-control" type="text" value="" readonly required /> )
    const btnTypeEdit = <button type="button" class="btn btn-outline-primary"><i class="bi-pencil"/> {tr('Edit')}</button>
    btnTypeEdit.addEventListener('click', () => {
      const ed = new MeasTypeEditor(this, mtStore, measType[0])
      ed.el.addEventListener(CustomStoreEvent.NAME, typeChange)  // typeChange bubbles the event
    })
    const btnTypeSel = <button type="button" class="btn btn-outline-primary"><i class="bi-card-list"/> {tr('Select')}</button>
    btnTypeSel.addEventListener('click', async () => {
      const type = await listSelectDialog(tr('sel-meas-type'), this.ctx.storage.allMeasurementTemplates)
      if (type) {
        await mtStore.upd(measType[0], type)
        typeChange()
      }
    })
    const grpType = safeCastElement(HTMLDivElement, <div class="input-group"> {inpType} {btnTypeEdit} {btnTypeSel} </div>)

    //TODO Later: Consider inputmode="decimal", but check whether that will cause the input to suffer from bug #2 (Samsung numeric keyboard doesn't have minus)
    const inpValue = safeCastElement(HTMLInputElement, <input class="form-control" type="text"
      pattern={obj.type.validPattern} value={obj.value} required />)
    inpValue.addEventListener('change', () => grpValue.dispatchEvent(new CustomChangeEvent()))
    const lblUnit = <span class="input-group-text"></span>
    const grpValue = safeCastElement(HTMLDivElement, <div class="input-group"> {inpValue} {lblUnit} </div>)
    const lblRange = <span></span>
    const lblPrc = <span></span>

    /* TODO Later: Should we disallow edits to "Description" in general?
     * This might especially make sense when all objects store a copy of their template.
     * Perhaps even change the terminology to reflect that. */
    //TODO Later: Don't display description when empty (CSS :has and :empty?)
    const typeDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly></textarea>)

    const inpTime = new DateTimeInput(obj.time, true)

    const typeChange = () => {
      inpType.value = measType[0].name
      if (measType[0].unit.trim().length) lblUnit.innerText = measType[0].unit
      else lblUnit.replaceChildren(<em>({tr('no units')})</em>)
      const r = measType[0].rangeAsText
      if (r.length) lblRange.innerText = r
      else lblRange.replaceChildren(<em>({tr('not specified')})</em>)
      const p = measType[0].precision
      lblPrc.innerText = Number.isFinite(p) && p>=0 ? `; ${tr('precision')} ${p}` : ''
      typeDesc.value = measType[0].description
      inpValue.pattern = measType[0].validPattern
      grpType.dispatchEvent(new CustomChangeEvent())
      this.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: '0' }))  // essentially a bubbling of the event (see above)
    }
    typeChange()

    this.form2obj = () => new Measurement({ type: measType[0],
      value: inpValue.value, time: inpTime.timestamp })

    //TODO Later: Should back button be disallowed until measurement value is entered? (or should back button delete a blank measurement created from template??)
    this.initialize([
      this.makeRow(grpType, tr('meas-type'), <><strong>{tr('Required')}.</strong> {tr('meas-type-help')}</>, tr('Invalid measurement type')),
      this.makeRow(grpValue, tr('Value'),
        <><strong>{tr('Required')}.</strong> {tr('meas-value-help')} {lblRange}{lblPrc}</>, tr('Invalid value')),
      this.makeRow(typeDesc, tr('Description'), <>{tr('meas-desc-help')}</>, null),
      this.makeRow(inpTime.el, tr('Timestamp'), <><strong>{tr('Required')}.</strong> {tr('meas-time-help')}</>, tr('Invalid timestamp')),
    ])
  }
}