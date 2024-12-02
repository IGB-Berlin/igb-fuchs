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
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { MeasurementType } from '../types/meas-type'
import { dateTimeLocalInputToDate } from '../date'
import { listSelectDialog } from './list-dialog'
import { NO_TIMESTAMP } from '../types/common'
import { MeasTypeEditor } from './meas-type'
import { Measurement } from '../types/meas'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class MeasurementEditor extends Editor<MeasurementEditor, Measurement> {
  override readonly el :HTMLElement
  static override readonly briefTitle: string = tr('meas')
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<Measurement>
  protected override readonly form2obj :()=>Readonly<Measurement>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<Measurement>, targetObj :Measurement|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new Measurement(null)

    const inpType = safeCastElement(HTMLInputElement, <input class="form-control" type="text" value="" readonly required /> )
    const lblUnit = <span class="input-group-text"></span>
    const lblRange = <span></span>
    const lblPrc = <span></span>

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
      //TODO: always show allowed precision (for now - when we store the meas value as a string it shouldn't be necessary.)
      lblPrc.innerText = Number.isFinite(p) && p>=0 ? `; ${tr('precision')} ${p}` : ''
    }
    typeChange()
    mtStore.events.add(typeChange)

    const btnTypeEdit = <button type="button" class="btn btn-outline-secondary"><i class="bi-pencil"/> {tr('Edit')}</button>
    btnTypeEdit.addEventListener('click', () => { new MeasTypeEditor(ctx, mtStore, measType[0]) })

    const btnTypeSel = <button type="button" class="btn btn-outline-secondary"><i class="bi-card-list"/> {tr('Select')}</button>
    btnTypeSel.addEventListener('click', async () => {
      const type = await listSelectDialog(tr('sel-meas-type'), ctx.storage.allMeasurementTemplates)
      if (type) await mtStore.upd(measType[0], type)
    })

    const grpType = <div class="input-group"> {inpType} {btnTypeEdit} {btnTypeSel} </div>

    const inpValue = safeCastElement(HTMLInputElement, <input class="form-control" type="number"
      value={Number.isFinite(obj.value)?obj.value:''} step={obj.type.precisionAsStep()??'1'} required />)
    const grpValue = <div class="input-group"> {inpValue} {lblUnit} </div>

    /* TODO Later: The time input fields only have minute granularity, but if the user clicks the "Now" button
     * or they're initialized from somewhere else, like templateToObject(), we should be able to keep those values. */
    const [inpTime, grpTime] = this.makeDtSelect(obj.time)
    inpTime.setAttribute('required', 'required')

    this.el = this.form = this.makeForm(tr('Measurement'), [
      this.makeRow(grpType, tr('meas-type'), <><strong>{tr('Required')}.</strong> {tr('meas-type-help')}</>, tr('Invalid measurement type')),
      this.makeRow(grpValue, tr('Value'),
        <><strong>{tr('Required')}.</strong> {tr('meas-value-help')} {lblRange}{lblPrc}</>, tr('Invalid value')),
      this.makeRow(grpTime, tr('Timestamp'), <><strong>{tr('Required')}.</strong> {tr('meas-time-help')}</>, tr('Invalid timestamp')),
    ])

    this.form2obj = () => new Measurement({ type: measType[0], value: inpValue.valueAsNumber,
      time: dateTimeLocalInputToDate(inpTime)?.getTime() ?? NO_TIMESTAMP })

    this.onClose = () => mtStore.events.remove(typeChange)
    this.open()
  }
}