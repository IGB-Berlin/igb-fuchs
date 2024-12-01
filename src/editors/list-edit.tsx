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
import { DataObjectBase, DataObjectTemplate, DataObjectWithTemplate } from '../types/common'
import { HasHtmlSummary, listSelectDialog } from './list-dialog'
import { deleteConfirmation } from '../dialogs'
import { Editor, EditorClass } from './base'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { assert } from '../utils'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

export class ListEditor<E extends Editor<E, B>, B extends DataObjectBase<B>> {
  readonly el :HTMLElement

  protected selId :string|null = null
  protected btnDel :HTMLElement
  protected btnNew :HTMLElement
  protected btnEdit :HTMLElement
  protected disableNotice :HTMLElement
  protected globalEnabled :boolean = false
  enable (newGlobalEnable :boolean) {
    this.globalEnabled = newGlobalEnable
    if (this.globalEnabled) {
      if (this.selId!==null) {
        this.btnDel.removeAttribute('disabled')
        this.btnEdit.removeAttribute('disabled')
      }
      else {
        this.btnDel.setAttribute('disabled', 'disabled')
        this.btnEdit.setAttribute('disabled', 'disabled')
      }
      this.btnNew.removeAttribute('disabled')
      this.disableNotice.classList.add('d-none')
    }
    else {
      this.btnDel.setAttribute('disabled', 'disabled')
      this.btnEdit.setAttribute('disabled', 'disabled')
      this.btnNew.setAttribute('disabled', 'disabled')
      this.disableNotice.classList.remove('d-none')
    }
  }

  /* If this list editor is editing part of an object that is new, then it won't have
   * been saved to its target store, so any changes to the arrays it holds (like the one
   * being edited by this editor) won't be saved wither. So, to prevent users from being
   * able to build large object  trees without them ever being saved, we require this
   * list editor's parent object to be saved before allowing edits to its arrays. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected parentEditor :Editor<any, any>|null = null
  protected parentListener :(()=>void) = () => {
    assert(this.parentEditor!==null, 'bad internal state')
    this.enable(!!this.parentEditor.savedObj)
  }
  watchEnable<E2 extends Editor<E2, B2>, B2 extends DataObjectBase<B2>>(parentEditor :E2) {
    assert(this.parentEditor===null, 'watchEnable called twice')
    this.parentEditor = parentEditor
    this.parentEditor.targetEvents.add(this.parentListener)
    this.parentListener()
  }
  close() {
    if (this.parentEditor!==null) {
      this.parentEditor.targetEvents.remove(this.parentListener)
      this.parentEditor = null
    }
  }

  constructor(ctx :GlobalContext, theStore :AbstractStore<B>, editorClass :EditorClass<E, B>) {
    this.btnDel = <button type="button" class="btn btn-danger text-nowrap" disabled><i class="bi-trash3-fill"/> {tr('Delete')}</button>
    this.btnNew = <button type="button" class="btn btn-info text-nowrap ms-3"><i class="bi-plus-circle"/> {tr('New')}</button>
    this.btnEdit = <button type="button" class="btn btn-primary text-nowrap ms-3" disabled><i class="bi-pencil-fill"/> {tr('Edit')}</button>
    this.disableNotice = <div class="d-none d-flex flex-row justify-content-end"><em>{tr('list-editor-disabled-new')}</em></div>
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
      this.selId = id
      this.enable(this.globalEnabled)
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
      this.enable(this.globalEnabled)
    }
    setTimeout(redrawList)  // work around that we can't call the async function from the constructor
    this.el = <div>
      {theUl}
      <div class="d-flex flex-row justify-content-end flex-wrap">{this.btnDel}{this.btnNew}{this.btnEdit}</div>
      {this.disableNotice}
    </div>
    this.btnDel.addEventListener('click', async () => {
      const delId = this.selId  // b/c the event handlers may change this
      if (delId===null) return  // shouldn't happen
      const selItem = await theStore.get(delId)
      switch ( await deleteConfirmation(selItem.summaryAsHtml(true)) ) {
      case 'cancel': break
      case 'delete': {
        console.debug('Deleting',selItem,'...')
        /* REMEMBER deletion may change some object's ids!
         * Redrawing the list is handled via the event listener below. */
        const del = await theStore.del(selItem)
        assert(delId === del, `${delId}!==${del}`)  // paranoia
        console.debug('... deleted id',del)
        break }
      }
    })
    this.btnEdit.addEventListener('click', async () => {
      if (this.selId===null) return  // shouldn't happen
      const selItem = await theStore.get(this.selId)
      new editorClass(ctx, theStore, selItem)  // adds and removes itself from the stack
    })
    this.btnNew.addEventListener('click', () => {
      new editorClass(ctx, theStore, null)  // adds and removes itself from the stack
    })
    theStore.events.add(event => redrawList(event.action === 'del' ? undefined : event.id))
  }

  withBorder(title :string, help :string|null = null) {
    return <div class="border rounded my-3 p-3">
      <div class={help===null?'mb-3 fs-5':'fs-5'}>{title}</div>
      {help===null?'':<div class="form-text mb-3">{help}</div>}
      {this.el}
    </div>
  }

}

abstract class ListEditorTemp<E extends Editor<E, B>, T extends HasHtmlSummary, B extends DataObjectBase<B>> extends ListEditor<E, B> {
  protected abstract makeNew(t :T) :B
  protected btnTemp :HTMLElement
  constructor(ctx :GlobalContext, theStore :AbstractStore<B>, editorClass :EditorClass<E, B>, dialogTitle :string|HTMLElement, templateSource :()=>T[]) {
    super(ctx, theStore, editorClass)
    this.btnTemp = <button type="button" class="btn btn-info text-nowrap ms-3"><i class="bi-copy"/> {tr('From Template')}</button>
    this.btnTemp.addEventListener('click', async () => {
      const template = await listSelectDialog(dialogTitle, templateSource())
      if (template===null) return
      const newObj = this.makeNew(template)
      console.debug('Added',newObj,'with id',theStore.add(newObj))
    })
    this.btnNew.insertAdjacentElement('beforebegin', this.btnTemp)
  }
  override enable(newGlobalEnable: boolean) {
    super.enable(newGlobalEnable)
    if (this.globalEnabled) this.btnTemp.removeAttribute('disabled')
    else this.btnTemp.setAttribute('disabled', 'disabled')
  }
}
export class ListEditorForTemp<E extends Editor<E, T>, T extends DataObjectTemplate<T, D>, D extends DataObjectWithTemplate<D, T>> extends ListEditorTemp<E, T, T> {
  protected override makeNew(t :T) :T { return t.deepClone() }
}
export class ListEditorWithTemp<E extends Editor<E, D>, T extends DataObjectTemplate<T, D>, D extends DataObjectWithTemplate<D, T>> extends ListEditorTemp<E, T, D> {
  protected override makeNew(t :T) :D { return t.templateToObject() }
}
