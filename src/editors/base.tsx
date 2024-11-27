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
import { DataObjectBase } from '../types/common'
import { jsx, safeCastElement } from '../jsx-dom'
import { assert } from '../utils'
import { tr } from '../i18n'

export type DoneCallback = () => void

export abstract class Editor<T extends DataObjectBase> {
  protected readonly initObj :Readonly<T>|null  //TODO: remove if unused
  protected obj :T|null
  protected readonly doneCb :DoneCallback
  abstract readonly el :HTMLElement
  constructor(initObj :T|null, doneCb :DoneCallback) {
    this.initObj = initObj
    this.obj = initObj
    this.doneCb = doneCb  //TODO: call this
  }
  /** Have changes been made to the form that haven't been saved to the object yet? */
  abstract get isDirty() :boolean
  protected abstract formSubmit() :void
  /** Helper function to make the <form> */
  protected makeForm(title :string, contents :HTMLElement[]) :HTMLFormElement {
    const btnSubmit = <button type="submit" class="btn btn-success"><i class="bi-floppy-fill"/> {tr('Save & Close')}</button>
    const btnCancel = <button type="button" class="btn btn-danger me-3"><i class="bi-trash3-fill"/> {tr('Cancel')}</button>
    const warnList = <ul></ul>
    //TODO: Translations
    const warnAlert = <div class="d-none alert alert-warning" role="alert">
      <h4 class="alert-heading"><i class="bi-exclamation-triangle-fill"/> Warnings</h4>
      {warnList}
      <hr />
      <p class="mb-0">You can either correct these warnings or save anyway.</p>
    </div>
    const form = safeCastElement(HTMLFormElement,
      <form novalidate>
        <legend class="mb-3">{title}</legend>
        {contents}
        {warnAlert}
        {btnCancel}
        {btnSubmit}
      </form>)
    btnCancel.addEventListener('click', () => {
      console.log('Cancel')  //TODO: if dirty, an "are you sure?" modal (options Cancel, Discard, Save)
    })
    form.addEventListener('submit', event => {
      form.classList.add('was-validated')
      event.preventDefault()
      event.stopPropagation()
      if (form.checkValidity()) {
        this.formSubmit()
        assert(this.obj)
        const warnings = this.obj.warningsCheck()
        warnList.replaceChildren( ...warnings.map(w => <li>{w}</li>) )
        warnAlert.classList.toggle('d-none', !warnings.length)
        btnSubmit.classList.toggle('btn-success', !warnings.length)
        btnSubmit.classList.toggle('btn-warning', !!warnings.length)
        //TODO: If the user changed something, re-run the sanity check, otherwise, the next "submit" click finishes the form
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
    input.setAttribute('placeholder', label)
    if (helpText)
      input.setAttribute('aria-describedby', helpId)
    input.classList.add('form-control')
    return <div class="row mb-3">
      <label for={inpId} class="col-sm-2 col-form-label">{label}</label>
      <div class="col-sm-10">
        {input}
        {helpText ? <div id={helpId} class="form-text">{helpText}</div> : '' }
        {invalidText ? <div class="invalid-feedback">{invalidText}</div> : ''}
      </div>
    </div>
  }
}