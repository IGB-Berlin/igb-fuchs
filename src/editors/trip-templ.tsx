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
import { jsx, safeCastElement } from '../jsx-dom'
import { SamplingTripTemplate } from '../types/trip'

export function createSamplingTripEditor(stt :SamplingTripTemplate, done :()=>void) :HTMLElement {
  const inpName = safeCastElement(HTMLInputElement,
    <input type="text" class="form-control" id="inpSaTrTempName" aria-describedby="inpSaTrTempNameHelp"
      required value={stt.name} />)
  const inpDesc = safeCastElement(HTMLTextAreaElement,
    <textarea class="form-control" id="inpSaTrTempDesc" rows="3"
      aria-describedby="inpSaTrTempDescHelp">{stt.description}</textarea>)
  const form = safeCastElement(HTMLFormElement,
    <form novalidate>
      <div class="row">
        <label for="inpSaTrTempName" class="col-sm-2 col-form-label">Name</label>
        <div class="col-sm-10">
          {inpName}
          <div id="inpSaTrTempNameHelp" class="form-text">
            A descriptive name (TODO: Translate)
          </div>
          <div class="invalid-feedback">Not a valid name</div>
        </div>
      </div>
      <div class="row">
        <label for="inpSaTrTempDesc" class="col-sm-2 col-form-label">Description</label>
        <div class="col-sm-10">
          {inpDesc}
          <div id="inpSaTrTempDescHelp" class="form-text">
            Description
          </div>
          <div class="invalid-feedback">Invalid</div>
        </div>
      </div>
      <button type="submit" class="btn btn-success"><i class="bi-check-lg"/> Finish</button>
    </form>)
  form.addEventListener('submit', event => {
    if (form.checkValidity()) {
      stt.name = inpName.value.trim()
      stt.description = inpDesc.value.trim()
      done()
    }
    form.classList.add('was-validated')
    event.preventDefault()
    event.stopPropagation()
  })
  return form
}