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
import { assert } from '../utils'
import { tr } from '../i18n'

export type DoneCallback<B extends DataObjectBase<B>> = (obj :B|null) => void

export type EditorClass<E extends Editor<E, B>, B extends DataObjectBase<B>> = { new (targetArray :B[], idx :number): E }

export abstract class Editor<E extends Editor<E, B>, B extends DataObjectBase<B>> {
  /** The HTML element holding the editor UI. */
  abstract readonly el :HTMLElement
  /** The HTML form (may or may not be the same as `el`). */
  protected abstract readonly form :HTMLFormElement
  /** The original object. */
  protected readonly origObj :B|null
  protected readonly targetArray :B[]
  protected readonly targetIdx :number
  /** The object being edited. */
  protected obj :B|null
  /** The callback to be called when the editor is done and should be closed. */
  constructor(targetArray :B[], idx :number) {
    this.targetArray = targetArray
    this.targetIdx = idx
    const obj = idx>=0 && idx<targetArray.length ? targetArray[idx] : null
    assert(obj!==undefined)
    this.origObj = obj
    this.obj = obj ? obj.deepClone() : null
  }
  /* Simple event listener mechanism b/c EventTarget is a little complex to deal with in TypeScript. */
  protected doneCallbacks :DoneCallback<B>[] = []
  addDoneCallback(c :DoneCallback<B>) { this.doneCallbacks.push(c) }
  removeDoneCallback(c :DoneCallback<B>) {
    const idx = this.doneCallbacks.indexOf(c)
    if (idx>=0) this.doneCallbacks.splice(idx,1)
  }
  protected done(obj :B|null) {
    console.log('Done Editing', obj)
    if (obj) {
      if (this.targetIdx>=0 && this.targetIdx<this.targetArray.length)
        this.targetArray[this.targetIdx] = obj
      else
        this.targetArray.push(obj)
    }
    this.doneCallbacks.forEach(c => c(obj))
    this.doneCallbacks.length = 0  // free references
  }
  /** Return an object with its fields populated from the current form state. */
  protected abstract form2obj() :B
  /** Whether the current state of the form differs from the current object. */
  protected isDirty(orig :boolean) { return !this.form2obj().equals(orig ? this.origObj : this.obj) }
  /** Requests to cancel the current edit in progress. */
  async requestCancel() {
    if (this.isDirty(false) || this.isDirty(true))
      switch( await unsavedChangesQuestion(tr('Save & Close')) ) {
      case 'save': this.form.requestSubmit(); return
      case 'cancel': return
      case 'discard': this.done(null); return
      }
    else this.done(null)
  }
  /** Helper function to make the <form> */
  protected makeForm(title :string, contents :HTMLElement[]) :HTMLFormElement {
    const btnSubmit = <button type="submit" class="btn btn-success ms-3 text-nowrap"><i class="bi-floppy-fill"/> {tr('Save & Close')}</button>
    const btnCancel = <button type="button" class="btn btn-danger text-nowrap"><i class="bi-trash3-fill"/> {tr('Cancel')}</button>
    const warnList = <ul></ul>
    const warnAlert = <div class="d-none alert alert-warning" role="alert">
      <h4 class="alert-heading"><i class="bi-exclamation-triangle-fill"/> {tr('Warnings')}</h4>
      {warnList}
      <hr />
      <p class="mb-0">{tr('editor-warn-info')}</p>
    </div>
    const errDetail = <p></p>
    const errAlert = <div class="d-none alert alert-danger" role="alert">
      <h4 class="alert-heading"><i class="bi-x-octagon"/> {tr('Error')}</h4>
      {errDetail}
      <hr />
      <p class="mb-0">{tr('editor-err-info')}</p>
    </div>
    const form = safeCastElement(HTMLFormElement,
      <form novalidate>
        <legend class="mb-3">{title}</legend>
        {contents}
        {warnAlert}
        {errAlert}
        <div class="d-flex flex-row justify-content-end flex-wrap">
          {btnCancel}
          {btnSubmit}
        </div>
      </form>)
    btnCancel.addEventListener('click', () => this.requestCancel())
    form.addEventListener('submit', event => {
      form.classList.add('was-validated')
      event.preventDefault()
      event.stopPropagation()
      if (form.checkValidity()) {
        const wasDirty = this.isDirty(false)
        this.obj = this.form2obj()
        assert(!this.isDirty(false), 'Dirty wasn\'t cleared after form2obj')
        btnSubmit.classList.remove('btn-success', 'btn-warning')
        try {
          /* Optimally, this is covered by input field validation, but there are a few cases where
           * it can't be, e.g. when the MeasurementType's `max` is smaller than the `min`. */
          this.obj.validate()
        }
        catch (ex) {
          btnSubmit.classList.add('btn-warning')
          warnAlert.classList.add('d-none')
          errDetail.innerText = String(ex)
          errAlert.classList.remove('d-none')
          return
        }
        errAlert.classList.add('d-none')
        const warnings = this.obj.warningsCheck()
        if (warnings.length) {
          btnSubmit.classList.add('btn-warning')
          warnList.replaceChildren( ...warnings.map(w => <li>{w}</li>) )
          warnAlert.classList.remove('d-none')
          if (!wasDirty)
            /* If the dirty flag wasn't set before, this means the user clicked the button a second
             * time without making changes, thereby saying they want to ignore the warnings. */
            this.done(this.obj)
          else {
            // Briefly disable the submit button to allow the user to see the warnings and to prevent accidental double clicks.
            btnSubmit.setAttribute('disabled','disabled')
            setTimeout(() => btnSubmit.removeAttribute('disabled'), 1000)
          }
        }
        else {
          btnSubmit.classList.add('btn-success')
          warnAlert.classList.add('d-none')
          this.done(this.obj)
        }
      }
    })
    return form
  }
  /** Helper function to make a <div class="row"> with labels etc. for a form input. */
  private static _inputCounter = 0
  protected makeRow(input :HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement,
    label :string, helpText :HTMLElement|string|null, invalidText :HTMLElement|string|null) :HTMLElement {
    assert(!input.hasAttribute('id') && !input.hasAttribute('aria-describedby') && !input.hasAttribute('placeholder'))
    const inpId = `_Editor_Input_ID-${Editor._inputCounter++}`
    const helpId = inpId+'_Help'
    input.setAttribute('id', inpId)
    //input.setAttribute('placeholder', label)  // they're actually kind of distracting
    if (helpText)
      input.setAttribute('aria-describedby', helpId)
    input.classList.add('form-control')
    return <div class="row mb-3">
      <label for={inpId} class="col-sm-2 col-form-label text-end-sm">{label}</label>
      <div class="col-sm-10">
        {input}
        {helpText ? <div id={helpId} class="form-text">{helpText}</div> : '' }
        {invalidText ? <div class="invalid-feedback">{invalidText}</div> : ''}
      </div>
    </div>
  }
}