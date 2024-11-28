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
import { Editor } from './base'
import { tr } from '../i18n'

export class MeasTypeEditor extends Editor<MeasTypeEditor, MeasurementType> {
  override readonly el :HTMLElement
  protected override readonly form :HTMLFormElement

  protected readonly inpName :HTMLInputElement
  protected readonly inpUnit :HTMLInputElement
  protected readonly inpMin :HTMLInputElement
  protected readonly inpMax :HTMLInputElement
  protected readonly inpPrc :HTMLInputElement
  protected readonly inpNotes :HTMLTextAreaElement
  constructor(targetArray :MeasurementType[], idx :number) {
    super(targetArray, idx)
    this.inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={this.obj?.name??''} />)
    this.inpUnit = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_UNIT_RE.source} value={this.obj?.unit??''} />)
    this.inpMin = safeCastElement(HTMLInputElement,
      <input type="number" value={this.obj?.min??''} step="1" />)
    this.inpMax = safeCastElement(HTMLInputElement,
      <input type="number" value={this.obj?.max??''} step="1" />)
    this.inpPrc = safeCastElement(HTMLInputElement,
      <input type="number" value={this.obj?.precision??'0'} min="0" step="1" />)
    const prcToStep = () => {
      const p = this.inpPrc.valueAsNumber
      if (Number.isFinite(p) && p>=0) {
        const s = p ? '0.'+('1'.padStart(p,'0')) : '1'
        this.inpMin.step = s
        this.inpMax.step = s
      }
    }
    this.inpPrc.addEventListener('change', prcToStep)
    prcToStep()
    this.inpNotes = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{this.obj?.notes.trim()??''}</textarea>)
    this.el = this.form = this.makeForm(tr('Measurement Type'), [
      this.makeRow(this.inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {tr('name-help')} {tr('meas-name-help')}</>, tr('Invalid name')),
      this.makeRow(this.inpUnit, tr('Unit'), <><strong>{tr('Required')}.</strong> {tr('unit-help')}</>, tr('Invalid unit')),
      this.makeRow(this.inpMin, tr('Minimum'), <><em>{tr('Recommended')}.</em> {tr('min-help')}</>, tr('Invalid minimum value')),
      this.makeRow(this.inpMax, tr('Maximum'), <><em>{tr('Recommended')}.</em> {tr('max-help')}</>, tr('Invalid maximum value')),
      this.makeRow(this.inpPrc, tr('Precision'), <><em>{tr('Recommended')}.</em> {tr('precision-help')}</>, tr('Invalid precision')),
      this.makeRow(this.inpNotes, tr('Notes'), tr('notes-help'), null)
    ])
  }

  protected override form2obj() {
    return new MeasurementType({ name: this.inpName.value, unit: this.inpUnit.value,
      min: Number.isFinite(this.inpMin.valueAsNumber) ? this.inpMin.valueAsNumber : -Infinity,
      max: Number.isFinite(this.inpMax.valueAsNumber) ? this.inpMax.valueAsNumber : +Infinity,
      precision: Number.isFinite(this.inpPrc.valueAsNumber) ? this.inpPrc.valueAsNumber : NaN,
      notes: this.inpNotes.value.trim() })
  }
}
