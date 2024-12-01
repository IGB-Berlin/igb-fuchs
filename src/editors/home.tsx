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
import { TripTemplateEditor } from './trip-temp'
import { ListEditor } from './list-edit'
import { EditorStack } from './stack'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'
import { GlobalContext } from '../main'

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

export function makeHomePage(ctx :GlobalContext, stack :EditorStack) {
  const ttEdit = new ListEditor(stack, ctx.storage.tripTemplates(), TripTemplateEditor)
  ttEdit.enable(true)

  return <div class="p-3">
    <div class="accordion" id="homeAccordion">
      {makeAcc(tr('Sampling Trips'), 'TODO')}
      {makeAcc(tr('Sampling Trip Templates'), ttEdit.el)}
    </div>
  </div>
}
