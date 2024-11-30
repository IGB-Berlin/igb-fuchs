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
import { isISamplingTripTemplateArray, SamplingTripTemplate } from '../types/trip'
import { TripTemplateEditor } from './trip-temp'
import { ArrayEventList } from '../types/list'
import { ListEditor } from './list-edit'
import { EditorStack } from './stack'
import * as storage from '../storage'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

function makeTripTempListEditor(stack :EditorStack) {
  const _tt :unknown = JSON.parse( storage.get(storage.TRIP_TEMPLATES) ?? '[]' )
  const tt :SamplingTripTemplate[] = isISamplingTripTemplateArray(_tt) ? _tt.map(t => new SamplingTripTemplate(t)) : []
  const el = new ArrayEventList(tt)
  const ttEdit = new ListEditor(stack, el, TripTemplateEditor)
  el.events.add(event => {
    console.log(`SAVING Sampling Trip Templates (${event.action} ${event.index})`)
    storage.set(storage.TRIP_TEMPLATES, JSON.stringify(tt))
  })
  return ttEdit
}

let _accId = 0
export class HomePage {
  readonly el :HTMLElement
  constructor(stack :EditorStack) {
    const makeAcc = (title :string, body :HTMLElement|string) =>
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target={`#${++_accId}`} aria-expanded="false" aria-controls={_accId}>
            {title}
          </button>
        </h2>
        <div id={_accId} class="accordion-collapse collapse" data-bs-parent="#homeAccordion">
          <div class="accordion-body">
            {body}
          </div>
        </div>
      </div>

    const ttEdit = makeTripTempListEditor(stack)

    this.el = <div class="p-3">
      <div class="accordion" id="homeAccordion">
        {makeAcc(tr('Sampling Trips'), 'TODO')}
        {makeAcc(tr('Sampling Trip Templates'), ttEdit.el)}
      </div>
    </div>
  }
}
