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
import { MeasurementType, VALID_UNIT_RE } from '../types/meas-type'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { VALID_NAME_RE } from '../types/common'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class MeasTypeEditor extends Editor<MeasTypeEditor, MeasurementType> {
  override readonly fullTitle = tr('Measurement Type')
  override readonly briefTitle = tr('meas-type')
  protected override readonly initObj :Readonly<MeasurementType>
  protected override readonly form2obj :()=>Readonly<MeasurementType>
  protected override readonly onClose :()=>void = ()=>{}

  constructor(ctx :GlobalContext, targetStore :AbstractStore<MeasurementType>, targetObj :MeasurementType|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new MeasurementType(null)

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpUnit = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_UNIT_RE.source} value={obj.unit} />)
    const inpMin = safeCastElement(HTMLInputElement, <input type="number" value={obj.min} step="1" />)
    const inpMax = safeCastElement(HTMLInputElement, <input type="number" value={obj.max} step="1" />)
    const inpPrc = safeCastElement(HTMLInputElement, <input type="number" value={obj.precision} min="0" step="1" />)
    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.description.trim()}</textarea>)

    const prcToStep = () => {
      const s = obj.precisionAsStep(inpPrc.valueAsNumber)
      if (s) { inpMin.step = s; inpMax.step = s }
    }
    inpPrc.addEventListener('change', prcToStep)
    prcToStep()

    this.form2obj = () => new MeasurementType({ name: inpName.value, unit: inpUnit.value,
      min: Number.isFinite(inpMin.valueAsNumber) ? inpMin.valueAsNumber : -Infinity,
      max: Number.isFinite(inpMax.valueAsNumber) ? inpMax.valueAsNumber : +Infinity,
      precision: Number.isFinite(inpPrc.valueAsNumber) && inpPrc.valueAsNumber>=0 ? inpPrc.valueAsNumber : NaN,
      description: inpDesc.value.trim() })

    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()} {tr('meas-name-help')}</>, tr('Invalid name')),
      this.makeRow(inpUnit, tr('Unit'), <><strong>{tr('Required')}.</strong> {tr('unit-help')}</>, tr('Invalid unit')),
      this.makeRow(inpPrc, tr('Precision'), <><em>{tr('Recommended')}.</em> {tr('precision-help')}</>, tr('Invalid precision')),
      this.makeRow(inpMin, tr('Minimum'), <><em>{tr('Recommended')}.</em> {tr('min-help')}</>, tr('Invalid minimum value')),
      this.makeRow(inpMax, tr('Maximum'), <><em>{tr('Recommended')}.</em> {tr('max-help')}</>, tr('Invalid maximum value')),
      this.makeRow(inpDesc, tr('Description'), <>{tr('meas-type-desc-help')} {tr('desc-help')}</>, null),
    ])
  }
}
