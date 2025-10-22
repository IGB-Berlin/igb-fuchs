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
import { jsx, safeCastElement } from './jsx-dom'
import { GlobalContext } from './main'
import { Collapse } from 'bootstrap'
import { assert } from './utils'
import { tr } from './i18n'

let globalHide = false

function initOrRemoveCollapse(el :HTMLElement) {
  el.classList.toggle('collapse', globalHide)
  const c = Collapse.getOrCreateInstance(el, { toggle: false })
  if (!globalHide) c.dispose()
}

/** To be called by settings change. */
export function globalHideHelp(hide :boolean) {
  globalHide = hide
  document.body.classList.toggle('hide-help-texts', globalHide)
  document.querySelectorAll('.hideable-help').forEach(el => {
    assert(el instanceof HTMLElement)
    initOrRemoveCollapse(el)
  })
}

/** Just the button, no functionality. */
export function makeHelpButton() :HTMLButtonElement {
  return safeCastElement(HTMLButtonElement, <button type="button" class="btn btn-sm px-1 py-0 my-0 ms-1 me-0 help-button"
    title={tr('Help')}><i class="bi-question-circle" /><span class="visually-hidden"> {tr('Help')}</span></button>)
}

export function makeHelp(ctx :GlobalContext, target :HTMLElement) :[string, HTMLButtonElement] {
  assert(!target.hasAttribute('id') && !target.classList.contains('hideable-help'))
  const helpId = ctx.genId('Help')
  target.setAttribute('id', helpId)
  target.classList.add('hideable-help')
  initOrRemoveCollapse(target)
  const btn = makeHelpButton()
  btn.setAttribute('data-bs-toggle','collapse')
  btn.setAttribute('data-bs-target','#'+helpId)
  btn.setAttribute('aria-controls',helpId)
  btn.setAttribute('aria-expanded','false')
  return [helpId, btn]
}
