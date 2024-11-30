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
import { SimpleEventHub } from '../events'
import { EditorStack } from './stack'
import { assert } from '../utils'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'
import { AbstractList } from '../types/list'

interface ListEditorEvent {
  kind :'edit'|'delete'|'new'
  idx :number
}

export class ListEditor<E extends Editor<E, B>, B extends DataObjectBase<B>> {
  readonly el :HTMLElement
  readonly events :SimpleEventHub<ListEditorEvent>
  readonly updateEnable :(enable ?:boolean) => void
  constructor(stack :EditorStack, theList :AbstractList<B>, editorClass :EditorClass<E, B>, editorArgs ?:object) {
    const btnDel = <button type="button" class="btn btn-danger text-nowrap" disabled><i class="bi-trash3-fill"/> {tr('Delete')}</button>
    const btnNew = <button type="button" class="btn btn-info text-nowrap ms-3"><i class="bi-plus-circle"/> {tr('New')}</button>
    const btnEdit = <button type="button" class="btn btn-primary text-nowrap ms-3" disabled><i class="bi-pencil-fill"/> {tr('Edit')}</button>
    const disableNotice = <div class="d-none d-flex flex-row justify-content-end"><em>{tr('list-editor-disabled-new')}</em></div>
    let enabled :boolean = true
    this.updateEnable = (enable ?:boolean) => {
      if (enable===undefined) enable = enabled
      if (enable) {
        if (selIdx>=0 && selIdx<theList.length) {
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
      enabled = enable
    }
    const els :HTMLElement[] = []
    let selIdx :number = -1
    const selectItem = (idx :number, scroll :boolean = false) => {
      assert(els.length===theList.length && idx>=0 && idx<theList.length)
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
      this.updateEnable()
    }
    const theUl = <ul class="list-group mb-2"></ul>
    const redrawList = (selAfter :number = -1) => {
      els.length = theList.length
      if (theList.length)
        Array.from(theList).forEach((item,i) => els[i]=<li class="list-group-item cursor-pointer" onclick={() => selectItem(i)}>{item.summaryAsHtml(false)}</li> )
      else
        els.push( <li class="list-group-item"><em>{tr('No items')}</em></li> )
      theUl.replaceChildren(...els)
      if (selAfter>=0) selectItem(selAfter, true)
      else selIdx = -1
      this.updateEnable()
    }
    redrawList()
    this.el = <div>
      {theUl}
      <div class="d-flex flex-row justify-content-end flex-wrap">{btnDel}{btnNew}{btnEdit}</div>
      {disableNotice}
    </div>
    btnDel.addEventListener('click', async () => {
      if (selIdx<0) return  // shouldn't happen
      const selItem = theList.get(selIdx)
      switch ( await deleteConfirmation(selItem.summaryAsHtml(true)) ) {
      case 'cancel': break
      case 'delete': {
        const delIdx = selIdx
        const rv = theList.del(delIdx)
        assert(selItem === rv)  // paranoia
        redrawList()
        this.events.fire({ kind: 'delete', idx: delIdx })
        break }
      }
    })
    btnEdit.addEventListener('click', () => {
      if (selIdx<0) return  // shouldn't happen
      const editor = new editorClass(stack, theList, selIdx, editorArgs)
      editor.events.add(event => {
        console.debug(`ListEditor<${editorClass.name}> got EditorEvent`, event.type)
        if (event.type==='save') {
          redrawList(selIdx)
          this.events.fire({ kind: 'edit', idx: selIdx })
        }
      })
    })
    btnNew.addEventListener('click', () => {
      const editor = new editorClass(stack, theList, -1, editorArgs)
      editor.events.add(event => {
        console.debug(`ListEditor<${editorClass.name}> got EditorEvent`, event.type)
        if (event.type==='save') {
          redrawList(theList.length-1)
          this.events.fire({ kind: 'new', idx: theList.length-1 })
        }
      })
    })
    this.events = new SimpleEventHub(false, [this.el, theUl])
  }
}
