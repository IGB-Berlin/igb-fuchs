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
import { assert } from '../utils'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

export class ListEditor<E extends Editor<E, B>, B extends DataObjectBase<B>> {
  readonly el :HTMLElement
  constructor(theList :Array<B>, editorClass :EditorClass<E, B>) {
    const btnDel = <button class="btn btn-danger text-nowrap" disabled><i class="bi-trash3-fill"/> {tr('Delete')}</button>
    const btnNew = <button class="btn btn-info text-nowrap ms-3"><i class="bi-plus-circle"/> {tr('New')}</button>
    const btnEdit = <button class="btn btn-primary text-nowrap ms-3" disabled><i class="bi-pencil-fill"/> {tr('Edit')}</button>
    const els :HTMLElement[] = []
    let selIdx :number = -1
    const selectItem = (idx :number) => {
      assert(idx>=0 && idx<theList.length)
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
      btnDel.removeAttribute('disabled')
      btnEdit.removeAttribute('disabled')
    }
    const theUl = <ul class="list-group mb-2"></ul>
    const redrawList = (selAfter :number = -1) => {
      els.length = theList.length
      if (theList.length)
        theList.forEach((item,i) => els[i]=<li class="list-group-item" onclick={() => selectItem(i)}>{item.summaryAsHtml()}</li> )
      else {
        els.push( <li class="list-group-item"><em>{tr('No items')}</em></li> )
        btnDel.setAttribute('disabled', 'disabled')
        btnEdit.setAttribute('disabled', 'disabled')
      }
      theUl.replaceChildren(...els)
      if (selAfter>=0) selectItem(selAfter)
      else selIdx = -1
    }
    redrawList()
    this.el = <div> {theUl} <div class="d-flex flex-row justify-content-end flex-wrap">{btnDel}{btnNew}{btnEdit}</div> </div>
    btnDel.addEventListener('click', async () => {
      if (selIdx<0) return  // shouldn't happen
      const selItem = theList[selIdx]
      assert(selItem)
      switch ( await deleteConfirmation(selItem.summaryAsHtml()) ) {
      case 'cancel': break
      case 'delete': {
        const rv = theList.splice(selIdx, 1)
        assert(rv.length===1 && Object.is(selItem, rv[0]))
        redrawList()
        break }
      }
    })
    btnEdit.addEventListener('click', () => {
      if (selIdx<0) return  // shouldn't happen
      const editor = new editorClass(theList, selIdx)
      editor.addDoneCallback(changeMade => {
        document.body.removeChild(editor.el)
        if (changeMade) {
          redrawList(selIdx)
          this.fireChange()
        }
      })
      document.body.appendChild(editor.el)
    })
    btnNew.addEventListener('click', () => {
      const editor = new editorClass(theList, -1)
      editor.addDoneCallback(changeMade => {
        document.body.removeChild(editor.el)
        if (changeMade) {
          redrawList(theList.length-1)
          this.fireChange()
        }
      })
      document.body.appendChild(editor.el)  //TODO: just for debugging - implement editor stack
    })
  }
  /* Simple event listener mechanism b/c EventTarget is a little complex to deal with in TypeScript for this simple case. */
  protected changeCallbacks :(()=>void)[] = []
  addChangeCallback(c :()=>void) { this.changeCallbacks.push(c) }
  removeChangeCallback(c :()=>void) {
    for(let i=this.changeCallbacks.length-1;i>=0;i--)
      if (this.changeCallbacks[i]===c)
        this.changeCallbacks.splice(i,1) }
  fireChange() { this.changeCallbacks.forEach(c => c()) }
}
