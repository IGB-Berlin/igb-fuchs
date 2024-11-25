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
import { MeasurementType } from '../types/meas-type'
import { jsx, safeCastElement } from '../jsx-dom'
import { IDENTIFIER_RE } from '../types/common'

export function makeMeasurementTypeEditor(mt :MeasurementType, done :()=>void) :HTMLElement {
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
          <div id="inpMeasTypeIdHelp" class="form-text">
            An identifier
          </div>
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
}