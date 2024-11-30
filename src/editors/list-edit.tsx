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
import { DataObjectBase } from '../types/common'
import { deleteConfirmation } from '../dialogs'
import { Editor, EditorClass } from './base'
import { AbstractStore } from '../storage'
import { EditorStack } from './stack'
import { assert } from '../utils'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

export class ListEditor<E extends Editor<E, B>, B extends DataObjectBase<B>> {
  readonly el :HTMLElement
  readonly enable :(enable :boolean) => void
  constructor(stack :EditorStack, theStore :AbstractStore<B>, editorClass :EditorClass<E, B>, editorArgs ?:object) {
    const btnDel = <button type="button" class="btn btn-danger text-nowrap" disabled><i class="bi-trash3-fill"/> {tr('Delete')}</button>
    const btnNew = <button type="button" class="btn btn-info text-nowrap ms-3"><i class="bi-plus-circle"/> {tr('New')}</button>
    const btnEdit = <button type="button" class="btn btn-primary text-nowrap ms-3" disabled><i class="bi-pencil-fill"/> {tr('Edit')}</button>
    const disableNotice = <div class="d-none d-flex flex-row justify-content-end"><em>{tr('list-editor-disabled-new')}</em></div>
    let selId :string|null = null
    let globalEnabled :boolean = false
    this.enable = (newGlobalEnable :boolean) => {
      globalEnabled = newGlobalEnable
      if (globalEnabled) {
        if (selId!==null) {
          btnDel.removeAttribute('disabled')
          btnEdit.removeAttribute('disabled')
        }
        else {
          btnDel.setAttribute('disabled', 'disabled')
          btnEdit.setAttribute('disabled', 'disabled')
        }
        btnNew.removeAttribute('disabled')
        disableNotice.classList.add('d-none')
      }
      else {
        btnDel.setAttribute('disabled', 'disabled')
        btnEdit.setAttribute('disabled', 'disabled')
        btnNew.setAttribute('disabled', 'disabled')
        disableNotice.classList.remove('d-none')
      }
    }
    const els :HTMLElement[] = []
    const selectItem = (id :string|null, scroll :boolean = false) => {
      els.forEach(e => {
        if (id!==null && id===e.getAttribute('data-id')) {
          e.classList.add('active')
          e.setAttribute('aria-current', 'true')
          if (scroll) e.scrollIntoView({ behavior: 'smooth' })
        }
        else {
          e.classList.remove('active')
          e.removeAttribute('aria-current')
        }
      })
      selId = id
      this.enable(globalEnabled)
    }
    const theUl = <ul class="list-group mb-2"></ul>
    const redrawList = async (selAfter :string|null = null) => {
      const theList = await theStore.getAll(null)
      els.length = theList.length
      if (theList.length) {
        Array.from(theList).forEach(([id,item],i) =>
          els[i]=<li class="list-group-item cursor-pointer" data-id={id} onclick={()=>selectItem(id)}>{item.summaryAsHtml(false)}</li> )
      } else els.push( <li class="list-group-item"><em>{tr('No items')}</em></li> )
      theUl.replaceChildren(...els)
      selectItem(selAfter, true)
      this.enable(globalEnabled)
    }
    setTimeout(redrawList)
    this.el = <div>
      {theUl}
      <div class="d-flex flex-row justify-content-end flex-wrap">{btnDel}{btnNew}{btnEdit}</div>
      {disableNotice}
    </div>
    btnDel.addEventListener('click', async () => {
      if (selId===null) return  // shouldn't happen
      const selItem = await theStore.get(selId)
      switch ( await deleteConfirmation(selItem.summaryAsHtml(true)) ) {
      case 'cancel': break
      case 'delete': {
        // REMEMBER deletion may change some object's ids!
        const del = await theStore.del(selItem)
        assert(selId === del)  // paranoia
        break }
      }
    })
    btnEdit.addEventListener('click', async () => {
      if (selId===null) return  // shouldn't happen
      const selItem = await theStore.get(selId)
      new editorClass(stack, theStore, selItem, editorArgs)  // adds and removes itself from the stack
    })
    btnNew.addEventListener('click', () => {
      new editorClass(stack, theStore, null, editorArgs)  // adds and removes itself from the stack
    })
    theStore.events.add(event => redrawList(event.action === 'del' ? undefined : event.id))
  }
}
