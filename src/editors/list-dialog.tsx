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
import * as bootstrap from 'bootstrap'
import { assert } from '../utils'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

export type HasHtmlSummary = { summaryAsHtml(withTypeName :boolean) :HTMLElement }

export function listSelectDialog<T extends HasHtmlSummary>(title :string|HTMLElement, list :Readonly<Readonly<T>[]>) :Promise<T|null> {
  let okClicked = false
  const btnOk = <button type="button" class="btn btn-success" data-bs-dismiss="modal"
    onclick={()=>okClicked=true} disabled><i class="bi-check-lg"/> {tr('Select')}</button>
  let selIdx = -1
  const selectItem = (idx :number) => {
    assert(els.length==list.length && idx>=0 && idx<list.length)
    els.forEach((e,i) => {
      if (i===idx) {
        e.classList.add('active')
        e.setAttribute('aria-current', 'true')
      }
      else {
        e.classList.remove('active')
        e.removeAttribute('aria-current')
      }
    })
    selIdx = idx
    btnOk.removeAttribute('disabled')
  }
  const els :HTMLElement[] = list.length ? list.map((e,i) =>
    <li class="list-group-item cursor-pointer" onclick={() => selectItem(i)}>{e.summaryAsHtml(false)}</li>)
    : [<li class="list-group-item"><em>{tr('No items')}</em></li>]
  const dialog = <div data-bs-backdrop="static" data-bs-keyboard="false"
    class="modal fade" tabindex="-1" aria-labelledby="listSelectDialogLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="listSelectDialogLabel">
            <i class="bi-card-list me-2" /> {title}</h1>
        </div>
        <div class="modal-body">
          <ul class="list-group">{els}</ul>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="bi-x-lg"/> {tr('Cancel')}</button>
          {btnOk}
        </div>
      </div>
    </div>
  </div>
  document.body.appendChild(dialog)
  return new Promise<T|null>(resolve => {
    const modal = new bootstrap.Modal(dialog)
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      assert((list.length===0 && els.length===1 || els.length===list.length) && selIdx<list.length)
      if (okClicked && selIdx>=0) {
        const item = list[selIdx]
        assert(item)
        resolve(item)
      }
      else resolve(null)
    })
    modal.show()
  })
}
