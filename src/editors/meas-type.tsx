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
  private readonly inpName
  private readonly inpUnit
  private readonly inpPrc
  private readonly inpMin
  private readonly inpMax
  private readonly inpInst
  constructor(parent :EditorParent, targetStore :AbstractStore<MeasurementType>, targetObj :MeasurementType|null) {
    super(parent, targetStore, targetObj)

    this.inpName = safeCastElement(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    this.inpUnit = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_UNIT_RE.source} value={this.initObj.unit} />)
    this.inpPrc = safeCastElement(HTMLInputElement, <input type="number" value={Math.floor(this.initObj.precision)} min="0" step="1" />)
    // inpPrc can use type="number" b/c we don't need negative numbers there
    this.inpMin = safeCastElement(HTMLInputElement, <input type="text" inputmode="decimal" value={Number.isFinite(this.initObj.min)?this.initObj.min:''} />)
    numericTextInputStuff(this.inpMin)
    this.inpMax = safeCastElement(HTMLInputElement, <input type="text" inputmode="decimal" value={Number.isFinite(this.initObj.max)?this.initObj.max:''} />)
    numericTextInputStuff(this.inpMax)
    this.inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.instructions.trim()}</textarea>)

    const prcToPat = () => {
      const pat = makeValidNumberPat(this.inpPrc.valueAsNumber)
      this.inpMin.pattern = pat
      this.inpMax.pattern = pat
    }
    this.inpPrc.addEventListener('change', prcToPat)
    prcToPat()

    this.initialize([
      this.makeRow(this.inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()} {tr('meas-name-help')}</>, tr('Invalid name')),
      this.makeRow(this.inpUnit, tr('Unit'), <><strong>{tr('Required')}.</strong> {tr('unit-help')}</>, tr('Invalid unit')),
      this.makeRow(this.inpPrc, tr('Precision'), <><em>{tr('Recommended')}.</em> {tr('precision-help')}</>, tr('Invalid precision')),
      this.makeRow(this.inpMin, tr('Minimum'), <><em>{tr('Recommended')}.</em> {tr('min-help')} {tr('dot-minus-hack')}</>, tr('Invalid minimum value')),
      this.makeRow(this.inpMax, tr('Maximum'), <><em>{tr('Recommended')}.</em> {tr('max-help')} {tr('dot-minus-hack')}</>, tr('Invalid maximum value')),
      this.makeRow(this.inpInst, tr('Instructions'), <>{tr('meas-type-inst-help')} {tr('inst-help')}</>, null),
    ])
  }

  protected override newObj() { return new MeasurementType(null) }

  protected override form2obj() {
    const prc = this.inpPrc.valueAsNumber
    const min = Number.parseFloat(this.inpMin.value)
    const max = Number.parseFloat(this.inpMax.value)
    return new MeasurementType({ name: this.inpName.value, unit: this.inpUnit.value,
      min: Number.isFinite(min) ? min : -Infinity,
      max: Number.isFinite(max) ? max : +Infinity,
      precision: Number.isFinite(prc) && prc>=0 ? Math.floor(prc) : NaN,
      instructions: this.inpInst.value.trim() })
  }

  override currentName() { return this.inpName.value }

  protected override doScroll() {
    this.ctx.scrollTo(this.el)  //TODO NEXT
  }

}
