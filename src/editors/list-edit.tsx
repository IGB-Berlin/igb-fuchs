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
import { DataObjectBase, DataObjectTemplate, DataObjectWithTemplate, HasHtmlSummary, StyleValue } from '../types/common'
import { CustomSelectEvent, CustomStoreEvent } from '../events'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, OrderedStore } from '../storage'
import { EditorClass, EditorParent } from './base'
import { listSelectDialog } from './list-dialog'
import { deleteConfirmation } from '../dialogs'
import { assert, paranoia } from '../utils'
import { GlobalContext } from '../main'
import { makeHelp } from '../help'
import { tr } from '../i18n'

/** The parts of the {@link Editor} interface that {@link ListEditor} cares about. */
export interface ListEditorParent {
  readonly ctx :GlobalContext
  readonly el :HTMLElement|null
  readonly isUnsaved :boolean
  selfUpdate() :Promise<void>
}

/** For keeping track of the most recently selected item, mostly so it can be used as a scroll target.
 * This is an external object because some {@link Editor}s contain multiple {@link ListEditor}s. */
export interface SelectedItemContainer {
  el :HTMLElement|null
}

/** {@link ListEditor} constructor arguments. */
interface ListEditorArguments<B extends DataObjectBase<B>> {
  parent :ListEditorParent
  theStore :AbstractStore<B>
  editorClass :EditorClass<B>
  editorStyle :StyleValue
  selItem ?:SelectedItemContainer
  title :string
  help ?:string|HTMLElement
}
export class ListEditor<B extends DataObjectBase<B>> implements EditorParent {
  readonly ctx
  protected readonly parent
  /** The Store this {@link ListEditor} is editing. */
  protected readonly theStore
  private readonly editorClass

  protected readonly selItem :SelectedItemContainer|undefined|null
  private selId :string|null = null

  /** The {@link ListEditor} without title or help. This is also the object that handles all Events! */
  readonly el :HTMLElement
  /** Only public so it can be used as a scroll target. */
  readonly titleEl :HTMLElement
  readonly elWithTitle :HTMLElement

  private readonly theUl :HTMLUListElement
  private readonly listEls :HTMLLIElement[] = []

  /** Buttons that should be enabled only when an item on the list is selected (see also {@link otherButtons}). */
  protected readonly selReqButtons :HTMLButtonElement[]
  /** Buttons that should always be enabled when the list editor is globally enabled (as opposed to {@link selReqButtons}). */
  protected readonly otherButtons :HTMLButtonElement[]

  private readonly btnDel :HTMLButtonElement
  /** Protected instead of private so it can be used by subclasses to inject buttons */
  protected readonly btnNew :HTMLButtonElement
  private readonly btnEdit :HTMLButtonElement

  private readonly divButtons :HTMLDivElement
  private readonly disableNotice :HTMLElement

  /** Construct a new ListEditor.
   *
   * **Warning:** You must call `initialize()` after constructing a new object of this class or its subclasses!
   */
  constructor(args :ListEditorArguments<B>) {
    this.ctx = args.parent.ctx
    this.parent = args.parent
    this.theStore = args.theStore
    this.editorClass = args.editorClass
    this.selItem = args.selItem

    this.btnDel = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-danger text-nowrap" disabled><i class="bi-trash3"/> {tr('Delete')}</button>)
    this.btnNew = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-info text-nowrap" disabled><i class="bi-plus-circle"/> {tr('New')}</button>)
    this.btnEdit = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-primary text-nowrap" disabled><i class="bi-pencil-fill"/> {tr('Edit')}</button>)
    this.selReqButtons = [ this.btnDel, this.btnEdit ]
    this.otherButtons = [ this.btnNew ]

    this.theUl = safeCastElement(HTMLUListElement, <ul class="list-group my-2"></ul>)
    this.divButtons = safeCastElement(HTMLDivElement,
      <div class="d-flex flex-row justify-content-end flex-wrap row-gap-1 column-gap-2">{this.btnDel}{this.btnNew}{this.btnEdit}</div> )
    this.disableNotice = <div class="d-none d-flex flex-row justify-content-end"><em>{tr('list-editor-disabled-new')}</em></div>
    this.el = <div>{this.theUl}{this.divButtons}{this.disableNotice}</div>

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

    this.btnEdit.addEventListener('click', async () => {
      if (this.selId===null) return  // shouldn't happen
      return this.newEditor(await this.theStore.get(this.selId), false)
    })
    this.btnNew.addEventListener('click', () => this.newEditor(null, true))
    if (this.parent.el)  // see notes in .checkGlobalEnable()
      this.parent.el.addEventListener(CustomStoreEvent.NAME, () => this.checkGlobalEnable())

    const divHelp = <div class="form-text my-0">{args.help??''}</div>
    const [_helpId, helpBtn] = makeHelp(this.ctx, divHelp)
    this.titleEl = <h5 class={`mb-0 editor-${args.editorStyle.cssId}-text`}><i class={`bi-${args.editorStyle.icon} me-1`}/>
      {args.title} {args.help?helpBtn:''}</h5>
    this.elWithTitle = <div class="my-3">
      <hr class="mt-4 mb-2" />
      {this.titleEl}
      {args.help?divHelp:''}
      {this.el}
    </div>

    this.el.addEventListener(CustomStoreEvent.NAME, async event => {
      assert(event instanceof CustomStoreEvent)
      // If we were changed, tell parent editor (if we have one) to update itself in its store
      if (this.parent.el) await this.parent.selfUpdate()
      return this.redrawList(event.detail.action === 'del' ? null : event.detail.id)
    })

  }  // ListEditor constructor

  private selectItem(id :string|null) {
    this.listEls.forEach(e => {
      if (id!==null && id===e.getAttribute('data-id')) {
        e.classList.add('active')
        e.setAttribute('aria-current', 'true')
        if (this.selItem!=null) this.selItem.el = e
      }
      else {
        e.classList.remove('active')
        e.removeAttribute('aria-current')
      }
    })
    this.selId = id
    this.el.dispatchEvent(new CustomSelectEvent(id))
    this.checkGlobalEnable()
  }

  private async redrawList(selAfter :string|null = null) {
    const theList = await this.theStore.getAll(null)
    this.listEls.length = theList.length
    if (theList.length) {
      Array.from(theList).forEach(([id,item],i) => {
        let content :HTMLElement = this.contentFor(item)
        if (this.theStore instanceof OrderedStore) {
          const btnUp = safeCastElement(HTMLButtonElement,
            <button type="button" class="btn btn-sm btn-secondary py-0 lh-1" title={tr('Move up')}>
              <i class="bi-caret-up-fill"/><span class="visually-hidden"> {tr('Move up')}</span></button>)
          if (!i) btnUp.disabled = true
          const btnDown = safeCastElement(HTMLButtonElement,
            <button type="button" class="btn btn-sm btn-secondary py-0 lh-1" title={tr('Move down')}>
              <i class="bi-caret-down-fill"/><span class="visually-hidden"> {tr('Move down')}</span></button>)
          if (i===theList.length-1) btnDown.disabled = true
          content = <><div class="flex-grow-1">{content}</div><div class="d-flex flex-column gap-0 flex-nowrap justify-content-end">{btnUp}{btnDown}</div></>
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
        this.listEls[i] = safeCastElement(HTMLLIElement,
          <li class="list-group-item d-flex justify-content-between align-items-center cursor-pointer gap-2"
            data-id={id} onclick={()=>this.selectItem(id)} ondblclick={()=>this.newEditor(item, false)}>{content}</li>)
      } )
    } else this.listEls.push( safeCastElement(HTMLLIElement, <li class="list-group-item"><em>{tr('No items')}</em></li> ) )
    this.theUl.replaceChildren(...this.listEls)
    this.selectItem(selAfter)
    this.checkGlobalEnable()
  }

  async initialize() {
    await this.redrawList()
    return this
  }

  /** Checks whether this ListEditor should be globally en-/disabled and updates the button states
   * and appropriate notice.
   *
   * If this ListEditor is editing part of a newly created object, then that newly created object
   * won't have been saved to its target store yet, so any changes to the arrays it holds - like
   * the one being edited by this ListEditor - won't have been saved either. So, to prevent users
   * from being able to build large object trees without them ever being saved, we require this
   * ListEditor's parent object to be saved before allowing edits to its arrays.
   *
   * @returns `true` if this ListEditor can be enabled, `false` if it should remain disabled.
   */
  protected checkGlobalEnable() :boolean {
    const globalEnable = !this.parent.isUnsaved
    this.selReqButtons.forEach(btn => btn.disabled = !globalEnable || this.selId==null )
    this.otherButtons.forEach( btn => btn.disabled = !globalEnable )
    this.disableNotice.classList.toggle('d-none', globalEnable)
    return globalEnable
  }

  /** *Only* for use by {@link popButton}! */
  protected _popButton(btn :HTMLButtonElement) :HTMLButtonElement {
    btn.classList.remove('btn','text-nowrap','btn-outline-info','btn-outline-danger','btn-outline-primary')
    btn.parentElement?.removeChild(btn)
    return btn
  }
  /** Removes the button from the ListEditor, and also removes its styling. Currently *only* for use by {@link HomePage}. */
  popButton(which :'new'|'del'|'edit') { return this._popButton( which==='new' ? this.btnNew : which==='del' ? this.btnDel : this.btnEdit ) }
  /** Registers a button whose click handler operates on the currently selected item. Currently *only* for use by {@link HomePage}. */
  registerButton(btn :HTMLButtonElement, onclick :(selItem :B)=>unknown) {
    btn.addEventListener('click', async () => {
      if (this.selId===null) return
      return onclick( await this.theStore.get(this.selId) )
    })
    this.selReqButtons.push(btn)
    this.checkGlobalEnable()
  }
  /** Add an element to this ListEditor's button div. Currently *only* for use by {@link HomePage}. */
  addToButtons(what :HTMLElement) { this.divButtons.appendChild(what) }

  /** Open a new {@link Editor} object for an item in this list. */
  protected async newEditor(obj :B|null, isNew :boolean) {
    const ed = await new this.editorClass(this, this.theStore, obj, isNew).initialize()  // adds and removes itself from the stack
    /* Editors dispatch the CustomStoreEvent on themselves because there is a case where their child
     * ListEditors need to see it (see the .checkGlobalEnable() notes), so here we just bubble the event down to
     * ourselves (so it can all be handled in one place) instead of making the editor fire it twice. */
    ed.el.addEventListener(CustomStoreEvent.NAME, event => {
      assert(event instanceof CustomStoreEvent)
      this.el.dispatchEvent(new CustomStoreEvent(event.detail))
    })
  }

  /** So subclasses can override. */
  protected contentFor(item :B) :HTMLElement { return item.summaryAsHtml(false) }

  /** So parent can request a specific button to be highlighted; subclasses can override. */
  highlightButton(_which :'new') {
    this.btnNew.classList.remove('btn-outline-info')
    this.btnNew.classList.add('btn-info')
  }

}  // class ListEditor

/** {@link ListEditorTemp} constructor arguments. */
interface ListEditorTempArguments<T extends HasHtmlSummary, B extends DataObjectBase<B>> extends ListEditorArguments<B> {
  dialogTitle :string|HTMLElement
  templateSource :()=>Promise<T[]>
}
/** An abstract class of a ListEditor for objects that have templates. */
export abstract class ListEditorTemp<T extends HasHtmlSummary, B extends DataObjectBase<B>> extends ListEditor<B> {

  private btnTemp :HTMLButtonElement

  constructor(args :ListEditorTempArguments<T,B>) {
    super(args)

    this.btnTemp = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-info text-nowrap" disabled><i class="bi-copy"/> {tr('From Template')}</button>)
    this.btnTemp.addEventListener('click', async () => {
      const template = await listSelectDialog<T>(args.dialogTitle, await args.templateSource())
      if (template===null) return
      await this.addNew(template)
    })
    this.otherButtons.push(this.btnTemp)
    this.btnNew.insertAdjacentElement('beforebegin', this.btnTemp)
  }

  override highlightButton(which: 'new'|'temp'): void {
    switch(which) {
      case 'new': super.highlightButton('new'); break
      case 'temp':
        this.btnTemp.classList.remove('btn-outline-info')
        this.btnTemp.classList.add('btn-info')
    }
  }

  override popButton(which :'new'|'del'|'edit'|'temp') { return which==='temp' ? super._popButton(this.btnTemp) : super.popButton(which) }

  /** Creates a new (unsaved) object from a template. */
  protected abstract makeNew(t :T) :B

  /** Creates a new object from a template, saves it to this store being edited, and opens a new {@link Editor} for the object. */
  protected async addNew(template :T) {
    const newObj = this.makeNew(template)
    console.debug('Adding',newObj,'...')
    const newId = await this.theStore.add(newObj)
    this.el.dispatchEvent(new CustomStoreEvent({ action: 'add', id: newId }))
    console.debug('... added with id',newId,'now editing')
    return this.newEditor(newObj, true)
  }

}  // class ListEditorTemp

/** An implementation of ListEditorTemp where the templates are of the same type as the objects being edited. */
export class ListEditorForTemp<T extends DataObjectTemplate<T, D>, D extends DataObjectWithTemplate<D, T>> extends ListEditorTemp<T, T> {
  protected override makeNew(t :T) :T { return t.deepClone() }
}

/** {@link ListEditorWithTemp} constructor arguments. */
interface ListEditorWithTempArguments<T extends DataObjectTemplate<T, D>, D extends DataObjectWithTemplate<D, T>> extends ListEditorTempArguments<T,D> {
  planned :T[]|null|undefined
  txtPlanned :string
}
/** An implementation of ListEditorTemp where the templates are of different type than the objects being edited. */
export class ListEditorWithTemp<T extends DataObjectTemplate<T, D>, D extends DataObjectWithTemplate<D, T>> extends ListEditorTemp<T, D> {

  /** How many planned items there originally were when this editor was initialized. */
  private readonly plannedCount :number
  private readonly plannedLeft :T[]
  get plannedLeftCount() { return this.plannedLeft.length }

  /** Is only public so it can be used as a scroll target. */
  readonly plannedTitleEl
  private readonly pUl
  private readonly pEl
  private readonly pDone

  constructor(args :ListEditorWithTempArguments<T,D>) {
    super(args)

    this.plannedCount = args.planned?.length ?? 0
    this.plannedLeft = args.planned ?? []

    assert(args.editorStyle.opposite)
    this.pUl = <ul class="list-group"></ul>
    this.plannedTitleEl = <div class="mb-2 fs-5"><i class={`bi-${args.editorStyle.opposite.icon}`}/> {args.txtPlanned}</div>
    this.pEl = <div class="mt-1 d-none"> {this.plannedTitleEl} {this.pUl} </div>
    this.el.appendChild(this.pEl)
    this.el.addEventListener(CustomStoreEvent.NAME, () => this.redrawPlanned())

    this.pDone = <div class="my-2 text-success fw-semibold fs-5 d-none"><i class="bi-check-lg me-1"/> {args.txtPlanned}: {tr('All completed')}</div>
    this.el.appendChild(this.pDone)
  }

  private async redrawPlanned() {
    // Show the "done" text if we originally had planned items and they're all done:
    if (this.plannedCount && !this.plannedLeft.length) this.pDone.classList.remove('d-none')
    // If there aren't any planned items left, hide the whole list:
    this.pEl.classList.toggle('d-none', !this.plannedLeft.length)
    this.pUl.replaceChildren(...this.plannedLeft.map((t,ti) => {
      const btnStart = safeCastElement(HTMLButtonElement,
        <button type="button" class="btn btn-info text-nowrap ms-3 fw-semibold"><i class="bi-copy"/> {tr('Start')}</button>)
      btnStart.addEventListener('click', async () => {
        // NOTE the similarity to this.startFirstPlannedItem()
        const rm = this.plannedLeft.splice(ti,1)[0]  // remove the desired template from the `planned` array
        paranoia(rm===t)
        // this also fires an event that causes our parent editor to be told to selfUpdate, so the above change to the `planned` array is saved
        await this.addNew(t)
      })
      return <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="me-auto">{t.summaryAsHtml(false)}</div> {btnStart} </li>
    }))
  }

  override async initialize() {
    await super.initialize()
    await this.redrawPlanned()
    return this
  }

  protected override makeNew(t :T) :D { return t.templateToObject() }

  async startFirstPlannedItem() {
    // NOTE the similarity to btnNew's click handler
    const first = this.plannedLeft.shift()
    if (!first) throw new Error('startFirstPlannedItem called when no planned items left')
    await this.addNew(first)
  }

}  // class ListEditorWithTemp
