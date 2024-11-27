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
import { isValidName, VALID_NAME_RE } from '../types/common'
import { MeasurementType, VALID_UNIT_RE } from '../types/meas-type'
import { DoneCallback, Editor } from './base'
import { assert } from '../utils'

export class MeasTypeEditor extends Editor<MeasurementType> {
  readonly el :HTMLElement
  protected readonly inpName :HTMLInputElement
  protected readonly inpUnit :HTMLInputElement
  constructor(obj :MeasurementType|null, doneCb :DoneCallback) {
    super(obj, doneCb)
    this.inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={this.obj?.name??''} />)
    this.inpUnit = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_UNIT_RE.source} value={this.obj?.unit??''} />)
    this.el = this.makeForm('Measurement Type', [
      this.makeRow(this.inpName, 'Name', <><i>Required.</i> An identifier.</>, 'Invalid name'),
      this.makeRow(this.inpUnit, 'Unit', <><i>Recommended.</i> Units</>, 'Invalid unit'),
    ])
  }
  get isDirty() {
    return (this.obj?.name ?? '') !== this.inpName.value
      || (this.obj?.unit ?? '') !== this.inpUnit.value
  }
  protected formSubmit() {
    if (this.obj) {
      assert(isValidName(this.inpName.value))  //TODO: There's now a cleaner way to handle this, .validate(), which our caller should use
      this.obj.name = this.inpName.value
      this.obj.unit = this.inpUnit.value.trim()
    } else
      this.obj = new MeasurementType({ name: this.inpName.value, unit: this.inpUnit.value.trim() })
  }
}

/*export function makeMeasurementTypeEditor(mt :MeasurementType, done :()=>void) :HTMLElement {
  const inpId = safeCastElement(HTMLInputElement,
    <input type="text" class="form-control" id="inpMeasTypeId" aria-describedby="inpMeasTypeIdHelp"
      required pattern={IDENTIFIER_RE.source} value={mt.id} />)
  const form = safeCastElement(HTMLFormElement,
    <form novalidate>
      <legend class="mb-3">Measurement Type</legend>
      <div class="row mb-3">
        <label for="inpMeasTypeId" class="col-sm-2 col-form-label">ID</label>
        <div class="col-sm-10">
          {inpId}
          <div id="inpMeasTypeIdHelp" class="form-text">An identifier</div>
          <div class="invalid-feedback">Not a valid id</div>
        </div>
      </div>
      <button type="submit" class="btn btn-success"><i class="bi-check-lg"/> Finish</button>
    </form>)
  form.addEventListener('submit', event => {
    if (form.checkValidity()) {
      mt.id = inpId.value
      done()
    }
    form.classList.add('was-validated')
    event.preventDefault()
    event.stopPropagation()
  })
  return form
}*/