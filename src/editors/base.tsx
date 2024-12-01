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
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { assert } from '../utils'
import { tr } from '../i18n'

export type EditorClass<E extends Editor<E, B>, B extends DataObjectBase<B>> = { briefTitle :string,
  new (ctx :GlobalContext, targetStore :AbstractStore<B>, targetObj :B|null): E }

/* WARNING: All <button>s inside the <form> that don't have a `type="button"`
 * act as submit buttons, so always remember to add `type="button"`!! */

export abstract class Editor<E extends Editor<E, B>, B extends DataObjectBase<B>> {

  /** The HTML element holding the editor UI. */
  abstract readonly el :HTMLElement
  /** A brief title of this editor (for navigation). */
  static readonly briefTitle :string
  /** The HTML form (may or may not be the same as `el`). */
  protected abstract readonly form :HTMLFormElement
  /** The initial object being edited: either `savedObj`, or a newly created object.
   *
   * This exists because when creating a new object, this base class cannot create new objects,
   * so this base class has to leave it up to the actual implementations to do so. */
  protected abstract readonly initObj :Readonly<B>
  /** Returns an object with its fields populated from the current form state. */
  protected abstract readonly form2obj :()=>Readonly<B>
  /** Perform any cleanup the subclass might need to do. */
  protected abstract readonly onClose :()=>void

  protected readonly ctx :GlobalContext
  /** The store in which the object with being edited resides. */
  private readonly targetStore :AbstractStore<B>
  /** The event hub of the store in which the object being edited resides. */
  get targetEvents() { return this.targetStore.events }
  /** The object being edited, if it is stored in `targetStore`, or `null` if creating a new object.
   *
   * NOTE that this class automatically updates this to point to a newly created object once it is saved for the first time.
   */
  get savedObj() { return this._savedObj }
  private _savedObj :Readonly<B>|null = null

  /** Helper to get the static property from an instance. */
  get briefTitle() { return (this.constructor as typeof Editor).briefTitle }

  /** Construct a new editor.
   *
   * NOTE subclasses should simply pass the constructor arguments through, without saving or modifying them,
   * and they should call `this.open()` when they're initialized and ready to be shown.
   *
   * @param targetStore The store in which the object to be edited lives or is to be added to.
   * @param targetObj If `null`, create a new object and add it to the store when saved; otherwise, the object to edit.
   */
  constructor(ctx :GlobalContext, targetStore :AbstractStore<B>, targetObj :B|null) {
    this.ctx = ctx
    this.targetStore = targetStore
    this._savedObj = targetObj
  }

  /** To be called by subclasses when they're ready to be shown. */
  protected open() {
    this.ctx.stack.push(this)
  }

  /** Requests the closing of the current editor (e.g the "Back" button); the user may cancel this. */
  async requestBack() {
    // Has the user made any changes?
    const prevObj = this.savedObj ?? this.initObj
    const curObj = this.form2obj()
    if ( !prevObj.equals(curObj) ) {
      console.debug('Unsaved changes, prev', prevObj, 'vs. cur', curObj)
      switch( await unsavedChangesQuestion(tr('Save & Close')) ) {
      case 'save': this.form.requestSubmit(); return
      case 'cancel': return
      case 'discard': break
      }
    }
    this.doClose()
  }

  /** Close out this editor.
   *
   * Note that we expect the user of this class to delete the editor from the DOM after receiving the event. */
  private doClose() {
    this.onClose()
    this.ctx.stack.pop(this)
  }

  /** Save the current form to the target list, optionally closing the editor after. */
  private async doSave(curObj :B, andClose :boolean) {
    try {
      // Are there actually any changes to save?
      if ( !this.savedObj ) {  // Yes, this is a new object.
        // add() will fire event listeners, some of which need to access this.savedObj, so set that first.
        console.debug('Adding',curObj,'...')
        this._savedObj = curObj
        const rv = await this.targetStore.add(curObj)
        console.debug('... added with id',rv)
      }
      else if ( !this.savedObj.equals(curObj) ) {  // Yes, the saved object differs from the current form.
        console.debug('Saving',curObj,'...')
        const prevObj = this.savedObj
        this._savedObj = curObj
        const rv = await this.targetStore.upd(prevObj, curObj)
        console.debug('... saved with id',rv)
      }
      else console.debug('No save needed, saved', this.savedObj, 'vs. cur', curObj)
    }
    catch (ex) {
      console.log(ex)
      await infoDialog('error', tr('Error Saving'), <><p>{tr('save-error-txt')}</p><p class="mb-0">{ex}</p></>)
    }
    if (andClose) this.doClose()
  }

  /** To be called by subclasses, to report when any of the lists they're editing have changed */
  protected async reportMod() {
    if (this.savedObj!==null) await this.targetStore.mod(this.savedObj)
    else console.warn('reportSelfChange ignored because savedObj is null')
  }

  /** Helper function to make the <form> */
  protected makeForm(title :string, contents :HTMLElement[]) :HTMLFormElement {
    const btnSaveClose = <button type="submit" class="btn btn-success ms-2 text-nowrap"><i class="bi-folder-check"/> {tr('Save & Close')}</button>
    const btnSave = <button type="button" class="btn btn-primary ms-2 text-nowrap"><i class="bi-floppy-fill"/> {tr('Save')}</button>
    const btnBack = <button type="button" class="btn btn-secondary text-nowrap"><i class="bi-arrow-bar-left"/> {tr('Back')}</button>
    const warnList = <ul></ul>
    const warnAlert = <div class="d-none alert alert-warning" role="alert">
      <h4 class="alert-heading"><i class="bi-exclamation-triangle-fill"/> {tr('Warnings')}</h4>
      {warnList} <hr />
      <p class="mb-0">{tr('editor-warn-info')}</p>
    </div>
    const errDetail = <p></p>
    const errAlert = <div class="d-none alert alert-danger" role="alert">
      <h4 class="alert-heading"><i class="bi-x-octagon"/> {tr('Error')}</h4>
      {errDetail} <hr />
      <p class="mb-0">{tr('editor-err-info')}</p>
    </div>
    const form = safeCastElement(HTMLFormElement,
      <form novalidate class="p-3">
        <legend class="mb-3">{title}</legend>
        {contents} {warnAlert} {errAlert}
        <div class="d-flex flex-row justify-content-end flex-wrap"> {btnBack} {btnSave} {btnSaveClose} </div>
      </form>)
    btnBack.addEventListener('click', () => this.requestBack())

    let prevSaveClickObjState :Readonly<B>|null = null
    const doSave = async (andClose :boolean) => {
      form.classList.add('was-validated')
      if (!form.checkValidity()) return
      const curObj = this.form2obj()
      btnSaveClose.classList.remove('btn-success', 'btn-warning')
      const otherObjs = (await this.targetStore.getAll(this.savedObj)).map(([_,o])=>o)
      try {
        /* There are a few cases that aren't covered by the form validation, for example:
          * - when the MeasurementType's `max` is smaller than the `min`
          * - duplicate `name` properties */
        curObj.validate(otherObjs)
      }
      catch (ex) {
        btnSaveClose.classList.add('btn-warning')
        warnAlert.classList.add('d-none')
        errDetail.innerText = String(ex)
        errAlert.classList.remove('d-none')
        errAlert.scrollIntoView({ behavior: 'smooth' })
        prevSaveClickObjState = null
        return
      }  // else, there were no validation errors
      errAlert.classList.add('d-none')
      // so next, check warnings
      const warnings = curObj.warningsCheck(!this.savedObj && !andClose)
      if (warnings.length) {
        btnSaveClose.classList.add('btn-warning')
        warnList.replaceChildren( ...warnings.map(w => <li>{w}</li>) )
        warnAlert.classList.remove('d-none')
        warnAlert.scrollIntoView({ behavior: 'smooth' })
        if (andClose) {  // Button "Save & Close"
          // Did the user click the "Save & Close" button a second time without making changes?
          if (curObj.equals(prevSaveClickObjState))
            await this.doSave(curObj, true)
          else { // otherwise, "Save & Close" wasn't clicked before, or there were changes made since the last click
            // Briefly disable the submit button to allow the user to see the warnings and to prevent accidental double clicks.
            btnSaveClose.setAttribute('disabled','disabled')
            setTimeout(() => btnSaveClose.removeAttribute('disabled'), 700)
            // However, we don't actually want to prevent the save, we just want the user to see the warnings.
            await this.doSave(curObj, false)
          }
        } else  // Button "Save"
          await this.doSave(curObj, false)
      }
      else {  // no warnings
        btnSaveClose.classList.add('btn-success')
        warnAlert.classList.add('d-none')
        await this.doSave(curObj, andClose)
      }
      prevSaveClickObjState = curObj
    } // end of doSave

    btnSave.addEventListener('click', () => doSave(false))
    form.addEventListener('submit', async event => {
      event.preventDefault()
      event.stopPropagation()
      await doSave(true)
    })
    return form
  }

  /** Helper function to make a <div class="row"> with labels etc. for a form input. */
  private static _inputCounter = 0
  protected makeRow(input :HTMLElement,
    label :string, helpText :HTMLElement|string|null, invalidText :HTMLElement|string|null) :HTMLElement {
    assert(!input.hasAttribute('id') && !input.hasAttribute('aria-describedby') && !input.hasAttribute('placeholder'))
    const inpId = `_Editor_Input_ID-${Editor._inputCounter++}`
    const helpId = inpId+'_Help'
    input.setAttribute('id', inpId)
    //input.setAttribute('placeholder', label)  // they're actually kind of distracting
    if (helpText)
      input.setAttribute('aria-describedby', helpId)
    if (!(input instanceof HTMLDivElement))
      input.classList.add('form-control')
    return <div class="row mb-3">
      <label for={inpId} class="col-sm-3 col-form-label text-end-sm">{label}</label>
      <div class="col-sm-9">
        {input}
        {helpText ? <div id={helpId} class="form-text">{helpText}</div> : '' }
        {invalidText ? <div class="invalid-feedback">{invalidText}</div> : ''}
      </div>
    </div>
  }

  protected makeNameHelp() {
    const el = <a href="#">{tr('name-help-show')}.</a>
    el.addEventListener('click', async event => {
      event.preventDefault()
      await infoDialog('info', tr('name-help-title'), <ul>{tr('name-help-full').split('\n').map(t => <li>{t}</li>)}</ul>)
    })
    return el
  }
}