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
import { infoDialog, unsavedChangesQuestion } from '../dialogs'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { DataObjectBase } from '../types/common'
import { CustomChangeEvent } from '../events'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { assert } from '../utils'
import { tr } from '../i18n'

/* WARNING: All <button>s inside the <form> that don't have a `type="button"`
 * act as submit buttons, so always remember to add `type="button"`!! */

export type EditorClass<E extends Editor<E, B>, B extends DataObjectBase<B>> = {
  new (ctx :GlobalContext, targetStore :AbstractStore<B>, targetObj :B|null): E }

export abstract class Editor<E extends Editor<E, B>, B extends DataObjectBase<B>> {

  /** The initial object being edited: either `savedObj`, or a newly created object.
   *
   * This exists because when creating a new object, this base class cannot create new objects,
   * so this base class has to leave it up to the subclasses to do so. */
  protected abstract readonly initObj :Readonly<B>
  /** Returns an object with its fields populated from the current form state. */
  protected abstract readonly form2obj :()=>Readonly<B>
  /** Perform any cleanup the subclass might need to do. */
  protected abstract readonly onClose :()=>void

  get fullTitle() { return this.initObj.typeName('full') }
  get briefTitle() { return this.initObj.typeName('short') }

  protected readonly ctx
  /** The store in which the object with being edited resides. */
  private readonly targetStore
  /** The event hub of the store in which the object being edited resides. */
  get targetEvents() { return this.targetStore.events }

  /** The object being edited, if it is stored in `targetStore`, or `null` if creating a new object.
   *
   * NOTE that this class automatically updates this to point to a newly created object once it is saved for the first time.
   */
  private savedObj :Readonly<B>|null = null
  get isSaved() { return this.savedObj!==null }

  /** The HTML element holding the editor UI. */
  get el() :HTMLElement { return this.form }
  private readonly form :HTMLFormElement
  private readonly btnSaveClose :HTMLElement
  private readonly elWarnList :HTMLElement
  private readonly elWarnAlert :HTMLElement
  private readonly elErrDetail :HTMLElement
  private readonly elErrAlert :HTMLElement

  /** Construct a new editor.
   *
   * NOTE subclasses should simply pass the constructor arguments through, without saving or modifying them,
   * and they should call `this.initialize()` at the end of their constructor when they're initialized and ready to be shown.
   *
   * @param targetStore The store in which the object to be edited lives or is to be added to.
   * @param targetObj If `null`, create a new object and add it to the store when saved; otherwise, the object to edit.
   */
  constructor(ctx :GlobalContext, targetStore :AbstractStore<B>, targetObj :B|null) {
    this.ctx = ctx
    this.targetStore = targetStore
    this.savedObj = targetObj

    this.btnSaveClose = <button type="submit" class="btn btn-success ms-2 mt-1 text-nowrap"><i class="bi-folder-check"/> {tr('Save & Close')}</button>
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
    this.form = safeCastElement(HTMLFormElement,
      /* NOTE that title and contents are .insertBefore()d this.elWarnAlert! */
      <form novalidate class="p-3">
        {this.elWarnAlert} {this.elErrAlert}
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
    this.form.insertBefore(<legend class="mb-3">{this.fullTitle}</legend>, this.elWarnAlert)
    formContents.forEach(e => this.form.insertBefore(e, this.elWarnAlert))
    this.ctx.stack.push(this)
  }

  /** To be called by subclasses to report when any of the lists they're editing have changed. */
  protected async reportMod() {
    if (this.savedObj!==null) await this.targetStore.mod(this.savedObj)
    else console.warn('reportMod ignored because savedObj is null')
  }

  private prevSaveClickObjState :Readonly<B>|null = null  // for doSave
  /** Perform a save of the object being edited.
   *
   * @param andClose Whether the "Save & Close" button was clicked, but
   *  *NOT* whether this function should actually perform the close, that's up to the caller!
   * @returns `true` if this editor can and should be closed, `false` otherwise.
   */
  private async doSave(andClose :boolean) :Promise<boolean> {
    this.form.classList.add('was-validated')
    if (!this.form.checkValidity()) return false
    const curObj = this.form2obj()

    // Check for errors and warnings
    this.btnSaveClose.classList.remove('btn-success', 'btn-warning')
    const otherObjs = (await this.targetStore.getAll(this.savedObj)).map(([_,o])=>o)
    try {
      /* There are a few cases that aren't covered by the form validation, for example:
        * - when the MeasurementType's `max` is smaller than the `min`
        * - duplicate `name` properties */
      curObj.validate(otherObjs)
    }
    catch (ex) {
      this.btnSaveClose.classList.add('btn-warning')
      this.elWarnAlert.classList.add('d-none')
      this.elErrDetail.innerText = String(ex)
      this.elErrAlert.classList.remove('d-none')
      this.elErrAlert.scrollIntoView({ behavior: 'smooth' })
      this.prevSaveClickObjState = null
      return false
    }  // else, there were no validation errors
    this.elErrAlert.classList.add('d-none')

    // So next, check warnings
    const warnings = curObj.warningsCheck(!this.savedObj && !andClose)
    if (warnings.length) {
      this.btnSaveClose.classList.add('btn-warning')
      this.elWarnList.replaceChildren( ...warnings.map(w => <li>{w}</li>) )
      this.elWarnAlert.classList.remove('d-none')
      this.elWarnAlert.scrollIntoView({ behavior: 'smooth' })
      if (andClose) {  // Button "Save & Close"
        // Did the user click the "Save & Close" button a second time without making changes?
        if (!curObj.equals(this.prevSaveClickObjState)) { // no, first time or changes were made
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

    // Actually save the object
    try {
      // Are there actually any changes to save?
      if ( !this.savedObj ) {  // Yes, this is a new object.
        // add() will fire event listeners, some of which need to access this.savedObj, so set that first.
        console.debug('Adding',curObj,'...')
        this.savedObj = curObj
        const rv = await this.targetStore.add(curObj)
        console.debug('... added with id',rv)
        this.el.dispatchEvent(new CustomChangeEvent())
      }
      else if ( !this.savedObj.equals(curObj) ) {  // Yes, the saved object differs from the current form.
        console.debug('Saving',curObj,'...')
        const prevObj = this.savedObj
        this.savedObj = curObj
        const rv = await this.targetStore.upd(prevObj, curObj)
        console.debug('... saved with id',rv)
        this.el.dispatchEvent(new CustomChangeEvent())
      }
      else console.debug('No save needed, saved', this.savedObj, 'vs. cur', curObj)
    }
    catch (ex) {
      console.log(ex)
      await infoDialog('error', tr('Error Saving'), <><p>{tr('save-error-txt')}</p><p class="mb-0">{ex}</p></>)
    }

    return andClose
  }

  /** Whether there are any unsaved changes. */
  get unsavedChanges() :boolean { return !this.form2obj().equals(this.savedObj ?? this.initObj) }
  /** Requests the closing of the current editor (e.g the "Back" button); the user may cancel this.
   *
   * @returns `true` if this editor can and should be closed, `false` otherwise.
   */
  async requestClose() :Promise<boolean> {
    // Has the user made any changes?
    const curObj = this.form2obj()
    const prevObj = this.savedObj ?? this.initObj
    if ( !curObj.equals(prevObj) ) {
      console.debug('Unsaved changes, prev', prevObj, 'vs. cur', curObj)
      switch( await unsavedChangesQuestion(tr('Save & Close'), curObj.summaryAsHtml(true)) ) {
      case 'save': return this.doSave(true)
      case 'cancel': return false
      case 'discard': break
      }
    }
    return true
  }

  /** Close out this editor after a successful `requestClose`. */
  close() {
    this.onClose()
  }

  /** Helper function for subclasses to make a <div class="row"> with labels etc. for a form input. */
  private static _inputCounter = 0
  protected makeRow(input :HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|HTMLDivElement,
    label :string, helpText :HTMLElement|string|null, invalidText :HTMLElement|string|null) :HTMLElement {
    assert(!input.hasAttribute('id') && !input.hasAttribute('aria-describedby') && !input.hasAttribute('placeholder'))
    const inpId = `_Editor_Input_ID-${Editor._inputCounter++}`
    const helpId = inpId+'_Help'
    input.setAttribute('id', inpId)
    //input.setAttribute('placeholder', label)  // they're actually kind of distracting
    if (helpText)
      input.setAttribute('aria-describedby', helpId)
    if (input instanceof HTMLDivElement)
      input.addEventListener(CustomChangeEvent.NAME, () => this.el.dispatchEvent(new CustomChangeEvent()))
    else {
      input.addEventListener('change', () => this.el.dispatchEvent(new CustomChangeEvent()))
      input.classList.add('form-control')
    }
    return <div class="row mb-3">
      <label for={inpId} class="col-sm-3 col-form-label text-end-sm">{label}</label>
      <div class="col-sm-9">
        {input}
        {helpText ? <div id={helpId} class="form-text">{helpText}</div> : '' }
        {invalidText ? <div class="invalid-feedback">{invalidText}</div> : ''}
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
}