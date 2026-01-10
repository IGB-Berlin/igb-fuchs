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
import { jsx, safeCast } from '@haukex/simple-jsx-dom'
import { GlobalContext } from './main'
import { Modal } from 'bootstrap'

interface ModalDialogOpts<T> {
  testId ?:string
  size ?:undefined|'lg'|'xl'|'fullscreen-sm-down'
  scrollable ?:boolean
  headerColor ?:undefined|'info'|'bg-warning'|'bg-danger'
  titleIcon ?:string
  title :string
  body :string|Node
  buttons :HTMLElement[]
  hiddenCallback :( (resolve: (value: T | PromiseLike<T>) => void) => void )
}

export function modalDialog<T>(o :ModalDialogOpts<T>) :Promise<T> {
  const h1Id = GlobalContext.genId('Modal')
  const titleIcon = o.titleIcon ? <i class={ (o.titleIcon.startsWith('bi-') ? '' : 'bi-') + o.titleIcon + ' me-1' }/> : ''
  const h1 = <h1 class="modal-title fs-5" id={h1Id}>{titleIcon}{o.title}</h1>
  o.buttons.forEach(btn => {
    safeCast(HTMLButtonElement, btn).type = 'button'
    btn.setAttribute('data-bs-dismiss','modal')
    btn.classList.add('btn')
  })
  const footer = o.buttons.length ? <div class="modal-footer">{o.buttons}</div> : ''
  const dialog = <div data-bs-backdrop="static" data-bs-keyboard="false"
    class="modal fade" tabindex="-1" aria-labelledby={h1Id} aria-hidden="true">
    <div class={ 'modal-dialog modal-dialog-centered' + ( o.size ? ' modal-'+o.size : '' ) + ( o.scrollable ? ' modal-dialog-scrollable' : '' ) }>
      <div class="modal-content">
        <div class={ 'modal-header' + ( o.headerColor ? ' text-'+o.headerColor : '' ) }>{h1}</div>
        <div class="modal-body">{ o.body instanceof Node ? o.body : <p>{o.body}</p> }</div>
        {footer}
      </div>
    </div>
  </div>
  if (o.testId) dialog.setAttribute('data-test-id',o.testId)
  document.body.appendChild(dialog)
  return new Promise<T>(resolve => {
    const modal = Modal.getOrCreateInstance(dialog)
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      o.hiddenCallback(resolve)
    })
    modal.show()
  })
}
