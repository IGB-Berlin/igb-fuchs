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
import { CustomChangeEvent, CustomStoreEvent } from '../events'
import { infoDialog, unsavedChangesQuestion } from '../dialogs'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { DataObjectBase } from '../types/common'
import { ListEditorParent } from './list-edit'
import { assert, paranoia } from '../utils'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { StackAble } from './stack'
import { makeHelp } from '../help'
import { tr } from '../i18n'

/* WARNING: All <button>s inside the <form> that don't have a `type="button"`
 * act as submit buttons, so always remember to add `type="button"`!! */

export interface EditorParent {
  ctx :GlobalContext
  el :HTMLElement
}

export type EditorClass<B extends DataObjectBase<B>> = new (
  parent :EditorParent, targetStore :AbstractStore<B>, targetObj :B|null, isNew :boolean) => Editor<B>

interface MakeRowOps {
  label :HTMLElement|string
  helpText ?:HTMLElement|string
  invalidText ?:HTMLElement|string
}

interface MakeTextAreaRowOpts extends MakeRowOps {
  readonly ?:boolean
  startExpanded :boolean
  hideWhenEmpty ?:boolean
}

export abstract class Editor<B extends DataObjectBase<B>> implements StackAble, ListEditorParent, EditorParent {

  /** Return a brand new object of the type being edited by the editor. */
  protected abstract newObj() :B
  /** Returns an object with its fields populated from the current form state.
   *
   * @param saving Whether the object is in the process of being saved,
   *  as opposed to a dirty check.
   */
  protected abstract form2obj(saving :boolean) :Readonly<B>
  /** Return the current name of the element being edited. */
  abstract currentName() :string
  /** Implementations should intelligently scroll to the next field/button that needs input. */
  protected abstract doScroll(_pushNotPop :boolean) :void

  /** Subclasses can choose to provide a "Next" button by overriding this and `doNext` */
  protected nextButtonText() :string { return '' }
  /** Subclasses can choose to provide a "Next" button by overriding this and `nextButtonText` */
  protected doNext() {}

  readonly ctx
  protected readonly parent
  /** The store in which the object with being edited resides. */
  private readonly targetStore
  /** The object being edited, if it is stored in `targetStore`, or `null` if creating a new object.
   *
   * NOTE that this class automatically updates this to point to a newly created object once it is saved for the first time.
   */
  private savedObj :Readonly<B>|null = null
  /** Whether this object is unsaved, i.e. not yet present in the target store. */
  get isUnsaved() { return this.savedObj===null }
  private _isNew :boolean
  /** Whether this object is new (either unsaved or freshly created from template and not saved) */
  get isNew() { return this._isNew }

  /** The initial object being edited: either `savedObj`, or a newly created object. */
  protected readonly initObj :B
  get fullTitle() { return this.initObj.typeName('full') }
  get briefTitle() { return this.initObj.typeName('short') }

  /** The HTML element holding the editor UI. */
  get el() :HTMLElement { return this.form }
  private readonly form
  private readonly elEndHr
  protected readonly btnSaveClose  // is protected instead of private so subclasses can scroll to it, nothing else
  private readonly elWarnList
  private readonly elWarnAlert
  private readonly elErrDetail
  private readonly elErrAlert

  /** Construct a new editor.
   *
   * NOTE subclasses should simply pass the constructor arguments through, without saving or modifying them,
   * and they should call `this.initialize()` at the end of their constructor when they're initialized and ready to be shown.
   *
   * @param targetStore The store in which the object to be edited lives or is to be added to.
   * @param targetObj If `null`, create a new object and add it to the store when saved; otherwise, the object to edit.
   */
  constructor(parent :EditorParent, targetStore :AbstractStore<B>, targetObj :B|null, isNew :boolean) {
    this.parent  = parent
    this.ctx = parent.ctx
    this.targetStore = targetStore
    this.savedObj = targetObj
    this._isNew = targetObj === null || isNew
    this.initObj = targetObj === null ? this.newObj() : targetObj

    this.btnSaveClose = <button type="submit" class="btn btn-success ms-2 mt-1 text-nowrap fw-semibold"><i class="bi-folder-check"/> {tr('Save & Close')}</button>
    const btnSave = <button type="button" class="btn btn-outline-primary ms-2 mt-1 text-nowrap"><i class="bi-floppy-fill"/> {tr('Save')}</button>
    const btnBack = <button type="button" class="btn btn-outline-secondary mt-1 text-nowrap"><i class="bi-arrow-bar-left"/> {tr('Back')}</button>
    this.elWarnList = <ul></ul>
    this.elWarnAlert = <div class="d-none alert alert-warning" role="alert">
      <h4 class="alert-heading"><i class="bi-exclamation-triangle-fill"/> {tr('Warnings')}</h4>
      {this.elWarnList} <hr />
      <p class="mb-0">{tr('editor-warn-info')}</p>
    </div>
    this.elErrDetail = <p></p>
    this.elErrAlert = <div class="d-none alert alert-danger" role="alert">
      <h4 class="alert-heading"><i class="bi-x-octagon"/> {tr('Error')}</h4>
      {this.elErrDetail} <hr />
      <p class="mb-0">{tr('editor-err-info')}</p>
    </div>
    this.elEndHr = <hr class="mt-4 mb-2" />
    this.form = safeCastElement(HTMLFormElement,
      /* NOTE that title and contents are .insertBefore()d this.elEndHr! */
      <form novalidate class="editor-form p-3">
        {this.elEndHr} {this.elWarnAlert} {this.elErrAlert}
        <div class="d-flex flex-row justify-content-end flex-wrap"> {btnBack} {btnSave} {this.btnSaveClose} </div>
      </form>)
    btnBack.addEventListener('click', () => this.ctx.stack.back(this))
    this.el.addEventListener(CustomChangeEvent.NAME, () => {
      const unsaved = this.unsavedChanges
      btnBack.classList.toggle('btn-outline-secondary', !unsaved)
      btnBack.classList.toggle('btn-outline-warning', unsaved)
    })
    btnSave.addEventListener('click', () => this.doSave(false))
    this.form.addEventListener('submit', async event => {
      event.preventDefault()
      event.stopPropagation()
      if (await this.doSave(true)) this.ctx.stack.back(this)
    })
  }

  /** To be called by subclasses when they're ready to be shown. */
  protected initialize(formContents :HTMLElement[]) {
    this.form.insertBefore(<h4 class="mb-3">{this.fullTitle}</h4>, this.elEndHr)
    formContents.forEach(e => this.form.insertBefore(e, this.elEndHr))
    this.ctx.stack.push(this)
  }

  /** Called by the stack when this editor is (re-)shown. */
  shown(pushNotPop :boolean) {
    // Hide warnings when (re-)showing an editor, hopefully help reduce confusion
    this.resetWarningsErrors()
    // handle "Next" button
    const nextBtnTxt = this.nextButtonText()
    if ( nextBtnTxt.length ) {
      //TODO NEXT: add functionality to the next button
      this.ctx.footer.replaceChildren(<button type="button" class="btn btn-sm btn-outline-success m-1">{nextBtnTxt}</button>)
    }
    else this.ctx.footer.replaceChildren()
    this.doScroll(pushNotPop)
  }

  /** Only to be called by ListEditor when bubbling change events. */
  async selfUpdate() {
    if (this.savedObj===null) throw new Error('selfUpdate not allowed when not yet saved')
    console.debug('Updating',this.savedObj,'...')
    const savedObjBefore = this.savedObj
    const id = await this.targetStore.upd(this.savedObj, this.savedObj)
    paranoia(Object.is(savedObjBefore, this.savedObj))  // paranoia left over from debugging
    this.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: id }))
    this.el.dispatchEvent(new CustomChangeEvent())
    console.debug('... saved with id',id)
  }

  /** Can be overridden by subclasses to provide custom validation errors/warnings for their forms.
   * Errors are provided by throwing one, warnings are returned as an array of strings. */
  protected customWarnings() :string[] { return [] }

  private resetWarningsErrors() {
    this.btnSaveClose.classList.remove('btn-warning')
    this.btnSaveClose.classList.add('btn-success')
    this.elWarnAlert.classList.add('d-none')
    this.elErrAlert.classList.add('d-none')
    this.prevSaveClickObjState = null
    this.prevSaveWarnings = []
  }
  private prevSaveClickObjState :Readonly<B>|null = null  // for doSave
  private prevSaveWarnings :string[] = []  // for doSave
  /** Perform a save of the object being edited.
   *
   * @param andClose Whether the "Save & Close" button was clicked, but
   *  *NOT* whether this function should actually perform the close, that's up to the caller!
   * @returns `true` if this editor can and should be closed, `false` otherwise.
   */
  private async doSave(andClose :boolean) :Promise<boolean> {
    this.btnSaveClose.classList.remove('btn-success', 'btn-warning')
    const showError = (msg :string) => {
      this.btnSaveClose.classList.add('btn-warning')
      this.elWarnAlert.classList.add('d-none')
      this.elErrDetail.innerText = msg
      this.elErrAlert.classList.remove('d-none')
      this.ctx.scrollTo(this.elErrAlert)
      this.prevSaveClickObjState = null
      this.prevSaveWarnings = []
    }

    // Check if the form passes validation
    this.form.classList.add('was-validated')
    if (!this.form.checkValidity()) {
      showError(tr('form-invalid'))
      return false
    }

    // Get custom validation stuff
    const customWarn :string[] = []
    try { customWarn.push(...this.customWarnings()) }
    catch (ex) {
      showError(String(ex))
      return false
    }

    // Form passed validation, so get the resulting object
    const curObj = this.form2obj(true)

    // Check for errors and warnings
    const otherObjs = (await this.targetStore.getAll(this.savedObj)).map(([_,o])=>o)
    try {
      /* There are a few cases that aren't covered by the form validation, for example:
        * - when the MeasurementType's `max` is smaller than the `min`
        * - duplicate `name` properties */
      curObj.validate(otherObjs)
    }
    catch (ex) {
      showError(String(ex))
      return false
    }  // else, there were no validation errors
    this.elErrAlert.classList.add('d-none')

    // So next, check warnings
    const skipInitWarns = this.isUnsaved && !andClose
    const warnings = curObj.warningsCheck(skipInitWarns).concat(customWarn)
    if (warnings.length) {
      this.btnSaveClose.classList.add('btn-warning')
      this.elWarnList.replaceChildren( ...warnings.map(w => <li>{w}</li>) )
      this.elWarnAlert.classList.remove('d-none')
      this.ctx.scrollTo(this.elWarnAlert)
      if (andClose) {  // Button "Save & Close"
        // Did the user click the "Save & Close" button a second time without making changes? (warnings may also change if isBrandNew changes)
        if (!curObj.equals(this.prevSaveClickObjState) || warnings.length!==this.prevSaveWarnings.length
          || warnings.some((w,i) => w!==this.prevSaveWarnings[i])) { // no, first time, changes were made, or different warnings
          // Briefly disable the submit button to allow the user to see the warnings and to prevent accidental double clicks.
          this.btnSaveClose.setAttribute('disabled','disabled')
          setTimeout(() => this.btnSaveClose.removeAttribute('disabled'), 700)
          // However, we don't actually want to prevent the save, we just want the user to see the warnings.
          andClose = false
        }
      } // else, button "Save"
    }
    else {  // no warnings
      this.btnSaveClose.classList.add('btn-success')
      this.elWarnAlert.classList.add('d-none')
    }
    this.prevSaveClickObjState = curObj
    this.prevSaveWarnings = warnings

    // Actually save the object
    try {
      // Are there actually any changes to save?
      if ( this.savedObj===null ) {  // Yes, this is a new object.
        console.debug('Adding',curObj,'...')
        const newId = await this.targetStore.add(curObj)
        this.savedObj = curObj
        this._isNew = false
        this.el.dispatchEvent(new CustomStoreEvent({ action: 'add', id: newId }))
        this.el.dispatchEvent(new CustomChangeEvent())
        console.debug('... added with id',newId)
      }
      else if ( !this.savedObj.equals(curObj) ) {  // Yes, the saved object differs from the current form.
        console.debug('Saving',curObj,'...')
        const id = await this.targetStore.upd(this.savedObj, curObj)
        this.savedObj = curObj
        this._isNew = false
        this.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: id }))
        this.el.dispatchEvent(new CustomChangeEvent())
        console.debug('... saved with id',id)
      }
      else console.debug('No save needed, saved state', this.savedObj, 'vs. current', curObj)
    }
    catch (ex) {
      console.log(ex)
      await infoDialog('error', tr('Error Saving'), <><p>{tr('save-error-txt')}</p><p class="mb-0">{ex}</p></>)
    }

    return andClose
  }

  /** Close this editor. To be called by the EditorStack. */
  async close() { await this.onClose() }
  /** Optional hook that subclasses can override, called when the editor is closed. */
  protected async onClose() {}

  /** Whether there are any unsaved changes. */
  get unsavedChanges() :boolean { return !this.form2obj(false).equals(this.savedObj ?? this.initObj) }
  /** Requests the closing of the current editor (e.g the "Back" button); the user may cancel this.
   *
   * @returns `true` if this editor can and should be closed, `false` otherwise.
   */
  async requestClose() :Promise<boolean> {
    // Has the user made any changes?
    const curObj = this.form2obj(false)
    const prevObj = this.savedObj ?? this.initObj
    if ( !curObj.equals(prevObj) ) {
      console.debug('Unsaved changes, prev', prevObj, 'vs. cur', curObj)
      switch( await unsavedChangesQuestion(tr('Save & Close'), curObj.summaryAsHtml(true)) ) {
      case 'save': return this.doSave(true)
      case 'cancel': return false
      case 'discard': return true
      }
    } else return true
  }

  /** Helper function for subclasses to make a <div class="row"> with labels etc. for a form input. */
  private static _inputCounter = 0
  protected makeRow(input :HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|HTMLDivElement,
    opts: MakeRowOps, btnExtra ?:HTMLButtonElement) :HTMLElement {
    assert(!input.hasAttribute('id') && !input.hasAttribute('aria-describedby') && !input.hasAttribute('placeholder'))
    const inpId = `_Editor_Input_ID-${Editor._inputCounter++}`
    input.setAttribute('id', inpId)
    //input.setAttribute('placeholder', label)  // they're actually kind of distracting
    if (input instanceof HTMLDivElement)  // custom <div> containing e.g. <input>s
      input.addEventListener(CustomChangeEvent.NAME, () => this.el.dispatchEvent(new CustomChangeEvent()))  // bubble
    else { // <input>, <textarea>, <select>
      input.addEventListener('change', () => this.el.dispatchEvent(new CustomChangeEvent()))  // bubble
      input.classList.add('form-control')
    }
    let divHelp :HTMLDivElement|string = ''
    let btnHelp :HTMLButtonElement|string = ''
    if (opts.helpText) {
      divHelp = safeCastElement(HTMLDivElement, <div class="form-text">{opts.helpText}</div>)
      let helpId :string
      [helpId, btnHelp] = makeHelp(divHelp)
      input.setAttribute('aria-describedby', helpId)
    }
    return <div class="row mb-2 mb-sm-3">
      <label for={inpId} class="col-sm-3 col-form-label text-end-sm">
        {opts.label}
        {btnHelp}
        {btnExtra??''}
      </label>
      <div class="col-sm-9">
        {input}
        {divHelp}
        {opts.invalidText ? <div class="invalid-feedback">{opts.invalidText}</div> : ''}
      </div>
    </div>
  }

  /** Helper function for subclasses to make the form help text for "Name" inputs. */
  protected makeNameHelp() {
    const el = <a href="#">{tr('name-help-show')}.</a>
    el.addEventListener('click', async event => {
      event.preventDefault()
      await infoDialog('info', tr('name-help-title'), <ul>{tr('name-help-full').split('\n').map(t => <li>{t}</li>)}</ul>)
    })
    return el
  }

  /** Helper function for subclasses to make a textarea row. */
  protected makeTextAreaRow(initValue :string|undefined, opts :MakeTextAreaRowOpts) :[HTMLElement, HTMLTextAreaElement] {
    const input = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{initValue?.trim()??''}</textarea>)
    if (opts.readonly) input.setAttribute('readonly', 'readonly')

    // Begin Auto-Expand stuff
    // someday: https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing
    const btnExpand = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-sm px-1 py-0 my-0 ms-1 me-0"></button>)
    let currentlyExpanded = opts.startExpanded || !initValue?.trim().length
    const updateButton = () => {
      btnExpand.setAttribute('title', tr(currentlyExpanded ? 'Collapse' : 'Expand') )
      if (currentlyExpanded)
        btnExpand.replaceChildren(<i class="bi-chevron-bar-contract"/>, <span class="visually-hidden"> {tr('Collapse')}</span>)
      else
        btnExpand.replaceChildren(<i class="bi-chevron-bar-expand"/>, <span class="visually-hidden"> {tr('Expand')}</span>)
    }
    updateButton()
    btnExpand.addEventListener('click', () => {
      currentlyExpanded = !currentlyExpanded
      updateButton()
      if (!currentlyExpanded) {
        input.style.removeProperty('overflow-y')
        input.style.removeProperty('height')
      } else updateHeight()
    })
    const updateHeight = () => {
      if (!currentlyExpanded) return
      input.style.setProperty('overflow-y', 'hidden')
      input.style.setProperty('height', '') // trick to allow shrinking
      input.style.setProperty('height', `${input.scrollHeight}px`)
    }
    input.addEventListener('input', updateHeight)
    setTimeout(updateHeight)  // delay update until after render
    // End Auto-Expand stuff

    const row = this.makeRow(input, opts, btnExpand)
    if (opts.hideWhenEmpty && !initValue?.trim().length)
      row.classList.add('d-none')
    return [row, input]
  }
}