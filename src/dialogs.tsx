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
import { HasHtmlSummary } from './types/common'
import * as bootstrap from 'bootstrap'
import { jsx } from './jsx-dom'
import { tr } from './i18n'

export function noStorageAlert() {
  const dialog = <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static"
    data-bs-keyboard="false" tabindex="-1" aria-labelledby="noStorageAlert" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header text-bg-danger">
          <h1 class="modal-title fs-5" id="noStorageAlert">
            <i class="bi-exclamation-triangle-fill me-2"/>
            {tr('Error: No Storage Available')}</h1>
        </div>
        <div class="modal-body">
          {tr('alert-no-storage-text')}
        </div>
      </div>
    </div>
  </div>
  const modal = new bootstrap.Modal(dialog)
  modal.show()
}

type UnsavedChangesResponse = 'save'|'discard'|'cancel'
export function unsavedChangesQuestion(saveBtnLabel :string, details :HTMLElement|string) :Promise<UnsavedChangesResponse> {
  let result :UnsavedChangesResponse = 'cancel'
  const dialog = <div data-bs-backdrop="static" data-bs-keyboard="false"
    class="modal fade" tabindex="-1" aria-labelledby="unsavedChangesAlertLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header text-bg-warning">
          <h1 class="modal-title fs-5" id="unsavedChangesAlertLabel">
            <i class="bi-exclamation-triangle-fill"/> {tr('Unsaved Changes')}</h1>
        </div>
        <div class="modal-body">
          <p><strong>{tr('unsaved-changes')}</strong></p>
          { details instanceof HTMLElement ? details : <p>{details}</p> }
          <p class="mt-3 mb-0 fw-bold text-warning">{tr('cannot-undo-discard')}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-bs-dismiss="modal" onclick={()=>result='discard'}>
            <i class="bi-trash3-fill"/> {tr('Discard')}</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="bi-x-lg"/> {tr('Cancel')}</button>
          <button type="button" class="btn btn-success" data-bs-dismiss="modal" onclick={()=>result='save'}>
            <i class="bi-floppy-fill"/> {saveBtnLabel}</button>
        </div>
      </div>
    </div>
  </div>
  document.body.appendChild(dialog)
  return new Promise<UnsavedChangesResponse>(resolve => {
    const modal = new bootstrap.Modal(dialog)
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      resolve(result)
    })
    modal.show()
  })
}

type DeletionConfirmation = 'delete'|'cancel'
export function deleteConfirmation(desc :string|HTMLElement) :Promise<DeletionConfirmation> {
  let result :DeletionConfirmation = 'cancel'
  const dialog = <div data-bs-backdrop="static" data-bs-keyboard="false"
    class="modal fade" tabindex="-1" aria-labelledby="deleteConfirmationLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header text-bg-warning">
          <h1 class="modal-title fs-5" id="deleteConfirmationLabel">
            <i class="bi-exclamation-triangle-fill"/> {tr('Confirm Deletion')}</h1>
        </div>
        <div class="modal-body">
          <p><strong>{tr('confirm-delete')}</strong></p>
          { desc ? <p>{desc}</p> : '' }
          <p class="mb-0 fw-bold text-warning">{tr('cannot-undo-delete')}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-bs-dismiss="modal" onclick={()=>result='delete'}>
            <i class="bi-trash3-fill"/> {tr('Delete')}</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="bi-x-lg"/> {tr('Cancel')}</button>
        </div>
      </div>
    </div>
  </div>
  document.body.appendChild(dialog)
  return new Promise<DeletionConfirmation>(resolve => {
    const modal = new bootstrap.Modal(dialog)
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      resolve(result)
    })
    modal.show()
  })
}

/** For use during data import as the contents of a yesNoDialog */
export function importOverwriteQuestion(have :HasHtmlSummary, imp :HasHtmlSummary) :HTMLElement {
  const h = have.summaryAsHtml(true)  // we know this is a flex-row div
  h.classList.add('mb-3')
  h.insertAdjacentElement('afterbegin',
    <div class="fw-semibold text-success-emphasis">{tr('Existing object')}:</div>)
  const i = imp.summaryAsHtml(true)
  i.insertAdjacentElement('afterbegin',
    <div class="fw-semibold text-warning-emphasis">{tr('Imported object')}:</div>)
  return <div>
    <p class="fw-bold text-danger-emphasis">{tr('import-overwrite')}</p>
    {h} {i} </div>
}

type YesNoResult = 'yes'|'no'|'cancel'
export function yesNoDialog(question :string|HTMLElement, title :string, cancel :false, yesIsGood :boolean) :Promise<'yes'|'no'>
export function yesNoDialog(question :string|HTMLElement, title :string, cancel :true, yesIsGood :boolean) :Promise<YesNoResult>
export function yesNoDialog(question :string|HTMLElement, title :string, cancel :boolean, yesIsGood :boolean = false) :Promise<YesNoResult> {
  let result :YesNoResult = cancel ? 'cancel' : 'no'
  const btnCancel = <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" onclick={()=>result='cancel'}>
    <i class="bi-x-lg"/> {tr('Cancel')}</button>
  const dialog = <div data-bs-backdrop="static" data-bs-keyboard="false"
    class="modal fade" tabindex="-1" aria-labelledby="yesNoDialogLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header text-info">
          <h1 class="modal-title fs-5" id="yesNoDialogLabel">
            <i class="bi-question-circle-fill"/> {title}</h1>
        </div>
        <div class="modal-body">
          { question instanceof HTMLElement ? question : <p><strong>{question}</strong></p> }
        </div>
        <div class="modal-footer">
          <button type="button" class={yesIsGood?'btn btn-success':'btn btn-warning'} data-bs-dismiss="modal" onclick={()=>result='yes'}>
            <i class="bi-check-circle"/> {tr('Yes')}</button>
          <button type="button" class={yesIsGood?'btn btn-warning':'btn btn-success'} data-bs-dismiss="modal" onclick={()=>result='no'}>
            <i class="bi-x-square"/> {tr('No')}</button>
          {cancel ? btnCancel : ''}
        </div>
      </div>
    </div>
  </div>
  document.body.appendChild(dialog)
  return new Promise<YesNoResult>(resolve => {
    const modal = new bootstrap.Modal(dialog)
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      resolve(result)
    })
    modal.show()
  })
}

type InfoDialogType = 'info'|'warning'|'error'
export function infoDialog(type :InfoDialogType, title :string, content :string|HTMLElement) :Promise<void> {
  const dialog = <div data-bs-backdrop="static" data-bs-keyboard="false"
    class="modal fade" tabindex="-1" aria-labelledby="infoDialogLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class={'modal-header '+( type==='info' ? 'text-info' : type==='warning' ? 'text-bg-warning' : 'text-bg-danger' )}>
          <h1 class="modal-title fs-5" id="infoDialogLabel">
            <i class={ type==='info' ? 'bi-info-circle' : type==='warning' ? 'bi-exclamation-triangle-fill' : 'bi-x-octagon-fill' } /> {title}</h1>
        </div>
        <div class="modal-body">
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
            <i class="bi-check-lg"/> {tr('Understood')}</button>
        </div>
      </div>
    </div>
  </div>
  document.body.appendChild(dialog)
  return new Promise<void>(resolve => {
    const modal = new bootstrap.Modal(dialog)
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      resolve()
    })
    modal.show()
  })
}
