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
import { assert } from '../utils'
import { tr } from '../i18n'

export type EditorClass<E extends Editor<E, B>, B extends DataObjectBase<B>> = { new (targetArray :B[], idx :number): E }

interface DoneEvent {
  changeMade :boolean
}

export abstract class Editor<E extends Editor<E, B>, B extends DataObjectBase<B>> {
  /** The HTML element holding the editor UI. */
  abstract readonly el :HTMLElement
  /** A brief title of this editor (for navigation) */
  abstract readonly briefTitle :string
  /** The HTML form (may or may not be the same as `el`). */
  protected abstract readonly form :HTMLFormElement
  /** The original object. */
  protected readonly origObj :B|null
  protected readonly targetArray :B[]
  protected targetIdx :number
  protected changeMade :boolean = false
  /** The object being edited. */
  protected obj :B|null
  readonly events :SimpleEventHub<DoneEvent> = new SimpleEventHub()
  /** The callback to be called when the editor is done and should be closed. */
  constructor(targetArray :B[], idx :number) {
    assert(idx<targetArray.length)
    this.targetArray = targetArray
    this.targetIdx = idx
    const obj = idx<0 ? null : targetArray[idx]
    assert(obj!==undefined)
    this.origObj = obj
    this.obj = obj ? obj.deepClone() : null
  }
  protected maybeFinish(action :'save'|'save-close'|'back') {
    switch(action) {
    case 'save':
    case 'save-close':
      // Is this a new object, or if not, has the user actually made changes?
      if ( !this.origObj || !this.origObj.equals(this.obj) ) {
        assert(this.obj)
        if (this.targetIdx<0)
          this.targetIdx = this.targetArray.push(this.obj) - 1
        else {
          assert(this.targetIdx<this.targetArray.length)
          this.targetArray[this.targetIdx] = this.obj
        }
        this.changeMade = true
      }
      if (action==='save') return
      break
    case 'back':
      break
    }
    this.events.fire({ changeMade: this.changeMade })
    this.events.clear()
  }
  /** Return an object with its fields populated from the current form state. */
  protected abstract form2obj() :B
  /** Whether the current state of the form differs from the current or original object. */
  protected isDirty(orig :boolean) { return !this.form2obj().equals(orig ? this.origObj : this.obj) }
  //TODO: this sequence doesn't ask about unsaved changes: New -> enter valid input but with warnings -> Back -> (in Dialog) Save & Close -> Back
  /** Requests to cancel the current edit in progress; but may not actually cancel if the user aborts. */
  async requestBack() {
    // Does the form contain unsaved changes, or, if this isn't a new object, is it different from the original?
    if (this.isDirty(false) || this.origObj && this.isDirty(true))
      switch( await unsavedChangesQuestion(tr('Save & Close')) ) {
      case 'save': this.form.requestSubmit(); return
      case 'cancel': return
      case 'discard': break
      }
    this.maybeFinish('back')
  }
  /** Helper function to make the <form> */
  protected makeForm(title :string, contents :HTMLElement[]) :HTMLFormElement {
    const btnSaveClose = <button type="submit" class="btn btn-success ms-2 text-nowrap"><i class="bi-folder-check"/> {tr('Save & Close')}</button>
    const btnSave = <button type="button" class="btn btn-primary ms-2 text-nowrap"><i class="bi-floppy-fill"/> {tr('Save')}</button>
    const btnBack = <button type="button" class="btn btn-secondary text-nowrap"><i class="bi-arrow-bar-left"/> {tr('Back')}</button>
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
      <form novalidate class="p-3">
        <legend class="mb-3">{title}</legend>
        {contents}
        {warnAlert}
        {errAlert}
        <div class="d-flex flex-row justify-content-end flex-wrap">
          {btnBack}
          {btnSave}
          {btnSaveClose}
        </div>
      </form>)
    btnBack.addEventListener('click', () => this.requestBack())
    let firstSave = true
    const doSave = (andClose :boolean) => {
      form.classList.add('was-validated')
      if (form.checkValidity()) {
        const wasDirty = firstSave || this.isDirty(false)
        firstSave = false
        this.obj = this.form2obj()
        assert(!this.isDirty(false), 'Dirty wasn\'t cleared after form2obj')
        btnSaveClose.classList.remove('btn-success', 'btn-warning')
        try {
          /* Optimally, this is covered by input field validation, but there are a few cases where
           * it can't be, e.g. when the MeasurementType's `max` is smaller than the `min`. */
          this.obj.validate(this.targetArray.filter((_,i) => i!==this.targetIdx))
        }
        catch (ex) {
          btnSaveClose.classList.add('btn-warning')
          warnAlert.classList.add('d-none')
          errDetail.innerText = String(ex)
          errAlert.classList.remove('d-none')
          errAlert.scrollIntoView({ behavior: 'smooth' })
          return
        }
        errAlert.classList.add('d-none')
        const warnings = this.obj.warningsCheck()
        if (warnings.length) {
          btnSaveClose.classList.add('btn-warning')
          warnList.replaceChildren( ...warnings.map(w => <li>{w}</li>) )
          warnAlert.classList.remove('d-none')
          warnAlert.scrollIntoView({ behavior: 'smooth' })
          if (andClose) {
            if (!wasDirty)
              /* If the dirty flag wasn't set before, this means the user clicked the button a second
              * time without making changes, thereby saying they want to ignore the warnings. */
              this.maybeFinish('save-close')
            else {
              // Briefly disable the submit button to allow the user to see the warnings and to prevent accidental double clicks.
              btnSaveClose.setAttribute('disabled','disabled')
              setTimeout(() => btnSaveClose.removeAttribute('disabled'), 700)
            }
          } else this.maybeFinish('save')
        }
        else {
          btnSaveClose.classList.add('btn-success')
          warnAlert.classList.add('d-none')
          this.maybeFinish( andClose ? 'save-close' : 'save' )
        }
      }
    }
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
      <label for={inpId} class="col-sm-3 col-form-label text-end-sm">{label}</label>
      <div class="col-sm-9">
        {input}
        {helpText ? <div id={helpId} class="form-text">{helpText}</div> : '' }
        {invalidText ? <div class="invalid-feedback">{invalidText}</div> : ''}
      </div>
    </div>
  }
}