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
import { jsx, jsxFragment, safeCast } from '@haukex/simple-jsx-dom'
import { CustomChangeEvent, CustomStoreEvent } from '../events'
import { infoDialog, unsavedChangesQuestion } from '../dialogs'
import { DataObjectBase } from '../types/common'
import { ListEditorParent } from './list-edit'
import { assert, paranoia } from '../utils'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { MyTooltip } from '../tooltip'
import { Collapse } from 'bootstrap'
import { StackAble } from './stack'
import { makeHelp } from '../help'
import { tr } from '../i18n'

/* WARNING: All <button>s inside the <form> that don't have a `type="button"`
 * act as submit buttons, so always remember to add `type="button"`!! */

export interface EditorParent {
  ctx :GlobalContext
  el :HTMLElement
}

interface MakeRowOpts {
  label :HTMLElement|string
  helpText ?:HTMLElement|string
  invalidText ?:HTMLElement|string
}

interface MakeTextAreaRowOpts extends MakeRowOpts {
  readonly ?:boolean
  startExpanded :boolean
  hideWhenEmpty ?:boolean
}

interface MakeAccordOpts {
  label :HTMLElement|string
  title :HTMLElement
  testId ?:string
  rows :HTMLElement[]
}

// https://stackoverflow.com/a/53056911
export type EditorClass<B extends DataObjectBase<B>> = new (...args :ConstructorParameters<typeof Editor<B>>) => Editor<B>

export abstract class Editor<B extends DataObjectBase<B>> implements StackAble, ListEditorParent, EditorParent {

  /** Return a brand new object of the type being edited by the editor. */
  protected abstract newObj() :B
  /** Returns an object with its fields populated from the current form state.
   *
   * @param saving Whether the object is in the process of being saved, as opposed to a dirty check.
   *  **Note** this may cause changes to the inputs, such as updating the "End Time" field!
   */
  protected abstract form2obj(saving :boolean) :Readonly<B>
  /** Return the current name of the element being edited. */
  abstract currentName(short ?:boolean) :string
  /** Implementations should intelligently scroll to the next field/button that needs input. */
  protected abstract doScroll(pushNotPop :boolean) :void

  /** Subclasses can choose to provide a "Next" button by overriding this method and `doNext` (implemented in `EditorStack`). */
  nextButtonText() :HTMLElement|null { return null }
  /** Subclasses can choose to provide a "Next" button by overriding this method and `nextButtonText` (implemented in `EditorStack`).
   * Is method is *only* to be called by the stack when executing the "Next" button. */
  async doNext() { throw new Error('Internal Error: doNext should only be called when nextButtonText is implemented; '
    +'this error probably means you overrode the latter but not the former?') }

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
  get style() { return this.initObj.style }

  /** The HTML element holding the editor UI. */
  get el() :HTMLElement { return this.form }
  private readonly form
  private readonly elEndHr
  private readonly btnBack
  protected readonly btnSaveClose  // is protected instead of private so subclasses can scroll to it, nothing else
  private readonly tipSaveClose
  private readonly elWarnList
  private readonly elWarnAlert
  private readonly elErrDetail
  private readonly elErrAlert

  /** Construct a new editor.
   *
   * **Warning:** You must call `initialize()` after constructing a new object of this class or its subclasses!
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
    this.tipSaveClose = new MyTooltip(this.btnSaveClose)
    const btnSave = <button type="button" class="btn btn-outline-primary ms-2 mt-1 text-nowrap"><i class="bi-floppy-fill"/> {tr('Save')}</button>
    this.btnBack = <button type="button" class="btn btn-outline-secondary mt-1 text-nowrap"><i class="bi-arrow-bar-left"/> {tr('Back')}</button>
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
    this.form = safeCast(HTMLFormElement,
      /* NOTE that title and contents are .insertBefore()d this.elEndHr! */
      <form novalidate class="editor-form p-3">
        {this.elEndHr} {this.elWarnAlert} {this.elErrAlert}
        <div class="d-flex flex-row justify-content-end flex-wrap"> {this.btnBack} {btnSave} {this.btnSaveClose} </div>
      </form>)
    this.btnBack.addEventListener('click', () => this.ctx.stack.back(this))
    btnSave.addEventListener('click', () => this.doSave(false))
    this.form.addEventListener('submit', event => {
      event.preventDefault()
      event.stopPropagation()
      return this.doSaveAndClose()
    })
  }
  abstract initialize() :Promise<this>

  private async updateColors() {
    const unsaved = this.unsavedChanges
    this.btnBack.classList.toggle('btn-outline-secondary', !unsaved)
    this.btnBack.classList.toggle('btn-outline-warning', unsaved)
    const [valid, detail] = await this.checkValidity(false, true)
    this.tipSaveClose.update(detail)
    this.btnSaveClose.classList.toggle('btn-danger', valid==='error')
    this.btnSaveClose.classList.toggle('btn-warning', valid==='warn')
    this.btnSaveClose.classList.toggle('btn-success', valid==='good')
  }

  /** Only to be called by the Stack (and the Editor's "Save & Close" button of course).
   *
   * @returns `true` if the save was successful and the Editor will be closed by the Stack, `false` otherwise.
   */
  async doSaveAndClose(): Promise<boolean> {
    if (!await this.doSave(true)) return false
    this.ctx.stack.back(this)
    return true
  }

  protected setFormContents(formContents :HTMLElement[]) {
    this.form.insertBefore(<h4 class={`mb-3 editor-${this.style.cssId}-text`}><i class={'bi-'+this.style.icon}/> {this.style.fullTitle}</h4>, this.elEndHr)
    formContents.forEach(e => this.form.insertBefore(e, this.elEndHr))
  }
  private _initDoneCalled = false
  /** To be called by subclasses when they're ready to be shown. */
  protected async initDone() {
    paranoia(!this._initDoneCalled)
    this._initDoneCalled = true
    this.el.addEventListener(CustomChangeEvent.NAME, ()=>this.updateColors())
    await this.updateColors()
    this.ctx.stack.push(this)
  }

  /** Called by the stack when this editor is (re-)shown. */
  shown(pushNotPop :boolean) {
    // Hide warnings when (re-)showing an editor, hopefully help reduce confusion
    this.resetWarningsErrors()
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
   * Errors are provided by throwing one, warnings are returned as an array of strings.
   *
   * @param skipInitWarns See the corresponding parameter of `DataObjectBase.warningsCheck()`.
   */
  protected customValidation(_skipInitWarns :boolean) :string[] { return [] }

  /** Internal function used in `checkValidity` and `doSave`. Throws errors on validation failures.
   *
   * @param saving See the corresponding parameter of `form2obj` *and the notes therein!*
   * @param andClose See the corresponding parameter of `doSave` *and the notes therein!*
   */
  private async doChecks(saving :boolean, andClose :boolean) :Promise<[Readonly<B>, string[]]> {
    // Check if the form passes validation
    if (!this.form.checkValidity()) throw new Error(tr('form-invalid'))
    /** Skip some warnings if this is a brand new (unsaved) object and we're not closing the editor.
     * This first save is required to enable the list editor(s); see also the corresponding discussion in ListEditor.checkGlobalEnable(). */
    const skipInitWarns = this.isUnsaved && !andClose
    // Get custom validation stuff (can throw error, so do this first)
    const customWarn = this.customValidation(skipInitWarns)
    // Form passed validation, so get the resulting object
    const curObj = this.form2obj(saving)
    // Check for errors and warnings
    const otherObjs = (await this.targetStore.getAll(this.savedObj)).map(([_,o])=>o)
    /* Why: There are a few cases that aren't covered by the form validation, for example:
     * - when the MeasurementType's `max` is smaller than the `min`
     * - duplicate `name` properties */
    curObj.validate(otherObjs)  // throws errors
    // So last, check warnings and return
    return [curObj, curObj.warningsCheck(skipInitWarns).concat(customWarn)]
  }

  /** Runs the same checks as `doSave` and returns the result.
   *
   * @param saving See the corresponding parameter of `form2obj` *and the notes therein!*
   * @param andClose See the corresponding parameter of `doSave` *and the notes therein!*
   */
  async checkValidity(saving :boolean, andClose :boolean) :Promise<['good'|'warn'|'error', string]> {
    try {
      const warnings = (await this.doChecks(saving, andClose))[1]
      return [warnings.length ? 'warn' : 'good', warnings.join('; ')]
    }
    catch (ex) { return ['error', String(ex)] }
  }

  private resetWarningsErrors() {
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
    this.form.classList.add('was-validated')

    let _curObj :Readonly<B>
    let _warnings :string[]
    try {
      [_curObj, _warnings] = await this.doChecks(true, andClose)
    }
    catch (ex) {
      console.debug(ex)
      this.elWarnAlert.classList.add('d-none')
      this.elErrDetail.innerText = String(ex)
      this.elErrAlert.classList.remove('d-none')
      this.ctx.scrollTo(this.elErrAlert)
      this.prevSaveClickObjState = null
      this.prevSaveWarnings = []
      return false
    }  // else, there were no validation errors
    this.elErrAlert.classList.add('d-none')
    // convert to consts (paranoia)
    const curObj = _curObj
    const warnings = _warnings

    // So next, check warnings
    if (warnings.length) {
      this.elWarnList.replaceChildren( ...warnings.map(w => <li>{w}</li>) )
      this.elWarnAlert.classList.remove('d-none')
      this.ctx.scrollTo(this.elWarnAlert)
      if (andClose) {  // Button "Save & Close"
        // Did the user click the "Save & Close" button a second time without making changes? (note warnings may also change if skipInitWarns changes)
        if (!curObj.equals(this.prevSaveClickObjState) || warnings.length!==this.prevSaveWarnings.length
          || warnings.some((w,i) => w!==this.prevSaveWarnings[i])) { // no, first time, changes were made, or different warnings
          // Briefly disable the submit button to allow the user to see the warnings and to prevent accidental double clicks.
          // (NOTE that now we have the "Next" button, it's still theoretically possible for the user to Save & Close via that while btnSaveClose is disabled)
          this.btnSaveClose.setAttribute('disabled','disabled')
          setTimeout(() => this.btnSaveClose.removeAttribute('disabled'), 700)
          // However, we don't actually want to prevent the save, we just want the user to see the warnings.
          andClose = false
        }
      } // else, button "Save"
    }
    else {  // no warnings
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

  /** Close this editor. To be called by the EditorStack. Subclasses should not override; see `onClose` for that. */
  async close() {
    await this.tipSaveClose.close()
    await this.onClose()
  }
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
  makeRow(input :HTMLElement, opts :MakeRowOpts, btnExtra ?:HTMLButtonElement) :HTMLElement {
    assert(!input.hasAttribute('id') && !input.hasAttribute('aria-describedby'))
    const inpId = this.ctx.genId('Editor_Input')
    input.setAttribute('id', inpId)
    //input.setAttribute('placeholder', label)  // they're actually kind of distracting - and not all `input`s are <input>s anymore!
    if ( input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement ) {
      // <input>, <textarea>, <select>
      input.addEventListener('change', () => this.el.dispatchEvent(new CustomChangeEvent()))  // bubble
      input.classList.add('form-control')
    } else  // custom element (e.g. <div>) containing its own inputs; assume it uses CustomChangeEvent to signal changes
      input.addEventListener(CustomChangeEvent.NAME, () => this.el.dispatchEvent(new CustomChangeEvent()))  // bubble
    let divHelp :HTMLDivElement|string = ''
    let btnHelp :HTMLButtonElement|string = ''
    if (opts.helpText) {
      divHelp = safeCast(HTMLDivElement, <div class="form-text">{opts.helpText}</div>)
      let helpId :string
      [helpId, btnHelp] = makeHelp(this.ctx, divHelp)
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
    const input = safeCast(HTMLTextAreaElement, <textarea class="max-vh-75" rows="2">{initValue?.trim()??''}</textarea>)
    if (opts.readonly) input.setAttribute('readonly', 'readonly')

    // Begin Auto-Expand stuff
    // someday: https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing
    const btnExpand = safeCast(HTMLButtonElement,
      <button type="button" class="btn btn-sm mini-button px-1 py-0 my-0 ms-1 me-0"></button>)
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
        //input.style.removeProperty('overflow-y')
        input.style.removeProperty('height')
      } else updateHeight()
    })
    const updateHeight = () => {
      if (!currentlyExpanded) return
      /* The overflow-y hiding doesn't seem to be needed anymore since we started doing scrollHeight+1
       * below, plus we need the scrollbar now that the field's max height is limited! */
      //input.style.setProperty('overflow-y', 'hidden')
      input.style.setProperty('height', '') // trick to allow shrinking
      input.style.setProperty('height', `${input.scrollHeight+1}px`)
    }
    input.addEventListener('input', updateHeight)
    setTimeout(updateHeight)  // delay update until after render
    // End Auto-Expand stuff

    const row = this.makeRow(input, opts, btnExpand)
    if (opts.hideWhenEmpty && !initValue?.trim().length)
      row.classList.add('d-none')
    return [row, input]
  }

  /** Helper function for subclasses to make an accordion that contains other rows.
   *
   * NOTE: If there are buttons in the title, then they need to be surrounded by an element
   * that has the attributes `<... data-bs-toggle="collapse" data-bs-target>`, so that
   * the buttons don't trigger the expand/collapse - and the attributes need to be on
   * a surrounding element, not the buttons, because otherwise the buttons don't work.
   */
  makeAccordion(opts :MakeAccordOpts) :[HTMLElement, ()=>Collapse] {
    const accId = this.ctx.genId()
    const accParentId = accId+'-parent'
    const rowLast = safeCast(HTMLElement, opts.rows.at(-1))
    rowLast.classList.remove('mb-2','mb-sm-3')
    const accordCollapse =
      <div id={accId} class="accordion-collapse collapse" data-bs-parent={'#'+accParentId}>
        <div class="accordion-body p-3"> {opts.rows} </div>
      </div>
    const btnAccTitle = <button
      class="accordion-button collapsed py-2 px-3" type="button" data-bs-toggle="collapse"
      data-bs-target={'#'+accId} aria-expanded="false" aria-controls={accId}>
      <div class="flex-grow-1 d-flex flex-wrap row-gap-2 align-items-center">
        <div class="w-25 text-end-sm pe-4 w-min-fit">{opts.label}</div>
        <div class="pe-2 text-body-secondary">{opts.title}</div>
      </div>
    </button>
    if (opts.testId) btnAccTitle.setAttribute('data-test-id', opts.testId)
    const acc = <div class="row mt-3 mb-2 mb-sm-3"><div class="col-sm-12">
      <div class="accordion" id={accParentId}>
        <div class="accordion-item">
          <h2 class="accordion-header">{btnAccTitle}</h2>
          {accordCollapse}
        </div>
      </div>
    </div></div>
    return [acc, ()=>Collapse.getOrCreateInstance(accordCollapse, { toggle: false })]
  }
}