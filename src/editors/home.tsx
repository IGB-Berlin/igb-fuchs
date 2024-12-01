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
import { ListEditor, ListEditorWithTemp } from './list-edit'
import { TripTemplateEditor } from './trip-temp'
import { SamplingTripEditor } from './trip'
import { GlobalContext } from '../main'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

let _accId = 0
function makeAcc(title :string, body :HTMLElement|string) {
  return <div class="accordion-item">
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
}

export function makeHomePage(ctx :GlobalContext) {
  const stEdit = new ListEditorWithTemp(ctx, ctx.storage.samplingTrips(), SamplingTripEditor, tr('new-trip-from-temp'),
    async () => (await ctx.storage.tripTemplates().getAll(null)).map(([_,t])=>t) )
  stEdit.enable(true)
  const ttEdit = new ListEditor(ctx, ctx.storage.tripTemplates(), TripTemplateEditor)
  ttEdit.enable(true)

  return <div class="p-3">
    <div class="accordion" id="homeAccordion">
      {makeAcc(tr('Sampling Trips'), stEdit.el)}
      {makeAcc(tr('Sampling Trip Templates'), ttEdit.el)}
    </div>
  </div>
}
