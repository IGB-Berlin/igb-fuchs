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
import { Editor, EditorClass } from './base'
import { deleteConfirmation } from '../misc'
import { SimpleEventHub } from '../events'
import { EditorStack } from './stack'
import { assert } from '../utils'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

type ChangeKind = 'edit'|'delete'|'new'
interface ListChange {
  kind :ChangeKind
  idx :number
}

export class ListEditor<E extends Editor<E, B>, B extends DataObjectBase<B>> {
  readonly el :HTMLElement
  readonly events :SimpleEventHub<ListChange>
  constructor(stack :EditorStack, theList :Array<B>, editorClass :EditorClass<E, B>, editorArgs ?:object) {
    const btnDel = <button type="button" class="btn btn-danger text-nowrap" disabled><i class="bi-trash3-fill"/> {tr('Delete')}</button>
    const btnNew = <button type="button" class="btn btn-info text-nowrap ms-3"><i class="bi-plus-circle"/> {tr('New')}</button>
    const btnEdit = <button type="button" class="btn btn-primary text-nowrap ms-3" disabled><i class="bi-pencil-fill"/> {tr('Edit')}</button>
    const els :HTMLElement[] = []
    let selIdx :number = -1
    const selectItem = (idx :number, scroll :boolean = false) => {
      assert(idx>=0 && idx<theList.length)
      els.forEach((e,i) => {
        if (i===idx) {
          e.classList.add('active')
          e.setAttribute('aria-current', 'true')
          if (scroll) e.scrollIntoView({ behavior: 'smooth' })
        }
        else {
          e.classList.remove('active')
          e.removeAttribute('aria-current')
        }
      })
      selIdx = idx
      btnDel.removeAttribute('disabled')
      btnEdit.removeAttribute('disabled')
    }
    const theUl = <ul class="list-group mb-2"></ul>
    const redrawList = (selAfter :number = -1) => {
      btnDel.setAttribute('disabled', 'disabled')
      btnEdit.setAttribute('disabled', 'disabled')
      els.length = theList.length
      if (theList.length)
        theList.forEach((item,i) => els[i]=<li class="list-group-item cursor-pointer" onclick={() => selectItem(i)}>{item.summaryAsHtml(false)}</li> )
      else
        els.push( <li class="list-group-item"><em>{tr('No items')}</em></li> )
      theUl.replaceChildren(...els)
      if (selAfter>=0) selectItem(selAfter, true)
      else selIdx = -1
    }
    redrawList()
    this.el = <div> {theUl} <div class="d-flex flex-row justify-content-end flex-wrap">{btnDel}{btnNew}{btnEdit}</div> </div>
    btnDel.addEventListener('click', async () => {
      if (selIdx<0) return  // shouldn't happen
      const selItem = theList[selIdx]
      assert(selItem)
      switch ( await deleteConfirmation(selItem.summaryAsHtml(true)) ) {
      case 'cancel': break
      case 'delete': {
        const delIdx = selIdx
        const rv = theList.splice(delIdx, 1)
        assert(rv.length===1 && selItem === rv[0])
        redrawList()
        this.events.fire({ kind: 'delete', idx: delIdx })
        break }
      }
    })
    btnEdit.addEventListener('click', () => {
      if (selIdx<0) return  // shouldn't happen
      //TODO Later: Now that Editors have access to the stack, should they push/pop themselves?
      const editor = new editorClass(stack, theList, selIdx, editorArgs)
      editor.events.add(event => {
        if (event.changeMade) {
          redrawList(selIdx)
          this.events.fire({ kind: 'edit', idx: selIdx })
        }
      })
    })
    btnNew.addEventListener('click', () => {
      const editor = new editorClass(stack, theList, -1, editorArgs)
      editor.events.add(event => {
        if (event.changeMade) {
          redrawList(theList.length-1)
          this.events.fire({ kind: 'new', idx: theList.length-1 })
        }
      })
    })
    this.events = new SimpleEventHub(false, [this.el, theUl])
  }
}
