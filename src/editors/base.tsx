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
import { jsx, safeCastElement } from '../jsx-dom'
import { DataObjectBase } from '../types/common'
import { EventList } from '../types/list'
import { EditorStack } from './stack'
import { assert } from '../utils'
import { tr } from '../i18n'

export type EditorClass<E extends Editor<E, B>, B extends DataObjectBase<B>> = {
  new (stack :EditorStack, targetList :EventList<B>, idx :number, args ?:object): E, briefTitle :string }

/* WARNING: All <button>s inside the <form> that don't have a `type="button"`
 * act as submit buttons, so always remember to add `type="button"`!! */

export abstract class Editor<E extends Editor<E, B>, B extends DataObjectBase<B>> {

  /** A brief title of this editor (for navigation). */
  static readonly briefTitle :string
  /** The HTML element holding the editor UI. */
  abstract readonly el :HTMLElement
  /** The HTML form (may or may not be the same as `el`). */
  protected abstract readonly form :HTMLFormElement
  /** The initial object being edited: either `savedObj`, or a newly created object.
   *
   * This exists because when creating a new object, this base class cannot create new objects,
   * so this base class has to leave it up to the actual implementations to do so. */
  protected abstract readonly initObj :Readonly<B>
  /** Returns an object with its fields populated from the current form state. */
  protected abstract form2obj :()=>Readonly<B>
  /** Perform any cleanup the subclass might need to do. */
  protected abstract onClose :()=>void

  protected stack :EditorStack
  /** The list in which the object being edited resides, at `targetIdx`. */
  private readonly targetList :EventList<B>
  /** The index at which the object being edited resides, in `targetList`. */
  private targetIdx :number
  /** A reference to the object being edited in `targetList` and `targetIdx`, or `null` if creating a new object.
   *
   * NOTE that this class automatically updates this to point to a newly created object once it is saved for the first time.
   */
  protected get savedObj() :Readonly<B>|null {
    return this.targetIdx<0 ? null : this.targetList.get(this.targetIdx) }

  /** Helper to get the static property from an instance. */
  get briefTitle() { return (this.constructor as typeof Editor).briefTitle }

  /** Construct a new editor.
   *
   * NOTE subclasses should simply pass the constructor arguments through, without saving or modifying them,
   * and they should call `this.open()` when they're initialized and ready to be shown.
   *
   * @param targetList The list in which the object to be edited lives or is to be added to.
   * @param targetIdx If less than zero, create a new object and push it onto the list; otherwise point to the object in the list to edit.
   */
  constructor(stack :EditorStack, targetList :EventList<B>, targetIdx :number, _args ?:object) {
    assert(targetIdx<targetList.length)
    this.stack = stack
    this.targetList = targetList
    this.targetIdx = targetIdx
  }

  /** To be called by subclasses when they're ready to be shown. */
  protected open() {
    this.stack.push(this)
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
    this.stack.pop(this)
  }

  /** Save the current form to the target list, optionally closing the editor after. */
  private doSave(andClose :boolean) {
    const curObj = this.form2obj()
    // Are there actually any changes to save?
    if ( !this.savedObj ) {  // Yes, this is a new object.
      assert(this.targetIdx<0)
      console.debug('Appending', curObj)
      // add() will fire event listeners, some of which need to access this.savedObj and thereby this.targetIdx, so set that first.
      const nextIdx = this.targetList.length
      this.targetIdx = nextIdx
      const rv = this.targetList.add(curObj)
      assert(rv==nextIdx)  // paranoia
    }
    else if ( !this.savedObj.equals(curObj) ) {  // Yes, the saved object differs from the current form.
      assert( this.targetIdx>=0 && this.targetIdx<this.targetList.length )
      console.debug(`Saving to [${this.targetIdx}]`, curObj)
      this.targetList.set(this.targetIdx, curObj)
    }
    else console.debug('No save needed, saved', this.savedObj, 'vs. cur', curObj)
    if (andClose) this.doClose()
  }

  /** To be called by subclasses, to report when any of the lists they're editing have changed */
  protected reportSelfChange() {
    if (this.targetIdx>=0) this.targetList.reportChange(this.targetIdx) }

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
    const doSave = (andClose :boolean) => {
      form.classList.add('was-validated')
      if (!form.checkValidity()) return
      const curObj = this.form2obj()
      btnSaveClose.classList.remove('btn-success', 'btn-warning')
      try {
        /* There are a few cases that aren't covered by the form validation, for example:
          * - when the MeasurementType's `max` is smaller than the `min`
          * - duplicate `name` properties */
        curObj.validate( Array.from(this.targetList).filter((_,i) => i!==this.targetIdx) )
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
      const warnings = curObj.warningsCheck(!this.savedObj)
      if (warnings.length) {
        btnSaveClose.classList.add('btn-warning')
        warnList.replaceChildren( ...warnings.map(w => <li>{w}</li>) )
        warnAlert.classList.remove('d-none')
        warnAlert.scrollIntoView({ behavior: 'smooth' })
        if (andClose) {  // Button "Save & Close"
          // Did the user click the "Save & Close" button a second time without making changes?
          if (curObj.equals(prevSaveClickObjState))
            this.doSave(true)
          else { // otherwise, "Save & Close" wasn't clicked before, or there were changes made since the last click
            // Briefly disable the submit button to allow the user to see the warnings and to prevent accidental double clicks.
            btnSaveClose.setAttribute('disabled','disabled')
            setTimeout(() => btnSaveClose.removeAttribute('disabled'), 700)
            // However, we don't actually want to prevent the save, we just want the user to see the warnings.
            this.doSave(false)
          }
        } else  // Button "Save"
          this.doSave(false)
      }
      else {  // no warnings
        btnSaveClose.classList.add('btn-success')
        warnAlert.classList.add('d-none')
        this.doSave(andClose)
      }
      prevSaveClickObjState = curObj
    } // end of doSave

    btnSave.addEventListener('click', () => doSave(false))
    form.addEventListener('submit', event => {
      event.preventDefault()
      event.stopPropagation()
      doSave(true)
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