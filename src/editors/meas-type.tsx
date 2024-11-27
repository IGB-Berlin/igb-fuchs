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
import { DoneCallback, Editor } from './base'
import { tr } from '../i18n'

export class MeasTypeEditor extends Editor<MeasurementType> {
  readonly el :HTMLElement
  protected readonly inpName :HTMLInputElement
  protected readonly inpUnit :HTMLInputElement
  protected readonly inpMin :HTMLInputElement
  protected readonly inpMax :HTMLInputElement
  protected readonly inpPrc :HTMLInputElement
  protected readonly inpNotes :HTMLTextAreaElement
  constructor(obj :MeasurementType|null, doneCb :DoneCallback<MeasurementType>) {
    super(obj, doneCb)
    this.inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={this.obj?.name??''} />)
    this.inpUnit = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_UNIT_RE.source} value={this.obj?.unit??''} />)
    this.inpMin = safeCastElement(HTMLInputElement,
      <input type="number" value={this.obj?.min??''} />)
    this.inpMax = safeCastElement(HTMLInputElement,
      <input type="number" value={this.obj?.max??''} />)
    this.inpPrc = safeCastElement(HTMLInputElement,
      <input type="number" value={this.obj?.precision??''} min="0" />)
    this.inpNotes = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{this.obj?.notes.trim()??''}</textarea>)
    this.el = this.makeForm('Measurement Type', [
      this.makeRow(this.inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {tr('name-help')} {tr('meas-name-help')}</>, tr('Invalid name')),
      this.makeRow(this.inpUnit, tr('Unit'), <><strong>{tr('Required')}.</strong> {tr('unit-help')}</>, tr('Invalid unit')),
      this.makeRow(this.inpMin, tr('Minimum'), <><em>{tr('Recommended')}.</em> {tr('min-help')}</>, tr('Invalid minimum value')),
      this.makeRow(this.inpMax, tr('Maximum'), <><em>{tr('Recommended')}.</em> {tr('max-help')}</>, tr('Invalid maximum value')),
      this.makeRow(this.inpPrc, tr('Precision'), <><em>{tr('Recommended')}.</em> {tr('precision-help')}</>, tr('Invalid precision')),
      this.makeRow(this.inpNotes, tr('Notes'), tr('notes-help'), null)
    ])
  }

  protected get inMin() { return Number.isFinite(this.inpMin.valueAsNumber) ? this.inpMin.valueAsNumber : -Infinity }
  protected get inMax() { return Number.isFinite(this.inpMax.valueAsNumber) ? this.inpMax.valueAsNumber : +Infinity }
  protected get inPrc() { return Number.isFinite(this.inpPrc.valueAsNumber) ? this.inpPrc.valueAsNumber : NaN }
  protected get inNot() { return this.inpNotes.value.trim() }

  get isDirty() {
    const oPrc = this.obj?.precision ?? NaN
    return (this.obj?.name ?? '') !== this.inpName.value
        || (this.obj?.unit ?? '') !== this.inpUnit.value
        || (this.obj?.min ?? -Infinity) !== this.inMin
        || (this.obj?.max ?? +Infinity) !== this.inMax
        || !(Number.isNaN(oPrc) && Number.isNaN(this.inPrc) || oPrc === this.inPrc)
        || (this.obj?.notes.trim() ?? '') !== this.inNot
  }

  protected from2obj() {
    const n = new MeasurementType({ name: this.inpName.value, unit: this.inpUnit.value,
      min: this.inMin, max: this.inMax, precision: this.inPrc, notes: this.inNot })
    if (this.obj) Object.assign(this.obj, n)
    else this.obj = n
  }
}
