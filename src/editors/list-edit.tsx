/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
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
import { DataObjectBase, DataObjectTemplate, DataObjectWithTemplate, HasHtmlSummary } from '../types/common'
import { AbstractStore, OrderedStore } from '../storage'
import { listSelectDialog } from './list-dialog'
import { deleteConfirmation } from '../dialogs'
import { jsx, jsxFragment } from '../jsx-dom'
import { Editor, EditorClass } from './base'
import { CustomStoreEvent } from '../events'
import { assert, paranoia } from '../utils'
import { GlobalContext } from '../main'
import { tr } from '../i18n'

interface ListEditorParent {
  readonly ctx :GlobalContext
  readonly el :HTMLElement|null
  readonly isBrandNew :boolean
  selfUpdate() :Promise<void>
}

interface ILETexts {
  title :string
  help ?:string|HTMLElement|undefined
}
interface ILETextsWithTemp extends ILETexts {
  planned: string
}

export class ListEditor<E extends Editor<E, B>, B extends DataObjectBase<B>> {
  readonly el :HTMLElement
  readonly elWithTitle :HTMLElement

  private readonly btnDiv
  private readonly extraButtons :HTMLButtonElement[] = []
  private selId :string|null = null
  private readonly btnDel
  protected readonly btnNew
  private readonly btnEdit
  private readonly disableNotice
  protected enable() :boolean {
    /* If this list editor is editing part of an object that is new, then it won't have
    * been saved to its target store, so any changes to the arrays it holds (like the one
    * being edited by this editor) won't be saved either. So, to prevent users from being
    * able to build large object trees without them ever being saved, we require this
    * list editor's parent object to be saved before allowing edits to its arrays. */
    if (!this.parent.isBrandNew) {
      if (this.selId!==null) {
        this.btnDel.removeAttribute('disabled')
        this.btnEdit.removeAttribute('disabled')
        this.extraButtons.forEach(btn => btn.removeAttribute('disabled'))
      }
      else {
        this.btnDel.setAttribute('disabled', 'disabled')
        this.btnEdit.setAttribute('disabled', 'disabled')
        this.extraButtons.forEach(btn => btn.setAttribute('disabled', 'disabled'))
      }
      this.btnNew.removeAttribute('disabled')
      this.disableNotice.classList.add('d-none')
    }
    else {
      this.btnDel.setAttribute('disabled', 'disabled')
      this.btnEdit.setAttribute('disabled', 'disabled')
      this.btnNew.setAttribute('disabled', 'disabled')
      this.extraButtons.forEach(btn => btn.setAttribute('disabled', 'disabled'))
      this.disableNotice.classList.remove('d-none')
    }
    return !this.parent.isBrandNew
  }

  addButton(btn :HTMLButtonElement, onclick :(sel :B)=>void) {
    this.extraButtons.push(btn)
    this.btnDiv.appendChild(btn)
    btn.addEventListener('click', async () => {
      if (this.selId===null) return  // shouldn't happen
      onclick( await this.theStore.get(this.selId) )
    })
  }

  protected newEditor(obj :B|null) {
    const ed = new this.editorClass(this, this.theStore, obj)  // adds and removes itself from the stack
    /* Editors dispatch the CustomStoreEvent on themselves because there is a case where their child
     * ListEditors need to see it (see the .enable() notes), so here we just bubble the event down to
     * ourselves (so it can all be handled in one place) instead of making the editor fire it twice. */
    ed.el.addEventListener(CustomStoreEvent.NAME, event => {
      assert(event instanceof CustomStoreEvent)
      this.el.dispatchEvent(new CustomStoreEvent(event.detail))
    })
  }

  readonly ctx
  protected readonly parent
  protected readonly theStore
  private readonly editorClass
  constructor(parent :ListEditorParent, theStore :AbstractStore<B>, editorClass :EditorClass<E, B>, texts :ILETexts) {
    this.ctx = parent.ctx
    this.parent = parent
    this.theStore = theStore
    this.editorClass = editorClass

    this.btnDel = <button type="button" class="btn btn-outline-danger text-nowrap mt-1" disabled><i class="bi-trash3"/> {tr('Delete')}</button>
    this.btnNew = <button type="button" class="btn btn-outline-info text-nowrap ms-3 mt-1"><i class="bi-plus-circle"/> {tr('New')}</button>
    this.btnEdit = <button type="button" class="btn btn-outline-primary text-nowrap ms-3 mt-1" disabled><i class="bi-pencil-fill"/> {tr('Edit')}</button>
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
      this.enable()
    }
    const theUl = <ul class="list-group mb-2"></ul>
    const redrawList = async (selAfter :string|null = null) => {
      const theList = await this.theStore.getAll(null)
      els.length = theList.length
      if (theList.length) {
        Array.from(theList).forEach(([id,item],i) => {
          let content :HTMLElement = item.summaryAsHtml(false)
          if (this.theStore instanceof OrderedStore) {
            const btnUp = <button type="button" class="btn btn-sm btn-secondary me-1" title={tr('Move up')}><i class="bi-caret-up-fill"/><span class="visually-hidden"> {tr('Move up')}</span></button>
            if (!i) btnUp.setAttribute('disabled','disabled')
            const btnDown = <button type="button" class="btn btn-sm btn-secondary" title={tr('Move down')}><i class="bi-caret-down-fill"/><span class="visually-hidden"> {tr('Move down')}</span></button>
            if (i===theList.length-1) btnDown.setAttribute('disabled','disabled')
            content = <><div class="me-auto">{content}</div>{btnUp}{btnDown} </>
            btnUp.addEventListener('click', async event => {
              event.stopPropagation()
              assert(this.theStore instanceof OrderedStore)
              const newId = this.theStore.move(id, 'up')
              this.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: newId }))
            })
            btnDown.addEventListener('click', async event => {
              event.stopPropagation()
              assert(this.theStore instanceof OrderedStore)
              const newId = this.theStore.move(id, 'down')
              this.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: newId }))
            })
          }
          els[i] = <li class="list-group-item d-flex justify-content-between align-items-center cursor-pointer"
            data-id={id} onclick={()=>selectItem(id)}>{content}</li>
        } )
      } else els.push( <li class="list-group-item"><em>{tr('No items')}</em></li> )
      theUl.replaceChildren(...els)
      selectItem(selAfter, true)
      this.enable()
    }
    setTimeout(redrawList)  // work around that we can't call the async function from the constructor
    this.btnDiv = <div class="d-flex flex-row justify-content-end flex-wrap">{this.btnDel}{this.btnNew}{this.btnEdit}</div>
    this.el = <div>{theUl}{this.btnDiv}{this.disableNotice}</div>
    this.btnDel.addEventListener('click', async () => {
      const delId = this.selId  // b/c the event handlers may change this
      if (delId===null) return  // shouldn't happen
      const selItem = await this.theStore.get(delId)
      switch ( await deleteConfirmation(selItem.summaryAsHtml(true)) ) {
      case 'cancel': break
      case 'delete': {
        console.debug('Deleting',selItem,'...')
        /* REMEMBER deletion may change some object's ids!
         * Redrawing the list is handled via the event listener below. */
        const oldId = await this.theStore.del(selItem)
        paranoia(delId === oldId, `${delId}!==${oldId}`)
        this.el.dispatchEvent(new CustomStoreEvent({ action: 'del', id: oldId }))
        console.debug('... deleted id',oldId)
        break }
      }
    })
    this.elWithTitle = <div class="my-3">
      <hr class="mt-4 mb-2" />
      <h5 class={texts.help?'mb-1':'mb-3'}>{texts.title}</h5>
      {texts.help?<div class="form-text mb-3 hideable-help">{texts.help}</div>:''}
      {this.el}
    </div>

    //TODO Later: Double click an entry to edit
    this.btnEdit.addEventListener('click', async () => {
      if (this.selId===null) return  // shouldn't happen
      this.newEditor(await this.theStore.get(this.selId))
    })
    this.btnNew.addEventListener('click', () => this.newEditor(null))
    this.el.addEventListener(CustomStoreEvent.NAME, async event => {
      assert(event instanceof CustomStoreEvent)
      // If we were changed, tell parent editor (if we have one) to update itself in its store
      if (this.parent.el) await this.parent.selfUpdate()
      return redrawList(event.detail.action === 'del' ? null : event.detail.id)
    })
    if (this.parent.el)  // see notes in .enable()
      this.parent.el.addEventListener(CustomStoreEvent.NAME, () => this.enable())
  }
}

abstract class ListEditorTemp<E extends Editor<E, B>, T extends HasHtmlSummary, B extends DataObjectBase<B>> extends ListEditor<E, B> {
  protected abstract makeNew(t :T) :B
  protected postNew(_obj :B) {}
  private btnTemp
  constructor(parent :ListEditorParent, theStore :AbstractStore<B>, editorClass :EditorClass<E, B>, texts :ILETexts,
    dialogTitle :string|HTMLElement, templateSource :()=>Promise<T[]>) {
    super(parent, theStore, editorClass, texts)
    this.btnTemp = <button type="button" class="btn btn-outline-info text-nowrap ms-3 mt-1"><i class="bi-copy"/> {tr('From Template')}</button>
    this.btnTemp.addEventListener('click', async () => {
      const template = await listSelectDialog<T>(dialogTitle, await templateSource())
      if (template===null) return
      const newObj = this.makeNew(template)
      console.debug('Adding',newObj,'...')
      const newId = await this.theStore.add(newObj)
      this.el.dispatchEvent(new CustomStoreEvent({ action: 'add', id: newId }))
      this.postNew(newObj)
      console.debug('... added with id',newId)
    })
    this.btnNew.insertAdjacentElement('beforebegin', this.btnTemp)
  }
  override enable() {
    const globalEnable = super.enable()
    if (globalEnable) this.btnTemp.removeAttribute('disabled')
    else this.btnTemp.setAttribute('disabled', 'disabled')
    return globalEnable
  }
}
export class ListEditorForTemp<E extends Editor<E, T>, T extends DataObjectTemplate<T, D>, D extends DataObjectWithTemplate<D, T>> extends ListEditorTemp<E, T, T> {
  protected override makeNew(t :T) :T { return t.deepClone() }
}
export class ListEditorWithTemp<E extends Editor<E, D>, T extends DataObjectTemplate<T, D>, D extends DataObjectWithTemplate<D, T>> extends ListEditorTemp<E, T, D> {
  constructor(parent :ListEditorParent, theStore :AbstractStore<D>, editorClass :EditorClass<E, D>, texts :ILETextsWithTemp,
    dialogTitle :string|HTMLElement, templateSource :()=>Promise<T[]>, planned :T[]|null|undefined) {
    super(parent, theStore, editorClass, texts, dialogTitle, templateSource)
    planned ??= []

    const theUl = <ul class="list-group"></ul>
    const myEl = <div class="mt-1 d-none">
      <div class="mb-2 fs-5">{texts.planned}</div>
      {theUl}
    </div>
    const redrawList = async () => {
      myEl.classList.toggle('d-none', !planned.length)
      theUl.replaceChildren(...planned.map((t,ti) => {
        const btnNew = <button type="button" class="btn btn-info text-nowrap ms-3 fw-semibold"><i class="bi-copy"/> {tr('Start')}</button>
        btnNew.addEventListener('click', async () => {
          const rm = planned.splice(ti,1)[0]  // remove the desired template from the `planned` array
          paranoia(rm===t)
          const newObj = t.templateToObject()
          console.debug('Adding',newObj,'...')
          const newId = await this.theStore.add(newObj)
          // this event also causes our parent editor to be told to selfUpdate, so the above change to the `planned` array is saved
          this.el.dispatchEvent(new CustomStoreEvent({ action: 'add', id: newId }))
          this.newEditor(newObj)
          console.debug('... added with id',newId)
        })
        return <li class="list-group-item d-flex justify-content-between align-items-center">
          <div class="me-auto">{t.summaryAsHtml(false)}</div>
          {btnNew}
        </li>
      }))
    }
    setTimeout(redrawList)
    this.el.addEventListener(CustomStoreEvent.NAME, redrawList)
    this.el.appendChild(myEl)
  }
  protected override makeNew(t :T) :D { return t.templateToObject() }
  protected override postNew(obj: D) { this.newEditor(obj) }
}
