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
import { EditorStack } from './stack'
import { Editor } from './base'
import { tr } from '../i18n'

export class MeasTypeEditor extends Editor<MeasTypeEditor, MeasurementType> {
  static override readonly briefTitle = tr('meas-type')
  override readonly el :HTMLElement
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<MeasurementType>
  protected override form2obj :()=>Readonly<MeasurementType>

  constructor(stack :EditorStack, targetArray :MeasurementType[], idx :number) {
    super(stack, targetArray, idx)
    const obj = this.initObj = this.savedObj ? this.savedObj : new MeasurementType(null)

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpUnit = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_UNIT_RE.source} value={obj.unit} />)
    const inpMin = safeCastElement(HTMLInputElement,
      <input type="number" value={obj.min} step="1" />)
    const inpMax = safeCastElement(HTMLInputElement,
      <input type="number" value={obj.max} step="1" />)
    const inpPrc = safeCastElement(HTMLInputElement,
      <input type="number" value={obj.precision} min="0" step="1" />)
    const inpNotes = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{obj.notes.trim()}</textarea>)

    const prcToStep = () => {
      const s = obj.precisionAsStep(inpPrc.valueAsNumber)
      if (s) { inpMin.step = s; inpMax.step = s }
    }
    inpPrc.addEventListener('change', prcToStep)
    prcToStep()

    this.el = this.form = this.makeForm(tr('Measurement Type'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {tr('name-help')} {tr('meas-name-help')}</>, tr('Invalid name')),
      this.makeRow(inpUnit, tr('Unit'), <><strong>{tr('Required')}.</strong> {tr('unit-help')}</>, tr('Invalid unit')),
      this.makeRow(inpPrc, tr('Precision'), <><em>{tr('Recommended')}.</em> {tr('precision-help')}</>, tr('Invalid precision')),
      this.makeRow(inpMin, tr('Minimum'), <><em>{tr('Recommended')}.</em> {tr('min-help')}</>, tr('Invalid minimum value')),
      this.makeRow(inpMax, tr('Maximum'), <><em>{tr('Recommended')}.</em> {tr('max-help')}</>, tr('Invalid maximum value')),
      this.makeRow(inpNotes, tr('Notes'), tr('notes-help'), null),
    ])

    this.form2obj = () => new MeasurementType({ name: inpName.value, unit: inpUnit.value,
      min: Number.isFinite(inpMin.valueAsNumber) ? inpMin.valueAsNumber : -Infinity,
      max: Number.isFinite(inpMax.valueAsNumber) ? inpMax.valueAsNumber : +Infinity,
      precision: Number.isFinite(inpPrc.valueAsNumber) ? inpPrc.valueAsNumber : NaN,
      notes: inpNotes.value.trim() })

    this.open()
  }
}
