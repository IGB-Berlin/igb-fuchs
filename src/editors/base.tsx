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
import { jsx, safeCastElement } from '../jsx-dom'
import { unsavedChangesQuestion } from '../misc'
import { DataObjectBase } from '../types/common'
import { SimpleEventHub } from '../events'
import { EditorStack } from './stack'
import { assert } from '../utils'
import { tr } from '../i18n'

interface DoneEvent {
  changeMade :boolean
}

export type EditorClass<E extends Editor<E, B>, B extends DataObjectBase<B>> = {
  new (stack :EditorStack, targetArray :B[], idx :number, args ?:object): E, briefTitle :string }

/* WARNING: All <button>s inside the <form> that don't have a `type="button"`
 * act as submit buttons, so always remember to add `type="button"`!! */

export abstract class Editor<E extends Editor<E, B>, B extends DataObjectBase<B>> {

  /** A brief title of this editor (for navigation). */
  static readonly briefTitle :string
  /** The HTML element holding the editor UI. */
  abstract readonly el :HTMLElement
  /** The HTML form (may or may not be the same as `el`). */
  protected abstract readonly form :HTMLFormElement
  /** The initial object being edited: either `savedObj` (or its clone), or a newly created object. */
  protected abstract readonly initObj :Readonly<B>
  /** Returns an object with its fields populated from the current form state. */
  protected abstract form2obj :()=>Readonly<B>

  protected stack :EditorStack
  /** The array in which the object being edited resides, at `targetIdx`. */
  private readonly targetArray :Readonly<B>[]
  /** The index at which the object being edited resides, in `targetArray`. */
  private targetIdx :number
  /** Whether or not this editor has made a change to the target array.
   *
   * NOTE we should only set this flag, and never clear it. */
  private changeMade :boolean = false
  /** A reference to the object being edited in `targetArray` and `targetIdx`, or `null` if creating a new object. */
  protected get savedObj() :Readonly<B>|null {
    if (this.targetIdx<0) return null
    else {
      const obj = this.targetArray[this.targetIdx]
      assert(obj)
      return obj
    }
  }

  /** The event dispatcher for this editor. */
  readonly events :SimpleEventHub<DoneEvent> = new SimpleEventHub(true)

  /** Helper to get the static property from an instance. */
  get briefTitle() { return (this.constructor as typeof Editor).briefTitle }

  /** Construct a new editor.
   *
   * NOTE subclasses should simply pass the constructor arguments through, without saving or modifying them,
   * and they should call `this.open()` when they're initialized and ready to be shown.
   *
   * @param targetArray The array in which the object to be edited lives or is to be added to.
   * @param idx If less than zero, create a new object and push it onto the array; otherwise point to the object in the array to edit.
   */
  constructor(stack :EditorStack, targetArray :B[], idx :number, _args ?:object) {
    assert(idx<targetArray.length)
    this.stack = stack
    this.targetArray = targetArray
    this.targetIdx = idx
  }

  /** To be called by subclasses when they're ready to be shown. */
  protected open() {
    this.stack.push(this)
    this.events.unhold()
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
    this.events.fire({ changeMade: this.changeMade })
    this.stack.pop(this)
    this.events.clear()
  }

  /** Save the current form to the target array, optionally closing the editor after. */
  private doSave(andClose :boolean) {
    const curObj = this.form2obj()
    // Are there actually any changes to save?
    if ( !this.savedObj ) {  // Yes, this is a new object.
      assert(this.targetIdx<0)
      console.debug('Appending', curObj)
      this.targetIdx = this.targetArray.push(curObj) - 1
      this.changeMade = true
    }
    else if ( !this.savedObj.equals(curObj) ) {  // Yes, the saved object differs from the current form.
      assert( this.targetIdx>=0 && this.targetIdx<this.targetArray.length )
      console.debug(`Saving to [${this.targetIdx}]`, curObj)
      this.targetArray[this.targetIdx] = curObj
      this.changeMade = true
    }
    else console.debug('No save needed, saved', this.savedObj, 'vs. cur', curObj)
    if (andClose) this.doClose()
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
    const doSave = (andClose :boolean) => {
      form.classList.add('was-validated')
      if (!form.checkValidity()) return
      const curObj = this.form2obj()
      btnSaveClose.classList.remove('btn-success', 'btn-warning')
      try {
        /* There are a few cases that aren't covered by the form validation, for example:
          * - when the MeasurementType's `max` is smaller than the `min`
          * - duplicate `name` properties */
        curObj.validate( this.targetArray.filter((_,i) => i!==this.targetIdx) )
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
      const warnings = curObj.warningsCheck()
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
}