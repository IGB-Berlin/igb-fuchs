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
import { AbstractStore, ArrayStore } from '../storage'
import { MeasurementType } from '../types/meas-type'
import { listSelectDialog } from './list-dialog'
import { CustomChangeEvent } from '../events'
import { MeasTypeEditor } from './meas-type'
import { DateTimeInput } from './date-time'
import { Measurement } from '../types/meas'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class MeasurementEditor extends Editor<MeasurementEditor, Measurement> {
  protected override readonly initObj :Readonly<Measurement>
  protected override readonly form2obj :()=>Readonly<Measurement>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<Measurement>, targetObj :Measurement|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new Measurement(null)

    const inpType = safeCastElement(HTMLInputElement, <input class="form-control" type="text" value="" readonly required /> )
    const btnTypeEdit = <button type="button" class="btn btn-outline-primary"><i class="bi-pencil"/> {tr('Edit')}</button>
    btnTypeEdit.addEventListener('click', () => { new MeasTypeEditor(this.ctx, mtStore, measType[0]) })
    const btnTypeSel = <button type="button" class="btn btn-outline-primary"><i class="bi-card-list"/> {tr('Select')}</button>
    btnTypeSel.addEventListener('click', async () => {
      const type = await listSelectDialog(tr('sel-meas-type'), this.ctx.storage.allMeasurementTemplates)
      if (type) await mtStore.upd(measType[0], type)
    })
    const grpType = safeCastElement(HTMLDivElement, <div class="input-group"> {inpType} {btnTypeEdit} {btnTypeSel} </div>)

    //TODO: Consider inputmode="decimal", but check whether that will cause the input to suffer from bug #2
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
    //TODO: Don't display description when empty
    const typeDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly></textarea>)

    const inpTime = new DateTimeInput(obj.time, true)

    const measType :[MeasurementType] = [obj.type]
    const mtStore = new ArrayStore(measType)
    const typeChange = () => {
      inpType.value = measType[0].name
      const u = measType[0].unit
      if (u.length) lblUnit.innerText = measType[0].unit
      else lblUnit.replaceChildren(<em>({tr('no units')})</em>)
      const r = measType[0].rangeAsText
      if (r.length) lblRange.innerText = r
      else lblRange.replaceChildren(<em>({tr('not specified')})</em>)
      const p = measType[0].precision
      lblPrc.innerText = Number.isFinite(p) && p>=0 ? `; ${tr('precision')} ${p}` : ''
      typeDesc.value = measType[0].description
      inpValue.pattern = measType[0].validPattern
      grpType.dispatchEvent(new CustomChangeEvent())
    }
    typeChange()
    mtStore.events.add(typeChange)
    this.onClose = () => mtStore.events.remove(typeChange)

    this.form2obj = () => new Measurement({ type: measType[0],
      value: inpValue.value, time: inpTime.timestamp })

    this.initialize([
      this.makeRow(grpType, tr('meas-type'), <><strong>{tr('Required')}.</strong> {tr('meas-type-help')}</>, tr('Invalid measurement type')),
      this.makeRow(grpValue, tr('Value'),
        <><strong>{tr('Required')}.</strong> {tr('meas-value-help')} {lblRange}{lblPrc}</>, tr('Invalid value')),
      this.makeRow(typeDesc, tr('Description'), <>{tr('meas-desc-help')}</>, null),
      this.makeRow(inpTime.el, tr('Timestamp'), <><strong>{tr('Required')}.</strong> {tr('meas-time-help')}</>, tr('Invalid timestamp')),
    ])
  }
}