/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024-2025 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * IGB-FUCHS is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * IGB-FUCHS is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * IGB-FUCHS. If not, see <https://www.gnu.org/licenses/>.
 */
import { HasHtmlSummary } from '../types/common'
import { jsx } from '@haukex/simple-jsx-dom'
import { modalDialog } from '../dialog'
import { assert } from '../utils'
import { tr } from '../i18n'

export function listSelectDialog<T extends HasHtmlSummary>(title :string, list :Readonly<Readonly<T>[]>) :Promise<T|null> {
  let okClicked = false
  const btnOk = <button class="btn-success" onclick={()=>okClicked=true} disabled><i class="bi-check-lg"/> {tr('Select')}</button>
  let selIdx = -1
  const selectItem = (idx :number) => {
    assert(els.length===list.length && idx>=0 && idx<list.length)
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
    <li class="list-group-item cursor-pointer" onclick={() => selectItem(i)}
      // NOTE I'm not sure why preventDefault and stopPropagation aren't preventing double-click text selection
      ondblclick={(e :MouseEvent)=>{ e.preventDefault(); e.stopPropagation(); btnOk.click() }}>
      {e.summaryAsHtml(false)}</li>)
    : [<li class="list-group-item"><em>{tr('No items')}</em></li>]
  return modalDialog<T|null>({
    size: 'fullscreen-sm-down',
    scrollable: true,
    titleIcon: 'card-list',
    title: title,
    body: <ul class="list-group">{els}</ul>,
    buttons: [ <button class="btn-secondary"><i class="bi-x-lg"/> {tr('Cancel')}</button>, btnOk ],
    hiddenCallback: resolve => {
      assert((list.length===0 && els.length===1 || els.length===list.length) && selIdx<list.length)
      if (okClicked && selIdx>=0) {
        const item = list[selIdx]
        assert(item)
        resolve(item)
      }
      else resolve(null)
    }
  })
}
