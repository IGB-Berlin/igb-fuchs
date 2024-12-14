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
import { makeValidNumberPat } from '../types/common'
import { listSelectDialog } from './list-dialog'
import { Editor, EditorParent } from './base'
import { MeasTypeEditor } from './meas-type'
import { DateTimeInput } from './date-time'
import { Measurement } from '../types/meas'
import { minusSignHack } from '../utils'
import { tr } from '../i18n'

export class MeasurementEditor extends Editor<MeasurementEditor, Measurement> {
  override readonly currentName
  protected override readonly form2obj
  protected override newObj() { return new Measurement(null) }

  private readonly inpValue
  constructor(parent :EditorParent, targetStore :AbstractStore<Measurement>, targetObj :Measurement|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const measType :[MeasurementType] = [obj.type]
    const mtStore = new ArrayStore(measType)
    const inpType = safeCastElement(HTMLInputElement, <input type="text" class="form-control fw-semibold" value="" readonly required /> )
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

    const typeInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly></textarea>)
    const rowInst = this.makeRow(typeInst, tr('Instructions'), <>{tr('meas-inst-help')}</>, null)

    this.inpValue = safeCastElement(HTMLInputElement, <input type="text" inputmode="decimal"
      class="form-control fw-semibold font-monospace" value={obj.value} required />)
    minusSignHack(this.inpValue)
    this.inpValue.addEventListener('change', () => grpValue.dispatchEvent(new CustomChangeEvent()))
    const lblUnit = <span class="input-group-text"></span>
    const grpValue = safeCastElement(HTMLDivElement, <div class="input-group"> {this.inpValue} {lblUnit} </div>)
    const lblRange = <span></span>
    const lblPrc = <span></span>

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
      typeInst.value = measType[0].instructions
      rowInst.classList.toggle('d-none', !measType[0].instructions.trim().length)
      this.inpValue.pattern = makeValidNumberPat(measType[0].precision)
      grpType.dispatchEvent(new CustomChangeEvent())
      this.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: '0' }))  // essentially a bubbling of the event (see above)
    }
    typeChange()

    this.form2obj = () => new Measurement({ type: measType[0],
      value: this.inpValue.value, time: inpTime.timestamp })
    this.currentName = () => measType[0].name

    this.initialize([
      this.makeRow(grpType, tr('Measurement Type'), <><strong>{tr('Required')}.</strong> {tr('meas-type-help')}</>, tr('Invalid measurement type')),
      rowInst,
      this.makeRow(grpValue, tr('Value'),
        <><strong>{tr('Required')}.</strong> {tr('meas-value-help')} {lblRange}{lblPrc}</>, tr('Invalid value')),
      this.makeRow(inpTime.el, tr('Timestamp'), <><strong>{tr('Required')}.</strong> {tr('meas-time-help')}</>, tr('Invalid timestamp')),
    ])
  }
  override shown() {
    super.shown()
    this.inpValue.focus()
  }
}