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
import { MeasurementType, VALID_UNIT_RE } from '../types/meas-type'
import { makeValidNumberPat, VALID_NAME_RE } from '../types/common'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { numericTextInputStuff } from '../utils'
import { Editor, EditorParent } from './base'
import { AbstractStore } from '../storage'
import { tr } from '../i18n'

export class MeasTypeEditor extends Editor<MeasTypeEditor, MeasurementType> {
  override readonly currentName
  protected override readonly form2obj
  protected override newObj() { return new MeasurementType(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<MeasurementType>, targetObj :MeasurementType|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpName = safeCastElement(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpUnit = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_UNIT_RE.source} value={obj.unit} />)
    const inpPrc = safeCastElement(HTMLInputElement, <input type="number" value={Math.floor(obj.precision)} min="0" step="1" />)
    // inpPrc can use type="number" b/c we don't need negative numbers there
    const inpMin = safeCastElement(HTMLInputElement, <input type="text" inputmode="decimal" value={Number.isFinite(obj.min)?obj.min:''} />)
    numericTextInputStuff(inpMin)
    const inpMax = safeCastElement(HTMLInputElement, <input type="text" inputmode="decimal" value={Number.isFinite(obj.max)?obj.max:''} />)
    numericTextInputStuff(inpMax)
    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.instructions.trim()}</textarea>)

    const prcToPat = () => {
      const pat = makeValidNumberPat(inpPrc.valueAsNumber)
      inpMin.pattern = pat
      inpMax.pattern = pat
    }
    inpPrc.addEventListener('change', prcToPat)
    prcToPat()

    this.form2obj = () => {
      const prc = inpPrc.valueAsNumber
      const min = Number.parseFloat(inpMin.value)
      const max = Number.parseFloat(inpMax.value)
      return new MeasurementType({ name: inpName.value, unit: inpUnit.value,
        min: Number.isFinite(min) ? min : -Infinity,
        max: Number.isFinite(max) ? max : +Infinity,
        precision: Number.isFinite(prc) && prc>=0 ? Math.floor(prc) : NaN,
        instructions: inpInst.value.trim() })
    }
    this.currentName = () => inpName.value

    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()} {tr('meas-name-help')}</>, tr('Invalid name')),
      this.makeRow(inpUnit, tr('Unit'), <><strong>{tr('Required')}.</strong> {tr('unit-help')}</>, tr('Invalid unit')),
      this.makeRow(inpPrc, tr('Precision'), <><em>{tr('Recommended')}.</em> {tr('precision-help')}</>, tr('Invalid precision')),
      this.makeRow(inpMin, tr('Minimum'), <><em>{tr('Recommended')}.</em> {tr('min-help')} {tr('dot-minus-hack')}</>, tr('Invalid minimum value')),
      this.makeRow(inpMax, tr('Maximum'), <><em>{tr('Recommended')}.</em> {tr('max-help')} {tr('dot-minus-hack')}</>, tr('Invalid maximum value')),
      this.makeRow(inpInst, tr('Instructions'), <>{tr('meas-type-inst-help')} {tr('inst-help')}</>, null),
    ])
  }
}
