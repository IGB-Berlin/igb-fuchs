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
import { numericTextInputStuff } from '../utils'
import { listSelectDialog } from './list-dialog'
import { Editor, EditorParent } from './base'
import { MeasTypeEditor } from './meas-type'
import { DateTimeInput } from './date-time'
import { Measurement } from '../types/meas'
import { tr } from '../i18n'

export class MeasurementEditor extends Editor<Measurement> {
  private readonly measType :[MeasurementType]
  private readonly grpType
  private readonly inpValue
  private readonly inpTime
  constructor(parent :EditorParent, targetStore :AbstractStore<Measurement>, targetObj :Measurement|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    this.measType = [this.initObj.type]
    const mtStore = new ArrayStore(this.measType)
    const inpType = safeCastElement(HTMLInputElement, <input type="text" class="form-control fw-semibold" value="" readonly required /> )
    const btnTypeEdit = <button type="button" class="btn btn-outline-primary"><i class="bi-pencil"/> {tr('Edit')}</button>
    btnTypeEdit.addEventListener('click', () => {
      const ed = new MeasTypeEditor(this, mtStore, this.measType[0], this.isUnsaved)
      ed.el.addEventListener(CustomStoreEvent.NAME, typeChange)  // typeChange bubbles the event
    })
    const btnTypeSel = <button type="button" class="btn btn-outline-primary"><i class="bi-card-list"/> {tr('Select')}</button>
    btnTypeSel.addEventListener('click', async () => {
      const type = await listSelectDialog(tr('sel-meas-type'), this.ctx.storage.allMeasurementTemplates)
      if (type) {
        await mtStore.upd(this.measType[0], type)
        typeChange()
      }
    })
    this.grpType = safeCastElement(HTMLDivElement, <div class="input-group"> {inpType} {btnTypeEdit} {btnTypeSel} </div>)

    const typeInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly></textarea>)
    const rowInst = this.makeRow(typeInst, tr('Instructions'), <>{tr('meas-inst-help')}</>, null)

    this.inpValue = safeCastElement(HTMLInputElement, <input type="text" inputmode="decimal"
      class="form-control fw-semibold font-monospace" value={this.initObj.value} required />)
    numericTextInputStuff(this.inpValue)
    this.inpValue.addEventListener('change', () => grpValue.dispatchEvent(new CustomChangeEvent()))
    const lblUnit = <span class="input-group-text"></span>
    const grpValue = safeCastElement(HTMLDivElement, <div class="input-group"> {this.inpValue} {lblUnit} </div>)
    const lblRange = <span></span>
    const lblPrc = <span></span>

    this.inpTime = new DateTimeInput(this.initObj.time, true)

    const typeChange = () => {
      const mt = this.measType[0]
      inpType.value = mt.name
      if (mt.unit.trim().length) lblUnit.innerText = mt.unit
      else lblUnit.replaceChildren(<em>({tr('no units')})</em>)
      const r = mt.rangeAsText
      if (r.length) lblRange.innerText = r
      else lblRange.replaceChildren(<em>({tr('not specified')})</em>)
      const p = mt.precision
      lblPrc.innerText = Number.isFinite(p) && p>=0 ? `; ${tr('precision')} ${p}` : ''
      typeInst.value = mt.instructions
      rowInst.classList.toggle('d-none', !mt.instructions.trim().length)
      this.inpValue.pattern = makeValidNumberPat(mt.precision)
      this.grpType.dispatchEvent(new CustomChangeEvent())
      this.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: '0' }))  // essentially a bubbling of the event (see above)
    }
    typeChange()

    this.initialize([
      this.makeRow(this.grpType, tr('Measurement Type'), <><strong>{tr('Required')}.</strong> {tr('meas-type-help')}</>, tr('Invalid measurement type')),
      rowInst,
      this.makeRow(grpValue, tr('Value'),
        <><strong>{tr('Required')}.</strong> {tr('meas-value-help')} {lblRange}{lblPrc}. {tr('dot-minus-hack')}</>, tr('Invalid value')),
      this.makeRow(this.inpTime.el, tr('Timestamp'), <><strong>{tr('Required')}.</strong> {tr('meas-time-help')}</>, tr('Invalid timestamp')),
    ])
  }

  protected override newObj() { return new Measurement(null) }

  protected override form2obj() {
    return new Measurement({ type: this.measType[0],
      value: this.inpValue.value, time: this.inpTime.timestamp })
  }

  override currentName() { return this.measType[0].name }

  protected override doScroll() {
    this.ctx.scrollTo( this.isNew || !this.measType[0].name.trim().length ? this.grpType : this.inpValue )
  }

  override shown(pushNotPop :boolean) {
    super.shown(pushNotPop)
    if ( this.measType[0].name && !this.inpValue.value )
      this.inpValue.focus()
  }

}